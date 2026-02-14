export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  program: string;
  status: "Active" | "Inactive" | "Discharged";
  created_at: string;
}

export interface PatientListItem extends Patient {
  last_screening_score?: number | null;
  last_screening_date?: string | null;
  assigned_team: string[];
}

export interface CareTeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface CareAssignment {
  patient_id: string;
  member_id: string;
  start_date: string;
  end_date?: string;
  member?: CareTeamMember;
}

export interface HealthScreening {
  id: string;
  score: number;
  collected_on: string;
  note?: string;
}

export interface PatientDetail extends Patient {
  assignments: CareAssignment[];
  screenings: HealthScreening[];
}

export interface PatientListResponse {
  items: PatientListItem[];
  total: number;
  page: number;
  limit: number;
}

export type PatientCreate = {
  first_name: string;
  last_name: string;
  program: string;
  status: "Active" | "Inactive" | "Discharged";
  date_of_birth?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type PatientUpdate = Partial<PatientCreate>;
