import datetime
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Deal, Employee, Quota

log = logging.getLogger(__name__)

EMPLOYEES = [
    Employee(id="emp_01", name="Alice Chen", department="Sales", role="Account Executive", start_date=datetime.date(2022, 3, 15)),
    Employee(id="emp_02", name="Bob Martinez", department="Sales", role="Account Executive", start_date=datetime.date(2021, 7, 1)),
    Employee(id="emp_03", name="Charlie Kim", department="Sales", role="SDR", start_date=datetime.date(2023, 1, 10)),
    Employee(id="emp_04", name="Diana Patel", department="Sales", role="Account Executive", start_date=datetime.date(2020, 11, 20)),
    Employee(id="emp_05", name="Ethan Brooks", department="Sales", role="SDR", start_date=datetime.date(2023, 6, 5)),
    Employee(id="emp_06", name="Fiona Walsh", department="Sales", role="Sales Manager", start_date=datetime.date(2019, 4, 12)),
    Employee(id="emp_07", name="George Tanaka", department="Sales", role="Account Executive", start_date=datetime.date(2022, 9, 1)),
    Employee(id="emp_08", name="Hannah Lee", department="Sales", role="Account Executive", start_date=datetime.date(2021, 2, 14)),
    Employee(id="emp_09", name="Ivan Petrov", department="Engineering", role="Staff Engineer", start_date=datetime.date(2020, 8, 3)),
    Employee(id="emp_10", name="Julia Reyes", department="Sales", role="VP Sales", start_date=datetime.date(2018, 1, 15)),
]

DEALS = [
    Deal(id="deal_01", employee_id="emp_01", deal_value=120000, stage="Closed Won", closed_date=datetime.date(2025, 1, 15), region="NA"),
    Deal(id="deal_02", employee_id="emp_01", deal_value=85000, stage="Closed Won", closed_date=datetime.date(2025, 2, 20), region="NA"),
    Deal(id="deal_03", employee_id="emp_01", deal_value=45000, stage="Pipeline", closed_date=None, region="NA"),
    Deal(id="deal_04", employee_id="emp_02", deal_value=200000, stage="Closed Won", closed_date=datetime.date(2025, 1, 8), region="EMEA"),
    Deal(id="deal_05", employee_id="emp_02", deal_value=60000, stage="Closed Won", closed_date=datetime.date(2025, 3, 5), region="EMEA"),
    Deal(id="deal_06", employee_id="emp_02", deal_value=35000, stage="Disqualified", closed_date=None, region="EMEA"),
    Deal(id="deal_07", employee_id="emp_03", deal_value=25000, stage="Closed Won", closed_date=datetime.date(2025, 2, 10), region="APAC"),
    Deal(id="deal_08", employee_id="emp_04", deal_value=175000, stage="Closed Won", closed_date=datetime.date(2025, 1, 22), region="NA"),
    Deal(id="deal_09", employee_id="emp_04", deal_value=95000, stage="Closed Won", closed_date=datetime.date(2025, 3, 12), region="NA"),
    Deal(id="deal_10", employee_id="emp_04", deal_value=150000, stage="Pipeline", closed_date=None, region="LATAM"),
    Deal(id="deal_11", employee_id="emp_05", deal_value=30000, stage="Closed Won", closed_date=datetime.date(2025, 2, 28), region="NA"),
    Deal(id="deal_12", employee_id="emp_07", deal_value=110000, stage="Closed Won", closed_date=datetime.date(2025, 1, 30), region="EMEA"),
    Deal(id="deal_13", employee_id="emp_07", deal_value=72000, stage="Closed Won", closed_date=datetime.date(2025, 3, 1), region="EMEA"),
    Deal(id="deal_14", employee_id="emp_07", deal_value=40000, stage="Disqualified", closed_date=None, region="APAC"),
    Deal(id="deal_15", employee_id="emp_08", deal_value=55000, stage="Closed Won", closed_date=datetime.date(2025, 2, 5), region="NA"),
    Deal(id="deal_16", employee_id="emp_08", deal_value=190000, stage="Closed Won", closed_date=datetime.date(2025, 3, 18), region="NA"),
    Deal(id="deal_17", employee_id="emp_08", deal_value=80000, stage="Pipeline", closed_date=None, region="LATAM"),
    Deal(id="deal_18", employee_id="emp_01", deal_value=65000, stage="Closed Won", closed_date=datetime.date(2025, 3, 25), region="APAC"),
    Deal(id="deal_19", employee_id="emp_02", deal_value=140000, stage="Pipeline", closed_date=None, region="NA"),
    Deal(id="deal_20", employee_id="emp_04", deal_value=88000, stage="Closed Won", closed_date=datetime.date(2025, 2, 15), region="EMEA"),
]

QUOTAS = [
    Quota(id="q_01", employee_id="emp_01", quarter="Q1-2025", target_amount=250000, attainment_pct=108.0),
    Quota(id="q_02", employee_id="emp_01", quarter="Q2-2025", target_amount=275000, attainment_pct=0.0),
    Quota(id="q_03", employee_id="emp_02", quarter="Q1-2025", target_amount=300000, attainment_pct=86.7),
    Quota(id="q_04", employee_id="emp_02", quarter="Q2-2025", target_amount=320000, attainment_pct=0.0),
    Quota(id="q_05", employee_id="emp_03", quarter="Q1-2025", target_amount=100000, attainment_pct=25.0),
    Quota(id="q_06", employee_id="emp_04", quarter="Q1-2025", target_amount=350000, attainment_pct=102.3),
    Quota(id="q_07", employee_id="emp_04", quarter="Q2-2025", target_amount=375000, attainment_pct=0.0),
    Quota(id="q_08", employee_id="emp_05", quarter="Q1-2025", target_amount=80000, attainment_pct=37.5),
    Quota(id="q_09", employee_id="emp_07", quarter="Q1-2025", target_amount=200000, attainment_pct=91.0),
    Quota(id="q_10", employee_id="emp_07", quarter="Q2-2025", target_amount=220000, attainment_pct=0.0),
    Quota(id="q_11", employee_id="emp_08", quarter="Q1-2025", target_amount=280000, attainment_pct=87.5),
    Quota(id="q_12", employee_id="emp_08", quarter="Q2-2025", target_amount=300000, attainment_pct=0.0),
]


async def seed_data(session: AsyncSession) -> None:
    result = await session.execute(select(Employee.id).limit(1))
    if result.scalar_one_or_none() is not None:
        log.info("Seed data already present, skipping")
        return

    session.add_all(EMPLOYEES)
    await session.flush()
    session.add_all(DEALS)
    session.add_all(QUOTAS)
    await session.commit()
    log.info("Seeded %d employees, %d deals, %d quotas", len(EMPLOYEES), len(DEALS), len(QUOTAS))
