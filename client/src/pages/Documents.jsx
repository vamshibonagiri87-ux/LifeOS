import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api.js';
import {
  FileText,
  Upload,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  FileCode,
} from 'lucide-react';
import { formatDate } from '../utils/dates.js';

export function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const fileInputRef = useRef(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.data?.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchDocs();
    } catch (err) {
      alert(`Upload failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this document?')) {
      await api.delete(`/documents/${id}`);
      if (selectedDoc && (selectedDoc._id || selectedDoc.id) === id) {
        setSelectedDoc(null);
      }
      fetchDocs();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Document Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Upload PDFs, syllabi, and letters to extract checklists and responsibilities automatically
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.txt,.docx"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-lg shadow-primary-600/30 flex items-center gap-2 transition disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Document (PDF / TXT)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2-Column Grid: Document List & Extracted Text Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Uploads List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-bold text-foreground text-sm flex items-center justify-between">
            <span>Uploaded Files</span>
            <span className="text-xs text-muted font-mono">{documents.length}</span>
          </h3>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary-400 mx-auto" />
            </div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center text-muted border border-dashed border-border rounded-2xl space-y-2">
              <FileText className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const docId = doc._id || doc.id;
                const isSelected = selectedDoc && (selectedDoc._id || selectedDoc.id) === docId;
                return (
                  <div
                    key={docId}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-primary-500/15 border-primary-500/40 text-primary-300 font-semibold'
                        : 'bg-surface/70 border-border/80 text-foreground hover:bg-surface-hover/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-surface-hover text-primary-400 border border-border/50 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{doc.fileName}</p>
                        <p className="text-[10px] text-muted font-mono">{formatDate(doc.uploadedAt)}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(docId);
                      }}
                      className="p-1.5 text-muted hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Preview & Extracted Details */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-surface/70 border border-border space-y-4">
          {selectedDoc ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="font-bold text-foreground text-base">{selectedDoc.fileName}</h3>
                  <p className="text-xs text-muted font-mono mt-0.5">
                    Format: {selectedDoc.fileType} • Size: {Math.round((selectedDoc.fileSize || 0) / 1024)} KB
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {selectedDoc.processingStatus || 'PROCESSED'}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Extracted Raw Text:
                </span>
                <div className="p-4 rounded-2xl bg-black/40 border border-border/60 font-mono text-xs text-foreground/90 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
                  {selectedDoc.extractedText || 'No text extracted.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-muted space-y-2">
              <FileCode className="w-10 h-10 mx-auto opacity-30 text-primary-400" />
              <p className="text-sm font-medium">Select a document on the left to preview extracted intelligence</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
