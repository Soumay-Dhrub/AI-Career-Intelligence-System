"""Placement Readiness System — FastAPI application factory.

Responsibilities:
- Lifespan: load ModelRegistry once at startup.
- Middleware: structured JSON request logging (method, path, status, duration_ms).
- Global exception handler: log full stack trace, return HTTP 500.
- Router registration: all module routers included here.
"""
import time
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.core.config import settings
from backend.core.logging import get_logger

logger = get_logger(__name__, level=settings.LOG_LEVEL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the ModelRegistry before serving requests."""
    from backend.services.model_registry import ModelRegistry

    registry = ModelRegistry()
    registry.load_all(settings)
    app.state.registry = registry
    logger.info("ModelRegistry loaded", extra={"model_status": registry.status()})
    yield
    logger.info("Application shutting down")


app = FastAPI(
    title="Placement Readiness System",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS — allow the Vite dev server and any localhost origin ─────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every request with method, path, status_code, and duration_ms."""
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000, 2)
    logger.info(
        "request",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch truly unhandled exceptions — let HTTPException pass through normally."""
    # Re-raise HTTPException so FastAPI handles it with the correct status code
    if isinstance(exc, HTTPException):
        raise exc
    logger.error(
        "Unhandled exception",
        extra={
            "method": request.method,
            "path": request.url.path,
            "traceback": traceback.format_exc(),
        },
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


def _include(router_path: str, **kwargs):
    """Attempt to import and register a router; skip gracefully if not yet created."""
    try:
        import importlib
        module_path, attr = router_path.rsplit(".", 1)
        module = importlib.import_module(module_path)
        router = getattr(module, attr)
        app.include_router(router, **kwargs)
        logger.info(f"Router registered: {router_path}")
    except (ImportError, AttributeError) as exc:
        logger.warning(f"Router not available yet, skipping: {router_path} ({exc})")


_include("backend.routes.health.router")
_include("backend.routes.burnout.router")
_include("backend.routes.resume.router")
_include("backend.routes.internship.router")
_include("backend.routes.failure.router")
_include("backend.routes.roadmap.router")
_include("backend.routes.analyze.router")

# Auth router — always available (no ML models needed)
from backend.routes.auth import router as auth_router  # noqa: E402
app.include_router(auth_router)

# Placement predictor
from backend.routes.placement import router as placement_router  # noqa: E402
app.include_router(placement_router)

# NextHire AI chat
from backend.routes.ai_chat import router as ai_chat_router  # noqa: E402
app.include_router(ai_chat_router)
