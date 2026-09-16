/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DateValidationResult {
  posted_date: string;
  posted_date_verified: boolean;
  posted_date_source: 'json-ld' | 'meta' | 'explicit-text' | 'unverified';
  age_days: number;
  age_status: 'fresh' | 'active' | 'stale';
  raw_detected?: string;
  notes?: string;
}

/**
 * Parses relative text such as "3 days ago", "just posted", "posted 1 week ago"
 */
export function parseRelativeDateText(text: string, referenceDate: Date = new Date()): Date | null {
  if (!text) return null;
  const t = text.toLowerCase().trim();

  if (t.includes('just posted') || t.includes('today') || t.includes('hours ago') || t.includes('minutes ago')) {
    return new Date(referenceDate.getTime());
  }

  if (t.includes('yesterday') || t.includes('1 day ago')) {
    return new Date(referenceDate.getTime() - 86400000);
  }

  const daysMatch = t.match(/(\d+)\s+days?\s+ago/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    return new Date(referenceDate.getTime() - days * 86400000);
  }

  const weeksMatch = t.match(/(\d+)\s+weeks?\s+ago/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1], 10);
    return new Date(referenceDate.getTime() - weeks * 7 * 86400000);
  }

  const monthsMatch = t.match(/(\d+)\s+months?\s+ago/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1], 10);
    return new Date(referenceDate.getTime() - months * 30 * 86400000);
  }

  return null;
}

/**
 * Validates and extracts posting date using high-confidence sources:
 * Priority:
 * 1. JSON-LD JobPosting schema (datePosted)
 * 2. High-confidence meta tags (article:published_time, etc.)
 * 3. Explicit posted text ("Posted: YYYY-MM-DD")
 * 4. Relative posted text ("X days ago")
 *
 * NOTE: Generic <time> elements are strictly NOT trusted unless verified by schema.
 */
export function validatePostingDate(input: {
  jsonLdDate?: string;
  metaDate?: string;
  explicitText?: string;
  relativeText?: string;
  genericTimeTag?: string; // Strictly rejected or flagged as unverified
}): DateValidationResult {
  const now = new Date();
  let selectedDate: Date | null = null;
  let source: 'json-ld' | 'meta' | 'explicit-text' | 'unverified' = 'unverified';
  let rawDetected: string | undefined;

  // 1. JSON-LD datePosted (Highest Confidence)
  if (input.jsonLdDate) {
    const d = new Date(input.jsonLdDate);
    if (!isNaN(d.getTime())) {
      selectedDate = d;
      source = 'json-ld';
      rawDetected = input.jsonLdDate;
    }
  }

  // 2. Meta Tags (High Confidence)
  if (!selectedDate && input.metaDate) {
    const d = new Date(input.metaDate);
    if (!isNaN(d.getTime())) {
      selectedDate = d;
      source = 'meta';
      rawDetected = input.metaDate;
    }
  }

  // 3. Explicit Posted Text (Medium-High Confidence)
  if (!selectedDate && input.explicitText) {
    // E.g. "Posted: March 5, 2026" or "Date Posted: 2026-03-01"
    const cleaned = input.explicitText.replace(/posted\s*:\s*/i, '').replace(/date\s*posted\s*:\s*/i, '').trim();
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      selectedDate = d;
      source = 'explicit-text';
      rawDetected = input.explicitText;
    }
  }

  // 4. Relative Text (e.g. "3 days ago")
  if (!selectedDate && input.relativeText) {
    const relDate = parseRelativeDateText(input.relativeText, now);
    if (relDate && !isNaN(relDate.getTime())) {
      selectedDate = relDate;
      source = 'explicit-text';
      rawDetected = input.relativeText;
    }
  }

  // Fallback if only generic <time> tag exists
  let notes: string | undefined;
  if (!selectedDate) {
    if (input.genericTimeTag) {
      notes = 'Generic <time> tag detected but rejected per Zero-Trust date validation rules.';
    }
    // Set fallback to recent date (3 days ago) but marked as unverified
    selectedDate = new Date(now.getTime() - 3 * 86400000);
    source = 'unverified';
  }

  // Cap future dates if server clock is slightly off
  if (selectedDate.getTime() > now.getTime()) {
    selectedDate = new Date(now.getTime());
  }

  const diffMs = now.getTime() - selectedDate.getTime();
  const age_days = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));

  let age_status: 'fresh' | 'active' | 'stale' = 'fresh';
  if (age_days > 30) {
    age_status = 'stale';
  } else if (age_days > 14) {
    age_status = 'active';
  }

  return {
    posted_date: selectedDate.toISOString().split('T')[0],
    posted_date_verified: source !== 'unverified',
    posted_date_source: source,
    age_days,
    age_status,
    raw_detected: rawDetected,
    notes,
  };
}
