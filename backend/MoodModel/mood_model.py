import numpy as np
import cv2
from pathlib import Path
from typing import Optional

from config import settings


class MoodModel:
    """
    Singleton wrapper around the Keras .h5 mood detection model.
    Loads once at startup and reuses for all predictions.
    """

    def __init__(self):
        self._model = None
        self._face_cascade = None

    def load(self):
        """Load model and face detector. Called once at app startup."""
        import tensorflow as tf  # type: ignore

        model_path = Path(settings.MOOD_MODEL_PATH)
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found at: {model_path}")

        self._model = tf.keras.models.load_model(str(model_path))

        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self._face_cascade = cv2.CascadeClassifier(cascade_path)

        print(f"✅ Model loaded from {model_path}")
        print(f"   Input shape : {self._model.input_shape}")
        print(f"   Output shape: {self._model.output_shape}")

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def predict_from_image_bytes(self, image_bytes: bytes) -> dict:
        """
        Run mood prediction on raw image bytes (e.g. from an uploaded file).

        Returns:
            {
                "dominant_mood": "happy",
                "confidence": 0.92,
                "scores": {"happy": 0.92, "sad": 0.03, ...},
                "face_detected": True
            }
        """
        self._ensure_loaded()

        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Could not decode image. Ensure it is a valid JPG/PNG.")

        return self._predict_frame(frame)

    def predict_from_array(self, frame: np.ndarray) -> dict:
        """Run mood prediction on a pre-decoded OpenCV frame (BGR)."""
        self._ensure_loaded()
        return self._predict_frame(frame)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _predict_frame(self, frame: np.ndarray) -> dict:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        faces = self._face_cascade.detectMultiScale(
            gray, scaleFactor=1.3, minNeighbors=5, minSize=(30, 30)
        )

        if len(faces) == 0:
            return {
                "dominant_mood": None,
                "confidence": 0.0,
                "scores": {},
                "face_detected": False,
            }

        # Use the largest detected face
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        roi = gray[y : y + h, x : x + w]

        preprocessed = self._preprocess_roi(roi)
        raw_scores = self._model.predict(preprocessed, verbose=0)[0]

        labels = settings.MOOD_LABELS
        scores = {label: float(round(score, 4)) for label, score in zip(labels, raw_scores)}
        dominant = max(scores, key=scores.get)

        return {
            "dominant_mood": dominant,
            "confidence": scores[dominant],
            "scores": scores,
            "face_detected": True,
        }

    def _preprocess_roi(self, roi: np.ndarray) -> np.ndarray:
        """Resize and normalise face ROI to match model input."""
        input_h, input_w = self._model.input_shape[1], self._model.input_shape[2]
        resized = cv2.resize(roi, (input_w, input_h))
        normalised = resized.astype("float32") / 255.0
        # Add batch + channel dims → (1, H, W, 1)
        return np.expand_dims(np.expand_dims(normalised, axis=-1), axis=0)

    def _ensure_loaded(self):
        if not self.is_loaded:
            raise RuntimeError("MoodModel is not loaded. Call .load() first.")


# Singleton instance — imported everywhere
mood_model = MoodModel()