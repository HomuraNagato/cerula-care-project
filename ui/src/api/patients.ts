import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { apiClient } from './client';
import type {
  PatientCreate,
  PatientDetail,
  PatientListResponse,
  PatientUpdate,
  HealthScreening,
} from '../types/api';

export type PatientFilters = {
  search?: string;
  status?: string;
  program?: string;
  page?: number;
  limit?: number;
};

const fetchPatients = async (filters: PatientFilters): Promise<PatientListResponse> => {
  const response = await apiClient.get<PatientListResponse>('/patients', {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
      search: filters.search,
      status: filters.status,
      program: filters.program,
    },
  });
  return response.data;
};

const fetchPatientDetail = async (patientId: string): Promise<PatientDetail> => {
  const response = await apiClient.get<PatientDetail>(`/patients/${patientId}`);
  return response.data;
};

const fetchScreenings = async (patientId: string): Promise<HealthScreening[]> => {
  const response = await apiClient.get<{ items: HealthScreening[] }>(`/patients/${patientId}/screenings`, {
    params: { months: 6, limit: 12 },
  });
  return response.data.items;
};

const createPatient = async (payload: PatientCreate) => {
  const response = await apiClient.post('/patients', payload);
  return response.data;
};

const updatePatient = async ({ patientId, payload }: { patientId: string; payload: PatientUpdate }) => {
  const response = await apiClient.put(`/patients/${patientId}`, payload);
  return response.data;
};

export const usePatients = (filters: PatientFilters) =>
  useQuery<PatientListResponse, AxiosError>({
    queryKey: ['patients', filters],
    queryFn: () => fetchPatients(filters),
    keepPreviousData: true,
  });

export const usePatientDetail = (patientId?: string) =>
  useQuery<PatientDetail, AxiosError>({
    queryKey: ['patient', patientId],
    queryFn: () => fetchPatientDetail(patientId as string),
    enabled: Boolean(patientId),
  });

export const usePatientScreenings = (patientId?: string) =>
  useQuery<HealthScreening[], AxiosError>({
    queryKey: ['screenings', patientId],
    queryFn: () => fetchScreenings(patientId as string),
    enabled: Boolean(patientId),
  });

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};

export const useUpdatePatient = (patientId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePatient,
    onSuccess: () => {
      if (patientId) {
        queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
        queryClient.invalidateQueries({ queryKey: ['patients'] });
      }
    },
  });
};
