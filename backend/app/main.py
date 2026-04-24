import logging
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.routers import institutes, candidates, polls, aggregation, export, admin

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Recompute all aggregation caches on every startup."""
    try:
        from sqlalchemy import select
        from app.models.poll import Poll
        from app.database import AsyncSessionLocal
        from app.services.aggregation import refresh_aggregation_cache

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Poll.election_type, Poll.round).distinct()
            )
            combinations = result.all()
            for election_type, round_ in combinations:
                await refresh_aggregation_cache(db, election_type, round_)
                logger.info("Recomputed aggregation: %s round %s", election_type, round_)
            await db.commit()
    except Exception as exc:
        logger.warning("Startup aggregation recompute failed: %s", exc)
    yield


app = FastAPI(
    title="Agregador de Pesquisas Eleitorais — ES",
    description="API para agregação e visualização de pesquisas eleitorais do Espírito Santo.",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"

app.include_router(institutes.router, prefix=PREFIX)
app.include_router(candidates.router, prefix=PREFIX)
app.include_router(polls.router, prefix=PREFIX)
app.include_router(aggregation.router, prefix=PREFIX)
app.include_router(export.router, prefix=PREFIX)
app.include_router(admin.router, prefix=PREFIX)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error("Unhandled exception: %s\n%s", exc, traceback.format_exc())
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}
