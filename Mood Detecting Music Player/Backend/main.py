from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth import router as auth_router
from routes.mood import router as mood_router
from routes.recommendations import router as reco_router
from routes.mymusic import router as mymusic_router
from routes.analytics import router as analytics_router

# Create FastAPI app
app = FastAPI(
    title="Moodify API",
    description="Backend API for the Mood Detecting Music Player",
    version="1.0.0"
)

# CORS Middleware
# Allows React (running on port 5173) to talk to FastAPI (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth_router,      prefix="/auth",      tags=["Auth"])
app.include_router(mood_router,      prefix="/mood",      tags=["Mood"])
app.include_router(reco_router,                           tags=["Recommendations"])
app.include_router(mymusic_router,   prefix="/mymusic",   tags=["My Music"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])

# Root endpoint
@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Moodify API is running!",
        "status": "ok",
        "docs": "http://localhost:8000/docs"
    }

#Health check endpoint
@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
