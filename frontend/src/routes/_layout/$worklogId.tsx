import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { fetchFreelancers, fetchTimeEntries, fetchWorklogs } from '@/mock/mockApi';

export const Route = createFileRoute('/_layout/$worklogId' as any)({
  component: WorklogDetailPage,
});

function WorklogDetailPage() {
  const { worklogId } = Route.useParams();
  const [worklog, setWorklog] = useState<any | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [freelancer, setFreelancer] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [worklogsData, entriesData, freelancersData] = await Promise.all([fetchWorklogs(), fetchTimeEntries(), fetchFreelancers()]);
        const w = (worklogsData as any[]).find((x) => x.id === worklogId) || null;
        const e = (entriesData as any[]).filter((x) => x.worklog_id === worklogId);
        const f = (freelancersData as any[]).find((x) => w && x.id === w.freelancer_id);

        setWorklog(w);
        setEntries(e);
        setFreelancer(f || null);
      } catch (err) {
        console.error(err);
        setError('Failed to load worklog details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [worklogId]);

  if (isLoading) {
    return <div className="p-6">Loading worklog...</div>;
  }

  if (error) {
    return (
      <div className="p-6" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  if (!worklog) {
    return (
      <main className="p-6">
        <p>Worklog not found.</p>
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
      <h1 className="text-2xl font-bold">Worklog Details</h1>
      <div className="space-y-1">
        <p>
          <strong>Task:</strong> {worklog.task}
        </p>
        <p>
          <strong>Freelancer:</strong> {freelancer ? freelancer.name : worklog.freelancer_id}
        </p>
        <p>
          <strong>Created (UTC):</strong> {worklog.created_at}
        </p>
        <p>
          <strong>Total:</strong> ${worklog.total_amount}
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-4">Time Entries</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">ID</th>
            <th className="text-left py-2">Hours</th>
            <th className="text-left py-2">Rate</th>
            <th className="text-left py-2">Amount</th>
            <th className="text-left py-2">Created (UTC)</th>
            <th className="text-left py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e: any) => (
            <tr key={e.id} className="border-b">
              <td className="py-2">{e.id}</td>
              <td className="py-2">{e.hours}</td>
              <td className="py-2">${e.rate}</td>
              <td className="py-2">${e.amount}</td>
              <td className="py-2">{formatUTC(e.created_at)}</td>
              <td className="py-2">{e.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Link to="/" className="underline text-blue-500">
        Back to worklogs
      </Link>
    </main>
  );
}
