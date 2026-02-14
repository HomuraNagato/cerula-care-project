from datetime import date, datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, ForeignKey, Relationship, SQLModel


class PatientStatus(str, Enum):
    active = "Active"
    inactive = "Inactive"
    discharged = "Discharged"


class CareTeamRole(str, Enum):
    health_coach = "Health Coach"
    bhcm = "Behavioral Health Care Manager"
    psychiatrist = "Psychiatrist"


class Patient(SQLModel, table=True):
    __tablename__ = "patients"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    program: str
    status: PatientStatus = Field(default=PatientStatus.active)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    assignments: List["CareAssignment"] = Relationship(back_populates="patient")
    screenings: List["HealthScreening"] = Relationship(back_populates="patient")


class CareTeamMember(SQLModel, table=True):
    __tablename__ = "care_team_members"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    role: CareTeamRole
    email: Optional[str] = None
    phone: Optional[str] = None

    assignments: List["CareAssignment"] = Relationship(back_populates="member")


class CareAssignment(SQLModel, table=True):
    __tablename__ = "care_assignments"

    patient_id: UUID = Field(foreign_key="patients.id", primary_key=True)
    member_id: UUID = Field(foreign_key="care_team_members.id", primary_key=True)
    start_date: date = Field(default_factory=date.today)
    end_date: Optional[date] = None

    patient: Optional[Patient] = Relationship(back_populates="assignments")
    member: Optional[CareTeamMember] = Relationship(back_populates="assignments")


class HealthScreening(SQLModel, table=True):
    __tablename__ = "health_screenings"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    patient_id: UUID = Field(foreign_key="patients.id")
    score: int = Field(ge=0, le=10)
    collected_on: date
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    patient: Optional[Patient] = Relationship(back_populates="screenings")
