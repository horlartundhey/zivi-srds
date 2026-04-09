import { useEffect, useState } from 'react';
import { getClasses, getDailyLog } from '../services/api';
import { BarChart3, Users, Mail, BookOpen } from 'lucide-react';

export default function Dashboard() {
  const [classes, setClasses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [classRes, logRes] = await Promise.all([getClasses(), getDailyLog()]);
        setClasses(classRes.data.data);
        setLogs(logRes.data.data);
      } catch {
        // silently fail on dashboard
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayLog = logs.find((l) => l.date === today);
  const sentToday = todayLog?.count || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your School Result Distribution System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<BookOpen size={22} className="text-blue-600" />}
          label="Total Classes"
          value={classes.length}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<Mail size={22} className="text-green-600" />}
          label="Emails Sent Today"
          value={`${sentToday} / 300`}
          bg="bg-green-50"
        />
        <StatCard
          icon={<BarChart3 size={22} className="text-purple-600" />}
          label="Remaining Today"
          value={300 - sentToday}
          bg="bg-purple-50"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Recent Email Log (Last 7 Days)</h2>
        </div>
        {logs.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No emails sent yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Emails Sent</th>
                <th className="px-5 py-3 text-left">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.slice(0, 7).map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-700">{log.date}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{log.count}</td>
                  <td className="px-5 py-3 text-green-600">{Math.max(0, 300 - log.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg }) {
  return (
    <div className={`${bg} rounded-xl p-5 flex items-center gap-4`}>
      <div className="bg-white rounded-lg p-2.5 shadow-sm">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
