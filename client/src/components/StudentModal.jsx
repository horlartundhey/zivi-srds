import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createStudent, updateStudent } from '../services/api';

export default function StudentModal({ classId, student, onClose, onSave }) {
  const isEdit = !!student;
  const [form, setForm] = useState({
    name: student?.name || '',
    parentEmail: student?.parentEmail || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.parentEmail.trim()) {
      return toast.error('All fields are required');
    }
    setLoading(true);
    try {
      let saved;
      if (isEdit) {
        const { data } = await updateStudent(student._id, form);
        saved = data.data;
        toast.success('Student updated');
      } else {
        const { data } = await createStudent({ ...form, classId });
        saved = data.data;
        toast.success('Student added');
      }
      onSave(saved);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? 'Edit Student' : 'Add Student'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Amina Bello"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
            <input
              type="email"
              value={form.parentEmail}
              onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
              placeholder="e.g. parent@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Student' : 'Add Student'}
          </button>
        </form>
      </div>
    </div>
  );
}
