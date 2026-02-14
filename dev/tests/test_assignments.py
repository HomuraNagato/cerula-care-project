
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, create_engine

from src.core.db import create_db_and_tables, override_engine
from src.main import app
from src.models import CareTeamMember, CareTeamRole


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


def create_patient(client: TestClient):
    response = client.post(
        "/patients",
        json={
            "first_name": "Marisol",
            "last_name": "Vega",
            "program": "Care Coaching",
            "status": "Active",
        },
    )
    return response.json()["id"]


def create_member():
    # Insert directly using the overridden in-memory engine.
    from src.core.db import get_engine

    member = CareTeamMember(
        name="Erin Kline",
        role=CareTeamRole.health_coach,
        email="erin.kline@cerula.care",
    )
    with Session(get_engine()) as session:
        session.add(member)
        session.commit()
        session.refresh(member)
    return str(member.id)


def test_assign_unassign_flow(client: TestClient):
    patient_id = create_patient(client)
    member_id = create_member()

    assign_resp = client.post(f"/patients/{patient_id}/assignments", json={"member_id": member_id})
    assert assign_resp.status_code == 201

    list_resp = client.get(f"/patients/{patient_id}/assignments")
    assert list_resp.status_code == 200
    assert any(item["member_id"] == member_id for item in list_resp.json())

    unassign_resp = client.delete(f"/patients/{patient_id}/assignments/{member_id}")
    assert unassign_resp.status_code == 200

    # Re-assign should succeed (reactivates)
    reassign_resp = client.post(f"/patients/{patient_id}/assignments", json={"member_id": member_id})
    assert reassign_resp.status_code == 201
