import logging
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import async_session_factory, init_db
from logging_config import request_id_var, setup_logging
from middleware import RequestIDMiddleware
from routes import router
from seed import seed_data

setup_logging()
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    async with async_session_factory() as session:
        await seed_data(session)
    yield


app = FastAPI(title="AI SQL Editor POC", version="0.1.0", lifespan=lifespan)

app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    log.error("Unhandled exception on %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "request_id": request_id_var.get(),
            "traceback": traceback.format_exception_only(type(exc), exc),
        },
    )


@app.get("/ping")
async def ping():
    return {"status": "ok", "request_id": request_id_var.get()}
