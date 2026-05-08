from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import XPLedger, User, Streak

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


def _get_period_start(period: str) -> date:
    today = date.today()
    if period == "weekly":
        return today - timedelta(days=today.weekday())  # Monday
    # monthly
    return today.replace(day=1)


@router.get("")
async def get_leaderboard(
    period: str = Query("weekly", enum=["weekly", "monthly"]),
    db: AsyncSession = Depends(get_db),
):
    start = _get_period_start(period)

    result = await db.execute(
        select(XPLedger.user_id, func.sum(XPLedger.amount).label("xp_earned"))
        .where(XPLedger.created_at >= start)
        .group_by(XPLedger.user_id)
        .order_by(func.sum(XPLedger.amount).desc())
        .limit(50)
    )
    rows = result.all()

    entries = []
    for user_id, xp_earned in rows:
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            continue

        # Get current streak — fall back to yesterday if today's row doesn't exist yet
        today = date.today()
        streak_result = await db.execute(
            select(Streak).where(Streak.user_id == user_id, Streak.date == today)
        )
        streak_row = streak_result.scalar_one_or_none()
        if streak_row:
            streak_count = streak_row.streak_count
        else:
            yesterday = today - timedelta(days=1)
            prev_result = await db.execute(
                select(Streak).where(Streak.user_id == user_id, Streak.date == yesterday)
            )
            prev_row = prev_result.scalar_one_or_none()
            streak_count = (
                prev_row.streak_count
                if prev_row and prev_row.easy1_done and prev_row.easy2_done and prev_row.medium_done
                else 0
            )

        entries.append({
            "username": user.username,
            "xp_this_period": xp_earned,
            "streak": streak_count,
        })

    return {"period": period, "entries": entries}
