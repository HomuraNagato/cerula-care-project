
from typing import Dict

import pytest
from fastapi.testclient import TestClient
from datetime import date, timedelta
from uuid import UUID
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, create_engine

from src.core.db import create_db_and_tables, override_engine
from src.main import app
from src.models import HealthScreening


def build_patient_payload(name: str) -> Dict[str, str]:
    first_name, last_name = name.split()
    return {
        "first_name": first_name,
        "last_name": last_name,
        "program": "Care Coaching",
        "status": "Active",
    }


@pytest.fixture(scope="module")
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    override_engine(engine)
    create_db_and_tables()
    with TestClient(app) as test_client:
        yield test_client


def test_health_check(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_patient_can_be_created_and_listed(client: TestClient):
    payload = build_patient_payload("Marisol Vega")
    response = client.post("/patients", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Marisol"
    assert data["last_name"] == "Vega"
    list_response = client.get("/patients")
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1


def test_patient_detail_includes_screenings(client: TestClient):
    payload = build_patient_payload("Jonas Pierce")
    create_response = client.post("/patients", json=payload).json()
    patient_id = create_response["id"]
    # Insert a screening directly for test coverage.
    from src.core.db import get_engine

    with Session(get_engine()) as session:
        session.add(
            HealthScreening(
                patient_id=UUID(patient_id),
                score=4,
                collected_on=date.today() - timedelta(days=30),
                note="Monthly screening",
            )
        )
        session.commit()
    detail_response = client.get(f"/patients/{patient_id}")
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["email"] is None

    screenings_response = client.get(f"/patients/{patient_id}/screenings")
    assert screenings_response.status_code == 200
    assert len(screenings_response.json()["items"]) >= 1
