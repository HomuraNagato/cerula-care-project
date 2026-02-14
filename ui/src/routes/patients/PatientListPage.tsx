import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

import { useCreatePatient, usePatients } from '../../api/patients';
import { useToast } from '../../components/ToastProvider';

const statusOptions = ['Active', 'Inactive', 'Discharged'];
const statusColor: Record<string, string> = {
  Active: 'bg-emerald-500/10 text-emerald-300',
  Inactive: 'bg-amber-500/10 text-amber-300',
  Discharged: 'bg-slate-600/10 text-slate-300',
};

const ITEMS_PER_PAGE = 6;

const PatientListPage = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [program, setProgram] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { pushToast } = useToast();
  const [page, setPage] = useState(1);
  const [formValues, setFormValues] = useState({
    first_name: '',
    last_name: '',
    program: '',
    status: 'Active',
    email: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  const { data, isLoading, isError } = usePatients({
    search: debouncedSearch || undefined,
    status: status || undefined,
    program: program || undefined,
    page,
    limit: ITEMS_PER_PAGE,
  });
  const createMutation = useCreatePatient();

  const patients = data?.items ?? [];
  const totalPages = useMemo(() => {
    if (!data) return 0;
    return Math.max(1, Math.ceil(data.total / ITEMS_PER_PAGE));
  }, [data]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleProgramChange = (value: string) => {
    setProgram(value);
    setPage(1);
  };

  const validateCreateForm = () => {
    const errors: Record<string, string> = {};
    if (!formValues.first_name.trim()) errors.first_name = 'First name is required.';
    if (!formValues.last_name.trim()) errors.last_name = 'Last name is required.';
    if (!formValues.program.trim()) errors.program = 'Program is required.';
    if (!formValues.status) errors.status = 'Status is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    if (!validateCreateForm()) return;
    createMutation.mutate(
      {
        first_name: formValues.first_name.trim(),
        last_name: formValues.last_name.trim(),
        program: formValues.program.trim(),
        status: formValues.status as 'Active' | 'Inactive' | 'Discharged',
        email: formValues.email.trim() || null,
        phone: formValues.phone.trim() || null,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setFormValues({
            first_name: '',
            last_name: '',
            program: '',
            status: 'Active',
            email: '',
            phone: '',
          });
          setFormErrors({});
          pushToast('Patient created successfully.', 'success');
        },
        onError: () => {
          pushToast('Unable to create patient.', 'error');
        },
      },
    );
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Patients</h1>
          <p className="text-sm text-slate-400">Assign teams and monitor screenings</p>
        </div>
        <button
          className="rounded-md border border-emerald-500 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20"
          onClick={() => setShowCreate((prev) => !prev)}
        >
          {showCreate ? 'Close' : '+ New Patient'}
        </button>
      </header>

      {showCreate && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">First name</label>
              <input
                value={formValues.first_name}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, first_name: event.target.value }))
                }
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
              />
              {formErrors.first_name && <p className="text-xs text-rose-400">{formErrors.first_name}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Last name</label>
              <input
                value={formValues.last_name}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, last_name: event.target.value }))
                }
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
              />
              {formErrors.last_name && <p className="text-xs text-rose-400">{formErrors.last_name}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Program</label>
              <input
                value={formValues.program}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, program: event.target.value }))
                }
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
              />
              {formErrors.program && <p className="text-xs text-rose-400">{formErrors.program}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Status</label>
              <select
                value={formValues.status}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, status: event.target.value }))
                }
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {formErrors.status && <p className="text-xs text-rose-400">{formErrors.status}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Email (optional)</label>
              <input
                value={formValues.email}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, email: event.target.value }))
                }
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Phone (optional)</label>
              <input
                value={formValues.phone}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, phone: event.target.value }))
                }
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {createMutation.isError ? 'Unable to create patient.' : ' '}
            </p>
            <button
              className="rounded-md border border-emerald-500 px-4 py-2 text-sm text-emerald-300 disabled:opacity-50"
              onClick={handleCreate}
              disabled={createMutation.isLoading}
            >
              {createMutation.isLoading ? 'Saving…' : 'Create Patient'}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Search by name"
          className="flex-1 min-w-[200px] rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
        <select
          value={status}
          onChange={(event) => handleStatusChange(event.target.value)}
          className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          <option value="">All statuses</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          value={program}
          onChange={(event) => handleProgramChange(event.target.value)}
          placeholder="Program filter"
          className="min-w-[180px] rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
      </div>


      <div className="space-y-3">
        {isLoading && (
          <p className="text-sm text-slate-400">Loading patients…</p>
        )}
        {isError && <p className="text-sm text-rose-400">Unable to load patients.</p>}
        {patients.length === 0 && !isLoading && (
          <p className="text-sm text-slate-500">No patients match your search.</p>
        )}
        {patients.map((patient) => (
          <Link
            key={patient.id}
            to={`/patients/${patient.id}`}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm transition hover:border-emerald-400"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 text-lg font-semibold">
              <span>
                {patient.first_name} {patient.last_name}
              </span>
              <span className={clsx('rounded-full px-3 py-1 text-xs font-medium', statusColor[patient.status])}>
                {patient.status}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Program: {patient.program}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Care team: {patient.assigned_team.length ? patient.assigned_team.join(', ') : 'Unassigned'}
            </div>
            <div className="mt-3 text-sm text-slate-300">
              Last screening{' '}
              {patient.last_screening_date
                ? new Date(patient.last_screening_date).toLocaleDateString()
                : 'n/a'}{' '}
              · Score {patient.last_screening_score ?? 'n/a'}
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
          <span>
            Showing {patients.length} of {data?.total ?? 0} patients
          </span>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border border-slate-800 px-3 py-1 text-xs text-slate-300 disabled:opacity-40"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              Prev
            </button>
            <span>
              Page {data?.page ?? page} of {totalPages}
            </span>
            <button
              className="rounded-md border border-slate-800 px-3 py-1 text-xs text-slate-300 disabled:opacity-40"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default PatientListPage;
