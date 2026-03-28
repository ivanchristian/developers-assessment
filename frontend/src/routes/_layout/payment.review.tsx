import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { fetchFreelancers, fetchTimeEntries, fetchWorklogs } from '@/mock/mockApi';

export const Route = createFileRoute('/_layout/payment/review' as any)({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      worklogIds: (search.worklogIds as string[]) ?? [],
    };
  },
  component: PaymentReviewPage,
});

function PaymentReviewPage() {
  const { worklogIds } = Route.useSearch();
  const [worklogs, setWorklogs] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [excludedWorklogs, setExcludedWorklogs] = useState<Record<string, boolean>>({});
  const [excludedFreelancers, setExcludedFreelancers] = useState<Record<string, boolean>>({});
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [w, e, f] = await Promise.all([fetchWorklogs(), fetchTimeEntries(), fetchFreelancers()]);
        const selectedWorklogs = (w as any[]).filter((x) => worklogIds.includes(x.id));
        setWorklogs(selectedWorklogs);
        setEntries(e as any[]);
        setFreelancers(f as any[]);
      } catch (err) {
        console.error(err);
        setError('Failed to load review data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [worklogIds]);

  const getFreelancerName = (id: string) => {
    const f = freelancers.find((x: any) => x.id === id);
    return f ? f.name : id;
  };

  const worklogsWithEntries = useMemo(() => {
    return worklogs.map((w) => ({
      ...w,
      entries: entries.filter((e: any) => e.worklog_id === w.id),
    }));
  }, [worklogs, entries]);

  const computeTotal = () => {
    let total = 0;
    for (const w of worklogsWithEntries) {
      if (excludedWorklogs[w.id]) continue;
      if (excludedFreelancers[w.freelancer_id]) continue;
      const sum = w.entries.reduce((acc: number, e: any) => acc + (e.amount || 0), 0);
      total += sum;
    }
    return total;
  };

  const toggleWorklog = (id: string) => {
    setExcludedWorklogs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFreelancer = (id: string) => {
    setExcludedFreelancers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirm = async () => {
    try {
      const API_URL = import.meta.env.VITE_MOCK_PAYMENT_URL ?? 'https://mock.worklog-dashboard.local';

      const axiosLocal = require('axios').default as typeof axios;
      axiosLocal.defaults.baseURL = API_URL;

      const payload: any = {
        paid_at: new Date().toISOString(),
        total_paid: computeTotal(),
        excluded_worklogs: Object.keys(excludedWorklogs).filter((k) => excludedWorklogs[k]),
        excluded_freelancers: Object.keys(excludedFreelancers).filter((k) => excludedFreelancers[k]),
        worklog_ids: worklogIds,
      };

      await axiosLocal.post(`${API_URL}/payments`, payload);
      setIsPaid(true);
    } catch (err) {
      console.error(err);
      alert('Failed to process payment. This feature is not implemented yet.');
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading payment review...</div>;
  }

  if (error) {
    return (
      <div className="p-6" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  if (!worklogsWithEntries.length) {
    return (
      <main className="p-6">
        <p>No worklogs selected for review.</p>
        <Link to="/" className="underline text-blue-500">
          Back to worklogs
        </Link>
      </main>
    );
  }

  if (isPaid) {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-2xl font-bold">Payment Processed (Mock)</h1>
        <p>Total paid: ${computeTotal()}</p>
        <Link to="/" className="underline text-blue-500">
          Back to worklogs
        </Link>
      </main>
    );
  }

  const formatUTC = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Payment Review</h1>
      <p>Review selected worklogs and time entries. Exclude specific worklogs or freelancers from this batch before confirming payment.</p>

      {worklogsWithEntries.map((w: any) => (
        <section key={w.id} className="border rounded p-3 space-y-2 mb-3 bg-white dark:bg-zinc-900 text-black dark:text-white">
          <div className="flex justify-between items-center gap-2">
            <div>
              <div className="font-semibold">{w.task}</div>
              <div>
                Freelancer: {getFreelancerName(w.freelancer_id)} ({w.freelancer_id})
              </div>
              <div>Created (UTC): {formatUTC(w.created_at)}</div>
            </div>
            <div className="space-x-3">
              <label>
                <input aria-label={`Exclude worklog ${w.id}`} type="checkbox" checked={!!excludedWorklogs[w.id]} onChange={() => toggleWorklog(w.id)} /> Exclude worklog
              </label>
              <label>
                <input aria-label={`Exclude freelancer ${w.freelancer_id}`} type="checkbox" checked={!!excludedFreelancers[w.freelancer_id]} onChange={() => toggleFreelancer(w.freelancer_id)} /> Exclude freelancer
              </label>
            </div>
          </div>

          <h3 className="font-semibold mt-2">Time entries</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-300 dark:border-gray-600">
                <th className="text-left py-1">ID</th>
                <th className="text-left py-1">Hours</th>
                <th className="text-left py-1">Rate</th>
                <th className="text-left py-1">Amount</th>
                <th className="text-left py-1">Created (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {w.entries.map((e: any) => (
                <tr key={e.id} className="border-b border-gray-300 dark:border-gray-600">
                  <td className="py-1">{e.id}</td>
                  <td className="py-1">{e.hours}</td>
                  <td className="py-1">${e.rate}</td>
                  <td className="py-1">${e.amount}</td>
                  <td className="py-1">{formatUTC(w.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <div className="mt-3">
        <strong>Batch total (after exclusions): </strong>${computeTotal()}
      </div>

      <div className="mt-4 space-x-3">
        <button aria-label="Confirm payment for selected worklogs" onClick={handleConfirm} className="border px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          Confirm Payment
        </button>
        <Link to="/" className="underline text-blue-500">
          Cancel
        </Link>
      </div>
    </main>
  );
}
