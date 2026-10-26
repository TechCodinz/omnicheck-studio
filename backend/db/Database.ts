import path from 'path';
import { Pool } from 'pg';

/**
 * Data layer - one async facade over two storage modes.
 *
 * Production (DATABASE_URL set): Neon Postgres. Accounts, templates,
 * invoices and verification records live in durable hosted storage,
 * because the previous setup kept the SQLite file on the Render
 * instance's ephemeral disk and every restart or redeploy silently
 * reset the database to empty (the owner lost his account this way
 * on 2026-10-26).
 *
 * Local development (no DATABASE_URL): the original better-sqlite3
 * file database, unchanged.
 *
 * Call sites use the familiar prepare().get()/all()/run() shape in
 * both modes; the Postgres branch translates SQLite-flavoured SQL:
 *   ? placeholders            -> $1..$n
 *   INSERT OR IGNORE INTO ... -> INSERT INTO ... ON CONFLICT DO NOTHING
 *   INSERT run()              -> appends RETURNING id so callers keep
 *                                { changes, lastInsertRowid } semantics.
 */
const DATABASE_URL = process.env.DATABASE_URL || '';

let pool: Pool | null = null;
let sqliteDb: any = null;

if (DATABASE_URL) {
    const poolConfig: any = { connectionString: DATABASE_URL };
    // Neon requires TLS. Connection strings copied from the Neon console
    // already carry sslmode=require; only add the flag when absent.
    if (!DATABASE_URL.includes('sslmode=')) poolConfig.ssl = { rejectUnauthorized: true };
    pool = new Pool(poolConfig);
} else {
    // Loaded lazily so the native module is never required in Postgres mode.
    const BetterSQLite3 = require('better-sqlite3');
    const dbPath = path.resolve(__dirname, '../../check_generator.db');
    sqliteDb = new BetterSQLite3(dbPath, process.env.DB_DEBUG ? { verbose: console.log } : {});
}

const SQLITE_DDL = `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id TEXT,
        action TEXT NOT NULL,
        user_id TEXT,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kyc_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        method TEXT NOT NULL,
        status TEXT NOT NULL,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ach_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL,
        entry_count INTEGER,
        total_amount REAL,
        transmission_log TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS check_deposits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trace_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'PENDING',
        risk_score REAL,
        micr_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tax_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        schema TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tax_documents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        template_id TEXT NOT NULL,
        data TEXT NOT NULL,
        status TEXT DEFAULT 'DRAFT',
        pdf_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES tax_templates(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        merchant_id TEXT,
        client_name TEXT NOT NULL,
        client_email TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'SENT',
        items TEXT NOT NULL,
        payment_method TEXT,
        payout_destination TEXT,
        payout_details TEXT,
        trial_deposits TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        paid_at DATETIME
    );
`;

// Same ten tables in Postgres dialect: identity columns instead of
// AUTOINCREMENT, TIMESTAMPTZ instead of DATETIME, DOUBLE PRECISION
// instead of REAL. Column names and order are identical.
const PG_DDL = `
    CREATE TABLE IF NOT EXISTS users (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        user_id INTEGER,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        metadata TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        document_id TEXT,
        action TEXT NOT NULL,
        user_id TEXT,
        details TEXT,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kyc_verifications (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id TEXT NOT NULL,
        method TEXT NOT NULL,
        status TEXT NOT NULL,
        data TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ach_batches (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        batch_id TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL,
        entry_count INTEGER,
        total_amount DOUBLE PRECISION,
        transmission_log TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS check_deposits (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        trace_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        status TEXT DEFAULT 'PENDING',
        risk_score DOUBLE PRECISION,
        micr_data TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tax_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        schema TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tax_documents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        template_id TEXT NOT NULL,
        data TEXT NOT NULL,
        status TEXT DEFAULT 'DRAFT',
        pdf_url TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES tax_templates(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        merchant_id TEXT,
        client_name TEXT NOT NULL,
        client_email TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'SENT',
        items TEXT NOT NULL,
        payment_method TEXT,
        payout_destination TEXT,
        payout_details TEXT,
        trial_deposits TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMPTZ
    );
`;

let initPromise: Promise<void> | null = null;

export const initDatabase = (): Promise<void> => {
    if (!initPromise) {
        initPromise = (async () => {
            if (pool) {
                await pool.query(PG_DDL);
            } else {
                sqliteDb.exec(SQLITE_DDL);
            }
            console.log('Database initialized successfully (inc. Phase 34 & Invoicing schemas).');
        })();
    }
    return initPromise;
};

const toPgSql = (sql: string): string => {
    let out = sql;
    let orIgnore = false;
    out = out.replace(/INSERT\s+OR\s+IGNORE\s+INTO/i, () => { orIgnore = true; return 'INSERT INTO'; });
    let n = 0;
    out = out.replace(/\?/g, () => `$${++n}`);
    if (orIgnore && !/ON\s+CONFLICT/i.test(out)) out += ' ON CONFLICT DO NOTHING';
    return out;
};

const makeStatement = (sql: string) => ({
    async get(...params: any[]): Promise<any> {
        await initDatabase();
        if (pool) {
            const r = await pool.query(toPgSql(sql), params);
            return r.rows[0];
        }
        return sqliteDb.prepare(sql).get(...params);
    },
    async all(...params: any[]): Promise<any[]> {
        await initDatabase();
        if (pool) {
            const r = await pool.query(toPgSql(sql), params);
            return r.rows;
        }
        return sqliteDb.prepare(sql).all(...params);
    },
    async run(...params: any[]): Promise<any> {
        await initDatabase();
        if (pool) {
            let text = toPgSql(sql);
            if (/^\s*INSERT\s+INTO/i.test(text) && !/RETURNING/i.test(text)) text += ' RETURNING id';
            const r = await pool.query(text, params);
            return { changes: r.rowCount ?? 0, lastInsertRowid: r.rows && r.rows[0] ? r.rows[0].id : null };
        }
        return sqliteDb.prepare(sql).run(...params);
    }
});

export class DB {
    static async query(sql: string, params: any[] = []) {
        return makeStatement(sql).all(...params);
    }

    static async get(sql: string, params: any[] = []) {
        return makeStatement(sql).get(...params);
    }

    static async run(sql: string, params: any[] = []) {
        return makeStatement(sql).run(...params);
    }

    static prepare(sql: string) {
        return makeStatement(sql);
    }
}

const dbFacade = { prepare: (sql: string) => makeStatement(sql) };

export default dbFacade;
