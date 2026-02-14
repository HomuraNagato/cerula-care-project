from typing import List

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..core.db import get_session
from ..models import CareTeamMember
from ..schemas import CareTeamMemberRead

router = APIRouter()


@router.get("", response_model=List[CareTeamMemberRead])
def list_care_team_members(session: Session = Depends(get_session)) -> List[CareTeamMemberRead]:
    members = session.exec(select(CareTeamMember).order_by(CareTeamMember.name)).all()
    return [CareTeamMemberRead.from_orm(member) for member in members]
