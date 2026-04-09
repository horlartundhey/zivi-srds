import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClasses, createClass, updateClass, deleteClass } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, ChevronRight, BookOpen, Pencil, Check, X } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // class object to delete
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchClasses = async () => {
    try {
      const { data } = await getClasses();
      setClasses(data.data);
    } catch {
      toast.error('Failed to load classes');
    }
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return toast.error('Class name is required');
    setLoading(true);
    try {
      await createClass(newName.trim());
      toast.success(`Class "${newName}" created`);
      setNewName('');
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (cls) => {
    setEditingId(cls._id);
    setEditName(cls.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleRename = async (cls) => {
    if (!editName.trim() || editName.trim() === cls.name) return cancelEdit();
    setSavingId(cls._id);
    try {
      const { data } = await updateClass(cls._id, editName.trim());
      setClasses((prev) => prev.map((c) => (c._id === cls._id ? { ...c, ...data.data } : c)));
      toast.success('Class renamed');
      cancelEdit();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rename failed');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteClass(confirmDelete._id);
      toast.success('Class deleted');
      fetchClasses();
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete class');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your school classes</p>
      </div>

      <form onSubmit={handleCreate} className="flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Class name (e.g. JSS1, SS2A)"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Create Class
        </button>
      </form>

      {classes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>No classes yet. Create one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls._id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {editingId === cls._id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(cls);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                        className="flex-1 min-w-0 border border-blue-400 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleRename(cls)}
                        disabled={savingId === cls._id}
                        className="text-green-600 hover:text-green-700 disabled:opacity-40"
                        title="Save"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-400 hover:text-gray-600"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">{cls.name}</h3>
                      <button
                        onClick={() => startEdit(cls)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-all"
                        title="Rename class"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Created {new Date(cls.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {editingId !== cls._id && (
                  <button
                    onClick={() => setConfirmDelete(cls)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                    title="Delete class"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Student count pills */}
              <div className="flex gap-2 mt-3">
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {cls.studentCount ?? 0} student{cls.studentCount !== 1 ? 's' : ''}
                </span>
                {cls.uploadedCount > 0 && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                    {cls.uploadedCount} uploaded
                  </span>
                )}
                {cls.studentCount > 0 && cls.uploadedCount < cls.studentCount && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                    {cls.studentCount - cls.uploadedCount} missing
                  </span>
                )}
              </div>

              <button
                onClick={() => navigate(`/classes/${cls._id}/students`)}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-600 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200 hover:border-blue-200"
              >
                Manage Students <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Class"
          message={`Delete "${confirmDelete.name}"? This cannot be undone. Classes with students cannot be deleted.`}
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
