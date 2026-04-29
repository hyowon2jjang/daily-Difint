from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import User, Streak, TopicStat, UserBadge, Badge, XPLedger, UserAttempt, Problem

router = APIRouter(prefix="/profile", tags=["profile"])

LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000]


def _compute_strength(stat) -> int:
    total = stat.total_attempts
    if total == 0:
        return 0
    weighted = stat.correct_first * 1.0 + stat.correct_later * 0.6
    return int(min(100, weighted / total * 100))


@router.get("/{username}")
async def get_profile(username: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    today = date.today()

    # Latest streak
    streak_result = await db.execute(
        select(Streak)
        .where(Streak.user_id == user.id)
        .order_by(Streak.date.desc())
        .limit(1)
    )
    streak_row = streak_result.scalar_one_or_none()

    # Topic stats
    stats_result = await db.execute(
        select(TopicStat).where(TopicStat.user_id == user.id)
    )
    topic_stats = stats_result.scalars().all()

    topic_data = [
        {"tag": s.tag, "score": _compute_strength(s)}
        for s in sorted(topic_stats, key=lambda s: _compute_strength(s))
    ]

    total_solved = sum(s.correct_first + s.correct_later for s in topic_stats)
    total_attempts = sum(s.total_attempts for s in topic_stats)
    accuracy = round(total_solved / total_attempts * 100) if total_attempts else 0

    boss_result = await db.execute(
        select(func.count()).select_from(UserAttempt).join(
            Problem, UserAttempt.problem_id == Problem.id
        ).where(
            UserAttempt.user_id == user.id,
            UserAttempt.is_correct == True,
            Problem.difficulty == "boss",
        )
    )
    boss_solved = boss_result.scalar() or 0
    favorite_tag = None
    if topic_stats:
        best = max(topic_stats, key=lambda s: s.correct_first + s.correct_later)
        if best.correct_first + best.correct_later > 0:
            favorite_tag = best.tag

    # Badges
    badges_result = await db.execute(
        select(UserBadge, Badge)
        .join(Badge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == user.id)
    )
    badges = [
        {"id": str(b.id), "name": b.name, "description": b.description}
        for _, b in badges_result.all()
    ]

    # XP last 7 days
    xp_7_days = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = day.strftime("%Y-%m-%d")
        xp_result = await db.execute(
            select(func.sum(XPLedger.amount)).where(
                XPLedger.user_id == user.id,
                func.date(XPLedger.created_at) == day,
            )
        )
        xp_sum = xp_result.scalar() or 0
        xp_7_days.append({"date": day_start, "xp": xp_sum})

    # Solve calendar — last 6 months of streak rows
    six_months_ago = today - timedelta(days=182)
    calendar_result = await db.execute(
        select(Streak).where(
            Streak.user_id == user.id,
            Streak.date >= six_months_ago,
        )
    )
    streak_rows = calendar_result.scalars().all()

    calendar = {}
    for row in streak_rows:
        done_count = sum([row.easy1_done, row.easy2_done, row.medium_done])
        has_boss = row.boss_done
        if has_boss:
            level = 4  # boss
        elif done_count == 3:
            level = 3  # full required
        elif done_count >= 1:
            level = 2  # partial
        else:
            level = 0
        calendar[str(row.date)] = level

    # Level progress
    current_xp = user.xp
    current_level = user.level
    level_idx = min(current_level - 1, len(LEVEL_THRESHOLDS) - 1)
    next_idx = min(current_level, len(LEVEL_THRESHOLDS) - 1)
    xp_for_current = LEVEL_THRESHOLDS[level_idx]
    xp_for_next = LEVEL_THRESHOLDS[next_idx]
    xp_progress = current_xp - xp_for_current
    xp_needed = xp_for_next - xp_for_current
    level_pct = min(100, round(xp_progress / xp_needed * 100)) if xp_needed > 0 else 100

    return {
        "username": user.username,
        "xp": user.xp,
        "level": user.level,
        "friend_code": user.friend_code,
        "streak": streak_row.streak_count if streak_row else 0,
        "level_pct": level_pct,
        "xp_for_next": xp_for_next,
        "stats": {
            "total_solved": total_solved,
            "accuracy": accuracy,
            "boss_solved": boss_solved,
            "favorite_tag": favorite_tag,
        },
        "topic_stats": topic_data,
        "badges": badges,
        "xp_last_7_days": xp_7_days,
        "calendar": calendar,
    }
