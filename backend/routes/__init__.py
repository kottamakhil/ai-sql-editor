from fastapi import APIRouter

from routes.chat import router as chat_router
from routes.employees import router as employees_router
from routes.execution import router as execution_router
from routes.payment_schedules import router as payment_schedules_router
from routes.payouts import router as payouts_router
from routes.plans import router as plans_router
from routes.skills import router as skills_router

router = APIRouter(prefix="/api")

router.include_router(plans_router)
router.include_router(skills_router)
router.include_router(chat_router)
router.include_router(execution_router)
router.include_router(employees_router)
router.include_router(payouts_router)
router.include_router(payment_schedules_router)
