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
  const [showModal, setShowModal] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);

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
      const total = computeTotal();
      setPaidAmount(total);
      setShowModal(true);
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

  // if (isPaid) {
  //   return (
  //     <main className="p-6 space-y-3">
  //       <h1 className="text-2xl font-bold">Payment Processed (Mock)</h1>
  //       <p>Total paid: ${computeTotal()}</p>
  //       <Link to="/" className="underline text-blue-500">
  //         Back to worklogs
  //       </Link>
  //     </main>
  //   );
  // }

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
    <>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 max-w-md w-full text-black dark:text-white space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 dark:bg-green-900 rounded-full p-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Payment Processed</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Your payment has been successfully processed.</p>
            </div>

            <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">${paidAmount.toFixed(2)}</p>
            </div>

            <button
              aria-label="Close payment success modal and return to dashboard"
              onClick={() => {
                setShowModal(false);
                window.location.href = '/';
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

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
    </>
  );
}
