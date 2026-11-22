
import base64
import io
import json
from pathlib import Path

import matplotlib
import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow import keras


class BrainTumorClassifier:
    def __init__(
        self,
        model_path="outputs/brain_tumor_model.keras",
        class_names_path="outputs/class_names.json",
        config_path="outputs/model_config.json",
    ):
        self.model = keras.models.load_model(model_path)
        with open(class_names_path) as f:
            self.class_names = json.load(f)
        self.img_size = 224
        if Path(config_path).exists():
            with open(config_path) as f:
                self.img_size = json.load(f).get("img_size", 224)
        self._setup_gradcam()

    # ------------------------------------------------------------------ utils
    def _load_image(self, image) -> Image.Image:
        if isinstance(image, (bytes, bytearray)):
            image = Image.open(io.BytesIO(image))
        elif isinstance(image, (str, Path)):
            image = Image.open(image)
        return image.convert("RGB")

    def preprocess(self, image) -> np.ndarray:
        """Same preprocessing as training: RGB, resize, raw 0-255 float32 pixels."""
        pil = self._load_image(image)
        arr = np.asarray(pil, dtype="float32")
        arr = tf.image.resize(arr, (self.img_size, self.img_size)).numpy()
        return arr

    # --------------------------------------------------------------- Grad-CAM
    def _setup_gradcam(self):
        self._gradcam_ok = False
        try:
            base = self.model.get_layer("efficientnet_b0")
            self._conv_model = keras.Model(base.inputs, base.get_layer("top_activation").output)
            idx = self.model.layers.index(base)
            self._head_layers = self.model.layers[idx + 1:]
            self._gradcam_ok = True
        except Exception as e:  # Grad-CAM is optional; never block predictions
            print("[warn] Grad-CAM disabled:", e)

    def _gradcam(self, arr, class_idx):
        x = tf.convert_to_tensor(arr[None], dtype=tf.float32)
        with tf.GradientTape() as tape:
            conv = self._conv_model(x)
            tape.watch(conv)
            y = conv
            for layer in self._head_layers:
                y = layer(y)
            score = y[:, class_idx]
        grads = tape.gradient(score, conv)
        weights = tf.reduce_mean(grads, axis=(1, 2))
        cam = tf.reduce_sum(conv * weights[:, None, None, :], axis=-1)[0]
        cam = tf.nn.relu(cam).numpy()
        cam = cam / (cam.max() + 1e-8)
        return cam

    def _overlay(self, arr, cam):
        size = (self.img_size, self.img_size)
        cam_big = tf.image.resize(cam[..., None], size).numpy()[..., 0]
        heat = (matplotlib.colormaps["jet"](cam_big)[..., :3] * 255).astype("uint8")
        overlay = (0.6 * arr + 0.4 * heat).clip(0, 255).astype("uint8")
        buf = io.BytesIO()
        Image.fromarray(overlay).save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode("utf-8")

    # ---------------------------------------------------------------- predict
    def predict(self, image, with_gradcam=False) -> dict:
        arr = self.preprocess(image)
        probs = self.model.predict(arr[None], verbose=0)[0]
        top = int(np.argmax(probs))

        result = {
            "label": self.class_names[top],
            "confidence": float(probs[top]),
            "probabilities": {c: float(p) for c, p in zip(self.class_names, probs)},
            #"disclaimer": "Educational/research prototype. Not a medical diagnosis.",
        }
        if with_gradcam and self._gradcam_ok:
            try:
                cam = self._gradcam(arr, top)
                result["gradcam_png_base64"] = self._overlay(arr, cam)
            except Exception as e:
                result["gradcam_error"] = str(e)
        return result


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python inference.py path/to/mri.jpg")
        raise SystemExit(1)
    clf = BrainTumorClassifier()
    res = clf.predict(sys.argv[1], with_gradcam=False)
    print(json.dumps(res, indent=2))
