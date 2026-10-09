from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.api.routes import router
from app.database import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [TestPilot-Backend] %(message)s"
)
logger = logging.getLogger("testpilot")

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing TestPilot AI SQLite persistence and Hawkins containment protocols...")
    init_db()
    logger.info("Database and storage directories initialized.")
    yield

app = FastAPI(
    title="TestPilot AI — Autonomous Testing Agent API",
    description="Backend services for code analysis, safe browser exploration, Playwright test generation and reporting. Developed by TEAM VORTEX (Lead Developer: Chareesh K).",
    version="2.4.0-HAWKINS",
    lifespan=lifespan
)

# CORS setup for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server anomaly: {str(exc)}"}
    )

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
