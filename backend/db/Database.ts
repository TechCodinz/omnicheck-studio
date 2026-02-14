import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../check_generator.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize Schema
export const initDatabase = () => {
    db.exec(`
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
            data TEXT NOT NULL, -- JSON string of template properties
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

        -- Phase 34: Data Persistence
        CREATE TABLE IF NOT EXISTS kyc_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            method TEXT NOT NULL, -- 'PLAID', 'BIOMETRIC', 'MICRO'
            status TEXT NOT NULL, -- 'PENDING', 'VERIFIED', 'REJECTED'
            data TEXT, -- JSON details (e.g., match score)
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ach_batches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL, -- 'PROCESSED', 'FAILED'
            entry_count INTEGER,
            total_amount REAL,
            transmission_log TEXT, -- JSON response from Gateway
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS check_deposits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trace_id TEXT UNIQUE NOT NULL,
            user_id TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED'
            risk_score REAL,
            micr_data TEXT, -- JSON
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Phase 36: Tax Document System
        CREATE TABLE IF NOT EXISTS tax_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT, -- 'INCOME', 'WAGE', 'REFUND'
            schema TEXT NOT NULL, -- JSON definition of fields and SVG coordinates
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS tax_documents (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            template_id TEXT NOT NULL,
            data TEXT NOT NULL, -- JSON values for fields
            status TEXT DEFAULT 'DRAFT', -- 'DRAFT', 'COMPLETED', 'SENT'
            pdf_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (template_id) REFERENCES tax_templates(id)
        );

    `);
    console.log('Database initialized successfully (inc. Phase 34 schemas).');
};

export class DB {
    static query(sql: string, params: any[] = []) {
        return db.prepare(sql).all(...params);
    }

    static get(sql: string, params: any[] = []) {
        return db.prepare(sql).get(...params);
    }

    static run(sql: string, params: any[] = []) {
        return db.prepare(sql).run(...params);
    }
}

export default db;
