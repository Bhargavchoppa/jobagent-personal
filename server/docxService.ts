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
  BorderStyle,
} from 'docx';
import { TailoredResume, MasterResume } from '../src/types';

/**
 * Generates an ATS-friendly, clean DOCX resume document.
 * Follows Phase 7 ATS requirements strictly:
 * - Uses Arial (standard ATS-safe font)
 * - Single-column flow (no tables, no text boxes, no columns, no icons/graphics)
 * - Standard bullet points
 * - Consistent dates and section headings
 * - Header/footer contain NO critical information (candidate info is in the body flow)
 * - Sections: Name, Target Title, Professional Summary, Core Skills, Professional Experience, Education, Certifications
 */
export async function generateResumeDocxBuffer(
  tailored: TailoredResume,
  master: MasterResume
): Promise<Buffer> {
  const pInfo = master.personal_information;
  const FONT_NAME = 'Arial';

  // Target title derivation
  const targetTitle =
    tailored.target_title ||
    tailored.headline ||
    pInfo.header_positioning ||
    tailored.job_title;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch margins
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          // 1. Candidate Full Name
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: pInfo.full_name,
                bold: true,
                size: 32, // 16pt
                font: FONT_NAME,
                color: '0F172A',
              }),
            ],
            spacing: { after: 100 },
          }),

          // Contact Details (Flow text, never inside Word header/footer objects)
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${pInfo.location}  |  ${pInfo.email}  |  ${pInfo.phone}${
                  pInfo.linkedin_url ? `  |  ${pInfo.linkedin_url}` : ''
                }`,
                size: 19, // 9.5pt
                font: FONT_NAME,
                color: '475569',
              }),
            ],
            spacing: { after: 140 },
          }),

          // 2. Target Title (Job-specific)
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: targetTitle,
                bold: true,
                size: 22, // 11pt
                font: FONT_NAME,
                color: '1E3A8A',
              }),
            ],
            spacing: { after: 180 },
          }),

          // Clean Divider Rule
          new Paragraph({
            border: {
              bottom: {
                color: 'CBD5E1',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            spacing: { after: 150 },
          }),

          // 3. Professional Summary Heading
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'PROFESSIONAL SUMMARY',
                bold: true,
                size: 22,
                font: FONT_NAME,
                color: '0F172A',
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),

          // Professional Summary Text
          new Paragraph({
            children: [
              new TextRun({
                text:
                  tailored.professional_summary ||
                  tailored.summary ||
                  master.professional_summary,
                size: 20, // 10pt
                font: FONT_NAME,
                color: '334155',
              }),
            ],
            spacing: { after: 200 },
          }),

          // 4. Core Skills Heading
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'CORE SKILLS & COMPETENCIES',
                bold: true,
                size: 22,
                font: FONT_NAME,
                color: '0F172A',
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),

          // Present Core Skills
          new Paragraph({
            children: [
              new TextRun({
                text: 'Technical & Domain Competencies: ',
                bold: true,
                size: 19,
                font: FONT_NAME,
                color: '0F172A',
              }),
              new TextRun({
                text: (
                  tailored.targeted_skills?.present ||
                  tailored.core_skills ||
                  master.skills ||
                  []
                ).join('  •  '),
                size: 19,
                font: FONT_NAME,
                color: '334155',
              }),
            ],
            spacing: { after: 80 },
          }),

          // Related / Equivalent Capabilities
          ...(tailored.targeted_skills?.related && tailored.targeted_skills.related.length > 0
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Demonstrated Related Capabilities: ',
                      bold: true,
                      size: 19,
                      font: FONT_NAME,
                      color: '0F172A',
                    }),
                    new TextRun({
                      text: tailored.targeted_skills.related.join('  •  '),
                      size: 19,
                      font: FONT_NAME,
                      color: '334155',
                    }),
                  ],
                  spacing: { after: 180 },
                }),
              ]
            : []),

          // 5. Professional Experience Heading
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'PROFESSIONAL EXPERIENCE',
                bold: true,
                size: 22,
                font: FONT_NAME,
                color: '0F172A',
              }),
            ],
            spacing: { before: 160, after: 120 },
          }),

          // Experience Entries (Title, Dates, Company, Location, Responsibilities)
          ...(
            tailored.tailored_experience ||
            tailored.professional_experience ||
            []
          ).flatMap((exp) => [
            // Company & Location | Title & Dates
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.company,
                  bold: true,
                  size: 21,
                  font: FONT_NAME,
                  color: '0F172A',
                }),
                new TextRun({
                  text: `  —  ${exp.location}`,
                  italics: true,
                  size: 19,
                  font: FONT_NAME,
                  color: '64748B',
                }),
              ],
              spacing: { before: 100, after: 30 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.title,
                  bold: true,
                  size: 20,
                  font: FONT_NAME,
                  color: '1E3A8A',
                }),
                new TextRun({
                  text: `  |  ${exp.dates}`,
                  size: 19,
                  font: FONT_NAME,
                  color: '475569',
                }),
              ],
              spacing: { after: 70 },
            }),
            // Responsibilities Bullets
            ...(exp.reordered_responsibilities || []).map(
              (resp) =>
                new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({
                      text: resp,
                      size: 19,
                      font: FONT_NAME,
                      color: '334155',
                    }),
                  ],
                  spacing: { after: 50 },
                })
            ),
            // Verified Key Achievements
            ...(exp.truth_aligned_achievements || []).map(
              (ach) =>
                new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({
                      text: 'Key Result: ',
                      bold: true,
                      size: 19,
                      font: FONT_NAME,
                      color: '047857',
                    }),
                    new TextRun({
                      text: ach,
                      size: 19,
                      font: FONT_NAME,
                      color: '334155',
                    }),
                  ],
                  spacing: { after: 50 },
                })
            ),
            new Paragraph({ spacing: { after: 80 } }),
          ]),

          // 6. Education Heading
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'EDUCATION',
                bold: true,
                size: 22,
                font: FONT_NAME,
                color: '0F172A',
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),

          ...(master.education || []).map(
            (edu) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${edu.degree} in ${edu.field_of_study}`,
                    bold: true,
                    size: 19,
                    font: FONT_NAME,
                    color: '0F172A',
                  }),
                  new TextRun({
                    text: `  |  ${edu.institution} (${edu.graduation_date})`,
                    size: 19,
                    font: FONT_NAME,
                    color: '475569',
                  }),
                ],
                spacing: { after: 50 },
              })
          ),

          // 7. Certifications Heading (Strictly Verified, No Fabricated Credentials)
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'VERIFIED CERTIFICATIONS',
                bold: true,
                size: 22,
                font: FONT_NAME,
                color: '0F172A',
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: (master.certifications || [])
                  .map((c) => `${c.name} (${c.issuer})`)
                  .join('  •  '),
                size: 19,
                font: FONT_NAME,
                color: '334155',
              }),
            ],
            spacing: { after: 180 },
          }),

          // Non-critical footer document compliance stamp
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `[JobAgent Web] ATS-Safe Arial Layout • Zero-Fabrication Audited • Target: ${tailored.job_title} at ${tailored.company} • Match: ${tailored.ats_score}%`,
                italics: true,
                size: 15,
                font: FONT_NAME,
                color: '94A3B8',
              }),
            ],
            spacing: { before: 150 },
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
