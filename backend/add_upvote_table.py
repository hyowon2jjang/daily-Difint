import asyncio
from app.core.database import engine
from app.models.models import Base

async def run():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("post_upvotes table created!")

asyncio.run(run())
