from datetime import date as date_type
from fastapi import APIRouter, Depends, Header, HTTPException
from jose import jwt, JWTError
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.config import settings
from app.core.database import get_db
from app.models.models import Problem, DailySchedule, User

router = APIRouter(prefix="/admin", tags=["admin"])


async def _require_admin(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Login required.")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    admins = [u.strip() for u in settings.ADMIN_USERNAMES.split(",") if u.strip()]
    if user.username not in admins:
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


class ProblemCreate(BaseModel):
    title: str
    body_latex: str
    answer_latex: str
    difficulty: str
    technique_tags: List[str] = []


class ScheduleCreate(BaseModel):
    date: str          # YYYY-MM-DD
    easy1_id: str
    easy2_id: str
    medium_id: str
    boss_id: Optional[str] = None


@router.get("/problems")
async def list_problems(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(_require_admin),
):
    result = await db.execute(
        select(Problem).order_by(Problem.created_at.desc())
    )
    problems = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "title": p.title,
            "body_latex": p.body_latex,
            "answer_latex": p.answer_latex,
            "difficulty": p.difficulty,
            "technique_tags": p.technique_tags or [],
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in problems
    ]


@router.post("/problems")
async def create_problem(
    body: ProblemCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    if body.difficulty not in ("easy", "medium", "boss"):
        raise HTTPException(status_code=400, detail="Invalid difficulty.")
    if not body.body_latex.strip() or not body.answer_latex.strip():
        raise HTTPException(status_code=400, detail="Problem and answer cannot be empty.")

    problem = Problem(
        title=body.title,
        body_latex=body.body_latex.strip(),
        answer_latex=body.answer_latex.strip(),
        difficulty=body.difficulty,
        technique_tags=body.technique_tags,
        status="approved",
        submitted_by=admin.id,
    )
    db.add(problem)
    await db.commit()
    return {"id": str(problem.id), "title": problem.title}


@router.get("/schedule")
async def list_schedule(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(_require_admin),
):
    result = await db.execute(
        select(DailySchedule).order_by(DailySchedule.date.desc()).limit(30)
    )
    rows = result.scalars().all()

    async def fetch_title(pid):
        if not pid:
            return None
        r = await db.execute(select(Problem.title, Problem.difficulty).where(Problem.id == pid))
        row = r.first()
        return {"title": row[0], "difficulty": row[1]} if row else None

    out = []
    for s in rows:
        out.append({
            "date": str(s.date),
            "easy1": await fetch_title(s.easy1_id),
            "easy2": await fetch_title(s.easy2_id),
            "medium": await fetch_title(s.medium_id),
            "boss": await fetch_title(s.boss_id),
        })
    return out


@router.post("/schedule")
async def create_schedule(
    body: ScheduleCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(_require_admin),
):
    try:
        target_date = date_type.fromisoformat(body.date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    existing = await db.execute(
        select(DailySchedule).where(DailySchedule.date == target_date)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Schedule for {body.date} already exists.")

    db.add(DailySchedule(
        date=target_date,
        easy1_id=body.easy1_id,
        easy2_id=body.easy2_id,
        medium_id=body.medium_id,
        boss_id=body.boss_id,
    ))
    await db.commit()
    return {"scheduled": body.date}


@router.delete("/schedule/{target_date}")
async def delete_schedule(
    target_date: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(_require_admin),
):
    try:
        d = date_type.fromisoformat(target_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format.")
    result = await db.execute(select(DailySchedule).where(DailySchedule.date == d))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="No schedule found for that date.")
    await db.delete(row)
    await db.commit()
    return {"deleted": target_date}
