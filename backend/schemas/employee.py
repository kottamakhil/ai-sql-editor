import datetime

from pydantic import BaseModel


class CreateEmployeeRequest(BaseModel):
    name: str
    department: str
    role: str
    country: str = "US"
    start_date: datetime.date


class EmployeeOut(BaseModel):
    employee_id: str
    name: str
    department: str
    role: str
    country: str
    start_date: datetime.date
