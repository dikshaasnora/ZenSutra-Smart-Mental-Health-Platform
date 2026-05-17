from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mood
from mood_model import mood_model

app = FastAPI(
    title="ZenSutra API",
    description="Smart Mental Health Support Platform",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    try:
        mood_model.load()
    except Exception as e:
        print(f"Warning: Could not load mood model at startup: {e}")

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}

app.include_router(mood.router, prefix="/api/v1/mood", tags=["Mood"])
