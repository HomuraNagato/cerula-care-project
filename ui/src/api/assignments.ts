import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

const fetchCareTeamMembers = async () => {
  const response = await apiClient.get('/care-team');
  return response.data;
};

const assignMember = async ({ patientId, memberId }: { patientId: string; memberId: string }) => {
  const response = await apiClient.post(`/patients/${patientId}/assignments`, {
    member_id: memberId,
  });
  return response.data;
};

const unassignMember = async ({ patientId, memberId }: { patientId: string; memberId: string }) => {
  const response = await apiClient.delete(`/patients/${patientId}/assignments/${memberId}`);
  return response.data;
};

export const useCareTeamMembers = () =>
  useQuery({
    queryKey: ['care-team'],
    queryFn: fetchCareTeamMembers,
  });

export const useAssignTeamMember = (patientId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignMember,
    onSuccess: () => {
      if (patientId) {
        queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
        queryClient.invalidateQueries({ queryKey: ['assignments', patientId] });
      }
    },
  });
};

export const useUnassignTeamMember = (patientId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unassignMember,
    onSuccess: () => {
      if (patientId) {
        queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
        queryClient.invalidateQueries({ queryKey: ['assignments', patientId] });
      }
    },
  });
};
