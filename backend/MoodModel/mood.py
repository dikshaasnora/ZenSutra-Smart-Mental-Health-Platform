from fastapi import APIRouter, UploadFile, File, HTTPException
from mood_service import predict_mood_from_bytes, MoodPredictionResponse

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_MB = 5


@router.post("/predict", response_model=MoodPredictionResponse)
async def predict_mood(file: UploadFile = File(...)):
    """
    Upload a face image (JPG/PNG/WEBP) and receive a mood prediction.

    - **file**: Image file containing a visible human face
    """
    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Use JPG, PNG, or WEBP.",
        )

    image_bytes = await file.read()

    # Validate file size
    if len(image_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB.",
        )

    try:
        return predict_mood_from_bytes(image_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/labels")
def get_mood_labels():
    """Returns the list of mood labels the model can predict."""
    from config import settings
    return {"labels": settings.MOOD_LABELS}


@router.get("/model-info")
def get_model_info():
    """Returns metadata about the loaded model."""
    from mood_model import mood_model
    if not mood_model.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")
    return {
        "loaded": True,
        "input_shape": mood_model._model.input_shape,
        "output_shape": mood_model._model.output_shape,
    }