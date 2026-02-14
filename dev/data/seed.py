import calendar
import sys
from datetime import date
from pathlib import Path

from sqlmodel import delete, select

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from src.core.db import create_db_and_tables, get_session
from src.models import CareAssignment, CareTeamMember, CareTeamRole, HealthScreening, Patient, PatientStatus


def months_ago(reference: date, months: int) -> date:
    year = reference.year
    month = reference.month - months
    while month <= 0:
        month += 12
        year -= 1
    day = min(reference.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def clear_tables(session):
    for model in (HealthScreening, CareAssignment, Patient, CareTeamMember):
        session.exec(delete(model))
    session.commit()


def build_seed_data():
    today = date.today()

    patients = [
        Patient(
            first_name="Marisol",
            last_name="Vega",
            date_of_birth=date(1989, 6, 12),
            email="marisol.vega@example.com",
            phone="(512) 555-3712",
            program="Care Coaching",
            status=PatientStatus.active,
        ),
        Patient(
            first_name="Jonas",
            last_name="Pierce",
            date_of_birth=date(1974, 2, 20),
            email="jonas.pierce@example.com",
            phone="(206) 555-9821",
            program="BHCM Intensive",
            status=PatientStatus.inactive,
        ),
        Patient(
            first_name="Amaya",
            last_name="Liu",
            date_of_birth=date(1993, 11, 2),
            email="amaya.liu@example.com",
            phone="(646) 555-4087",
            program="Psychiatry Care",
            status=PatientStatus.discharged,
        ),
        Patient(
            first_name="Evan",
            last_name="Brooks",
            date_of_birth=date(1985, 9, 18),
            email="evan.brooks@example.com",
            phone="(415) 555-1182",
            program="Care Coaching",
            status=PatientStatus.active,
        ),
        Patient(
            first_name="Kara",
            last_name="Nguyen",
            date_of_birth=date(1991, 1, 7),
            email="kara.nguyen@example.com",
            phone="(303) 555-4432",
            program="BHCM Intensive",
            status=PatientStatus.active,
        ),
        Patient(
            first_name="Miles",
            last_name="Hernandez",
            date_of_birth=date(1979, 4, 23),
            email="miles.hernandez@example.com",
            phone="(213) 555-9014",
            program="Psychiatry Care",
            status=PatientStatus.inactive,
        ),
        Patient(
            first_name="Priya",
            last_name="Singh",
            date_of_birth=date(1988, 12, 3),
            email="priya.singh@example.com",
            phone="(646) 555-7709",
            program="Care Coaching",
            status=PatientStatus.active,
        ),
        Patient(
            first_name="Dante",
            last_name="Cole",
            date_of_birth=date(1995, 6, 30),
            email="dante.cole@example.com",
            phone="(702) 555-6721",
            program="BHCM Intensive",
            status=PatientStatus.active,
        ),
        Patient(
            first_name="Selena",
            last_name="Park",
            date_of_birth=date(1982, 2, 14),
            email="selena.park@example.com",
            phone="(917) 555-3341",
            program="Psychiatry Care",
            status=PatientStatus.discharged,
        ),
        Patient(
            first_name="Noah",
            last_name="Adler",
            date_of_birth=date(1976, 8, 9),
            email="noah.adler@example.com",
            phone="(312) 555-9902",
            program="Care Coaching",
            status=PatientStatus.inactive,
        ),
        Patient(
            first_name="Lila",
            last_name="Montoya",
            date_of_birth=date(1999, 5, 27),
            email="lila.montoya@example.com",
            phone="(602) 555-4819",
            program="BHCM Intensive",
            status=PatientStatus.active,
        ),
        Patient(
            first_name="Gavin",
            last_name="Ross",
            date_of_birth=date(1983, 10, 11),
            email="gavin.ross@example.com",
            phone="(404) 555-1087",
            program="Psychiatry Care",
            status=PatientStatus.active,
        ),
        Patient(
            first_name="Zara",
            last_name="Kline",
            date_of_birth=date(1992, 7, 5),
            email="zara.kline@example.com",
            phone="(503) 555-7420",
            program="Care Coaching",
            status=PatientStatus.active,
        ),
    ]

    care_team = [
        CareTeamMember(name="Erin Kline", role=CareTeamRole.health_coach, email="erin.kline@cerula.care"),
        CareTeamMember(
            name="Devon Ortega",
            role=CareTeamRole.bhcm,
            email="devon.ortega@cerula.care",
        ),
        CareTeamMember(
            name="Dr. Priya Banerjee",
            role=CareTeamRole.psychiatrist,
            email="priya.banerjee@cerula.care",
        ),
    ]

    assignments = [
        (0, 0, 2),
        (0, 1, 1),
        (1, 1, 3),
        (2, 2, 4),
    ]

    screenings = []
    for patient_index, patient in enumerate(patients):
        base = 6 + patient_index
        for offset in range(6):
            screenings.append(
                HealthScreening(
                    patient_id=patient.id,
                    score=max(0, min(10, base - offset)),
                    collected_on=months_ago(today, offset),
                    note="Monthly behavioral health screen",
                )
            )

    return patients, care_team, assignments, screenings


def load_seed():
    create_db_and_tables()
    for session in get_session():
        clear_tables(session)

        patients, care_team, assignments, screenings = build_seed_data()

        session.add_all(patients)
        session.add_all(care_team)
        session.commit()

        members = session.exec(select(CareTeamMember)).all()

        for patient_index, member_index, months_back in assignments:
            patient = patients[patient_index]
            member = members[member_index]
            session.add(
                CareAssignment(
                    patient_id=patient.id,
                    member_id=member.id,
                    start_date=months_ago(date.today(), months_back),
                )
            )

        session.add_all(screenings)
        session.commit()

    print("Seed data loaded: 13 patients, 3 care team members, assignments, 6-month screenings.")


if __name__ == "__main__":
    load_seed()
