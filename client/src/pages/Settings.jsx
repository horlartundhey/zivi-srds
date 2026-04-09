import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmailTemplate, updateEmailTemplate } from '../services/api';

const VARIABLES = [
  { variable: '{{student_name}}', description: "Student's full name" },
  { variable: '{{class}}', description: 'Class name (e.g. JSS 1A)' },
  { variable: '{{result_link}}', description: 'Direct link to the PDF result' },
];

export default function Settings() {
  const [template, setTemplate] = useState('');
  const [original, setOriginal] = useState('');
  const [defaultTemplate, setDefaultTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    getEmailTemplate()
      .then(({ data }) => {
        setTemplate(data.data.template);
        setOriginal(data.data.template);
        setDefaultTemplate(data.data.defaultTemplate);
      })
      .catch(() => toast.error('Failed to load email template'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!template.trim()) return toast.error('Template cannot be empty');
    setSaving(true);
    try {
      await updateEmailTemplate(template);
      setOriginal(template);
      toast.success('Email template saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTemplate(defaultTemplate);
    toast('Template reset to default (not yet saved)', { icon: '↩️' });
  };

  const previewHtml = template
    .replace(/{{student_name}}/g, 'Orlatan Hundeyin')
    .replace(/{{class}}/g, 'SS 1C')
    .replace(/{{result_link}}/g, '#');

  const isDirty = template !== original;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Template</h1>
          <p className="text-sm text-gray-500 mt-1">
            Customize the email sent to parents when results are distributed
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            title="Reset to default template"
            className="flex items-center gap-2 border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {preview ? <EyeOff size={14} /> : <Eye size={14} />}
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Variable reference */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-amber-800 mb-2">Available Variables</h3>
        <div className="flex flex-wrap gap-4">
          {VARIABLES.map(({ variable, description }) => (
            <div key={variable} className="flex items-center gap-2">
              <code className="text-xs bg-white text-amber-900 px-2 py-1 rounded font-mono border border-amber-200">
                {variable}
              </code>
              <span className="text-xs text-amber-700">{description}</span>
            </div>
          ))}
        </div>
      </div>

      {preview ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2">
            <Eye size={14} className="text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">
              Preview — sample data (Orlatan Hundeyin · SS 1C)
            </span>
          </div>
          <iframe
            srcDoc={previewHtml}
            title="Email Template Preview"
            className="w-full border-0"
            style={{ height: '600px' }}
            sandbox="allow-same-origin"
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">HTML Source</span>
            {isDirty && (
              <span className="text-xs text-orange-600 font-medium">● Unsaved changes</span>
            )}
          </div>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            spellCheck={false}
            className="w-full p-5 font-mono text-sm text-gray-800 focus:outline-none resize-none"
            style={{ height: '540px', lineHeight: '1.6' }}
          />
        </div>
      )}
    </div>
  );
}
