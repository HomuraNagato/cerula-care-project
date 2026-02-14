from typing import Dict

import pytest
from fastapi.testclient import TestClient
from sqlmodel import create_engine

from src.core.db import create_db_and_tables, override_engine
from src.main import app


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
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
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
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Marisol"
    assert data["last_name"] == "Vega"
    list_response = client.get("/api/patients")
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1


def test_patient_detail_includes_screenings(client: TestClient):
    payload = build_patient_payload("Jonas Pierce")
    create_response = client.post("/api/patients", json=payload).json()
    patient_id = create_response["id"]
    detail_response = client.get(f"/api/patients/{patient_id}")
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["email"] is None
