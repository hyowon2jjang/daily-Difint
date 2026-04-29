import asyncio
from app.core.database import engine
from app.models.models import Base

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created!")

asyncio.run(create_tables())
