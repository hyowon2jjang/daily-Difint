import uuid
from datetime import date, datetime
from sqlalchemy import (
    Boolean, Column, Date, DateTime, ForeignKey,
    Integer, String, Text, UniqueConstraint, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(40), unique=True, nullable=False)
    email = Column(String, unique=True)
    hashed_password = Column(String)
    firebase_uid = Column(String, unique=True)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    friend_code = Column(String(7), unique=True, nullable=False)
    referred_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    streaks = relationship("Streak", back_populates="user")
    topic_stats = relationship("TopicStat", back_populates="user")
    badges = relationship("UserBadge", back_populates="user")


class Streak(Base):
    __tablename__ = "streaks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    easy1_done = Column(Boolean, default=False)
    easy2_done = Column(Boolean, default=False)
    medium_done = Column(Boolean, default=False)
    boss_done = Column(Boolean, default=False)
    streak_count = Column(Integer, default=0)

    user = relationship("User", back_populates="streaks")
    __table_args__ = (UniqueConstraint("user_id", "date"),)


class Problem(Base):
    __tablename__ = "problems"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200))
    body_latex = Column(Text, nullable=False)
    answer_latex = Column(Text, nullable=False)
    difficulty = Column(String(10), nullable=False)   # easy | medium | boss
    technique_tags = Column(ARRAY(String), default=[])
    source = Column(String(20), default="admin")       # admin | community
    status = Column(String(20), default="pending")     # pending | approved | rejected | scheduled
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    admin_notes = Column(Text)


class DailySchedule(Base):
    __tablename__ = "daily_schedule"

    date = Column(Date, primary_key=True)
    easy1_id = Column(UUID(as_uuid=True), ForeignKey("problems.id"))
    easy2_id = Column(UUID(as_uuid=True), ForeignKey("problems.id"))
    medium_id = Column(UUID(as_uuid=True), ForeignKey("problems.id"))
    boss_id = Column(UUID(as_uuid=True), ForeignKey("problems.id"), nullable=True)


class UserAttempt(Base):
    __tablename__ = "user_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    guest_session = Column(String)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("problems.id"), nullable=False)
    submitted_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    attempt_number = Column(Integer, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)


class TopicStat(Base):
    __tablename__ = "topic_stats"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    tag = Column(String(60), primary_key=True)
    total_attempts = Column(Integer, default=0)
    correct_first = Column(Integer, default=0)
    correct_later = Column(Integer, default=0)
    failed = Column(Integer, default=0)

    user = relationship("User", back_populates="topic_stats")


class Badge(Base):
    __tablename__ = "badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(80), unique=True, nullable=False)
    description = Column(Text)
    condition_key = Column(String(60))


class UserBadge(Base):
    __tablename__ = "user_badges"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    badge_id = Column(UUID(as_uuid=True), ForeignKey("badges.id"), primary_key=True)
    earned_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="badges")
    badge = relationship("Badge")


class Friend(Base):
    __tablename__ = "friends"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    friend_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Nudge(Base):
    __tablename__ = "nudges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    from_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("from_user_id", "to_user_id", "date"),)


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("problems.id"), nullable=False)
    posted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    upvotes = Column(Integer, default=0)
    solve_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Comment(Base):
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("community_posts.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class PostUpvote(Base):
    __tablename__ = "post_upvotes"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    post_id = Column(UUID(as_uuid=True), ForeignKey("community_posts.id"), primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "post_id"),)


class XPLedger(Base):
    __tablename__ = "xp_ledger"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    reason = Column(String(80), nullable=False)
    reference_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
