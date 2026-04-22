import logging
import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.routers import institutes, candidates, polls, aggregation, export, admin

logging.basicConfig(level=logging.DEBUG)

app = FastAPI(
    title="Agregador de Pesquisas Eleitorais — ES",
    description="API para agregação e visualização de pesquisas eleitorais do Espírito Santo.",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
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
