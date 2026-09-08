from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
from passlib.context import CryptContext  # type: ignore
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

from config.database import users_col
from models.user import UserRegister, UserLogin, UserUpdate

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM  = os.getenv("ALGORITHM")
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
router = APIRouter()


# ══════════════════════════════════════════════════════════
#  HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════

def hash_password(password: str) -> str:
    """Hash a plain password using bcrypt via passlib."""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Check if a plain password matches a bcrypt hash via passlib."""
    return pwd_context.verify(plain, hashed)


def create_token(data):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=EXPIRE_MIN)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await users_col.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expired or invalid")


@router.post("/register")
async def register(data: UserRegister):
    if data.password != data.confirmPassword:
        raise HTTPException(400, "Passwords do not match")

    if await users_col.find_one({"email": data.email}):
        raise HTTPException(400, "Email already registered")

    user = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "favorite_genre": [],
        "favorite_mood": "",
        "created_at": datetime.utcnow()
    }
    await users_col.insert_one(user)
    return {"message": "Account created! Please login."}


@router.post("/login")
async def login(data: UserLogin):
    user = await users_col.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(400, "Incorrect email or password")

    token = create_token({"sub": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"name": user["name"], "email": user["email"]}
    }


@router.post("/forgot-password")
async def forgot_password(data: dict):
    email = data.get("email")
    if not email:
        raise HTTPException(400, "Email is required")
    if not await users_col.find_one({"email": email}):
        raise HTTPException(404, "No account found with this email")
    # TODO: hook up email service later
    return {"message": "Reset link sent if email exists"}


@router.post("/logout")
async def logout():
    # token cleared on frontend
    return {"message": "Logged out"}


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return {
        "name": current_user["name"],
        "email": current_user["email"],
        "favorite_genre": current_user.get("favorite_genre", []),
        "favorite_mood": current_user.get("favorite_mood", ""),
        "created_at": str(current_user.get("created_at", ""))
    }


@router.put("/me")
async def update_me(data: UserUpdate, current_user=Depends(get_current_user)):
    updates = {k: v for k, v in data.dict().items() if v is not None}
    if not updates:
        raise HTTPException(400, "Nothing to update")
    await users_col.update_one({"email": current_user["email"]}, {"$set": updates})
    return {"message": "Profile updated"}


@router.put("/change-password")
async def change_password(data: dict, current_user=Depends(get_current_user)):
    old = data.get("old_password")
    new = data.get("new_password")
    if not old or not new:
        raise HTTPException(400, "Both passwords required")
    if not verify_password(old, current_user["password"]):
        raise HTTPException(400, "Old password is wrong")
    await users_col.update_one(
        {"email": current_user["email"]},
        {"$set": {"password": hash_password(new)}}
    )
    return {"message": "Password updated"}