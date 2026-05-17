from mood_model import mood_model
from pydantic import BaseModel
from typing import Optional, Dict

class MoodPredictionResponse(BaseModel):
    dominant_mood: Optional[str] = None
    confidence: float
    scores: Dict[str, float]
    face_detected: bool
    message: str


MOOD_MESSAGES = {
    "happy":    "You seem happy! Keep spreading that positivity 😊",
    "sad":      "It looks like you're feeling sad. It's okay to take a break 💙",
    "angry":    "You seem a bit tense. Try some deep breathing 🧘",
    "fear":     "You look anxious. Remember: you're safe and supported 🤝",
    "surprise": "You look surprised! Hope it's a good one 😲",
    "disgust":  "Something seems off. Would you like to talk about it?",
    "neutral":  "You seem calm and composed 🙂",
}


def predict_mood_from_bytes(image_bytes: bytes) -> MoodPredictionResponse:
    """
    Accepts raw image bytes, runs prediction, and returns a structured response.
    """
    result = mood_model.predict_from_image_bytes(image_bytes)

    if not result["face_detected"]:
        return MoodPredictionResponse(
            dominant_mood=None,
            confidence=0.0,
            scores={},
            face_detected=False,
            message="No face detected. Please ensure your face is clearly visible.",
        )

    mood = result["dominant_mood"]
    return MoodPredictionResponse(
        dominant_mood=mood,
        confidence=result["confidence"],
        scores=result["scores"],
        face_detected=True,
        message=MOOD_MESSAGES.get(mood, ""),
    )