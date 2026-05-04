from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings

_db_url = settings.DATABASE_URL
_connect_args = {}
for _param in ("sslmode=require", "sslmode=prefer", "channel_binding=require"):
    _db_url = _db_url.replace(f"?{_param}&", "?").replace(f"&{_param}", "").replace(f"?{_param}", "")
if "sslmode" not in settings.DATABASE_URL and "neon.tech" in settings.DATABASE_URL:
    _connect_args["ssl"] = True
elif "sslmode=require" in settings.DATABASE_URL or "sslmode=prefer" in settings.DATABASE_URL:
    _connect_args["ssl"] = True

engine = create_async_engine(_db_url, echo=False, connect_args=_connect_args)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
