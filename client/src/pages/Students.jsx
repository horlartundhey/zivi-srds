import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getStudentsByClass,
  deleteStudent,
  getEmailStatus,
  retryFailed,
  resetClassEmails,
  getApiUrl,
} from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Upload, Eye, ArrowLeft, RefreshCw, FileText } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import UploadModal from '../components/UploadModal';
import StudentModal from '../components/StudentModal';
import SendControls from '../components/SendControls';
import EmailPreviewModal from '../components/EmailPreviewModal';
import ConfirmDialog from '../components/ConfirmDialog';


export default function Students() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [className, setClassName] = useState('');
  const [stats, setStats] = useState({ sentToday: 0, remainingToday: 300, pending: 0, queued: 0, sent: 0, failed: 0, sendable: 0, pendingWithResult: 0 });
  const [loading, setLoading] = useState(true);

  const [uploadModal, setUploadModal] = useState(null);
  const [studentModal, setStudentModal] = useState(null);
  const [previewStudent, setPreviewStudent] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleStatusChange = useCallback((nextStats) => {
    setStats(nextStats);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [studRes, statusRes] = await Promise.all([
        getStudentsByClass(classId),
        getEmailStatus(classId),
      ]);
      setStudents(studRes.data.data);
      if (studRes.data.data[0]?.classId?.name) {
        setClassName(studRes.data.data[0].classId.name);
      }
      const { summary, sentToday, remainingToday } = statusRes.data.data;
      setStats({ ...summary, sentToday, remainingToday });
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteStudent(confirmDelete._id);
      toast.success('Student deleted');
      setConfirmDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleRetry = async () => {
    try {
      const { data } = await retryFailed(classId);
      toast.success(data.message);
      fetchData();
    } catch {
      toast.error('Retry failed');
    }
  };

  const handleReset = async () => {
    try {
      const { data } = await resetClassEmails(classId);
      toast.success(data.message + ' — you can now re-send');
      fetchData();
    } catch {
      toast.error('Reset failed');
    }
  };

  const handleStudentSave = (saved) => {
    setStudents((prev) => {
      const idx = prev.findIndex((s) => s._id === saved._id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/classes')} className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {(className || 'Class') + ' \u2014 Students'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{students.length} student(s)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap text-xs text-gray-500">
              <span>Total: <strong className="text-gray-800">{stats.total}</strong></span>
              <span>· Pending: <strong className="text-yellow-700">{stats.pending}</strong></span>
              <span>· Queued: <strong className="text-blue-700">{stats.queued}</strong></span>
              <span>· Sent: <strong className="text-green-700">{stats.sent}</strong></span>
              <span>· Failed: <strong className="text-red-700">{stats.failed}</strong></span>
            </div>
            <div className="flex gap-2">
              {stats.failed > 0 && (
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 border border-orange-200 px-2.5 py-1.5 rounded-lg"
                >
                  <RefreshCw size={12} /> Retry Failed
                </button>
              )}
              {stats.sent > 0 && (
                <button
                  onClick={handleReset}
                  title="Reset sent students back to pending so you can re-send"
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 border border-purple-200 px-2.5 py-1.5 rounded-lg"
                >
                  <RefreshCw size={12} /> Reset &amp; Resend
                </button>
              )}
              <button
                onClick={() => setStudentModal('add')}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg"
              >
                <Plus size={12} /> Add Student
              </button>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
              <p>No students yet.</p>
              <button
                onClick={() => setStudentModal('add')}
                className="mt-3 text-blue-600 text-sm hover:underline"
              >
                Add first student
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Parent Email</th>
                    <th className="px-4 py-3 text-left">Result</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50 group">
                      <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate" title={student.parentEmail}>{student.parentEmail}</td>
                      <td className="px-4 py-3">
                        {student.resultFileUrl ? (
                          <div className="flex items-center gap-1.5">
                            <FileText size={13} className="text-emerald-500 flex-shrink-0" />
                            <a
                              href={getApiUrl(`/students/${student._id}/download`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 text-xs hover:underline"
                            >
                              View PDF
                            </a>
                          </div>
                        ) : (
                          <button
                            onClick={() => setUploadModal(student)}
                            className="text-xs text-gray-400 hover:text-blue-600 hover:underline flex items-center gap-1 transition-colors"
                            title="Click to upload result"
                          >
                            <Upload size={11} /> Upload
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={student.emailStatus} />
                        {student.retryCount > 0 && (
                          <span className="ml-1 text-xs text-gray-400">
                            ({student.retryCount}/3)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setUploadModal(student)}
                            title={student.resultFileUrl ? 'Replace result' : 'Upload result'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              student.resultFileUrl
                                ? 'text-emerald-500 hover:bg-emerald-50'
                                : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                          >
                            <Upload size={14} />
                          </button>
                          <button
                            onClick={() => setPreviewStudent(student)}
                            title="Preview email"
                            disabled={!student.resultFileUrl}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => setStudentModal(student)}
                            title="Edit student"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(student)}
                            title="Delete student"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <SendControls
            classId={classId}
            className={className}
            stats={stats}
            onSent={fetchData}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>

      {uploadModal && (
        <UploadModal
          student={uploadModal}
          onClose={() => setUploadModal(null)}
          onUploadSuccess={handleStudentSave}
        />
      )}

      {studentModal && (
        <StudentModal
          classId={classId}
          student={studentModal === 'add' ? null : studentModal}
          onClose={() => setStudentModal(null)}
          onSave={handleStudentSave}
        />
      )}

      {previewStudent && (
        <EmailPreviewModal
          student={previewStudent}
          onClose={() => setPreviewStudent(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Student"
          message={`Remove "${confirmDelete.name}" and their result file? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
