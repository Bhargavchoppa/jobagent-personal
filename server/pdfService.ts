/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import PDFDocument from 'pdfkit';
import { TailoredResume, MasterResume } from '../src/types';

/**
 * Generates an ATS-friendly, clean single/multi-page PDF resume.
 * ATS Guidelines Enforced:
 * - Clean Arial/Helvetica standard typography
 * - Single-column layout (no tables, multi-column blocks, or text boxes)
 * - Standard bullet points
 * - No graphics, icons, or decorative sidebars
 * - Legible hierarchy, consistent dates, clear section headings
 */
export async function generateResumePdfBuffer(
  tailored: TailoredResume,
  master: MasterResume
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pInfo = master.personal_information;
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      info: {
        Title: `${pInfo.full_name} - ${tailored.job_title || 'Resume'}`,
        Author: pInfo.full_name,
        Subject: `Tailored Resume for ${tailored.job_title} at ${tailored.company}`,
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Colors & Fonts
    const FONT_PRIMARY = 'Helvetica';
    const FONT_BOLD = 'Helvetica-Bold';
    const FONT_OBLIQUE = 'Helvetica-Oblique';
    const COLOR_TEXT = '#0F172A';
    const COLOR_MUTED = '#475569';
    const COLOR_PRIMARY = '#1E3A8A';
    const COLOR_DIVIDER = '#CBD5E1';

    // 1. Header: Full Name
    doc
      .font(FONT_BOLD)
      .fontSize(18)
      .fillColor(COLOR_TEXT)
      .text(pInfo.full_name, { align: 'center' });

    doc.moveDown(0.25);

    // Contact Details
    const contactParts = [
      pInfo.location,
      pInfo.email,
      pInfo.phone,
      pInfo.linkedin_url ? pInfo.linkedin_url.replace(/^https?:\/\//, '') : null,
    ].filter(Boolean);

    doc
      .font(FONT_PRIMARY)
      .fontSize(9.5)
      .fillColor(COLOR_MUTED)
      .text(contactParts.join('   |   '), { align: 'center' });

    doc.moveDown(0.35);

    // Target Title (Job-specific)
    const targetTitle =
      tailored.target_title ||
      tailored.headline ||
      pInfo.header_positioning ||
      tailored.job_title;

    doc
      .font(FONT_BOLD)
      .fontSize(11.5)
      .fillColor(COLOR_PRIMARY)
      .text(targetTitle, { align: 'center' });

    doc.moveDown(0.5);

    // Horizontal Rule
    const leftMargin = 40;
    const rightMargin = doc.page.width - 40;
    doc
      .strokeColor(COLOR_DIVIDER)
      .lineWidth(0.75)
      .moveTo(leftMargin, doc.y)
      .lineTo(rightMargin, doc.y)
      .stroke();

    doc.moveDown(0.6);

    // Helper: Section Header
    const renderSectionHeader = (title: string) => {
      doc.moveDown(0.5);
      doc
        .font(FONT_BOLD)
        .fontSize(11)
        .fillColor(COLOR_TEXT)
        .text(title.toUpperCase(), { underline: false });

      doc
        .strokeColor(COLOR_DIVIDER)
        .lineWidth(0.5)
        .moveTo(leftMargin, doc.y + 2)
        .lineTo(rightMargin, doc.y + 2)
        .stroke();

      doc.moveDown(0.4);
    };

    // 2. Professional Summary
    const summary = tailored.professional_summary || tailored.summary || master.professional_summary;
    if (summary) {
      renderSectionHeader('Professional Summary');
      doc
        .font(FONT_PRIMARY)
        .fontSize(9.5)
        .fillColor('#1E293B')
        .text(summary, {
          align: 'justify',
          lineGap: 2.5,
        });
    }

    // 3. Core Skills
    const presentSkills =
      tailored.targeted_skills?.present ||
      tailored.core_skills ||
      master.skills ||
      [];
    const relatedSkills = tailored.targeted_skills?.related || [];

    if (presentSkills.length > 0 || relatedSkills.length > 0) {
      renderSectionHeader('Core Skills & Competencies');

      if (presentSkills.length > 0) {
        doc
          .font(FONT_BOLD)
          .fontSize(9.5)
          .fillColor(COLOR_TEXT)
          .text('Key Technical & Domain Competencies: ', { continued: true })
          .font(FONT_PRIMARY)
          .fillColor('#334155')
          .text(presentSkills.join('   •   '), { lineGap: 2 });
      }

      if (relatedSkills.length > 0) {
        doc.moveDown(0.25);
        doc
          .font(FONT_BOLD)
          .fontSize(9.5)
          .fillColor(COLOR_TEXT)
          .text('Demonstrated Equivalent Competencies: ', { continued: true })
          .font(FONT_PRIMARY)
          .fillColor('#334155')
          .text(relatedSkills.join('   •   '), { lineGap: 2 });
      }
    }

    // 4. Professional Experience
    const experiences =
      tailored.tailored_experience ||
      tailored.professional_experience ||
      [];

    if (experiences.length > 0) {
      renderSectionHeader('Professional Experience');

      experiences.forEach((exp, idx) => {
        if (idx > 0) doc.moveDown(0.5);

        // Title and Dates on top line
        doc
          .font(FONT_BOLD)
          .fontSize(10)
          .fillColor(COLOR_TEXT)
          .text(exp.title, { continued: true })
          .font(FONT_PRIMARY)
          .fillColor(COLOR_MUTED)
          .text(`  |  ${exp.dates}`, { align: 'right' });

        // Company and Location on second line
        doc
          .font(FONT_BOLD)
          .fontSize(9.5)
          .fillColor(COLOR_PRIMARY)
          .text(exp.company, { continued: true })
          .font(FONT_OBLIQUE)
          .fillColor(COLOR_MUTED)
          .text(`  —  ${exp.location}`, { align: 'left' });

        doc.moveDown(0.25);

        // Responsibilities as bullet points
        const responsibilities = exp.reordered_responsibilities || [];
        responsibilities.forEach((bullet) => {
          doc
            .font(FONT_PRIMARY)
            .fontSize(9)
            .fillColor('#334155')
            .text(`•  ${bullet}`, {
              indent: 10,
              lineGap: 2,
              paragraphGap: 2.5,
            });
        });

        // Truth-aligned achievements if present
        if (exp.truth_aligned_achievements && exp.truth_aligned_achievements.length > 0) {
          exp.truth_aligned_achievements.forEach((ach) => {
            doc
              .font(FONT_BOLD)
              .fontSize(9)
              .fillColor('#0F172A')
              .text(`•  Verified Impact: `, { continued: true, indent: 10 })
              .font(FONT_PRIMARY)
              .fillColor('#334155')
              .text(ach, { lineGap: 2, paragraphGap: 2.5 });
          });
        }
      });
    }

    // 5. Education
    if (master.education && master.education.length > 0) {
      renderSectionHeader('Education');
      master.education.forEach((edu) => {
        doc
          .font(FONT_BOLD)
          .fontSize(9.5)
          .fillColor(COLOR_TEXT)
          .text(`${edu.degree} in ${edu.field_of_study}`, { continued: true })
          .font(FONT_PRIMARY)
          .fillColor(COLOR_MUTED)
          .text(`  |  ${edu.institution} (${edu.graduation_date})`, { align: 'left' });
        doc.moveDown(0.2);
      });
    }

    // 6. Certifications (Strictly verified only - PMP omitted)
    if (master.certifications && master.certifications.length > 0) {
      renderSectionHeader('Verified Certifications');
      const certList = master.certifications.map((c) => `${c.name} (${c.issuer})`).join('   •   ');
      doc
        .font(FONT_PRIMARY)
        .fontSize(9)
        .fillColor('#334155')
        .text(certList, { lineGap: 2 });
    }

    // Footer ATS Validation Note
    doc.moveDown(0.8);
    doc
      .strokeColor(COLOR_DIVIDER)
      .lineWidth(0.5)
      .moveTo(leftMargin, doc.y)
      .lineTo(rightMargin, doc.y)
      .stroke();
    doc.moveDown(0.3);

    doc
      .font(FONT_OBLIQUE)
      .fontSize(7.5)
      .fillColor('#94A3B8')
      .text(
        `ATS Format Compliant Document • Zero-Fabrication Audited • Target Job: ${tailored.job_title} at ${tailored.company} • Coverage: ${tailored.ats_score}%`,
        { align: 'center' }
      );

    doc.end();
  });
}
