import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import useAuth from '@/hooks/useAuth';
import { fetchFreelancers, fetchWorklogs } from '@/mock/mockApi';

export const Route = createFileRoute('/_layout/')({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: 'WorkLog Payment Dashboard',
      },
    ],
  }),
});

function Dashboard() {
  const { user: currentUser } = useAuth();

  const [worklogs, setWorklogs] = useState<any[]>([]);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [selectedFreelancer, setSelectedFreelancer] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<'date' | 'freelancer' | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [w, f] = await Promise.all([fetchWorklogs(), fetchFreelancers()]);
        setWorklogs(w as any[]);
        setFreelancers(f as any[]);
      } catch (e) {
        console.error(e);
        setError('Failed to load worklogs. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = worklogs;

    if (fromDate || toDate) {
      try {
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        result = result.filter((w: any) => {
          const created = new Date(w.created_at);
          if (from && created < from) return false;
          if (to && created > to) return false;
          return true;
        });
      } catch (e) {
        console.error('Filter error', e);
      }
    }

    if (selectedFreelancer) {
      result = result.filter((w: any) => w.freelancer_id === selectedFreelancer);
    }

    return result;
  }, [worklogs, fromDate, toDate, selectedFreelancer]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedForReview = Object.keys(selectedIds).filter((id) => selectedIds[id]);

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

  const getFreelancerName = (freelancerId: string) => {
    const f = freelancers.find((x: any) => x.id === freelancerId);
    if (!f) return freelancerId;
    return f.name;
  };

  const handleReview = () => {
    if (selectedForReview.length === 0) return;
    navigate({
      to: '/payment/review',
      search: {
        worklogIds: selectedForReview,
      },
    });
  };

  if (isLoading) {
    return <div className="p-6">Loading worklogs...</div>;
  }

  if (error) {
    return (
      <div className="p-6" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">WorkLog Payment Dashboard</h1>
        <p className="text-muted-foreground">Hi, {currentUser?.full_name || currentUser?.email}. Review freelancer worklogs and process payments.</p>
      </header>

      <section className="space-y-3">
        <div className="flex gap-2">
          <button aria-pressed={activeFilter === 'date'} onClick={() => setActiveFilter(activeFilter === 'date' ? null : 'date')} className="border px-3 py-1 rounded">
            Date Range
          </button>
          <button aria-pressed={activeFilter === 'freelancer'} onClick={() => setActiveFilter(activeFilter === 'freelancer' ? null : 'freelancer')} className="border px-3 py-1 rounded">
            Freelancer
          </button>
        </div>

        {activeFilter === 'date' && (
          <div className="flex flex-wrap gap-3">
            <style>{`
              input[type='date']::-webkit-calendar-picker-indicator {
                filter: invert(1) brightness(1.2);
                cursor: pointer;
              }
              input[type='date'] {
                color-scheme: light dark;
              }
            `}</style>
            <label>
              From (UTC):{' '}
              <input aria-label="From date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border px-2 py-1 rounded bg-white dark:bg-zinc-800 text-black dark:text-white dark:accent-white" />
            </label>
            <label>
              To (UTC): <input aria-label="To date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border px-2 py-1 rounded bg-white dark:bg-zinc-800 text-black dark:text-white dark:accent-white" />
            </label>
          </div>
        )}

        {activeFilter === 'freelancer' && (
          <div className="flex gap-3">
            <select
              aria-label="Filter by freelancer"
              value={selectedFreelancer || ''}
              onChange={(e) => setSelectedFreelancer(e.target.value || null)}
              className="border px-3 py-1 rounded bg-white dark:bg-zinc-800 text-black dark:text-white"
            >
              <option value="" className="bg-white dark:bg-zinc-800 text-black dark:text-white">
                All Freelancers
              </option>
              {freelancers.map((f: any) => (
                <option key={f.id} value={f.id} className="bg-white dark:bg-zinc-800 text-black dark:text-white">
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Worklogs</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th />
              <th className="text-left py-2">Task</th>
              <th className="text-left py-2">Freelancer</th>
              <th className="text-left py-2">Created (UTC)</th>
              <th className="text-left py-2">Total</th>
              <th className="text-left py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((w: any) => (
              <tr key={w.id} className="border-b">
                <td className="py-2">
                  <input aria-label={`Select worklog ${w.id}`} type="checkbox" checked={!!selectedIds[w.id]} onChange={() => toggleSelect(w.id)} />
                </td>
                <td className="py-2">{w.task}</td>
                <td className="py-2">{getFreelancerName(w.freelancer_id)}</td>
                <td className="py-2">{formatUTC(w.created_at)}</td>
                <td className="py-2">${w.total_amount}</td>
                <td className="py-2">
                  <button
                    className="underline text-blue-600"
                    onClick={() =>
                      navigate({
                        to: '/payment/review',
                        search: { worklogIds: [String(w.id)] },
                      })
                    }
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center gap-3 mt-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page" className="border px-2 py-1 rounded">
            Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Next page" className="border px-2 py-1 rounded">
            Next
          </button>
        </div>
      </section>

      <section>
        <button aria-label="Review selected worklogs" disabled={selectedForReview.length === 0} className="border px-4 py-2 rounded disabled:opacity-50" onClick={handleReview}>
          Review Payment ({selectedForReview.length})
        </button>
      </section>
    </main>
  );
}
