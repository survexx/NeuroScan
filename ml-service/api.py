from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from inference import BrainTumorClassifier

app = FastAPI(title="Brain Tumor MRI Classifier API", version="1.0")

# Allow the web frontend to call this API. Replace "*" with your frontend URL in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = BrainTumorClassifier()  # loaded once at startup

MAX_BYTES = 10 * 1024 * 1024  # 10 MB


@app.get("/health")
def health():
    return {"status": "ok", "classes": classifier.class_names}


@app.post("/predict")
async def predict(file: UploadFile = File(...), gradcam: bool = False):
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file (jpg/png).")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 10 MB).")
    try:
        return classifier.predict(data, with_gradcam=gradcam)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not process image: {e}")
