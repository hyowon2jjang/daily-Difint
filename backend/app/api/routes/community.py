from asyncpg import UniqueViolationError
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from jose import jwt, JWTError
from pydantic import BaseModel
from sqlalchemy import select, desc, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.config import settings
from app.core.database import get_db
from app.models.models import CommunityPost, Comment, Problem, User, PostUpvote, UserAttempt

router = APIRouter(prefix="/community", tags=["community"])


def _get_user_id(authorization: str | None = Header(default=None)) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


class SubmitPostRequest(BaseModel):
    title: str
    body_latex: str
    answer_latex: str
    difficulty: str          # easy | medium | boss
    technique_tags: List[str]


@router.get("")
async def get_feed(
    sort: str = Query("hot", enum=["hot", "new", "most-solved"]),
    tag: str | None = Query(None),
    page: int = Query(1, ge=1),
    db: AsyncSession = Depends(get_db),
):
    limit = 20
    offset = (page - 1) * limit

    query = (
        select(CommunityPost, Problem, User)
        .join(Problem, CommunityPost.problem_id == Problem.id)
        .join(User, CommunityPost.posted_by == User.id)
        .where(Problem.status == "approved")
    )

    if tag:
        query = query.where(Problem.technique_tags.contains([tag]))

    if sort == "new":
        query = query.order_by(desc(CommunityPost.created_at))
    elif sort == "most-solved":
        query = query.order_by(desc(CommunityPost.solve_count))
    else:
        query = query.order_by(desc(CommunityPost.upvotes))

    result = await db.execute(query.offset(offset).limit(limit))
    rows = result.all()

    posts = []
    for post, problem, user in rows:
        comment_count_result = await db.execute(
            select(func.count()).where(Comment.post_id == post.id)
        )
        comment_count = comment_count_result.scalar()
        posts.append({
            "id": str(post.id),
            "problem_id": str(post.problem_id),
            "body_latex": problem.body_latex,
            "title": problem.title,
            "difficulty": problem.difficulty,
            "technique_tags": problem.technique_tags or [],
            "author": user.username,
            "upvotes": post.upvotes,
            "solve_count": post.solve_count,
            "comment_count": comment_count,
            "created_at": post.created_at.isoformat(),
        })

    return {"posts": posts, "page": page}


@router.post("")
async def create_post(
    body: SubmitPostRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(_get_user_id),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required to submit problems.")

    if body.difficulty not in ("easy", "medium", "boss"):
        raise HTTPException(status_code=400, detail="Invalid difficulty.")

    if not body.body_latex.strip() or not body.answer_latex.strip():
        raise HTTPException(status_code=400, detail="Problem and answer cannot be empty.")

    problem = Problem(
        title=body.title or "Community Problem",
        body_latex=body.body_latex.strip(),
        answer_latex=body.answer_latex.strip(),
        difficulty=body.difficulty,
        technique_tags=body.technique_tags,
        source="community",
        status="approved",
        submitted_by=user_id,
    )
    db.add(problem)
    await db.flush()

    post = CommunityPost(
        problem_id=problem.id,
        posted_by=user_id,
    )
    db.add(post)
    await db.commit()

    return {"id": str(post.id), "problem_id": str(problem.id)}


@router.post("/{post_id}/upvote")
async def upvote_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(_get_user_id),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    result = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    try:
        db.add(PostUpvote(user_id=user_id, post_id=post_id))
        post.upvotes += 1
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Already upvoted.")
    return {"upvotes": post.upvotes}


@router.get("/{post_id}/comments")
async def get_comments(post_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Comment, User)
        .join(User, Comment.user_id == User.id)
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at)
    )
    return [
        {"id": str(c.id), "username": u.username, "body": c.body,
         "created_at": c.created_at.isoformat()}
        for c, u in result.all()
    ]


class CommentRequest(BaseModel):
    body: str


@router.post("/{post_id}/comment")
async def add_comment(
    post_id: str,
    body: CommentRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(_get_user_id),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    if not body.body.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty.")
    comment = Comment(post_id=post_id, user_id=user_id, body=body.body.strip())
    db.add(comment)
    await db.commit()
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    return {"id": str(comment.id), "username": user.username if user else "?",
            "body": comment.body, "created_at": comment.created_at.isoformat()}


@router.post("/{post_id}/solve")
async def mark_solved(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(_get_user_id),
):
    result = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    # Block duplicate solves using UserAttempt
    if user_id:
        already = await db.execute(
            select(UserAttempt).where(
                UserAttempt.user_id == user_id,
                UserAttempt.problem_id == post.problem_id,
                UserAttempt.is_correct == True,
            )
        )
        if already.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Already solved.")

    post.solve_count += 1
    await db.commit()
    return {"solve_count": post.solve_count}
