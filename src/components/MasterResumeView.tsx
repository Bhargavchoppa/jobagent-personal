/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  Lock,
  Edit3,
  Award,
  GraduationCap,
  Briefcase,
  Layers,
  CheckCircle2,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Linkedin,
  ShieldCheck,
  FolderGit2,
  Trophy,
  Code2,
  Building2,
  Compass,
  Upload,
  History,
} from 'lucide-react';
import { MasterResume } from '../types';
import { SourceOfTruthBadge } from './master-resume/SourceOfTruthBadge';
import { InconsistencyBanner } from './master-resume/InconsistencyBanner';
import { UploadResumeModal } from './master-resume/UploadResumeModal';
import { VersionHistoryModal } from './master-resume/VersionHistoryModal';
import { EditResumeModal } from './master-resume/EditResumeModal';

interface MasterResumeViewProps {
  resume: MasterResume | null;
  onUpdateResume?: (updated: MasterResume) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export const MasterResumeView: React.FC<MasterResumeViewProps> = ({
  resume: initialResume,
  onUpdateResume,
  onRefresh,
}) => {
  const [currentResume, setCurrentResume] = useState<MasterResume | null>(initialResume);
  const [activeTab, setActiveTab] = useState<
    'all' | 'experience' | 'skills' | 'technologies' | 'certifications' | 'education' | 'projects' | 'achievements'
  >('all');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Synchronize if prop changes
  React.useEffect(() => {
    if (initialResume) {
      setCurrentResume(initialResume);
    }
  }, [initialResume]);

  if (!currentResume) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
          <span className="text-sm font-semibold">Loading master resume source of truth...</span>
        </div>
      </div>
    );
  }

  const pInfo = currentResume.personal_information;

  // Save new verified master resume (from upload or edit)
  const handleSaveVerifiedMaster = async (
    updated: MasterResume,
    note: string,
    makeActive: boolean
  ) => {
    try {
      const res = await fetch('/api/master-resume/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: updated,
          note,
          make_active: makeActive,
          source: 'manual_edit',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save master resume');
      }

      const data = await res.json();
      if (data.master_resume) {
        setCurrentResume(data.master_resume);
        if (onUpdateResume) {
          await onUpdateResume(data.master_resume);
        }
      }
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error('Error saving master resume:', err);
      throw err;
    }
  };

  // Activate historical version
  const handleActivateVersion = async (versionNum: number) => {
    try {
      const res = await fetch(`/api/master-resume/activate/${versionNum}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to activate version');
      }
      const data = await res.json();
      if (data.active_resume) {
        setCurrentResume(data.active_resume);
        if (onUpdateResume) {
          await onUpdateResume(data.active_resume);
        }
      }
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error('Error activating version:', err);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Source of Truth Indicator Badge */}
      <SourceOfTruthBadge
        resume={currentResume}
        onOpenVersions={() => setIsVersionsOpen(true)}
        onUploadNew={() => setIsUploadOpen(true)}
        onEditResume={() => setIsEditOpen(true)}
      />

      {/* 2. Inconsistency Warning Banner (Header vs Certification Section Discrepancy) */}
      <InconsistencyBanner
        flags={currentResume.inconsistency_flags || []}
        resume={currentResume}
      />

      {/* Structured Sections Filter Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-2 rounded-t-xl overflow-x-auto text-xs font-semibold">
        {[
          { id: 'all', label: 'All 9 Structured Sections' },
          { id: 'experience', label: `Experience (${currentResume.experience.length})` },
          { id: 'skills', label: `Skills (${currentResume.skills.length})` },
          { id: 'technologies', label: `Technologies (${currentResume.technologies.length})` },
          { id: 'certifications', label: `Certifications (${currentResume.certifications.length})` },
          { id: 'education', label: `Education (${currentResume.education.length})` },
          { id: 'projects', label: `Projects (${currentResume.projects.length})` },
          { id: 'achievements', label: `Achievements (${currentResume.achievements.length})` },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: Personal Information */}
      {(activeTab === 'all' || activeTab === 'experience') && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Section 1 • Personal Information
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {pInfo.full_name}
              </h1>
              <p className="text-sm font-bold text-blue-700 mt-0.5">
                {pInfo.header_positioning}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2.5">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {pInfo.location}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {pInfo.email}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {pInfo.phone}
                </span>
                {pInfo.linkedin_url && (
                  <a
                    href={pInfo.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
                  >
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn Profile
                  </a>
                )}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-right shrink-0">
              <div className="text-[11px] font-semibold text-slate-500">Verified Experience</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                ~{currentResume.total_experience_years} Years
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-0.5 flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {currentResume.experience.length} Verified Roles
              </div>
            </div>
          </div>

          {/* SECTION 2: Summary */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Section 2 • Executive Summary
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-normal bg-slate-50/50 p-3.5 rounded-lg border border-slate-100">
              {currentResume.professional_summary}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 3: Experience */}
      {(activeTab === 'all' || activeTab === 'experience') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Section 3 • Verified Experience Records ({currentResume.experience.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              Factual ceiling for employer names, dates, metrics, and achievements
            </span>
          </div>

          <div className="space-y-4">
            {currentResume.experience.map((exp, idx) => (
              <div
                key={exp.id || idx}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3.5 transition-all hover:border-slate-300"
              >
                {/* Header: Company, Title, Location, Dates */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">{exp.company}</h4>
                      {exp.is_current && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Current Role
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-blue-700 mt-0.5">{exp.title}</div>
                  </div>

                  <div className="text-right text-xs text-slate-500 space-y-0.5">
                    <div className="flex items-center gap-1 sm:justify-end font-semibold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exp.start_date} – {exp.end_date}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 sm:justify-end">
                      <MapPin className="w-3 h-3 text-slate-300" />
                      <span>{exp.location}</span>
                    </div>
                  </div>
                </div>

                {/* Industry & Domain Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <strong>Industry:</strong> {exp.industry}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-md border border-blue-200">
                    <Compass className="w-3 h-3 text-blue-500" />
                    <strong>Domain:</strong> {exp.domain}
                  </span>
                </div>

                {/* Responsibilities */}
                <div>
                  <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Verified Responsibilities ({exp.responsibilities.length})
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {exp.responsibilities.map((r, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                        <span className="leading-relaxed">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Achievements */}
                {exp.achievements && exp.achievements.length > 0 && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg space-y-1">
                    <h5 className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Achievements & Impact
                    </h5>
                    <ul className="space-y-1 text-xs text-emerald-950">
                      {exp.achievements.map((ach, aIdx) => (
                        <li key={aIdx} className="leading-relaxed">
                          • {ach}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Technologies */}
                {exp.technologies && exp.technologies.length > 0 && (
                  <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                      Tools & Tech:
                    </span>
                    {exp.technologies.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/60"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4 & 5: Skills & Technologies */}
      {(activeTab === 'all' || activeTab === 'skills' || activeTab === 'technologies') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Skills */}
          {(activeTab === 'all' || activeTab === 'skills') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Section 4 • Core Competencies ({currentResume.skills.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {currentResume.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-md font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Technologies */}
          {(activeTab === 'all' || activeTab === 'technologies') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-600" />
                Section 5 • Technologies & Tools ({currentResume.technologies.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {currentResume.technologies.map((tech, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-md font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 6: Certifications */}
      {(activeTab === 'all' || activeTab === 'certifications') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Section 6 • Verified Certifications ({currentResume.certifications.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              Zero-fabrication enforced: unlisted credentials cannot be tailored
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {currentResume.certifications.map((cert, idx) => (
              <div
                key={cert.id || idx}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-start gap-3"
              >
                <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl shrink-0 border border-amber-200">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">{cert.name}</h4>
                  <div className="text-slate-600 font-medium">Issuer: {cert.issuer}</div>
                  <div className="text-slate-400">Issued: {cert.issue_date}</div>
                  <span className="inline-block text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                    Verified Credential
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Audit Note */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong>Integrity Guard:</strong> If PMP is not listed above, the system will NEVER add PMP automatically to tailored resumes.
            </span>
          </div>
        </div>
      )}

      {/* SECTION 7: Education */}
      {(activeTab === 'all' || activeTab === 'education') && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            Section 7 • Education ({currentResume.education.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentResume.education.map((edu, idx) => (
              <div
                key={edu.id || idx}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex items-start gap-3.5"
              >
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 border border-indigo-200">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="text-xs space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    {edu.degree} in {edu.field_of_study}
                  </h4>
                  <div className="text-slate-700 font-semibold">{edu.institution}</div>
                  <div className="text-slate-500">
                    {edu.location} • Graduated {edu.graduation_date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 8 & 9: Projects & Achievements */}
      {(activeTab === 'all' || activeTab === 'projects' || activeTab === 'achievements') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Projects */}
          {(activeTab === 'all' || activeTab === 'projects') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-blue-600" />
                Section 8 • Key Projects ({currentResume.projects.length})
              </h3>
              <div className="space-y-3">
                {currentResume.projects.map((proj, idx) => (
                  <div key={proj.id || idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-900">{proj.name}</div>
                    <p className="text-slate-600 leading-relaxed">{proj.description}</p>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.technologies.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] font-medium bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {(activeTab === 'all' || activeTab === 'achievements') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-600" />
                Section 9 • Verified Achievements ({currentResume.achievements.length})
              </h3>
              <div className="space-y-2">
                {currentResume.achievements.map((ach, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-lg text-xs text-slate-800 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    <span className="leading-relaxed">{ach}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <UploadResumeModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSaveAsMaster={handleSaveVerifiedMaster}
      />

      <VersionHistoryModal
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
        onActivateVersion={handleActivateVersion}
        onSelectVersionSnapshot={(snap) => setCurrentResume(snap)}
      />

      <EditResumeModal
        isOpen={isEditOpen}
        resume={currentResume}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveVerifiedMaster}
      />
    </div>
  );
};
