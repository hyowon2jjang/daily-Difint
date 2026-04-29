import random
import string
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.models import User, XPLedger

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

REFERRAL_XP = 50


def _generate_friend_code() -> str:
    chars = string.ascii_uppercase + string.digits
    return "DIF-" + "".join(random.choices(chars, k=3))


def _make_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    friend_code: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


def _serialize_user(user: User) -> dict:
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "xp": user.xp,
        "level": user.level,
        "friend_code": user.friend_code,
    }


@router.post("/register")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check username taken
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken.")

    existing_email = await db.execute(select(User).where(User.email == body.email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered.")

    # Resolve friend code referral
    referrer = None
    if body.friend_code:
        ref_result = await db.execute(
            select(User).where(User.friend_code == body.friend_code)
        )
        referrer = ref_result.scalar_one_or_none()
        if not referrer:
            raise HTTPException(status_code=400, detail="Invalid friend code.")

    # Generate unique friend code for new user
    code = _generate_friend_code()
    while True:
        check = await db.execute(select(User).where(User.friend_code == code))
        if not check.scalar_one_or_none():
            break
        code = _generate_friend_code()

    user = User(
        username=body.username,
        email=body.email,
        hashed_password=pwd_context.hash(body.password),
        friend_code=code,
        referred_by=referrer.id if referrer else None,
        xp=REFERRAL_XP if referrer else 0,
    )
    db.add(user)
    await db.flush()  # get user.id before committing

    # Award referral XP to both via ledger only (user.xp already set above)
    if referrer:
        db.add(XPLedger(user_id=referrer.id, amount=REFERRAL_XP, reason="referral_referrer"))
        referrer.xp += REFERRAL_XP

    await db.commit()

    return {"token": _make_token(str(user.id)), "user": _serialize_user(user)}


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not pwd_context.verify(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {"token": _make_token(str(user.id)), "user": _serialize_user(user)}
