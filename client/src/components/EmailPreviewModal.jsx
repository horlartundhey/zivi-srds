import { useEffect, useState } from 'react';
import { X, Mail } from 'lucide-react';
import { getEmailPreview } from '../services/api';

export default function EmailPreviewModal({ student, onClose }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmailPreview(student._id)
      .then(({ data }) => setPreview(data.data))
      .catch(() => setPreview(null))
      .finally(() => setLoading(false));
  }, [student._id]);

  const html = preview
    ? `
    <html>
    <head><style>
      body { font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px; color: #333; }
      .container { max-width: 560px; margin: auto; background: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
      .header { background: #1a73e8; color: white; padding: 20px; border-radius: 6px 6px 0 0; text-align: center; }
      .body { padding: 20px 0; }
      .btn { display: inline-block; padding: 12px 24px; background: #1a73e8; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 16px; }
      .footer { font-size: 12px; color: #999; text-align: center; margin-top: 24px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header"><h2>📄 Your Child's Result</h2></div>
        <div class="body">
          <p>Dear Parent/Guardian,</p>
          <p>We are pleased to share the academic result for <strong>${preview.studentName}</strong> in <strong>${preview.className}</strong>.</p>
          <p>Please click the button below to view and download the result:</p>
          <a href="${preview.resultLink || '#'}" class="btn">View Result</a>
        </div>
        <div class="footer"><p>This email was sent by your school's administration.</p></div>
      </div>
    </body>
    </html>
  `
    : '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              Email Preview — {student.name}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Loading preview...</div>
        ) : !preview?.hasResult ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 p-6">
            No result uploaded yet. Upload a PDF first to preview the email.
          </div>
        ) : (
          <>
            <div className="px-5 py-3 bg-gray-50 border-b shrink-0 text-sm">
              <p className="text-gray-500">
                <span className="font-medium text-gray-700">To:</span> {preview.parentEmail}
              </p>
              <p className="text-gray-500 mt-0.5">
                <span className="font-medium text-gray-700">Subject:</span> Academic Result for {preview.studentName}
              </p>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe
                srcDoc={html}
                title="Email Preview"
                className="w-full h-full min-h-96 border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
