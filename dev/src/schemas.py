from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field
from sqlmodel import SQLModel

from .models import CareTeamRole, PatientStatus


class PatientBase(SQLModel):
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    program: str
    status: PatientStatus = Field(default=PatientStatus.active)


class PatientCreate(PatientBase):
    pass


class PatientUpdate(SQLModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    program: Optional[str] = None
    status: Optional[PatientStatus] = None


class PatientRead(PatientBase):
    id: UUID
    created_at: datetime


class PatientListItem(PatientRead):
    last_screening_score: Optional[int] = None
    last_screening_date: Optional[date] = None
    assigned_team: List[str] = []

class CareTeamMemberRead(SQLModel):
    id: UUID
    name: str
    role: CareTeamRole
    email: Optional[str] = None
    phone: Optional[str] = None


class HealthScreeningRead(SQLModel):
    id: UUID
    score: int
    collected_on: date
    note: Optional[str] = None


class CareAssignmentRead(SQLModel):
    patient_id: UUID
    member_id: UUID
    start_date: date
    end_date: Optional[date] = None
    member: Optional[CareTeamMemberRead] = None


class PatientDetail(PatientRead):
    assignments: List[CareAssignmentRead] = []
    screenings: List[HealthScreeningRead] = []


class PatientListResponse(BaseModel):
    items: List[PatientListItem]
    total: int
    page: int
    limit: int


class AssignmentRequest(BaseModel):
    member_id: UUID
    start_date: Optional[date] = Field(default_factory=date.today)


class AssignmentResponse(BaseModel):
    patient_id: UUID
    member_id: UUID
    start_date: date
    end_date: Optional[date] = None


class ScreeningListResponse(BaseModel):
    items: List[HealthScreeningRead]
