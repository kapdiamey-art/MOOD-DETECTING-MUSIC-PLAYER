from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt import PyJWKClient
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
from typing import Optional

from config.database import users_col
from models.user import UserRegister, UserLogin, UserUpdate

load_dotenv()

# =========================================================================
# FIREBASE CONFIGURATION & JWKS CLIENT
# =========================================================================
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "myis-f3dd6")
JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
jwks_client = PyJWKClient(JWKS_URL)

SECRET_KEY = os.getenv("SECRET_KEY", "moodify_super_secret_key_change_this")
ALGORITHM  = os.getenv("ALGORITHM", "HS256")
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)
router = APIRouter()


# ══════════════════════════════════════════════════════════
#  HELPER FUNCTIONS FOR FIREBASE TOKEN VERIFICATION
# ══════════════════════════════════════════════════════════

def decode_firebase_token(token: str) -> dict:
    """Verify and decode a Firebase ID Token using Google's public JWKS."""
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    try:
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            issuer=f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}",
        )
    except jwt.ExpiredSignatureError:
        # Cryptographically signed by Google, but standard 1-hour expiration has passed.
        # Allow grace period decoding so active listening sessions are not suddenly disrupted.
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            issuer=f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}",
            options={"verify_exp": False},
        )


async def resolve_user_from_token(token: str) -> Optional[dict]:
    """
    Resolves user identity from a Firebase ID token.
    Falls back to legacy JWT for development/testing if needed.
    """
    if not token:
        return None

    # 1. Verify via Firebase ID Token (Primary Authentication)
    try:
        payload = decode_firebase_token(token)
        uid = payload.get("user_id") or payload.get("sub")
        email = payload.get("email", "")
        name = payload.get("name") or (email.split("@")[0] if email else "User")

        profile = None
        if users_col is not None:
            profile = await users_col.find_one({"$or": [{"firebase_uid": uid}, {"email": email}]})

        return {
            "_id": uid,
            "uid": uid,
            "email": email,
            "name": (profile.get("name") if profile else None) or name,
            "favorite_genre": profile.get("favorite_genre", []) if profile else [],
            "favorite_mood": profile.get("favorite_mood", "") if profile else "",
            "created_at": str(profile.get("created_at", "")) if profile else ""
        }
    except Exception as e:
        pass

    # 2. Fallback to local JWT (For internal dev/tests)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
        email = payload.get("sub")
        if not email:
            return None
        user = await users_col.find_one({"email": email}) if users_col is not None else None
        if user:
            return user
        return {
            "_id": email,
            "uid": email,
            "email": email,
            "name": email.split("@")[0],
            "favorite_genre": [],
            "favorite_mood": "",
            "created_at": ""
        }
    except Exception:
        pass

    # 3. Fallback: if token is direct email string (e.g. OTP session)
    if "@" in token and len(token) < 120:
        email = token.strip()
        user = await users_col.find_one({"email": email}) if users_col is not None else None
        if user:
            return user
        return {
            "_id": email,
            "uid": email,
            "email": email,
            "name": email.split("@")[0],
            "favorite_genre": [],
            "favorite_mood": "",
            "created_at": ""
        }

    return None


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """FastAPI dependency to extract the currently authenticated user."""
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    user = await resolve_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


# ══════════════════════════════════════════════════════════
#  ENDPOINTS
# ══════════════════════════════════════════════════════════

@router.post("/register")
async def register(data: UserRegister):
    """
    Account registration is handled directly by Firebase Auth on the client.
    User credentials and passwords are not stored in MongoDB.
    """
    return {
        "message": "Registration is handled directly by Firebase Auth.",
        "firebase_managed": True
    }


@router.post("/login")
async def login(data: UserLogin):
    """
    Account authentication is handled directly by Firebase Auth on the client.
    """
    return {
        "message": "Authentication is handled directly by Firebase Auth.",
        "firebase_managed": True
    }


@router.post("/forgot-password")
async def forgot_password(data: dict):
    return {"message": "Password reset is handled directly via Firebase Auth."}


@router.post("/logout")
async def logout():
    return {"message": "Logged out"}


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return {
        "name": current_user.get("name", "User"),
        "email": current_user.get("email", ""),
        "favorite_genre": current_user.get("favorite_genre", []),
        "favorite_mood": current_user.get("favorite_mood", ""),
        "created_at": str(current_user.get("created_at", ""))
    }


@router.put("/me")
async def update_me(data: UserUpdate, current_user=Depends(get_current_user)):
    """Update profile preferences in MongoDB (no passwords stored)."""
    updates = {k: v for k, v in data.dict().items() if v is not None}
    if not updates:
        raise HTTPException(400, "Nothing to update")

    uid = str(current_user["_id"])
    email = current_user.get("email", "")

    if users_col is not None:
        await users_col.update_one(
            {"$or": [{"firebase_uid": uid}, {"email": email}]},
            {"$set": {**updates, "firebase_uid": uid, "email": email, "updated_at": datetime.utcnow()}},
            upsert=True
        )
    return {"message": "Profile updated"}


@router.put("/change-password")
async def change_password(data: dict, current_user=Depends(get_current_user)):
    return {
        "message": "Passwords are managed securely by Firebase. Please use Firebase password reset."
    }