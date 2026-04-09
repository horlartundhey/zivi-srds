import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-6 space-y-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              danger ? 'bg-red-100' : 'bg-blue-100'
            }`}
          >
            <AlertTriangle
              size={22}
              className={danger ? 'text-red-600' : 'text-blue-600'}
            />
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
            <p className="text-sm text-gray-500">{message}</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition-colors ${
                danger
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Please wait…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
