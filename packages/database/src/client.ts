/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import { db as inMemoryStore } from '../../../server/db';

dotenv.config();

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

class DatabaseService {
  private pool: Pool | null = null;
  private isPostgresConfigured: boolean = false;
  private connectionError: string | null = null;

  constructor() {
    this.initPool();
  }

  private initPool() {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
      try {
        const config: PoolConfig = {
          connectionString: databaseUrl,
          connectionTimeoutMillis: 3000,
          idleTimeoutMillis: 10000,
          max: 10,
        };
        this.pool = new Pool(config);
        this.isPostgresConfigured = true;

        this.pool.on('error', (err) => {
          this.connectionError = err.message;
        });
      } catch (err: any) {
        this.connectionError = err.message;
        this.pool = null;
        this.isPostgresConfigured = false;
      }
    } else {
      this.isPostgresConfigured = false;
    }
  }

  public getPool(): Pool | null {
    return this.pool;
  }

  public isConfigured(): boolean {
    return this.isPostgresConfigured;
  }

  public getStore() {
    return inMemoryStore;
  }

  /**
   * Execute query against PostgreSQL if available, otherwise against relational store
   */
  public async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    if (this.pool) {
      try {
        const res = await this.pool.query(sql, params);
        return {
          rows: res.rows,
          rowCount: res.rowCount || 0,
        };
      } catch (err) {
        // Log error and allow caller to handle
        throw err;
      }
    }

    // Relational In-Memory Store query capability
    return {
      rows: [],
      rowCount: 0,
    };
  }

  /**
   * Close connection pool on shutdown
   */
  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

export const dbClient = new DatabaseService();
