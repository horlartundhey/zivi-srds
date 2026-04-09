import { useState, useRef, useCallback } from 'react';
import { X, Upload, Trash2, FileText, CheckCircle2, CloudUpload } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadResult, deleteResult } from '../services/api';

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function UploadModal({ student, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef();

  const validateAndSet = (f) => {
    if (f.type !== 'application/pdf') return toast.error('Only PDF files are allowed');
    if (f.size > 10 * 1024 * 1024) return toast.error('File too large (max 10 MB)');
    setFile(f);
    setProgress(0);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSet(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const { data } = await uploadResult(student._id, file, (pct) => setProgress(pct));
      toast.success('Result uploaded');
      onUploadSuccess(data.data.student);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await deleteResult(student._id);
      toast.success('File removed');
      onUploadSuccess({ ...student, resultFileUrl: null, resultPublicId: null });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Remove failed');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Upload Result</h2>
            <p className="text-xs text-gray-400 mt-0.5">{student.name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Existing file banner */}
          {student.resultFileUrl && (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span className="text-sm text-emerald-800 font-medium">Result already uploaded</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <a
                  href={student.resultFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  View PDF
                </a>
                <button
                  onClick={handleRemove}
                  disabled={removing || uploading}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 disabled:opacity-40"
                >
                  <Trash2 size={12} />
                  {removing ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !file && !uploading && inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
            } ${!file && !uploading ? 'cursor-pointer' : ''}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files[0] && validateAndSet(e.target.files[0])}
            />

            {file ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setProgress(0); }}
                  disabled={uploading}
                  className="text-gray-400 hover:text-red-500 flex-shrink-0 disabled:opacity-40"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-2 pointer-events-none">
                <CloudUpload size={32} className="mx-auto text-gray-300" />
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Drop PDF here or <span className="text-blue-600">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">PDF only · max 10 MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            <Upload size={16} />
            {uploading
              ? `Uploading ${progress}%…`
              : student.resultFileUrl
              ? 'Replace File'
              : 'Upload Result'}
          </button>
        </div>
      </div>
    </div>
  );
}
