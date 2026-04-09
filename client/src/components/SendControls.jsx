import { useEffect, useRef, useState } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmailStatus, queueAll, queuePartial } from '../services/api';

export default function SendControls({ classId, className, stats, onSent, onStatusChange }) {
  const [mode, setMode] = useState('all');
  const [partialCount, setPartialCount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState(null);
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const syncStatus = async ({ target, baseline }) => {
    const { data } = await getEmailStatus(classId);
    const nextStats = {
      ...data.data.summary,
      sentToday: data.data.sentToday,
      remainingToday: data.data.remainingToday,
    };

    onStatusChange?.(nextStats);

    const sentDelta = Math.max(0, nextStats.sent - baseline.sent);
    const failedDelta = Math.max(0, nextStats.failed - baseline.failed);
    const processed = Math.min(target, sentDelta + failedDelta);
    const processing = data.data.processing;

    setProgress((current) => ({
      ...(current || {}),
      active: processing,
      target,
      processed,
      sent: sentDelta,
      failed: failedDelta,
      queued: nextStats.queued,
      remainingToday: nextStats.remainingToday,
    }));

    if (!processing) {
      stopPolling();
      setLoading(false);
      onSent?.();

      if (processed < target && nextStats.queued > 0) {
        toast('Batch stopped at today\'s limit. Remaining emails stay queued.', { icon: '⏳' });
      } else {
        toast.success(`${sentDelta} email(s) sent. ${failedDelta} failed.`);
      }
    }
  };

  const beginPolling = (payload) => {
    stopPolling();
    syncStatus(payload).catch((err) => {
      stopPolling();
      setLoading(false);
      toast.error(err.response?.data?.message || 'Failed to track email progress');
    });

    pollRef.current = setInterval(() => {
      syncStatus(payload).catch((err) => {
        stopPolling();
        setLoading(false);
        toast.error(err.response?.data?.message || 'Failed to track email progress');
      });
    }, 1000);
  };

  const eligibleCount = stats.sendable || 0;
  const eligiblePendingCount = stats.pendingWithResult || 0;
  const queuedCount = stats.queued || 0;

  const handleSendClick = () => {
    if (stats.remainingToday === 0) {
      return toast.error('Daily email limit (300) reached. Queue will resume tomorrow.');
    }
    if (eligibleCount === 0) {
      return toast.error('No students with uploaded results are ready to send.');
    }
    setConfirming(true);
  };

  const handleConfirm = async () => {
    setConfirming(false);
    setLoading(true);
    const baseline = { sent: stats.sent, failed: stats.failed };

    try {
      let res;
      if (mode === 'all') {
        res = await queueAll(classId);
      } else {
        res = await queuePartial(classId, partialCount);
      }

      const newlyQueued = res.data?.data?.queued || 0;
      const target = Math.min(queuedCount + newlyQueued, eligibleCount, stats.remainingToday + queuedCount);

      setProgress({
        active: true,
        target,
        processed: 0,
        sent: 0,
        failed: 0,
        queued: queuedCount + newlyQueued,
        remainingToday: stats.remainingToday,
      });

      toast('Sending started. Progress will update below.', { icon: '📨' });
      beginPolling({ target, baseline });
    } catch (err) {
      stopPolling();
      setProgress(null);
      toast.error(err.response?.data?.message || 'Failed to send emails');
      setLoading(false);
    }
  };

  const confirmMsg =
    mode === 'all'
      ? `Send to ${eligibleCount} eligible student(s) in ${className}?`
      : `Send to first ${Math.min(partialCount, eligiblePendingCount)} eligible student(s) in ${className}?`;

  const progressPercent = progress?.target
    ? Math.min(100, Math.round((progress.processed / progress.target) * 100))
    : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
        <Send size={16} /> Send Emails
      </h3>
      <div className="flex gap-3">
        <button
          onClick={() => setMode('all')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
            mode === 'all'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          }`}
        >
          Mode A: Send All
        </button>
        <button
          onClick={() => setMode('partial')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
            mode === 'partial'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          }`}
        >
          Mode B: Send Partial
        </button>
      </div>

      {mode === 'partial' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of eligible students to send
          </label>
          <input
            type="number"
            min={1}
            max={Math.max(1, eligiblePendingCount)}
            value={partialCount}
            onChange={(e) => setPartialCount(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 space-y-1">
        <p>📊 Today's quota: <span className="font-semibold text-gray-900">{stats.sentToday} / 300</span> sent <span className="text-xs text-gray-400">(Brevo free limit)</span></p>
        <p>📬 Available slots: <span className="font-semibold text-blue-600">{stats.remainingToday}</span></p>
        <p>✅ Ready to send: <span className="font-semibold text-emerald-600">{eligibleCount}</span></p>
        {stats.queued > 0 && (
          <p className="text-blue-600">🔄 {stats.queued} already queued (will send as quota allows)</p>
        )}
        {stats.pending > eligiblePendingCount && (
          <p className="text-xs text-amber-600">Some pending students are missing result uploads, so they cannot be emailed yet.</p>
        )}
        <p className="text-xs text-amber-600 mt-1">💡 Tip: For large classes, use <strong>Mode B</strong> to send in batches of 50–100 for better deliverability.</p>
      </div>

      {progress && (
        <div className="border border-blue-100 bg-blue-50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <p className="font-medium text-blue-900">
              {progress.active ? 'Sending in progress...' : 'Last batch complete'}
            </p>
            <p className="text-blue-700 font-semibold">{progress.processed} / {progress.target}</p>
          </div>
          <div className="w-full h-2.5 rounded-full bg-blue-100 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md bg-white/80 px-2 py-2 text-gray-600">
              <span className="block text-gray-400">Sent</span>
              <strong className="text-green-600">{progress.sent}</strong>
            </div>
            <div className="rounded-md bg-white/80 px-2 py-2 text-gray-600">
              <span className="block text-gray-400">Failed</span>
              <strong className="text-red-600">{progress.failed}</strong>
            </div>
            <div className="rounded-md bg-white/80 px-2 py-2 text-gray-600">
              <span className="block text-gray-400">Still queued</span>
              <strong className="text-blue-600">{progress.queued}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Inline confirmation panel — replaces window.confirm */}
      {confirming ? (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-3">
          <p className="text-sm text-amber-800 flex items-start gap-2">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-amber-600" />
            {confirmMsg}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
            >
              Yes, Send
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSendClick}
          disabled={loading || progress?.active || eligibleCount === 0}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors"
        >
          <Send size={16} />
          {progress?.active ? 'Sending Emails...' : loading ? 'Preparing...' : 'Send Now'}
        </button>
      )}
    </div>
  );
}

