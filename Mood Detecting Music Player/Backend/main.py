from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
# Reload trigger


from routes.auth import router as auth_router
from routes.mood import router as mood_router
from routes.recommendations import router as reco_router
from routes.mymusic import router as mymusic_router
from routes.analytics import router as analytics_router
from routes.spotify import router as spotify_router
from routes.companion import router as companion_router
from routes.context import router as context_router

# Create FastAPI app
app = FastAPI(
    title="Moodify API",
    description="Backend API for the Mood Detecting Music Player",
    version="1.0.0"
)

# CORS Middleware
# Allows local dev and production Vercel frontend deployments to connect
frontend_url = os.getenv("FRONTEND_URL", "*")
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if frontend_url != "*":
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if frontend_url == "*" else origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth_router,      prefix="/auth",      tags=["Auth"])
app.include_router(mood_router,      prefix="/mood",      tags=["Mood"])
app.include_router(spotify_router,   prefix="/spotify",   tags=["Spotify"])
app.include_router(reco_router,                           tags=["Recommendations"])
app.include_router(mymusic_router,   prefix="/mymusic",   tags=["My Music"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
app.include_router(companion_router, prefix="/companion", tags=["Companion"])
app.include_router(context_router,   prefix="/context",   tags=["Contextual Sentiment Fusion"])

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
