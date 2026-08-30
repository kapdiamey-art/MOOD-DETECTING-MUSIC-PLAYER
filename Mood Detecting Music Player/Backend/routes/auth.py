from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import bcrypt
import os

from config.database import users_col
from models.user import UserRegister, UserLogin, UserUpdate

# ── Load environment variables ─────────────────────────────
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM  = os.getenv("ALGORITHM")
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

# ── JWT token extractor ────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ── Router ─────────────────────────────────────────────────
router = APIRouter()


# ══════════════════════════════════════════════════════════
#  HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════

def hash_password(password: str) -> str:
    """Hash a plain password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Check if a plain password matches a bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_token(data: dict) -> str:
    """Create a signed JWT token with an expiry."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MIN)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Dependency — extracts and validates the JWT token.
    Any endpoint that needs the logged-in user uses:
        current_user = Depends(get_current_user)
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await users_col.find_one({"email": email})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ══════════════════════════════════════════════════════════
#  ENDPOINT 1 — REGISTER
#  POST /auth/register
#  Used by: Register.jsx
# ══════════════════════════════════════════════════════════

@router.post("/register")
async def register(data: UserRegister):
    # 1. Check passwords match
    if data.password != data.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    # 2. Check email is not already registered
    existing = await users_col.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="This email is already registered")

    # 3. Hash the password (NEVER store plain text)
    hashed = hash_password(data.password)

    # 4. Build user document
    user = {
        "name":           data.name,
        "email":          data.email,
        "password":       hashed,
        "favorite_genre": [],
        "favorite_mood":  "",
        "created_at":     datetime.utcnow()
    }

    # 5. Save to MongoDB users collection
    await users_col.insert_one(user)

    return {"message": "Account created successfully! Please login."}


# ══════════════════════════════════════════════════════════
#  ENDPOINT 2 — LOGIN
#  POST /auth/login
#  Used by: Login.jsx
# ══════════════════════════════════════════════════════════

@router.post("/login")
async def login(data: UserLogin):
    # 1. Find user by email in MongoDB
    user = await users_col.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    # 2. Verify password against stored hash
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    # 3. Create JWT token (contains user email as identifier)
    token = create_token({"sub": user["email"]})

    # 4. Return token + user info to frontend
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {
            "name":  user["name"],
            "email": user["email"]
        }
    }


# ══════════════════════════════════════════════════════════
#  ENDPOINT 3 — FORGOT PASSWORD
#  POST /auth/forgot-password
#  Used by: ForgotPassword.jsx
# ══════════════════════════════════════════════════════════

@router.post("/forgot-password")
async def forgot_password(data: dict):
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    user = await users_col.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email")

    # In a real app, you would send a reset email here
    # For now, we return success (email integration can be added later)
    return {"message": "If this email exists, a reset link has been sent"}


# ══════════════════════════════════════════════════════════
#  ENDPOINT 4 — LOGOUT
#  POST /auth/logout
#  Used by: Profile.jsx (logout button)
# ══════════════════════════════════════════════════════════

@router.post("/logout")
async def logout():
    # JWT is stateless — actual logout happens on frontend
    # (frontend deletes the token from localStorage)
    return {"message": "Logged out successfully"}


# ══════════════════════════════════════════════════════════
#  ENDPOINT 5 — GET MY PROFILE
#  GET /auth/me
#  Used by: Profile.jsx
#  Requires: JWT token in header
# ══════════════════════════════════════════════════════════

@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    return {
        "name":           current_user["name"],
        "email":          current_user["email"],
        "favorite_genre": current_user.get("favorite_genre", []),
        "favorite_mood":  current_user.get("favorite_mood", ""),
        "created_at":     str(current_user.get("created_at", ""))
    }


# ══════════════════════════════════════════════════════════
#  ENDPOINT 6 — UPDATE MY PROFILE
#  PUT /auth/me
#  Used by: Profile.jsx (Edit Profile button)
#  Requires: JWT token in header
# ══════════════════════════════════════════════════════════

@router.put("/me")
async def update_me(data: UserUpdate, current_user = Depends(get_current_user)):
    # Only update fields that were actually provided (not None)
    update_data = {k: v for k, v in data.dict().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided to update")

    await users_col.update_one(
        {"email": current_user["email"]},
        {"$set": update_data}
    )
    return {"message": "Profile updated successfully"}


# ══════════════════════════════════════════════════════════
#  ENDPOINT 7 — CHANGE PASSWORD
#  PUT /auth/change-password
#  Used by: Profile.jsx (Change Password button)
#  Requires: JWT token in header
# ══════════════════════════════════════════════════════════

@router.put("/change-password")
async def change_password(data: dict, current_user = Depends(get_current_user)):
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        raise HTTPException(status_code=400, detail="Both old and new passwords are required")

    # 1. Verify old password is correct
    if not verify_password(old_password, current_user["password"]):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    # 2. Hash new password
    hashed_new = hash_password(new_password)

    # 3. Update in MongoDB
    await users_col.update_one(
        {"email": current_user["email"]},
        {"$set": {"password": hashed_new}}
    )
    return {"message": "Password changed successfully"}