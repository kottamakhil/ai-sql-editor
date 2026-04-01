from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Employee
from schemas.employee import CreateEmployeeRequest, EmployeeOut

router = APIRouter()


def _employee_to_out(emp: Employee) -> EmployeeOut:
    return EmployeeOut(
        employee_id=emp.id,
        name=emp.name,
        department=emp.department,
        role=emp.role,
        country=emp.country,
        start_date=emp.start_date,
    )


@router.post("/employees", response_model=EmployeeOut, status_code=201)
async def create_employee(req: CreateEmployeeRequest, session: AsyncSession = Depends(get_db)):
    employee = Employee(
        name=req.name,
        department=req.department,
        role=req.role,
        country=req.country,
        start_date=req.start_date,
    )
    session.add(employee)
    await session.commit()
    await session.refresh(employee)
    return _employee_to_out(employee)


@router.get("/employees", response_model=list[EmployeeOut])
async def list_employees(session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(Employee).order_by(Employee.name))
    return [_employee_to_out(e) for e in result.scalars()]


@router.get("/employees/{employee_id}", response_model=EmployeeOut)
async def get_employee(employee_id: str, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")
    return _employee_to_out(employee)
