/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'gh_src',
  'gh_jid',
  'source',
  'fbclid',
  'gclid',
  'trk',
  'trackingid',
  'li_fat_id',
  'mc_cid',
  'mc_eid',
  'spjobid',
  'rb',
  'lever-source',
  'mode',
  'iis',
  'iisn',
  'sid',
  '_ga',
  '_gl',
]);

export interface NormalizedUrlResult {
  original: string;
  normalized: string;
  hostname: string;
  pathname: string;
  jobIdHint?: string;
  isValid: boolean;
}

/**
 * Normalizes job URLs by removing tracking tags and standardizing format
 */
export function normalizeJobUrl(rawUrl: string): NormalizedUrlResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      original: rawUrl || '',
      normalized: '',
      hostname: '',
      pathname: '',
      isValid: false,
    };
  }

  try {
    let cleanUrl = rawUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const parsed = new URL(cleanUrl);
    // Force HTTPS for consistency
    parsed.protocol = 'https:';
    // Lowercase hostname
    parsed.hostname = parsed.hostname.toLowerCase();

    // Strip tracking query params
    const keysToDelete: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
        keysToDelete.push(key);
      }
    });
    for (const key of keysToDelete) {
      parsed.searchParams.delete(key);
    }

    // Standardize pathname (remove redundant trailing slash)
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    // Extract Job ID Hint if embedded in URL path
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    let jobIdHint: string | undefined;

    // Greenhouse: /jobs/1234567 or /job/1234567
    // Lever: /jobs/intuit/abc-123-xyz
    // Workday: /job/Location/Title_R12345
    // Ashby: /company/jobId
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) {
        jobIdHint = part;
        break;
      }
      if (/^\d{5,10}$/.test(part)) {
        jobIdHint = part;
        break;
      }
      if (/^R\d{5,10}$/i.test(part)) {
        jobIdHint = part;
        break;
      }
    }
    if (!jobIdHint && pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.length > 3 && !['apply', 'job', 'jobs', 'careers'].includes(lastPart)) {
        jobIdHint = lastPart;
      }
    }

    // Reconstruct canonical URL (sorted search params for deterministic hashing)
    parsed.searchParams.sort();
    const normalized = parsed.toString();

    return {
      original: rawUrl,
      normalized,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      jobIdHint,
      isValid: true,
    };
  } catch {
    return {
      original: rawUrl,
      normalized: rawUrl,
      hostname: '',
      pathname: '',
      isValid: false,
    };
  }
}

/**
 * Generates deduplication fingerprints for job postings
 */
export function generateDedupeKeys(params: {
  company: string;
  title: string;
  location?: string;
  canonicalUrl?: string;
  applicationUrl?: string;
  jobId?: string;
}): {
  canonicalUrlKey?: string;
  applicationUrlKey?: string;
  jobIdKey?: string;
  companyTitleLocationKey: string;
  companyTitleKey: string;
} {
  const norm = (s?: string) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();

  const c = norm(params.company);
  const t = norm(params.title);
  const l = norm(params.location);

  return {
    canonicalUrlKey: params.canonicalUrl ? normalizeJobUrl(params.canonicalUrl).normalized : undefined,
    applicationUrlKey: params.applicationUrl ? normalizeJobUrl(params.applicationUrl).normalized : undefined,
    jobIdKey: params.jobId ? params.jobId.trim() : undefined,
    companyTitleLocationKey: `${c}:::${t}:::${l}`,
    companyTitleKey: `${c}:::${t}`,
  };
}
