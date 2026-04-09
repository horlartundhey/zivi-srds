import { useEffect, useState } from 'react';
import { getDailyLog } from '../services/api';
import { BarChart3 } from 'lucide-react';

export default function EmailLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDailyLog()
      .then(({ data }) => setLogs(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Daily sending history (last 30 days)</p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
          <p>No emails sent yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Emails Sent</th>
                <th className="px-5 py-3 text-left">Remaining</th>
                <th className="px-5 py-3 text-left">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => {
                const pct = Math.min(100, Math.round((log.count / 300) * 100));
                return (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700 font-medium">{log.date}</td>
                    <td className="px-5 py-3 text-gray-900 font-semibold">{log.count}</td>
                    <td className="px-5 py-3 text-green-600">{Math.max(0, 300 - log.count)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                          <div
                            className={`h-2 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-orange-400' : 'bg-blue-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
