from datetime import date
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..core.db import get_session
from ..models import CareAssignment, CareTeamMember, Patient
from ..schemas import AssignmentRequest, AssignmentResponse

router = APIRouter()


@router.post("/patients/{patient_id}/assignments", response_model=AssignmentResponse, status_code=201)
def assign_team_member(
    patient_id: UUID,
    payload: AssignmentRequest,
    session: Session = Depends(get_session),
) -> AssignmentResponse:
    patient = session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    member = session.get(CareTeamMember, payload.member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Care team member not found")

    assignment = session.get(CareAssignment, (patient_id, payload.member_id))
    if assignment:
        if assignment.end_date is None:
            return AssignmentResponse(
                patient_id=patient_id,
                member_id=payload.member_id,
                start_date=assignment.start_date,
                end_date=assignment.end_date,
            )
        assignment.start_date = payload.start_date or date.today()
        assignment.end_date = None
        session.add(assignment)
        session.commit()
        session.refresh(assignment)
        return AssignmentResponse(
            patient_id=assignment.patient_id,
            member_id=assignment.member_id,
            start_date=assignment.start_date,
            end_date=assignment.end_date,
        )

    active_assignment = CareAssignment(
        patient_id=patient_id,
        member_id=payload.member_id,
        start_date=payload.start_date or date.today(),
    )
    session.add(active_assignment)
    session.commit()
    session.refresh(active_assignment)

    return AssignmentResponse(
        patient_id=active_assignment.patient_id,
        member_id=active_assignment.member_id,
        start_date=active_assignment.start_date,
        end_date=active_assignment.end_date,
    )


@router.get("/patients/{patient_id}/assignments", response_model=List[AssignmentResponse])
def list_assignments(patient_id: UUID, session: Session = Depends(get_session)) -> List[AssignmentResponse]:
    if not session.get(Patient, patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")

    assignments = (
        session.exec(select(CareAssignment).where(CareAssignment.patient_id == patient_id)).scalars().all()
    )
    return [
        AssignmentResponse(
            patient_id=assignment.patient_id,
            member_id=assignment.member_id,
            start_date=assignment.start_date,
            end_date=assignment.end_date,
        )
        for assignment in assignments
    ]


@router.delete("/patients/{patient_id}/assignments/{member_id}", response_model=AssignmentResponse)
def unassign_team_member(
    patient_id: UUID,
    member_id: UUID,
    session: Session = Depends(get_session),
) -> AssignmentResponse:
    assignment = session.get(CareAssignment, (patient_id, member_id))
    if not assignment or assignment.end_date is not None:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.end_date = date.today()
    session.add(assignment)
    session.commit()
    session.refresh(assignment)

    return AssignmentResponse(
        patient_id=assignment.patient_id,
        member_id=assignment.member_id,
        start_date=assignment.start_date,
        end_date=assignment.end_date,
    )
