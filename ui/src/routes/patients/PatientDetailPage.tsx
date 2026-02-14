import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useCareTeamMembers, useAssignTeamMember, useUnassignTeamMember } from '../../api/assignments';
import { usePatientDetail, usePatientScreenings, useUpdatePatient } from '../../api/patients';
import { useToast } from '../../components/ToastProvider';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const PatientDetailPage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [selectedMember, setSelectedMember] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { pushToast } = useToast();
  const [editValues, setEditValues] = useState({
    first_name: '',
    last_name: '',
    program: '',
    status: 'Active',
    email: '',
    phone: '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const detailQuery = usePatientDetail(patientId);
  const screeningsQuery = usePatientScreenings(patientId);
  const careTeamQuery = useCareTeamMembers();
  const assignMutation = useAssignTeamMember(patientId);
  const unassignMutation = useUnassignTeamMember(patientId);
  const updateMutation = useUpdatePatient(patientId);

  const detail = detailQuery.data;
  const screenings = screeningsQuery.data ?? [];

  const chartData = useMemo(
    () =>
      [...screenings]
        .sort((a, b) => a.collected_on.localeCompare(b.collected_on))
        .map((screening) => ({
          label: formatDate(screening.collected_on),
          score: screening.score,
        })),
    [screenings],
  );

  const sortedScreenings = useMemo(
    () =>
      [...screenings].sort((a, b) => b.collected_on.localeCompare(a.collected_on)),
    [screenings],
  );

  const assignments = detail?.assignments ?? [];
  const members = careTeamQuery.data ?? [];
  const assignedIds = useMemo(() => new Set(assignments.map((assignment) => assignment.member_id)), [assignments]);

  const handleAssign = () => {
    if (!patientId || !selectedMember) return;
    assignMutation.mutate(
      { patientId, memberId: selectedMember },
      {
        onSuccess: () => pushToast('Team member assigned.', 'success'),
        onError: () => pushToast('Unable to assign member.', 'error'),
      },
    );
    setSelectedMember('');
  };

  const handleUnassign = (memberId: string) => {
    if (!patientId) return;
    unassignMutation.mutate(
      { patientId, memberId },
      {
        onSuccess: () => pushToast('Team member unassigned.', 'success'),
        onError: () => pushToast('Unable to unassign member.', 'error'),
      },
    );
  };

  const startEdit = () => {
    if (!detail) return;
    setEditValues({
      first_name: detail.first_name,
      last_name: detail.last_name,
      program: detail.program,
      status: detail.status,
      email: detail.email ?? '',
      phone: detail.phone ?? '',
    });
    setEditErrors({});
    setIsEditing(true);
  };

  const validateEdit = () => {
    const errors: Record<string, string> = {};
    if (!editValues.first_name.trim()) errors.first_name = 'First name is required.';
    if (!editValues.last_name.trim()) errors.last_name = 'Last name is required.';
    if (!editValues.program.trim()) errors.program = 'Program is required.';
    if (!editValues.status) errors.status = 'Status is required.';
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveEdit = () => {
    if (!patientId) return;
    if (!validateEdit()) return;
    updateMutation.mutate(
      {
        patientId,
        payload: {
          first_name: editValues.first_name.trim(),
          last_name: editValues.last_name.trim(),
          program: editValues.program.trim(),
          status: editValues.status as 'Active' | 'Inactive' | 'Discharged',
          email: editValues.email.trim() || null,
          phone: editValues.phone.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          pushToast('Patient updated successfully.', 'success');
        },
        onError: () => pushToast('Unable to update patient.', 'error'),
      },
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Patient Details</h1>
          <p className="text-sm text-slate-400">ID: {patientId}</p>
        </div>
        <Link to="/patients" className="rounded-md border border-slate-800 px-4 py-2 text-sm hover:border-emerald-400">
          Back to list
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Patient overview</h2>
            {!isEditing && (
              <button
                className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-emerald-400"
                onClick={startEdit}
              >
                Edit
              </button>
            )}
          </div>
          {detailQuery.isLoading && <p className="text-sm text-slate-400">Loading patient…</p>}
          {detail && !isEditing && (
            <dl className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd>
                  {detail.first_name} {detail.last_name}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Program</dt>
                <dd>{detail.program}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd>{detail.status}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Contact</dt>
                <dd>{detail.email ?? detail.phone ?? 'n/a'}</dd>
              </div>
            </dl>
          )}
          {detail && isEditing && (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">First name</label>
                  <input
                    value={editValues.first_name}
                    onChange={(event) =>
                      setEditValues((prev) => ({ ...prev, first_name: event.target.value }))
                    }
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  />
                  {editErrors.first_name && <p className="text-xs text-rose-400">{editErrors.first_name}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Last name</label>
                  <input
                    value={editValues.last_name}
                    onChange={(event) =>
                      setEditValues((prev) => ({ ...prev, last_name: event.target.value }))
                    }
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  />
                  {editErrors.last_name && <p className="text-xs text-rose-400">{editErrors.last_name}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Program</label>
                  <input
                    value={editValues.program}
                    onChange={(event) =>
                      setEditValues((prev) => ({ ...prev, program: event.target.value }))
                    }
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  />
                  {editErrors.program && <p className="text-xs text-rose-400">{editErrors.program}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Status</label>
                  <select
                    value={editValues.status}
                    onChange={(event) =>
                      setEditValues((prev) => ({ ...prev, status: event.target.value }))
                    }
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Discharged">Discharged</option>
                  </select>
                  {editErrors.status && <p className="text-xs text-rose-400">{editErrors.status}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Email</label>
                  <input
                    value={editValues.email}
                    onChange={(event) =>
                      setEditValues((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Phone</label>
                  <input
                    value={editValues.phone}
                    onChange={(event) =>
                      setEditValues((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  {updateMutation.isError ? 'Unable to save changes.' : ' '}
                </p>
                <div className="flex gap-2">
                  <button
                    className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-md border border-emerald-500 px-3 py-2 text-xs text-emerald-300 disabled:opacity-50"
                    onClick={saveEdit}
                    disabled={updateMutation.isLoading}
                  >
                    {updateMutation.isLoading ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Care team assignments</h2>
          <div className="mt-4 space-y-3">
            {assignments.length === 0 && <p className="text-sm text-slate-400">No assignments yet.</p>}
            {assignments.map((assignment) => (
              <div
                key={`${assignment.patient_id}-${assignment.member_id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold">{assignment.member?.name ?? 'Unknown member'}</p>
                  <p className="text-xs text-slate-400">Assigned {formatDate(assignment.start_date)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnassign(assignment.member_id)}
                  disabled={unassignMutation.isLoading}
                  className="rounded-md border border-rose-500 px-3 py-1 text-xs text-rose-300 disabled:opacity-40"
                >
                  Unassign
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <label className="text-xs uppercase tracking-wide text-slate-400">Assign new member</label>
            <div className="flex gap-2">
              <select
                value={selectedMember}
                onChange={(event) => setSelectedMember(event.target.value)}
                className="flex-1 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
              >
                <option value="">Select care team member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id} disabled={assignedIds.has(member.id)}>
                    {member.name} — {member.role}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAssign}
                disabled={!selectedMember || assignMutation.isLoading}
                className="rounded-md border border-emerald-500 px-4 py-2 text-sm text-emerald-300 disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Health screening trend</h2>
          <span className="text-xs uppercase tracking-wide text-slate-400">Last six months</span>
        </div>
        {screeningsQuery.isLoading && <p className="mt-3 text-sm text-slate-400">Loading screenings…</p>}
        {screenings.length > 0 && (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#94A3B8" />
                <YAxis domain={[0, 10]} stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none' }} />
                <Line type="monotone" dataKey="score" stroke="#14B8A6" strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {screenings.length === 0 && !screeningsQuery.isLoading && (
          <p className="mt-3 text-sm text-slate-400">No screenings recorded yet.</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Screening history</h2>
          <span className="text-xs uppercase tracking-wide text-slate-400">
            {sortedScreenings.length} entries
          </span>
        </div>
        {screeningsQuery.isLoading && <p className="mt-3 text-sm text-slate-400">Loading history…</p>}
        {!screeningsQuery.isLoading && sortedScreenings.length === 0 && (
          <p className="mt-3 text-sm text-slate-400">No screenings available.</p>
        )}
        {sortedScreenings.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {sortedScreenings.map((screening) => (
                  <tr key={screening.id} className="border-t border-slate-800">
                    <td className="px-4 py-3 text-slate-200">
                      {new Date(screening.collected_on).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-200">{screening.score}</td>
                    <td className="px-4 py-3 text-slate-400">{screening.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </section>
  );
};

export default PatientDetailPage;
