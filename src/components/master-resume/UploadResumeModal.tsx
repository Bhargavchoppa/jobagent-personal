/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  FileUp,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { MasterResume, ParsedResumeReview } from '../../types';

interface UploadResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAsMaster: (resume: MasterResume, note: string, makeActive: boolean) => Promise<void>;
}

export const UploadResumeModal: React.FC<UploadResumeModalProps> = ({
  isOpen,
  onClose,
  onSaveAsMaster,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parsingStep, setParsingStep] = useState<string>('');
  const [parsedReview, setParsedReview] = useState<ParsedResumeReview | null>(null);
  const [editableResume, setEditableResume] = useState<MasterResume | null>(null);
  const [versionNote, setVersionNote] = useState<string>('Uploaded and verified resume document');
  const [makeActive, setMakeActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleUploadAndParse = async () => {
    setError(null);
    setIsProcessing(true);
    setParsingStep('Reading document binary...');

    try {
      let payload: any = {};

      if (activeTab === 'file' && file) {
        setParsingStep(`Extracting text from ${file.name} (DOCX/PDF)...`);
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        const dataUrl = await base64Promise;
        payload = {
          file_base64: dataUrl,
          filename: file.name,
          mime_type: file.type,
        };
      } else if (activeTab === 'text' && rawText.trim()) {
        payload = {
          raw_text: rawText,
          filename: 'Pasted-Resume-Text',
        };
      } else {
        setError('Please select a PDF/DOCX file or enter resume text.');
        setIsProcessing(false);
        return;
      }

      setParsingStep('Parsing 9 structured sections (Zero-Fabrication Model)...');

      const res = await fetch('/api/master-resume/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to parse resume');
      }

      const data = await res.json();
      setParsingStep('Auditing cross-section integrity & credentials...');

      setParsedReview(data.review);
      setEditableResume(JSON.parse(JSON.stringify(data.review.extracted_resume)));
      setVersionNote(`Uploaded from ${file ? file.name : 'pasted text'}`);
    } catch (err: any) {
      setError(err.message || 'Error parsing document');
    } finally {
      setIsProcessing(false);
      setParsingStep('');
    }
  };

  const handleSaveVerified = async () => {
    if (!editableResume) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSaveAsMaster(editableResume, versionNote, makeActive);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save master resume');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileUp className="w-5 h-5 text-blue-600" />
              Upload & Parse Master Resume
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Extract structured factual background with zero-fabrication verification and integrity auditing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!editableResume ? (
            /* Upload Stage */
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('file')}
                  className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'file'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Upload File (PDF / DOCX)
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'text'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Paste Resume Text
                </button>
              </div>

              {activeTab === 'file' ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20 rounded-xl p-8 text-center cursor-pointer transition-colors space-y-3"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.doc,.txt"
                    className="hidden"
                  />
                  <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-200">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900">
                      {file ? file.name : 'Click to upload or drag & drop resume file'}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports native PDF, DOCX (Word), or plain text resume formats.
                    </p>
                  </div>
                  {file && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready: {(file.size / 1024).toFixed(1)} KB
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Paste Full Resume Text</label>
                  <textarea
                    rows={10}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste the raw text of your resume here (experience, skills, certifications, education)..."
                    className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleUploadAndParse}
                  disabled={isProcessing || (activeTab === 'file' ? !file : !rawText.trim())}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{parsingStep || 'Extracting & Auditing...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Extract Structured Information</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Review & Manual Correction Stage */
            <div className="space-y-5">
              {/* Top extraction notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-blue-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Extraction Complete — Review & Correct Information
                  </div>
                  <div className="text-blue-800">
                    Verify candidate details below. The system enforces zero-fabrication rules before saving.
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditableResume(null);
                    setParsedReview(null);
                  }}
                  className="text-xs text-blue-700 underline font-semibold"
                >
                  Upload Another
                </button>
              </div>

              {/* Inconsistency warnings */}
              {editableResume.inconsistency_flags && editableResume.inconsistency_flags.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-amber-950 text-sm">
                        Potential resume inconsistency — verify PMP certification.
                      </div>
                      <div className="text-amber-900">
                        Header mentions PMP (<code>"{editableResume.personal_information.header_positioning}"</code>), but the Certification section does not list PMP.
                      </div>
                      <div className="font-bold text-amber-950 pt-1">
                        Display: "Potential resume inconsistency — verify PMP certification."
                      </div>
                      <div className="p-2 bg-white/90 border border-amber-200 rounded text-amber-900 font-semibold">
                        Directive Enforced: Do NOT automatically add PMP.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Editable Section 1: Personal Information */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  1. Personal Information & Header
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Full Name</label>
                    <input
                      type="text"
                      value={editableResume.personal_information.full_name}
                      onChange={(e) =>
                        setEditableResume({
                          ...editableResume,
                          personal_information: {
                            ...editableResume.personal_information,
                            full_name: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 mt-1 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Header / Positioning</label>
                    <input
                      type="text"
                      value={editableResume.personal_information.header_positioning}
                      onChange={(e) =>
                        setEditableResume({
                          ...editableResume,
                          personal_information: {
                            ...editableResume.personal_information,
                            header_positioning: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 mt-1 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Email</label>
                    <input
                      type="email"
                      value={editableResume.personal_information.email}
                      onChange={(e) =>
                        setEditableResume({
                          ...editableResume,
                          personal_information: {
                            ...editableResume.personal_information,
                            email: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 mt-1 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Phone</label>
                    <input
                      type="text"
                      value={editableResume.personal_information.phone}
                      onChange={(e) =>
                        setEditableResume({
                          ...editableResume,
                          personal_information: {
                            ...editableResume.personal_information,
                            phone: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 mt-1 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Editable Section 2: Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  2. Executive Summary
                </h4>
                <textarea
                  rows={3}
                  value={editableResume.professional_summary}
                  onChange={(e) =>
                    setEditableResume({
                      ...editableResume,
                      professional_summary: e.target.value,
                    })
                  }
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              {/* Editable Section 3: Experience */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    3. Experience ({editableResume.experience.length} Roles)
                  </h4>
                </div>

                <div className="space-y-3">
                  {editableResume.experience.map((exp, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold">Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => {
                              const newExp = [...editableResume.experience];
                              newExp[idx].company = e.target.value;
                              setEditableResume({ ...editableResume, experience: newExp });
                            }}
                            className="w-full p-1.5 border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold">Title</label>
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => {
                              const newExp = [...editableResume.experience];
                              newExp[idx].title = e.target.value;
                              setEditableResume({ ...editableResume, experience: newExp });
                            }}
                            className="w-full p-1.5 border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold">Location</label>
                          <input
                            type="text"
                            value={exp.location}
                            onChange={(e) => {
                              const newExp = [...editableResume.experience];
                              newExp[idx].location = e.target.value;
                              setEditableResume({ ...editableResume, experience: newExp });
                            }}
                            className="w-full p-1.5 border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold">Dates</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={exp.start_date}
                              onChange={(e) => {
                                const newExp = [...editableResume.experience];
                                newExp[idx].start_date = e.target.value;
                                setEditableResume({ ...editableResume, experience: newExp });
                              }}
                              className="w-1/2 p-1.5 border border-slate-300 rounded"
                              placeholder="Start"
                            />
                            <input
                              type="text"
                              value={exp.end_date}
                              onChange={(e) => {
                                const newExp = [...editableResume.experience];
                                newExp[idx].end_date = e.target.value;
                                setEditableResume({ ...editableResume, experience: newExp });
                              }}
                              className="w-1/2 p-1.5 border border-slate-300 rounded"
                              placeholder="End"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Domain & Industry */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold">Industry</label>
                          <input
                            type="text"
                            value={exp.industry}
                            onChange={(e) => {
                              const newExp = [...editableResume.experience];
                              newExp[idx].industry = e.target.value;
                              setEditableResume({ ...editableResume, experience: newExp });
                            }}
                            className="w-full p-1 border border-slate-200 rounded text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold">Domain</label>
                          <input
                            type="text"
                            value={exp.domain}
                            onChange={(e) => {
                              const newExp = [...editableResume.experience];
                              newExp[idx].domain = e.target.value;
                              setEditableResume({ ...editableResume, experience: newExp });
                            }}
                            className="w-full p-1 border border-slate-200 rounded text-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Versioning & Save Confirmation */}
              <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Save Verified Master Resume Version
                </h4>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Version Changelog / Note</label>
                  <input
                    type="text"
                    value={versionNote}
                    onChange={(e) => setVersionNote(e.target.value)}
                    placeholder="e.g. Uploaded verified updated PDF resume"
                    className="w-full p-2 mt-1 border border-slate-300 rounded-lg bg-white text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="makeActiveCheck"
                    checked={makeActive}
                    onChange={(e) => setMakeActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <label htmlFor="makeActiveCheck" className="text-xs font-bold text-slate-800">
                    Mark this version as the ACTIVE Source of Truth for ATS Tailoring
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setEditableResume(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Back to Upload
                </button>

                <button
                  onClick={handleSaveVerified}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving & Activating...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Save as Verified Master Resume</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
