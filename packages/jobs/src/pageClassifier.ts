/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PageClassification, AtsPlatform } from './types';
import { normalizeJobUrl } from './urlNormalizer';

export interface PageClassificationResult {
  url: string;
  classification: PageClassification;
  platform: AtsPlatform;
  isLikelyJobPage: boolean;
  rejectReason?: string;
  rankScore: number; // 0 (rejected) to 100 (highest priority single job posting)
}

/**
 * Detect ATS platform from URL hostname and path structure
 */
export function detectAtsPlatform(rawUrl: string): AtsPlatform {
  const norm = normalizeJobUrl(rawUrl);
  const host = norm.hostname;
  const path = norm.pathname;

  if (host.includes('greenhouse.io') || host.includes('gh_jid')) return 'Greenhouse';
  if (host.includes('lever.co')) return 'Lever';
  if (host.includes('myworkdayjobs.com') || host.includes('workday.com')) return 'Workday';
  if (host.includes('ashbyhq.com')) return 'Ashby';
  if (host.includes('smartrecruiters.com')) return 'SmartRecruiters';
  if (host.includes('taleo.net') || (host.includes('oraclecloud.com') && path.includes('careersection'))) return 'Taleo';
  if (host.includes('builtin.com')) return 'BuiltIn';
  if (host.includes('linkedin.com')) return 'LinkedIn';

  return 'Direct Career Portal';
}

/**
 * Classifies a URL and its optional HTML/content signature
 */
export function classifyJobUrl(
  rawUrl: string,
  contentSnippet?: string,
  statusCode?: number
): PageClassificationResult {
  const norm = normalizeJobUrl(rawUrl);
  if (!norm.isValid) {
    return {
      url: rawUrl,
      classification: 'ERROR_PAGE',
      platform: 'Direct Career Portal',
      isLikelyJobPage: false,
      rejectReason: 'Invalid URL structure',
      rankScore: 0,
    };
  }

  const platform = detectAtsPlatform(rawUrl);
  const path = norm.pathname.toLowerCase();
  const search = norm.normalized.toLowerCase();

  // 1. Check HTTP Status Code or Error Snippet
  if (statusCode && (statusCode >= 400 || statusCode === 0)) {
    return {
      url: norm.normalized,
      classification: 'ERROR_PAGE',
      platform,
      isLikelyJobPage: false,
      rejectReason: `HTTP Status ${statusCode}`,
      rankScore: 0,
    };
  }

  if (contentSnippet) {
    const text = contentSnippet.toLowerCase();
    if (
      text.includes('404 not found') ||
      text.includes('page not found') ||
      text.includes('job is no longer available') ||
      text.includes('position has been filled') ||
      text.includes('expired job')
    ) {
      return {
        url: norm.normalized,
        classification: 'ERROR_PAGE',
        platform,
        isLikelyJobPage: false,
        rejectReason: 'Expired or deleted job page content detected',
        rankScore: 0,
      };
    }
  }

  // 2. Reject Obvious Search Pages
  const searchIndicators = [
    '/search',
    'search_query',
    'q=',
    'query=',
    'keywords=',
    '/find-jobs',
    '/career-search',
    '/job-search',
    'filter=',
    '/browse',
    '/all-jobs',
    '/job-alerts',
    '/rss',
    '/feed',
  ];
  for (const ind of searchIndicators) {
    if (search.includes(ind) && !path.includes('/jobs/') && !path.includes('/job/')) {
      return {
        url: norm.normalized,
        classification: 'SEARCH_PAGE',
        platform,
        isLikelyJobPage: false,
        rejectReason: `Search query URL detected: pattern '${ind}'`,
        rankScore: 0,
      };
    }
  }

  // 3. Reject Obvious Multi-job Listing / Directory Pages
  const listingIndicators = [
    '/categories/',
    '/departments/',
    '/locations/',
    '/teams/',
    '/careers/departments',
    '/open-positions',
    '/openings',
    '/join-us',
    '/work-with-us',
  ];
  for (const ind of listingIndicators) {
    const cleanInd = ind.replace(/\/$/, '');
    if (path.includes(ind) || path.endsWith(cleanInd)) {
      if (!path.includes('/job/') && !path.match(/\/jobs\/\d+/)) {
        return {
          url: norm.normalized,
          classification: 'LISTING_PAGE',
          platform,
          isLikelyJobPage: false,
          rejectReason: `Listing/category directory detected: pattern '${ind}'`,
          rankScore: 5,
        };
      }
    }
  }

  // Root or generic company page
  if (path === '' || path === '/' || path === '/careers' || path === '/about' || path === '/about-us') {
    return {
      url: norm.normalized,
      classification: 'COMPANY_PAGE',
      platform,
      isLikelyJobPage: false,
      rejectReason: 'Root company page or generic careers landing',
      rankScore: 2,
    };
  }

  // 4. Verify Individual Job Posting Patterns by ATS Platform
  let isIndividualJob = false;
  let rankScore = 50;

  switch (platform) {
    case 'Greenhouse':
      // Greenhouse individual jobs: /jobs/123456 or gh_jid=123456
      if (path.match(/\/jobs\/\d+/) || search.includes('gh_jid=')) {
        isIndividualJob = true;
        rankScore = 95;
      } else if (path.includes('/jobs/')) {
        isIndividualJob = true;
        rankScore = 85;
      }
      break;

    case 'Lever':
      // Lever individual jobs: /jobs.lever.co/<company>/<uuid-or-slug>
      if (path.split('/').filter(Boolean).length >= 2) {
        isIndividualJob = true;
        rankScore = 95;
      }
      break;

    case 'Workday':
      // Workday individual jobs: /job/... or /job/.../<Title_ReqId>
      if (path.includes('/job/') || path.includes('/en-us/job/')) {
        isIndividualJob = true;
        rankScore = 95;
      }
      break;

    case 'Ashby':
      // Ashby individual jobs: /company/<uuid-or-id>
      if (path.split('/').filter(Boolean).length >= 2) {
        isIndividualJob = true;
        rankScore = 95;
      }
      break;

    case 'SmartRecruiters':
      // SmartRecruiters individual jobs: /company/<id> or /jobs/<id>
      if (path.split('/').filter(Boolean).length >= 2 && !path.includes('/search')) {
        isIndividualJob = true;
        rankScore = 95;
      }
      break;

    case 'Taleo':
      // Taleo individual jobs: jobdetail.ftl?job=<id>
      if (search.includes('job=') || path.includes('/job/')) {
        isIndividualJob = true;
        rankScore = 90;
      }
      break;

    case 'BuiltIn':
      if (path.includes('/job/') || path.includes('/jobs/')) {
        isIndividualJob = true;
        rankScore = 85;
      }
      break;

    case 'LinkedIn':
      if (path.includes('/jobs/view/')) {
        isIndividualJob = true;
        rankScore = 90;
      }
      break;

    default:
      // Direct Career Portal heuristics
      if (
        path.match(/\/job\/[a-z0-9-_]+/i) ||
        path.match(/\/jobs\/[a-z0-9-_]+/i) ||
        path.match(/\/position\/[a-z0-9-_]+/i) ||
        path.match(/\/posting\/[a-z0-9-_]+/i) ||
        path.match(/\/careers\/[a-z0-9-_]+\/[a-z0-9-_]+/i) ||
        path.match(/\/view\/[a-z0-9-_]+/i) ||
        path.match(/\/remote-jobs\/[a-z0-9-_]+/i) ||
        path.match(/\/jobs\/companies\/[a-z0-9-_]+/i) ||
        norm.hostname.includes('arbeitnow.com') ||
        norm.hostname.includes('remotive.com') ||
        norm.hostname.includes('jobicy.com')
      ) {
        isIndividualJob = true;
        rankScore = 80;
      } else if (norm.jobIdHint) {
        isIndividualJob = true;
        rankScore = 75;
      }
      break;
  }

  // Content snippet validation (if provided)
  if (contentSnippet) {
    const text = contentSnippet.toLowerCase();
    const hasJobPostingSchema = text.includes('"@type": "jobposting"') || text.includes('"@type":"jobposting"');
    const hasApplyButton = text.includes('apply for this job') || text.includes('apply now') || text.includes('submit application');
    const hasJobSections = text.includes('responsibilities') || text.includes('requirements') || text.includes('qualifications');

    if (hasJobPostingSchema) {
      isIndividualJob = true;
      rankScore = 100;
    } else if (hasApplyButton && hasJobSections) {
      isIndividualJob = true;
      rankScore = Math.max(rankScore, 90);
    }
  }

  if (isIndividualJob) {
    return {
      url: norm.normalized,
      classification: 'INDIVIDUAL_JOB',
      platform,
      isLikelyJobPage: true,
      rankScore,
    };
  }

  return {
    url: norm.normalized,
    classification: 'UNKNOWN',
    platform,
    isLikelyJobPage: false,
    rejectReason: 'Could not confirm individual job detail structure',
    rankScore: 20,
  };
}
