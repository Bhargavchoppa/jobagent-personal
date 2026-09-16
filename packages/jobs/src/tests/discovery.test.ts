/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeJobUrl, generateDedupeKeys } from '../urlNormalizer';
import { detectAtsPlatform, classifyJobUrl } from '../pageClassifier';
import { validatePostingDate, parseRelativeDateText } from '../dateValidator';
import { JobDeduplicator } from '../deduplicator';
import { ConcurrencyEngine } from '../concurrencyEngine';
import { JobDiscoveryEngine } from '../discoveryEngine';

export function runJobDiscoveryTests(): {
  total: number;
  passed: number;
  failed: number;
  results: Array<{ test: string; passed: boolean; message?: string }>;
} {
  const testResults: Array<{ test: string; passed: boolean; message?: string }> = [];

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      testResults.push({ test: name, passed: true });
    } else {
      testResults.push({ test: name, passed: false, message: message || 'Assertion failed' });
    }
  }

  // -------------------------------------------------------------
  // Test 1: URL Normalization
  // -------------------------------------------------------------
  const rawUrl1 = 'https://boards.greenhouse.io/appliedmaterials/jobs/5283921/?utm_source=linkedin&ref=job_board&gh_src=custom';
  const norm1 = normalizeJobUrl(rawUrl1);
  assert(
    'URL Normalization strips utm and ref tracking parameters',
    !norm1.normalized.includes('utm_source') && !norm1.normalized.includes('ref=') && norm1.normalized.includes('jobs/5283921')
  );
  assert(
    'URL Normalization correctly extracts jobIdHint',
    norm1.jobIdHint === '5283921'
  );

  // -------------------------------------------------------------
  // Test 2: ATS Platform Recognition
  // -------------------------------------------------------------
  assert('Detects Greenhouse platform', detectAtsPlatform('https://boards.greenhouse.io/company/jobs/123') === 'Greenhouse');
  assert('Detects Lever platform', detectAtsPlatform('https://jobs.lever.co/company/abc-123') === 'Lever');
  assert('Detects Workday platform', detectAtsPlatform('https://cvs.wd1.myworkdayjobs.com/careers/job/123') === 'Workday');
  assert('Detects Ashby platform', detectAtsPlatform('https://jobs.ashbyhq.com/company/abc-123') === 'Ashby');
  assert('Detects SmartRecruiters platform', detectAtsPlatform('https://smartrecruiters.com/company/123') === 'SmartRecruiters');
  assert('Detects Taleo platform', detectAtsPlatform('https://company.taleo.net/careersection/jobdetail.ftl?job=123') === 'Taleo');

  // -------------------------------------------------------------
  // Test 3: Page Classification & Search/Listing Rejection
  // -------------------------------------------------------------
  const searchUrlClass = classifyJobUrl('https://indeed.com/jobs?q=Product+Manager&l=Bangalore');
  assert('Rejects obvious search pages', searchUrlClass.classification === 'SEARCH_PAGE' && !searchUrlClass.isLikelyJobPage);

  const listingUrlClass = classifyJobUrl('https://boards.greenhouse.io/company/departments/engineering');
  assert('Rejects directory / listing pages', listingUrlClass.classification === 'LISTING_PAGE' && !listingUrlClass.isLikelyJobPage);

  const singleJobClass = classifyJobUrl('https://boards.greenhouse.io/company/jobs/984721');
  assert('Identifies individual job pages', singleJobClass.classification === 'INDIVIDUAL_JOB' && singleJobClass.isLikelyJobPage);

  // -------------------------------------------------------------
  // Test 4: Date Validation (Zero-Trust Rules)
  // -------------------------------------------------------------
  const jsonLdResult = validatePostingDate({ jsonLdDate: '2026-09-08T10:00:00Z' });
  assert('Prioritizes verified JSON-LD datePosted', jsonLdResult.posted_date_source === 'json-ld' && jsonLdResult.posted_date_verified);

  const genericTimeOnlyResult = validatePostingDate({ genericTimeTag: '<time datetime="2026-01-01">1 yr ago</time>' });
  assert(
    'Rejects generic time elements per zero-trust policy',
    genericTimeOnlyResult.posted_date_source === 'unverified' && genericTimeOnlyResult.notes?.includes('Zero-Trust')
  );

  const relativeResult = validatePostingDate({ relativeText: '3 days ago' });
  assert('Correctly parses relative posted text', relativeResult.posted_date_source === 'explicit-text' && relativeResult.age_days >= 2);

  // -------------------------------------------------------------
  // Test 5: Deduplication (5-Tier Fingerprinting)
  // -------------------------------------------------------------
  const dedupe = new JobDeduplicator();
  dedupe.registerJob({
    company: 'Intuit',
    title: 'Staff Technical Business Analyst',
    location: 'Mountain View, CA',
    source_url: 'https://jobs.lever.co/intuit/tba-1',
    application_url: 'https://jobs.lever.co/intuit/tba-1/apply',
    job_id: 'tba-1',
  });

  const dupByUrl = dedupe.checkDuplicate({ source_url: 'https://jobs.lever.co/intuit/tba-1?utm_source=test' });
  assert('Detects duplicate by canonical URL', dupByUrl.isDuplicate && dupByUrl.matchedBy === 'canonical_url');

  const dupByTitle = dedupe.checkDuplicate({
    company: 'Intuit',
    title: 'Staff Technical Business Analyst',
    location: 'Remote, USA',
  });
  assert('Detects duplicate by normalized Company + Title', dupByTitle.isDuplicate && dupByTitle.matchedBy === 'normalized_company_title');

  const newUnique = dedupe.checkDuplicate({
    company: 'Intuit',
    title: 'Senior Product Manager',
    location: 'Mountain View, CA',
  });
  assert('Allows genuine distinct role from same company', !newUnique.isDuplicate);

  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;

  return {
    total: testResults.length,
    passed,
    failed,
    results: testResults,
  };
}
