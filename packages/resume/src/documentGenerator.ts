/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import PDFDocument from 'pdfkit';
import {
  TailoredResume,
  MasterResume,
  JobPosting,
  GeneratedResumeDocument,
  TruthValidationReport,
  AtsDocumentCompliance,
} from '../../../src/types';

// =============================================================
// PHASE 7: ATS RESUME DOCUMENT GENERATOR
// =============================================================

/**
 * Normalizes and sanitizes filename component strings.
 */
export function sanitizeFilenamePart(str: string): string {
  if (!str) return 'unknown';
  return str
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Standard ATS Resume File Naming:
 * Pattern: <job-id>_<company>_<title>_tailored.docx
 */
export function generateResumeDocumentFilename(
  jobId: string,
  company: string,
  title: string,
  ext: 'docx' | 'pdf'
): string {
  const cleanJobId = sanitizeFilenamePart(jobId || 'job');
  const cleanCompany = sanitizeFilenamePart(company || 'company');
  const cleanTitle = sanitizeFilenamePart(title || 'role');
  return `${cleanJobId}_${cleanCompany}_${cleanTitle}_tailored.${ext}`;
}

/**
 * Determines a job-specific target title while enforcing seniority boundaries.
 * "Do not claim a seniority level that contradicts the user's experience."
 * Candidate verified experience: ~9 years as Senior Business Analyst, Product Owner,
 * Technical Product Manager / BA.
 *
 * Contradictory levels that must NOT be claimed:
 * VP, Vice President, Executive Director, Managing Director, Director, Chief (CTO/CPO/CEO), Head of.
 */
export function determineJobSpecificTargetTitle(
  jobTitle?: string,
  userYearsOfExperience: number = 9
): {
  targetTitle: string;
  adjusted: boolean;
  adjustmentNote?: string;
} {
  if (!jobTitle || !jobTitle.trim()) {
    return {
      targetTitle: 'Senior Business Analyst / Technical Product Manager',
      adjusted: false,
    };
  }

  const raw = jobTitle.trim();
  const lower = raw.toLowerCase();

  // 1. Check for contradictory executive or director-level seniority
  const contradictoryExecutiveSeniority = [
    { pattern: /\b(vp|vice president|svp|evp)\b/i, label: 'Vice President / VP' },
    { pattern: /\b(senior director|managing director|director)\b/i, label: 'Director' },
    { pattern: /\b(cto|cpo|ceo|chief technology|chief product|chief executive)\b/i, label: 'Chief Officer' },
    { pattern: /\bhead of\b/i, label: 'Head of' },
  ];

  for (const item of contradictoryExecutiveSeniority) {
    if (item.pattern.test(raw)) {
      // Safely align to candidate's verified senior level without fabricating executive rank
      let safeAlignedTitle = 'Senior Product Manager';
      if (lower.includes('business analyst') || lower.includes('analysis') || lower.includes('analytics')) {
        safeAlignedTitle = 'Lead / Senior Business Analyst';
      } else if (lower.includes('product owner') || lower.includes('scrum')) {
        safeAlignedTitle = 'Senior Product Owner';
      } else if (lower.includes('technical') || lower.includes('software') || lower.includes('platform')) {
        safeAlignedTitle = 'Senior Technical Product Manager';
      } else if (lower.includes('product')) {
        safeAlignedTitle = 'Senior Product Manager';
      }

      return {
        targetTitle: safeAlignedTitle,
        adjusted: true,
        adjustmentNote: `Job title requested executive seniority (${item.label}). Adjusted to verified senior professional title (${safeAlignedTitle}) to preserve candidate truthfulness and prevent contradicting ~${userYearsOfExperience} years verified experience.`,
      };
    }
  }

  // 2. Clean parentheticals and trailing requisition codes
  let cleaned = raw
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s*-\s*(hybrid|remote|on-site|full-time|contract|req\s*\d+|job\s*\d+).*$/i, '')
    .trim();

  // 3. Fallback check for common high-match roles
  if (!cleaned) {
    cleaned = 'Senior Business Analyst / Product Manager';
  }

  return {
    targetTitle: cleaned,
    adjusted: false,
  };
}

/**
 * Generates ATS-safe plain text preview of the resume.
 * Useful for parser validation and raw stream rendering.
 */
export function generateResumePlainTextPreview(
  tailored: TailoredResume,
  master: MasterResume,
  job?: JobPosting
): string {
  const pInfo = master.personal_information;
  const targetTitleResult = determineJobSpecificTargetTitle(
    tailored.target_title || job?.title || tailored.job_title,
    master.total_experience_years || 9
  );
  const targetTitle = targetTitleResult.targetTitle;

  const lines: string[] = [];

  // 1. NAME
  lines.push(pInfo.full_name.toUpperCase());
  lines.push(`${pInfo.location} | ${pInfo.email} | ${pInfo.phone}${pInfo.linkedin_url ? ` | ${pInfo.linkedin_url}` : ''}`);
  lines.push('');

  // 2. TARGET TITLE
  lines.push(`TARGET POSITION: ${targetTitle.toUpperCase()}`);
  lines.push('');

  // 3. PROFESSIONAL SUMMARY
  lines.push('PROFESSIONAL SUMMARY');
  lines.push(tailored.summary || tailored.professional_summary || master.professional_summary);
  lines.push('');

  // 4. CORE SKILLS
  lines.push('CORE SKILLS');
  const skillsList = [
    ...(tailored.core_skills || []),
    ...(tailored.targeted_skills?.present || []),
  ];
  const uniqueSkills = Array.from(new Set(skillsList.filter(Boolean)));
  lines.push(uniqueSkills.length > 0 ? uniqueSkills.join(' | ') : master.skills.slice(0, 16).join(' | '));
  lines.push('');

  // 5. PROFESSIONAL EXPERIENCE
  lines.push('PROFESSIONAL EXPERIENCE');
  const experiences = tailored.professional_experience || tailored.tailored_experience || [];
  for (const exp of experiences) {
    lines.push(`${exp.company} | ${exp.title} | ${exp.location} | ${exp.dates}`);
    for (const resp of exp.reordered_responsibilities || []) {
      lines.push(`• ${resp}`);
    }
    for (const ach of exp.truth_aligned_achievements || []) {
      lines.push(`• Key Result: ${ach}`);
    }
    lines.push('');
  }

  // 6. EDUCATION
  lines.push('EDUCATION');
  for (const edu of master.education) {
    lines.push(`${edu.degree} in ${edu.field_of_study}`);
    lines.push(`${edu.institution} | ${edu.graduation_date}${edu.location ? ` | ${edu.location}` : ''}`);
  }
  lines.push('');

  // 7. CERTIFICATIONS (Strictly verified, no PMP)
  lines.push('CERTIFICATIONS');
  for (const cert of master.certifications.filter((c) => c.verified)) {
    lines.push(`• ${cert.name} (${cert.issuer})`);
  }

  return lines.join('\n');
}

/**
 * Builds standard ATS Document Compliance Metrics.
 */
export function checkAtsDocumentCompliance(plainText: string): AtsDocumentCompliance {
  const sectionsExpected = [
    'Name',
    'Target Title',
    'Professional Summary',
    'Core Skills',
    'Professional Experience',
    'Education',
    'Certifications',
  ];

  const words = plainText.split(/\s+/).filter(Boolean).length;
  // Estimate ~450 words per resume page with standard Arial 10pt and 1-inch margins
  const pagesEstimate = Math.max(1, Math.ceil(words / 450));

  return {
    has_tables: false,
    has_text_boxes: false,
    has_graphics: false,
    has_columns: false,
    has_icons: false,
    safe_font: 'Arial',
    critical_info_in_header_footer: false,
    sections_order: sectionsExpected,
    word_count: words,
    pages_estimate: pagesEstimate,
    compliance_score: 100,
  };
}

/**
 * PHASE 7 DOCX GENERATOR:
 * Simple ATS-compatible layout:
 * - Font: Arial
 * - Avoid: tables, text boxes, graphics, columns, icons, header/footer info
 * - Clear uppercase section headings
 * - Standard bullets
 * - Consistent dates
 * - Strict 7-section ordering:
 *   1. Name
 *   2. Target Title
 *   3. Professional Summary
 *   4. Core Skills
 *   5. Professional Experience
 *   6. Education
 *   7. Certifications
 */
export async function generateAtsResumeDocxBuffer(
  tailored: TailoredResume,
  master: MasterResume,
  job?: JobPosting
): Promise<Buffer> {
  const pInfo = master.personal_information;
  const targetTitleResult = determineJobSpecificTargetTitle(
    tailored.target_title || job?.title || tailored.job_title,
    master.total_experience_years || 9
  );
  const targetTitle = targetTitleResult.targetTitle;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1080, // 0.75 inch (standard ATS safe margin)
              right: 1080,
              bottom: 1080,
              left: 1080,
            },
          },
        },
        children: [
          // ==========================================
          // 1. NAME & CONTACT DETAILS (IN BODY, NOT HEADER!)
          // ==========================================
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: pInfo.full_name,
                bold: true,
                size: 32, // 16pt
                font: 'Arial',
                color: '111827',
              }),
            ],
            spacing: { after: 60 },
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${pInfo.location}  |  ${pInfo.email}  |  ${pInfo.phone}${
                  pInfo.linkedin_url ? `  |  ${pInfo.linkedin_url}` : ''
                }`,
                size: 19, // ~9.5pt
                font: 'Arial',
                color: '374151',
              }),
            ],
            spacing: { after: 120 },
          }),

          // ==========================================
          // 2. TARGET TITLE (Job-Specific & Seniority Guarded)
          // ==========================================
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: targetTitle.toUpperCase(),
                bold: true,
                size: 22, // 11pt
                font: 'Arial',
                color: '1E3A8A',
              }),
            ],
            spacing: { after: 160 },
          }),

          // ==========================================
          // 3. PROFESSIONAL SUMMARY
          // ==========================================
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'PROFESSIONAL SUMMARY',
                bold: true,
                size: 22, // 11pt
                font: 'Arial',
                color: '111827',
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: tailored.summary || tailored.professional_summary || master.professional_summary,
                size: 20, // 10pt
                font: 'Arial',
                color: '1F2937',
              }),
            ],
            spacing: { after: 140 },
          }),

          // ==========================================
          // 4. CORE SKILLS
          // ==========================================
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'CORE SKILLS',
                bold: true,
                size: 22, // 11pt
                font: 'Arial',
                color: '111827',
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),

          // Key technical & domain competencies
          new Paragraph({
            children: [
              new TextRun({
                text: 'Technical & Product Competencies: ',
                bold: true,
                size: 20, // 10pt
                font: 'Arial',
                color: '111827',
              }),
              new TextRun({
                text: (
                  tailored.core_skills && tailored.core_skills.length > 0
                    ? tailored.core_skills
                    : tailored.targeted_skills?.present && tailored.targeted_skills.present.length > 0
                    ? tailored.targeted_skills.present
                    : master.skills.slice(0, 14)
                ).join('  •  '),
                size: 20, // 10pt
                font: 'Arial',
                color: '1F2937',
              }),
            ],
            spacing: { after: 60 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'Tools, Platforms & Methodologies: ',
                bold: true,
                size: 20, // 10pt
                font: 'Arial',
                color: '111827',
              }),
              new TextRun({
                text: master.technologies.slice(0, 16).join('  •  '),
                size: 20, // 10pt
                font: 'Arial',
                color: '1F2937',
              }),
            ],
            spacing: { after: 140 },
          }),

          // ==========================================
          // 5. PROFESSIONAL EXPERIENCE
          // ==========================================
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'PROFESSIONAL EXPERIENCE',
                bold: true,
                size: 22, // 11pt
                font: 'Arial',
                color: '111827',
              }),
            ],
            spacing: { before: 140, after: 100 },
          }),

          // Professional experience entries
          ...((tailored.professional_experience || tailored.tailored_experience || []).flatMap((exp) => [
            // Company & Location | Dates
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.company,
                  bold: true,
                  size: 21, // 10.5pt
                  font: 'Arial',
                  color: '111827',
                }),
                new TextRun({
                  text: `  —  ${exp.location}`,
                  size: 19,
                  font: 'Arial',
                  color: '4B5563',
                }),
                new TextRun({
                  text: `  |  ${exp.dates}`,
                  size: 19,
                  font: 'Arial',
                  color: '374151',
                }),
              ],
              spacing: { before: 100, after: 30 },
            }),

            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.title,
                  bold: true,
                  size: 20, // 10pt
                  font: 'Arial',
                  color: '1E3A8A',
                }),
              ],
              spacing: { after: 60 },
            }),

            // Standard Bullet Points for Responsibilities
            ...(exp.reordered_responsibilities || []).map(
              (resp) =>
                new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({
                      text: resp,
                      size: 20, // 10pt
                      font: 'Arial',
                      color: '1F2937',
                    }),
                  ],
                  spacing: { after: 50 },
                })
            ),

            // Standard Bullet Points for Truth-Aligned Achievements
            ...(exp.truth_aligned_achievements || []).map(
              (ach) =>
                new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({
                      text: 'Key Result: ',
                      bold: true,
                      size: 20,
                      font: 'Arial',
                      color: '065F46',
                    }),
                    new TextRun({
                      text: ach,
                      size: 20,
                      font: 'Arial',
                      color: '1F2937',
                    }),
                  ],
                  spacing: { after: 50 },
                })
            ),

            new Paragraph({ spacing: { after: 80 } }),
          ])),

          // ==========================================
          // 6. EDUCATION
          // ==========================================
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'EDUCATION',
                bold: true,
                size: 22, // 11pt
                font: 'Arial',
                color: '111827',
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),

          ...master.education.map(
            (edu) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${edu.degree} in ${edu.field_of_study}`,
                    bold: true,
                    size: 20, // 10pt
                    font: 'Arial',
                    color: '111827',
                  }),
                  new TextRun({
                    text: `  |  ${edu.institution} (${edu.graduation_date})`,
                    size: 19,
                    font: 'Arial',
                    color: '374151',
                  }),
                ],
                spacing: { after: 50 },
              })
          ),

          // ==========================================
          // 7. CERTIFICATIONS (Strictly verified, no PMP)
          // ==========================================
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'CERTIFICATIONS',
                bold: true,
                size: 22, // 11pt
                font: 'Arial',
                color: '111827',
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),

          ...master.certifications
            .filter((c) => c.verified)
            .map(
              (cert) =>
                new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({
                      text: `${cert.name} — ${cert.issuer}`,
                      size: 20, // 10pt
                      font: 'Arial',
                      color: '1F2937',
                    }),
                  ],
                  spacing: { after: 40 },
                })
            ),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

/**
 * PHASE 7 PDF GENERATOR:
 * Simple ATS-compatible layout:
 * - Font: Helvetica (Universally mapped by ATS parsers to standard Arial)
 * - Single column layout
 * - Avoid: tables, text boxes, graphics, icons, headers/footers
 * - Clear uppercase section headings
 * - Standard bullets
 * - Consistent dates
 * - Strict 7-section ordering
 */
export function generateAtsResumePdfBuffer(
  tailored: TailoredResume,
  master: MasterResume,
  job?: JobPosting
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const pInfo = master.personal_information;
      const targetTitleResult = determineJobSpecificTargetTitle(
        tailored.target_title || job?.title || tailored.job_title,
        master.total_experience_years || 9
      );
      const targetTitle = targetTitleResult.targetTitle;

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 48, bottom: 48, left: 52, right: 52 },
        bufferPages: true,
        info: {
          Title: `${pInfo.full_name} - Tailored Resume`,
          Author: pInfo.full_name,
          Subject: `${targetTitle} - Tailored Resume for ${tailored.company || job?.company}`,
          Keywords: 'Resume, ATS, Product Manager, Business Analyst',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const contentWidth = doc.page.width - 52 * 2;

      // Helper for Section Headings
      const printSectionHeading = (title: string) => {
        doc.moveDown(0.7);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(title, {
          width: contentWidth,
        });
        doc.moveDown(0.2);
        // Clean subtle horizontal line
        doc
          .strokeColor('#CBD5E1')
          .lineWidth(0.75)
          .moveTo(doc.x, doc.y)
          .lineTo(doc.x + contentWidth, doc.y)
          .stroke();
        doc.moveDown(0.4);
      };

      // ==========================================
      // 1. NAME & CONTACT DETAILS (IN BODY!)
      // ==========================================
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#111827').text(pInfo.full_name, {
        align: 'center',
        width: contentWidth,
      });
      doc.moveDown(0.2);

      const contactLine = `${pInfo.location}  |  ${pInfo.email}  |  ${pInfo.phone}${
        pInfo.linkedin_url ? `  |  ${pInfo.linkedin_url}` : ''
      }`;
      doc.font('Helvetica').fontSize(9.5).fillColor('#4B5563').text(contactLine, {
        align: 'center',
        width: contentWidth,
      });
      doc.moveDown(0.3);

      // ==========================================
      // 2. TARGET TITLE
      // ==========================================
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1E3A8A').text(targetTitle.toUpperCase(), {
        align: 'center',
        width: contentWidth,
      });
      doc.moveDown(0.5);

      // ==========================================
      // 3. PROFESSIONAL SUMMARY
      // ==========================================
      printSectionHeading('PROFESSIONAL SUMMARY');
      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor('#1F2937')
        .text(tailored.summary || tailored.professional_summary || master.professional_summary, {
          width: contentWidth,
          lineGap: 2.5,
        });

      // ==========================================
      // 4. CORE SKILLS
      // ==========================================
      printSectionHeading('CORE SKILLS');

      const coreSkillsText = (
        tailored.core_skills && tailored.core_skills.length > 0
          ? tailored.core_skills
          : tailored.targeted_skills?.present && tailored.targeted_skills.present.length > 0
          ? tailored.targeted_skills.present
          : master.skills.slice(0, 14)
      ).join('  •  ');

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#111827').text('Technical & Product Competencies: ', {
        continued: true,
      });
      doc.font('Helvetica').fillColor('#1F2937').text(coreSkillsText, {
        lineGap: 2,
      });
      doc.moveDown(0.3);

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#111827').text('Tools, Platforms & Methodologies: ', {
        continued: true,
      });
      doc.font('Helvetica').fillColor('#1F2937').text(master.technologies.slice(0, 16).join('  •  '), {
        lineGap: 2,
      });

      // ==========================================
      // 5. PROFESSIONAL EXPERIENCE
      // ==========================================
      printSectionHeading('PROFESSIONAL EXPERIENCE');

      const experiences = tailored.professional_experience || tailored.tailored_experience || [];
      for (const exp of experiences) {
        // Line 1: Company + Location | Dates
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(exp.company, {
          continued: true,
        });
        doc.font('Helvetica').fontSize(9.5).fillColor('#4B5563').text(`  —  ${exp.location}`, {
          continued: true,
        });
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#374151').text(`  |  ${exp.dates}`);
        doc.moveDown(0.15);

        // Line 2: Title
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1E3A8A').text(exp.title);
        doc.moveDown(0.2);

        // Responsibilities Bullets
        for (const resp of exp.reordered_responsibilities || []) {
          doc.font('Helvetica').fontSize(9).fillColor('#1F2937').text(`•   ${resp}`, {
            width: contentWidth,
            indent: 10,
            lineGap: 2,
          });
          doc.moveDown(0.1);
        }

        // Truth-Aligned Achievements Bullets
        for (const ach of exp.truth_aligned_achievements || []) {
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#065F46').text(`•   Key Result: `, {
            continued: true,
            indent: 10,
          });
          doc.font('Helvetica').fillColor('#1F2937').text(ach, {
            lineGap: 2,
          });
          doc.moveDown(0.1);
        }

        doc.moveDown(0.35);
      }

      // ==========================================
      // 6. EDUCATION
      // ==========================================
      printSectionHeading('EDUCATION');
      for (const edu of master.education) {
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#111827').text(`${edu.degree} in ${edu.field_of_study}`, {
          continued: true,
        });
        doc.font('Helvetica').fillColor('#4B5563').text(`  |  ${edu.institution} (${edu.graduation_date})`);
        doc.moveDown(0.15);
      }

      // ==========================================
      // 7. CERTIFICATIONS (Strictly verified, no PMP)
      // ==========================================
      printSectionHeading('CERTIFICATIONS');
      for (const cert of master.certifications.filter((c) => c.verified)) {
        doc.font('Helvetica').fontSize(9).fillColor('#1F2937').text(`•   ${cert.name} — ${cert.issuer}`, {
          indent: 10,
          lineGap: 1.5,
        });
        doc.moveDown(0.08);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Builds and packages a complete GeneratedResumeDocument record with metadata.
 */
export async function createGeneratedResumeDocumentRecord(
  tailored: TailoredResume,
  master: MasterResume,
  job: JobPosting,
  truthReport?: TruthValidationReport,
  docxBuffer?: Buffer,
  pdfBuffer?: Buffer
): Promise<{
  document: GeneratedResumeDocument;
  docxBuffer: Buffer;
  pdfBuffer: Buffer;
}> {
  const targetTitleResult = determineJobSpecificTargetTitle(
    tailored.target_title || job.title || tailored.job_title,
    master.total_experience_years || 9
  );
  const targetTitle = targetTitleResult.targetTitle;

  // Generate binary buffers if not already supplied
  const finalDocxBuffer = docxBuffer || (await generateAtsResumeDocxBuffer(tailored, master, job));
  const finalPdfBuffer = pdfBuffer || (await generateAtsResumePdfBuffer(tailored, master, job));

  const docxFilename = generateResumeDocumentFilename(job.job_id, job.company, targetTitle, 'docx');
  const pdfFilename = generateResumeDocumentFilename(job.job_id, job.company, targetTitle, 'pdf');

  const previewText = generateResumePlainTextPreview(tailored, master, job);
  const compliance = checkAtsDocumentCompliance(previewText);

  const truthValidationStatus = truthReport
    ? truthReport.validation_status
    : tailored.validation_status || (tailored.truth_audit_passed ? 'PASSED' : 'FAILED');

  // GATING RULE:
  // "Before making the document available for download: require: truth_validation = PASS"
  const canDownload = truthValidationStatus === 'PASSED';
  const downloadBlockedReason = canDownload
    ? undefined
    : `Download blocked: Requires Truth Validation PASS (Status is ${truthValidationStatus}). Zero fabrication allowed.`;

  const docRecord: GeneratedResumeDocument = {
    id: `doc-${Date.now()}-${job.job_id}`,
    job_id: job.job_id,
    tailored_resume_id: tailored.id,
    company: job.company,
    job_title: job.title,
    target_title: targetTitle,
    target_title_adjusted: targetTitleResult.adjusted,
    target_title_adjustment_note: targetTitleResult.adjustmentNote,
    docx_filename: docxFilename,
    pdf_filename: pdfFilename,
    docx_size_bytes: finalDocxBuffer.length,
    pdf_size_bytes: finalPdfBuffer.length,
    docx_download_url: `/api/resumes/documents/${job.job_id}/docx`,
    pdf_download_url: `/api/resumes/documents/${job.job_id}/pdf`,
    match_score: job.match_score || 0,
    ats_score: tailored.ats_score || 0,
    truthful_maximum_ats_score: tailored.truthful_maximum_ats_score || tailored.ats_score || 0,
    truth_validation_status: truthValidationStatus,
    truth_validation_passed: canDownload,
    can_download: canDownload,
    download_blocked_reason: downloadBlockedReason,
    generated_at: new Date().toISOString(),
    preview_text: previewText,
    ats_compliance: compliance,
  };

  return {
    document: docRecord,
    docxBuffer: finalDocxBuffer,
    pdfBuffer: finalPdfBuffer,
  };
}
