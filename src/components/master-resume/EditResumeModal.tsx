/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  Briefcase,
  Layers,
  Award,
  GraduationCap,
  FolderGit2,
  Trophy,
  User,
  FileText,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { MasterResume, ExperienceEntry, CertificationEntry, EducationEntry } from '../../types';

interface EditResumeModalProps {
  isOpen: boolean;
  resume: MasterResume;
  onClose: () => void;
  onSave: (updated: MasterResume, note: string, makeActive: boolean) => Promise<void>;
}

export const EditResumeModal: React.FC<EditResumeModalProps> = ({
  isOpen,
  resume,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<MasterResume>(() => JSON.parse(JSON.stringify(resume)));
  const [activeTab, setActiveTab] = useState<
    'personal' | 'summary' | 'experience' | 'skills' | 'certifications' | 'education' | 'projects' | 'achievements'
  >('personal');
  const [changelogNote, setChangelogNote] = useState<string>('Manual edit to master resume');
  const [makeActive, setMakeActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // New Skill/Tech input state
  const [newSkill, setNewSkill] = useState('');
  const [newTech, setNewTech] = useState('');
  const [newAch, setNewAch] = useState('');

  if (!isOpen) return null;

  // Real-time inconsistency check
  const headerPos = (formData.personal_information.header_positioning || '').toLowerCase();
  const certs = formData.certifications || [];
  const mentionsPmpInHeader = /\bpmp\b|project management professional/.test(headerPos);
  const hasPmpInCerts = certs.some((c) => /\bpmp\b|project management professional/i.test(c.name));
  const hasPmpDiscrepancy = mentionsPmpInHeader && !hasPmpInCerts;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Re-run inconsistency detection
      const updatedResume = { ...formData };
      updatedResume.inconsistency_flags = [];

      if (hasPmpDiscrepancy) {
        updatedResume.inconsistency_flags.push({
          id: 'FLAG-PMP-AUDIT',
          code: 'HEADER_CERTIFICATION_MISMATCH',
          severity: 'high',
          title: 'Potential resume inconsistency — verify PMP certification.',
          description:
            'Header: PMP. Certification section: PMP not listed. Display: Potential resume inconsistency — verify PMP certification. Do NOT automatically add PMP.',
          location_a: 'personal_information.header_positioning',
          location_b: 'certifications',
          resolution_rule:
            'Enforced audit: Never inject PMP into tailored resumes or certifications without verified credential documentation.',
        });
      }

      await onSave(updatedResume, changelogNote, makeActive);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Add Experience
  const handleAddExperience = () => {
    const newEntry: ExperienceEntry = {
      id: `exp-${Date.now()}`,
      company: 'New Enterprise Corp',
      title: 'Senior Business Analyst',
      location: 'New York, NY',
      start_date: '01/2024',
      end_date: 'Present',
      is_current: true,
      responsibilities: ['Author detailed BRDs, FRDs, and user stories.'],
      achievements: ['Delivered initiative on schedule with 100% test coverage.'],
      technologies: ['JIRA', 'SQL', 'Confluence'],
      industry: 'Enterprise Software',
      domain: 'Digital Platforms',
    };
    setFormData({
      ...formData,
      experience: [newEntry, ...formData.experience],
    });
  };

  // Remove Experience
  const handleRemoveExperience = (idx: number) => {
    const nextExp = [...formData.experience];
    nextExp.splice(idx, 1);
    setFormData({ ...formData, experience: nextExp });
  };

  // Add Certification
  const handleAddCert = () => {
    const newCert: CertificationEntry = {
      id: `cert-${Date.now()}`,
      name: 'New Certification Credential',
      issuer: 'Certification Authority',
      issue_date: '2024',
      verified: true,
    };
    setFormData({
      ...formData,
      certifications: [...formData.certifications, newCert],
    });
  };

  // Remove Certification
  const handleRemoveCert = (idx: number) => {
    const nextCerts = [...formData.certifications];
    nextCerts.splice(idx, 1);
    setFormData({ ...formData, certifications: nextCerts });
  };

  // Add Education
  const handleAddEdu = () => {
    const newEdu: EducationEntry = {
      id: `edu-${Date.now()}`,
      degree: 'Master of Science',
      field_of_study: 'Information Systems',
      institution: 'University Name',
      graduation_date: '2020',
      location: 'Boston, MA',
    };
    setFormData({
      ...formData,
      education: [...formData.education, newEdu],
    });
  };

  // Remove Education
  const handleRemoveEdu = (idx: number) => {
    const nextEdu = [...formData.education];
    nextEdu.splice(idx, 1);
    setFormData({ ...formData, education: nextEdu });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Edit Verified Master Resume</h3>
              <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                Source of Truth Editor
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              All 9 structured sections are factual baselines. Saving creates a new immutable version.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inconsistency Warning if present */}
        {hasPmpDiscrepancy && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Warning:</strong> Potential resume inconsistency — verify PMP certification. (Header references PMP, but certification catalog does not list PMP. System will NOT automatically add PMP).
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-800 px-2 py-0.5 rounded shrink-0">
              Audit Flag Active
            </span>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-white overflow-x-auto text-xs font-semibold">
          {[
            { id: 'personal', label: 'Personal Info', icon: User },
            { id: 'summary', label: 'Summary', icon: FileText },
            { id: 'experience', label: `Experience (${formData.experience.length})`, icon: Briefcase },
            { id: 'skills', label: `Skills (${formData.skills.length})`, icon: Layers },
            { id: 'certifications', label: `Certifications (${formData.certifications.length})`, icon: Award },
            { id: 'education', label: `Education (${formData.education.length})`, icon: GraduationCap },
            { id: 'projects', label: `Projects (${formData.projects.length})`, icon: FolderGit2 },
            { id: 'achievements', label: `Achievements (${formData.achievements.length})`, icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-3 px-3 border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab 1: Personal Information */}
          {activeTab === 'personal' && (
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 text-sm">Personal Information & Header Positioning</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={formData.personal_information.full_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal_information: {
                          ...formData.personal_information,
                          full_name: e.target.value,
                        },
                      })
                    }
                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Header / Positioning Tagline</label>
                  <input
                    type="text"
                    value={formData.personal_information.header_positioning}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal_information: {
                          ...formData.personal_information,
                          header_positioning: e.target.value,
                        },
                      })
                    }
                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Example: Business Analyst | Product Owner | CSM | CSPO | PMP | AWS Certified
                  </p>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={formData.personal_information.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal_information: {
                          ...formData.personal_information,
                          email: e.target.value,
                        },
                      })
                    }
                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={formData.personal_information.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal_information: {
                          ...formData.personal_information,
                          phone: e.target.value,
                        },
                      })
                    }
                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Location (Target Markets)</label>
                  <input
                    type="text"
                    value={formData.personal_information.location}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal_information: {
                          ...formData.personal_information,
                          location: e.target.value,
                        },
                      })
                    }
                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">LinkedIn URL</label>
                  <input
                    type="text"
                    value={formData.personal_information.linkedin_url || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal_information: {
                          ...formData.personal_information,
                          linkedin_url: e.target.value,
                        },
                      })
                    }
                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Summary */}
          {activeTab === 'summary' && (
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 text-sm">Professional Summary</h4>
              <p className="text-slate-500">
                The executive narrative that anchors candidate positioning. Tailoring may emphasize specific proven sentences, but never hallucinates beyond this scope.
              </p>
              <textarea
                rows={8}
                value={formData.professional_summary}
                onChange={(e) =>
                  setFormData({ ...formData, professional_summary: e.target.value })
                }
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Tab 3: Experience */}
          {activeTab === 'experience' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Verified Experience Records</h4>
                  <p className="text-slate-500 text-[11px]">
                    Each role includes company, title, location, start_date, end_date, responsibilities, achievements, technologies, industry, domain.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Experience Record
                </button>
              </div>

              <div className="space-y-4">
                {formData.experience.map((exp, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-800">
                        Record #{idx + 1}: {exp.company} — {exp.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="font-semibold text-slate-600">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const copy = [...formData.experience];
                            copy[idx].company = e.target.value;
                            setFormData({ ...formData, experience: copy });
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600">Title</label>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => {
                            const copy = [...formData.experience];
                            copy[idx].title = e.target.value;
                            setFormData({ ...formData, experience: copy });
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600">Location</label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => {
                            const copy = [...formData.experience];
                            copy[idx].location = e.target.value;
                            setFormData({ ...formData, experience: copy });
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600">Start Date</label>
                        <input
                          type="text"
                          value={exp.start_date}
                          onChange={(e) => {
                            const copy = [...formData.experience];
                            copy[idx].start_date = e.target.value;
                            setFormData({ ...formData, experience: copy });
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600">End Date</label>
                        <input
                          type="text"
                          value={exp.end_date}
                          onChange={(e) => {
                            const copy = [...formData.experience];
                            copy[idx].end_date = e.target.value;
                            setFormData({ ...formData, experience: copy });
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600">Industry / Domain</label>
                        <div className="flex gap-1 mt-0.5">
                          <input
                            type="text"
                            value={exp.industry}
                            onChange={(e) => {
                              const copy = [...formData.experience];
                              copy[idx].industry = e.target.value;
                              setFormData({ ...formData, experience: copy });
                            }}
                            className="w-1/2 p-1.5 border border-slate-300 rounded bg-white"
                            placeholder="Industry"
                          />
                          <input
                            type="text"
                            value={exp.domain}
                            onChange={(e) => {
                              const copy = [...formData.experience];
                              copy[idx].domain = e.target.value;
                              setFormData({ ...formData, experience: copy });
                            }}
                            className="w-1/2 p-1.5 border border-slate-300 rounded bg-white"
                            placeholder="Domain"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Responsibilities */}
                    <div>
                      <label className="font-semibold text-slate-700">
                        Responsibilities (one per line)
                      </label>
                      <textarea
                        rows={3}
                        value={exp.responsibilities.join('\n')}
                        onChange={(e) => {
                          const copy = [...formData.experience];
                          copy[idx].responsibilities = e.target.value.split('\n').filter(Boolean);
                          setFormData({ ...formData, experience: copy });
                        }}
                        className="w-full p-2 border border-slate-300 rounded bg-white mt-1 text-xs"
                      />
                    </div>

                    {/* Achievements */}
                    <div>
                      <label className="font-semibold text-slate-700">
                        Achievements & Impact (one per line)
                      </label>
                      <textarea
                        rows={2}
                        value={exp.achievements.join('\n')}
                        onChange={(e) => {
                          const copy = [...formData.experience];
                          copy[idx].achievements = e.target.value.split('\n').filter(Boolean);
                          setFormData({ ...formData, experience: copy });
                        }}
                        className="w-full p-2 border border-slate-300 rounded bg-white mt-1 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Skills & Technologies */}
          {activeTab === 'skills' && (
            <div className="space-y-5 text-xs">
              <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="font-bold text-slate-900 text-sm">Core Skills ({formData.skills.length})</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add verified skill (e.g. BPMN Modeling)..."
                    className="p-2 border border-slate-300 rounded-lg flex-1 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
                        setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
                        setNewSkill('');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {formData.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded-md text-slate-800 font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...formData.skills];
                          next.splice(sIdx, 1);
                          setFormData({ ...formData, skills: next });
                        }}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="font-bold text-slate-900 text-sm">Technologies & Tools ({formData.technologies.length})</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    placeholder="Add technology/tool (e.g. Postman, Tableau)..."
                    className="p-2 border border-slate-300 rounded-lg flex-1 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTech.trim() && !formData.technologies.includes(newTech.trim())) {
                        setFormData({
                          ...formData,
                          technologies: [...formData.technologies, newTech.trim()],
                        });
                        setNewTech('');
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {formData.technologies.map((tech, tIdx) => (
                    <span
                      key={tIdx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-medium"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...formData.technologies];
                          next.splice(tIdx, 1);
                          setFormData({ ...formData, technologies: next });
                        }}
                        className="text-emerald-500 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Certifications */}
          {activeTab === 'certifications' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Verified Certifications ({formData.certifications.length})
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    Audit Rule: Credentials listed here are verified. The system will NEVER inject unlisted credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCert}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Certification
                </button>
              </div>

              <div className="space-y-3">
                {formData.certifications.map((cert, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Credential #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCert(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-semibold text-slate-600">Certification Name</label>
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => {
                            const copy = [...formData.certifications];
                            copy[idx].name = e.target.value;
                            setFormData({ ...formData, certifications: copy });
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600">Issuing Body</label>
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => {
                            const copy = [...formData.certifications];
                            copy[idx].issuer = e.target.value;
                            setFormData({ ...formData, certifications: copy });
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600">Issue Date / Status</label>
                        <input
                          type="text"
                          value={cert.issue_date || ''}
                          onChange={(e) => {
                            const copy = [...formData.certifications];
                            copy[idx].issue_date = e.target.value;
                            setFormData({ ...formData, certifications: copy });
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white mt-0.5"
                          placeholder="e.g. 2022"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 6: Education */}
          {activeTab === 'education' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Education Degrees ({formData.education.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleAddEdu}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Degree
                </button>
              </div>

              <div className="space-y-3">
                {formData.education.map((edu, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Degree #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEdu(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="font-semibold text-slate-600">Degree</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const copy = [...formData.education];
                            copy[idx].degree = e.target.value;
                            setFormData({ ...formData, education: copy });
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600">Field of Study</label>
                        <input
                          type="text"
                          value={edu.field_of_study}
                          onChange={(e) => {
                            const copy = [...formData.education];
                            copy[idx].field_of_study = e.target.value;
                            setFormData({ ...formData, education: copy });
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600">Institution</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const copy = [...formData.education];
                            copy[idx].institution = e.target.value;
                            setFormData({ ...formData, education: copy });
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600">Graduation Date</label>
                        <input
                          type="text"
                          value={edu.graduation_date}
                          onChange={(e) => {
                            const copy = [...formData.education];
                            copy[idx].graduation_date = e.target.value;
                            setFormData({ ...formData, education: copy });
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white mt-0.5"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 7: Projects */}
          {activeTab === 'projects' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Key Enterprise Projects</h4>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      projects: [
                        ...formData.projects,
                        {
                          id: `proj-${Date.now()}`,
                          name: 'New Platform Project',
                          description: 'Cross-functional delivery of microservices and APIs.',
                          technologies: ['SQL', 'REST API'],
                        },
                      ],
                    });
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Project
                </button>
              </div>

              {formData.projects.map((proj, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={proj.name}
                      onChange={(e) => {
                        const copy = [...formData.projects];
                        copy[idx].name = e.target.value;
                        setFormData({ ...formData, projects: copy });
                      }}
                      className="font-bold text-slate-900 p-1 border border-slate-300 rounded bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = [...formData.projects];
                        copy.splice(idx, 1);
                        setFormData({ ...formData, projects: copy });
                      }}
                      className="text-rose-600 hover:text-rose-800 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={proj.description}
                    onChange={(e) => {
                      const copy = [...formData.projects];
                      copy[idx].description = e.target.value;
                      setFormData({ ...formData, projects: copy });
                    }}
                    className="w-full p-2 border border-slate-300 rounded bg-white"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Tab 8: Achievements */}
          {activeTab === 'achievements' && (
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 text-sm">Recognized Achievements</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAch}
                  onChange={(e) => setNewAch(e.target.value)}
                  placeholder="Add verified achievement or award..."
                  className="p-2 border border-slate-300 rounded-lg flex-1 bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newAch.trim()) {
                      setFormData({
                        ...formData,
                        achievements: [...formData.achievements, newAch.trim()],
                      });
                      setNewAch('');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg"
                >
                  Add
                </button>
              </div>

              <div className="space-y-2 pt-2">
                {formData.achievements.map((ach, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2"
                  >
                    <span>• {ach}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const copy = [...formData.achievements];
                        copy.splice(idx, 1);
                        setFormData({ ...formData, achievements: copy });
                      }}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Save & Version Settings Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <label className="font-semibold text-slate-700">Changelog Note:</label>
              <input
                type="text"
                value={changelogNote}
                onChange={(e) => setChangelogNote(e.target.value)}
                className="ml-2 p-1.5 border border-slate-300 rounded bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="checkbox"
                id="activeToggle"
                checked={makeActive}
                onChange={(e) => setMakeActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <label htmlFor="activeToggle" className="font-bold text-slate-800">
                Mark as ACTIVE Source of Truth
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Version...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Verified Version</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
