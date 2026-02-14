from datetime import date, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from ..core.db import get_session
from ..models import CareAssignment, CareTeamMember, HealthScreening, Patient, PatientStatus
from ..schemas import (
    CareAssignmentRead,
    CareTeamMemberRead,
    HealthScreeningRead,
    PatientCreate,
    PatientDetail,
    PatientListResponse,
    PatientListItem,
    PatientRead,
    PatientUpdate,
    ScreeningListResponse,
)

router = APIRouter()


@router.get("", response_model=PatientListResponse)
def list_patients(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[PatientStatus] = Query(None),
    program: Optional[str] = Query(None),
    session: Session = Depends(get_session),
) -> PatientListResponse:
    query = select(Patient)

    if search:
        search_clause = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                Patient.first_name.ilike(search_clause),
                Patient.last_name.ilike(search_clause),
                (Patient.first_name + " " + Patient.last_name).ilike(search_clause),
            )
        )

    if status:
        query = query.where(Patient.status == status)

    if program:
        query = query.where(Patient.program.ilike(f"%{program}%"))

    total_row = session.exec(select(func.count()).select_from(query.subquery())).one()
    total = total_row[0] if isinstance(total_row, tuple) else total_row
    offset = (page - 1) * limit
    patients = session.exec(
        query.order_by(Patient.created_at.desc()).offset(offset).limit(limit)
    ).all()

    patient_ids = [patient.id for patient in patients]
    latest_screenings = {}
    if patient_ids:
        screening_rows = session.exec(
            select(HealthScreening)
            .where(HealthScreening.patient_id.in_(patient_ids))
            .order_by(HealthScreening.patient_id, HealthScreening.collected_on.desc())
        ).all()
        for screening in screening_rows:
            if screening.patient_id not in latest_screenings:
                latest_screenings[screening.patient_id] = screening

    assignment_rows = session.exec(
        select(CareAssignment, CareTeamMember)
        .join(CareTeamMember, CareAssignment.member_id == CareTeamMember.id)
        .where(CareAssignment.patient_id.in_(patient_ids))
        .where(CareAssignment.end_date.is_(None))
    ).all()

    assigned_map = {pid: [] for pid in patient_ids}
    for assignment, member in assignment_rows:
        assigned_map.setdefault(assignment.patient_id, []).append(member.name)

    patient_items = []
    for patient in patients:
        latest = latest_screenings.get(patient.id)
        patient_items.append(
            PatientListItem(
                **PatientRead.from_orm(patient).dict(),
                last_screening_score=latest.score if latest else None,
                last_screening_date=latest.collected_on if latest else None,
                assigned_team=assigned_map.get(patient.id, []),
            )
        )

    return PatientListResponse(items=patient_items, total=total, page=page, limit=limit)


@router.post("", response_model=PatientRead, status_code=201)
def create_patient(payload: PatientCreate, session: Session = Depends(get_session)) -> PatientRead:
    patient = Patient.from_orm(payload)
    session.add(patient)
    session.commit()
    session.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=PatientDetail)
def get_patient_detail(patient_id: UUID, session: Session = Depends(get_session)) -> PatientDetail:
    stmt = (
        select(Patient)
        .where(Patient.id == patient_id)
        .options(
            selectinload(Patient.assignments).selectinload(CareAssignment.member),
            selectinload(Patient.screenings),
        )
    )
    patient = session.exec(stmt).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_detail = PatientDetail.from_orm(patient)
    patient_detail.assignments = [
        CareAssignmentRead(
            patient_id=assignment.patient_id,
            member_id=assignment.member_id,
            start_date=assignment.start_date,
            end_date=assignment.end_date,
            member=CareTeamMemberRead.from_orm(assignment.member) if assignment.member else None,
        )
        for assignment in patient.assignments
        if assignment.end_date is None
    ]
    patient_detail.screenings = [
        HealthScreeningRead.from_orm(screening)
        for screening in sorted(patient.screenings, key=lambda s: s.collected_on, reverse=True)
    ]
    return patient_detail


@router.put("/{patient_id}", response_model=PatientRead)
def update_patient(patient_id: UUID, payload: PatientUpdate, session: Session = Depends(get_session)) -> PatientRead:
    patient = session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_data = payload.dict(exclude_unset=True)
    for field, value in patient_data.items():
        setattr(patient, field, value)

    session.add(patient)
    session.commit()
    session.refresh(patient)
    return patient


@router.get("/{patient_id}/screenings", response_model=ScreeningListResponse)
def patient_screenings(
    patient_id: UUID,
    months: int = Query(6, ge=1, le=24),
    limit: int = Query(10, ge=1, le=24),
    session: Session = Depends(get_session),
) -> ScreeningListResponse:
    cutoff = date.today() - timedelta(days=months * 31)
    screenings = session.exec(
        select(HealthScreening)
        .where(HealthScreening.patient_id == patient_id)
        .where(HealthScreening.collected_on >= cutoff)
        .order_by(HealthScreening.collected_on.desc())
        .limit(limit)
    ).all()
    return ScreeningListResponse(items=screenings)
