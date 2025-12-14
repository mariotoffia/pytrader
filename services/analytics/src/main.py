"""Analytics Service - FastAPI application"""
import time
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .routers import indicators, signals
from .models import HealthResponse
from .config import config
import logging

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="PyTrader Analytics Service",
    description="Technical indicators and trading signals",
    version="1.0.0",
)

@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.request_id = request_id

    start = time.time()
    try:
        response = await call_next(request)
    except Exception:
        elapsed_ms = int((time.time() - start) * 1000)
        logger.exception(f"[{request_id}] {request.method} {request.url.path} -> unhandled error ({elapsed_ms}ms)")
        raise

    elapsed_ms = int((time.time() - start) * 1000)
    response.headers["x-request-id"] = request_id
    logger.info(f"[{request_id}] {request.method} {request.url.path} -> {response.status_code} ({elapsed_ms}ms)")
    return response

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track start time
start_time = time.time()

# Include routers
app.include_router(indicators.router, tags=["indicators"])
app.include_router(signals.router, tags=["signals"])


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    uptime = time.time() - start_time
    return HealthResponse(
        status="ok",
        service="analytics",
        timestamp=int(time.time() * 1000),
        version="1.0.0",
        uptime=uptime,
    )


@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info(f"Analytics Service starting on port {config.PORT}")
    logger.info(f"Market Data URL: {config.MARKET_DATA_URL}")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("Analytics Service shutting down")
    # Close HTTP client
    await indicators.market_data_client.close()
    await signals.market_data_client.close()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=config.PORT,
        reload=True,
        log_level=config.LOG_LEVEL.lower(),
    )
