/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateDedupeKeys, normalizeJobUrl } from './urlNormalizer';
import { JobPostingData } from './types';

export interface DeduplicationResult<T extends Partial<JobPostingData>> {
  unique: T[];
  duplicatesCount: number;
  duplicateReasons: Array<{
    title: string;
    company: string;
    matchedBy: 'canonical_url' | 'application_url' | 'job_id' | 'company_title_location' | 'normalized_company_title';
    existingMatch: string;
  }>;
}

export class JobDeduplicator {
  private seenCanonicalUrls = new Set<string>();
  private seenApplicationUrls = new Set<string>();
  private seenJobIds = new Set<string>();
  private seenCompanyTitleLocations = new Set<string>();
  private seenCompanyTitles = new Set<string>();

  constructor(existingJobs: Array<{
    source_url?: string;
    application_url?: string;
    job_id?: string;
    company?: string;
    title?: string;
    location?: string;
  }> = []) {
    for (const job of existingJobs) {
      this.registerJob(job);
    }
  }

  public registerJob(job: {
    source_url?: string;
    application_url?: string;
    job_id?: string;
    company?: string;
    title?: string;
    location?: string;
  }): void {
    const keys = generateDedupeKeys({
      company: job.company || '',
      title: job.title || '',
      location: job.location,
      canonicalUrl: job.source_url,
      applicationUrl: job.application_url,
      jobId: job.job_id,
    });

    if (keys.canonicalUrlKey) this.seenCanonicalUrls.add(keys.canonicalUrlKey);
    if (keys.applicationUrlKey) this.seenApplicationUrls.add(keys.applicationUrlKey);
    if (keys.jobIdKey) this.seenJobIds.add(keys.jobIdKey);
    if (keys.companyTitleLocationKey) this.seenCompanyTitleLocations.add(keys.companyTitleLocationKey);
    if (keys.companyTitleKey) this.seenCompanyTitles.add(keys.companyTitleKey);
  }

  public checkDuplicate(job: {
    source_url?: string;
    application_url?: string;
    job_id?: string;
    company?: string;
    title?: string;
    location?: string;
  }): { isDuplicate: boolean; matchedBy?: 'canonical_url' | 'application_url' | 'job_id' | 'company_title_location' | 'normalized_company_title' } {
    const keys = generateDedupeKeys({
      company: job.company || '',
      title: job.title || '',
      location: job.location,
      canonicalUrl: job.source_url,
      applicationUrl: job.application_url,
      jobId: job.job_id,
    });

    // 1. Canonical URL
    if (keys.canonicalUrlKey && this.seenCanonicalUrls.has(keys.canonicalUrlKey)) {
      return { isDuplicate: true, matchedBy: 'canonical_url' };
    }

    // 2. Application URL
    if (keys.applicationUrlKey && this.seenApplicationUrls.has(keys.applicationUrlKey)) {
      return { isDuplicate: true, matchedBy: 'application_url' };
    }

    // 3. Job ID
    if (keys.jobIdKey && this.seenJobIds.has(keys.jobIdKey)) {
      return { isDuplicate: true, matchedBy: 'job_id' };
    }

    // 4. Normalized Company / Title / Location
    if (keys.companyTitleLocationKey && this.seenCompanyTitleLocations.has(keys.companyTitleLocationKey)) {
      return { isDuplicate: true, matchedBy: 'company_title_location' };
    }

    // 5. Normalized Company / Title
    if (keys.companyTitleKey && this.seenCompanyTitles.has(keys.companyTitleKey)) {
      return { isDuplicate: true, matchedBy: 'normalized_company_title' };
    }

    return { isDuplicate: false };
  }

  public deduplicateBatch<T extends Partial<JobPostingData> & { job_id?: string }>(jobs: T[]): DeduplicationResult<T> {
    const unique: T[] = [];
    const duplicateReasons: DeduplicationResult<T>['duplicateReasons'] = [];

    for (const job of jobs) {
      const check = this.checkDuplicate({
        company: job.company,
        title: job.title,
        location: job.location,
        source_url: job.source_url,
        application_url: job.application_url,
        job_id: job.job_id,
      });

      if (check.isDuplicate) {
        duplicateReasons.push({
          title: job.title || 'Untitled',
          company: job.company || 'Unknown',
          matchedBy: check.matchedBy!,
          existingMatch: `${job.company} - ${job.title}`,
        });
      } else {
        this.registerJob({
          company: job.company,
          title: job.title,
          location: job.location,
          source_url: job.source_url,
          application_url: job.application_url,
          job_id: job.job_id,
        });
        unique.push(job);
      }
    }

    return {
      unique,
      duplicatesCount: duplicateReasons.length,
      duplicateReasons,
    };
  }
}
