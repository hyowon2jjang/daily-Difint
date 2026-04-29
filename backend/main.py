import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, daily, community, leaderboard, profile, admin

app = FastAPI(title="dailyDifint API", version="0.1.0")

_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
allowed_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(daily.router)
app.include_router(community.router)
app.include_router(leaderboard.router)
app.include_router(profile.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "dailyDifint API"}
