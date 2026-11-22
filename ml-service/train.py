

import argparse
import json
import os
import random
from pathlib import Path

import numpy as np
import matplotlib

matplotlib.use("Agg")  # no display needed
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

IMG_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}


# ----------------------------------------------------------------------------
# Utilities
# ----------------------------------------------------------------------------
def set_seed(seed: int):
    random.seed(seed)
    np.random.seed(seed)
    tf.random.set_seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)


def enable_gpu_memory_growth():
    for gpu in tf.config.list_physical_devices("GPU"):
        try:
            tf.config.experimental.set_memory_growth(gpu, True)
        except Exception:
            pass


def list_images(root, class_names=None):
    """Return (paths, integer labels, class_names) for a folder-per-class tree."""
    root = Path(root)
    if class_names is None:
        class_names = sorted(d.name for d in root.iterdir() if d.is_dir())
    paths, labels = [], []
    for idx, cname in enumerate(class_names):
        cdir = root / cname
        if not cdir.is_dir():
            raise FileNotFoundError(f"Class folder '{cname}' not found in {root}")
        for p in sorted(cdir.rglob("*")):
            if p.suffix.lower() in IMG_EXT:
                paths.append(str(p))
                labels.append(idx)
    return np.array(paths), np.array(labels), class_names


def find_subdir(root: Path, names):
    for d in root.iterdir():
        if d.is_dir() and d.name.lower() in names:
            return d
    return None


def prepare_splits(data_dir, seed):
    root = Path(data_dir)
    if not root.is_dir():
        raise FileNotFoundError(f"Dataset folder not found: {root}")

    train_dir = find_subdir(root, {"training", "train"})
    test_dir = find_subdir(root, {"testing", "test"})

    if train_dir and test_dir:
        print(f"[data] Found train/test folders: {train_dir.name} / {test_dir.name}")
        X, y, classes = list_images(train_dir)
        X_te, y_te, _ = list_images(test_dir, classes)
        X_tr, X_va, y_tr, y_va = train_test_split(
            X, y, test_size=0.15, stratify=y, random_state=seed
        )
    else:
        print("[data] Single folder detected -> splitting 70% train / 15% val / 15% test")
        X, y, classes = list_images(root)
        X_tr, X_tmp, y_tr, y_tmp = train_test_split(
            X, y, test_size=0.30, stratify=y, random_state=seed
        )
        X_va, X_te, y_va, y_te = train_test_split(
            X_tmp, y_tmp, test_size=0.50, stratify=y_tmp, random_state=seed
        )

    if len(classes) < 2:
        raise ValueError("Need at least 2 class folders.")

    print(f"[data] Classes: {classes}")
    for name, yy in (("train", y_tr), ("val", y_va), ("test", y_te)):
        counts = {classes[i]: int((yy == i).sum()) for i in range(len(classes))}
        print(f"[data] {name:5s}: {len(yy):5d} images  {counts}")
    return (X_tr, y_tr), (X_va, y_va), (X_te, y_te), classes


def make_dataset(paths, labels, img_size, batch_size, training):
    def _load(path, label):
        raw = tf.io.read_file(path)
        img = tf.io.decode_image(raw, channels=3, expand_animations=False)
        img = tf.image.resize(img, (img_size, img_size))  # float32, range 0-255
        img.set_shape((img_size, img_size, 3))
        return img, label

    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    if training:
        ds = ds.shuffle(len(paths), reshuffle_each_iteration=True)
    ds = ds.map(_load, num_parallel_calls=tf.data.AUTOTUNE)
    return ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)


# ----------------------------------------------------------------------------
# Model
# ----------------------------------------------------------------------------
def build_model(num_classes, img_size):
    # Augmentation is part of the model but only active during training.
    augmentation = keras.Sequential(
        [
            layers.RandomFlip("horizontal"),
            layers.RandomRotation(0.08),
            layers.RandomZoom(0.10),
            layers.RandomTranslation(0.05, 0.05),
            layers.RandomContrast(0.10),
        ],
        name="augmentation",
    )

    inputs = keras.Input(shape=(img_size, img_size, 3), name="image")
    x = augmentation(inputs)

    # NOTE: EfficientNet has its own preprocessing built in -> feed raw 0-255 pixels.
    base = keras.applications.EfficientNetB0(
        include_top=False, weights="imagenet", input_shape=(img_size, img_size, 3)
    )
    base.trainable = False
    x = base(x, training=False)

    x = layers.GlobalAveragePooling2D(name="gap")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.4)(x)
    x = layers.Dense(
        256, activation="relu", kernel_regularizer=keras.regularizers.l2(1e-4)
    )(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    model = keras.Model(inputs, outputs, name="brain_tumor_classifier")
    return model, base


def compile_model(model, lr):
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=lr),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )


def get_callbacks(patience):
    return [
        keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=patience, restore_best_weights=True, verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.3, patience=max(2, patience // 2), min_lr=1e-7, verbose=1
        ),
    ]


# ----------------------------------------------------------------------------
# Plots / evaluation
# ----------------------------------------------------------------------------
def plot_history(history, out_path, split_epoch=None):
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    for ax, key, title in zip(axes, ("accuracy", "loss"), ("Accuracy", "Loss")):
        ax.plot(history[key], label="train")
        ax.plot(history["val_" + key], label="val")
        if split_epoch is not None:
            ax.axvline(split_epoch - 0.5, color="gray", linestyle="--", label="fine-tune start")
        ax.set_title(title)
        ax.set_xlabel("epoch")
        ax.legend()
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)


def plot_confusion_matrix(cm, class_names, out_path):
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm, cmap="Blues")
    ax.set_xticks(range(len(class_names)))
    ax.set_yticks(range(len(class_names)))
    ax.set_xticklabels(class_names, rotation=45, ha="right")
    ax.set_yticklabels(class_names)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True")
    ax.set_title("Confusion matrix (test set)")
    thresh = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, int(cm[i, j]), ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "black")
    fig.colorbar(im)
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="Train brain tumor MRI classifier")
    ap.add_argument("--data_dir", required=True, help="Path to dataset root")
    ap.add_argument("--output_dir", default="outputs")
    ap.add_argument("--img_size", type=int, default=224)
    ap.add_argument("--batch_size", type=int, default=32)
    ap.add_argument("--epochs_head", type=int, default=12, help="Phase 1 epochs")
    ap.add_argument("--epochs_finetune", type=int, default=25, help="Phase 2 epochs")
    ap.add_argument("--lr_head", type=float, default=1e-3)
    ap.add_argument("--lr_finetune", type=float, default=1e-5)
    ap.add_argument("--unfreeze_layers", type=int, default=40,
                    help="How many top layers of EfficientNet to fine-tune")
    ap.add_argument("--patience", type=int, default=6)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    set_seed(args.seed)
    enable_gpu_memory_growth()
    out = Path(args.output_dir)
    out.mkdir(parents=True, exist_ok=True)

    print("[env] TensorFlow", tf.__version__, "| GPUs:", tf.config.list_physical_devices("GPU"))

    # ---- data
    (X_tr, y_tr), (X_va, y_va), (X_te, y_te), class_names = prepare_splits(
        args.data_dir, args.seed
    )
    train_ds = make_dataset(X_tr, y_tr, args.img_size, args.batch_size, training=True)
    val_ds = make_dataset(X_va, y_va, args.img_size, args.batch_size, training=False)
    test_ds = make_dataset(X_te, y_te, args.img_size, args.batch_size, training=False)

    weights = compute_class_weight("balanced", classes=np.arange(len(class_names)), y=y_tr)
    class_weight = {i: float(w) for i, w in enumerate(weights)}
    print("[data] class weights:", class_weight)

    # ---- model
    model, base = build_model(len(class_names), args.img_size)

    # ---- phase 1: train head
    print("\n===== PHASE 1: training classification head =====")
    compile_model(model, args.lr_head)
    h1 = model.fit(
        train_ds, validation_data=val_ds, epochs=args.epochs_head,
        class_weight=class_weight, callbacks=get_callbacks(args.patience),
    )

    # ---- phase 2: fine-tune top of the base network
    print("\n===== PHASE 2: fine-tuning top layers =====")
    base.trainable = True
    for layer in base.layers[: -args.unfreeze_layers]:
        layer.trainable = False
    for layer in base.layers:  # keep BatchNorm statistics frozen (important for stability)
        if isinstance(layer, layers.BatchNormalization):
            layer.trainable = False
    compile_model(model, args.lr_finetune)
    h2 = model.fit(
        train_ds, validation_data=val_ds, epochs=args.epochs_finetune,
        class_weight=class_weight, callbacks=get_callbacks(args.patience),
    )

    history = {k: h1.history[k] + h2.history[k] for k in h1.history}
    plot_history(history, out / "training_curves.png", split_epoch=len(h1.history["loss"]))

    # ---- evaluation on held-out test set
    print("\n===== EVALUATION ON TEST SET =====")
    probs = model.predict(test_ds, verbose=1)
    y_pred = np.argmax(probs, axis=1)
    acc = float((y_pred == y_te).mean())
    report_txt = classification_report(y_te, y_pred, target_names=class_names, digits=4)
    report_dict = classification_report(
        y_te, y_pred, target_names=class_names, digits=4, output_dict=True
    )
    cm = confusion_matrix(y_te, y_pred)
    print(report_txt)
    print("Confusion matrix:\n", cm)
    print(f"Test accuracy: {acc:.4f}")

    plot_confusion_matrix(cm, class_names, out / "confusion_matrix.png")
    (out / "classification_report.txt").write_text(report_txt)
    with open(out / "metrics.json", "w") as f:
        json.dump({"test_accuracy": acc, "report": report_dict, "confusion_matrix": cm.tolist()}, f, indent=2)

    # ---- save model + metadata for deployment
    model.save(out / "brain_tumor_model.keras")
    with open(out / "class_names.json", "w") as f:
        json.dump(class_names, f)
    with open(out / "model_config.json", "w") as f:
        json.dump({"img_size": args.img_size, "preprocessing": "resize to img_size x img_size, RGB, raw 0-255 pixels (no rescaling)"}, f, indent=2)

    print(f"\nDone. Saved everything to: {out.resolve()}")


if __name__ == "__main__":
    main()
