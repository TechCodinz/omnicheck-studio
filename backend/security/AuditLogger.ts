/**
 * AuditLogger - Immutable Audit Trail System
 * 
 * Features:
 * - Hash-chain integrity verification
 * - Tamper-evident logging
 * - Compliance export (SOC2, PCI-DSS)
 * - Real-time event streaming
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

interface AuditEvent {
    id: string;
    timestamp: Date;
    eventType: AuditEventType;
    action: string;
    userId: string;
    resourceType: string;
    resourceId: string;
    ipAddress: string;
    userAgent: string;
    details: Record<string, any>;
    result: 'success' | 'failure' | 'partial';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    previousHash: string;
    hash: string;
}

type AuditEventType =
    | 'authentication'
    | 'authorization'
    | 'check_generation'
    | 'check_modification'
    | 'check_deletion'
    | 'check_export'
    | 'template_access'
    | 'admin_action'
    | 'security_event'
    | 'compliance_event'
    | 'data_access'
    | 'system_event';

interface AuditQuery {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    eventType?: AuditEventType;
    resourceType?: string;
    resourceId?: string;
    riskLevel?: string;
    limit?: number;
    offset?: number;
}

interface ComplianceReport {
    reportType: 'SOC2' | 'PCI-DSS' | 'GDPR' | 'HIPAA';
    generatedAt: Date;
    periodStart: Date;
    periodEnd: Date;
    events: AuditEvent[];
    summary: Record<string, number>;
    anomalies: any[];
    chainIntegrity: boolean;
}

export class AuditLogger extends EventEmitter {
    private events: AuditEvent[] = [];
    private lastHash: string = '0'.repeat(64); // Genesis hash
    private persistPath: string;
    private flushInterval: NodeJS.Timeout | null = null;
    private pendingEvents: AuditEvent[] = [];

    constructor(persistPath?: string) {
        super();
        this.persistPath = persistPath || path.join(process.cwd(), 'audit_logs');
        this.initialize();
    }

    private async initialize(): Promise<void> {
        // Create audit directory
        await fs.mkdir(this.persistPath, { recursive: true });

        // Load existing events
        await this.loadEvents();

        // Start periodic flush
        this.flushInterval = setInterval(() => this.flushToDisk(), 60000);
    }

    private async loadEvents(): Promise<void> {
        try {
            const files = await fs.readdir(this.persistPath);
            const logFiles = files.filter(f => f.endsWith('.audit.json')).sort();

            for (const file of logFiles) {
                const content = await fs.readFile(path.join(this.persistPath, file), 'utf-8');
                const events: AuditEvent[] = JSON.parse(content);
                this.events.push(...events);
            }

            // Set last hash
            if (this.events.length > 0) {
                this.lastHash = this.events[this.events.length - 1].hash;
            }

            console.log(`📋 Loaded ${this.events.length} audit events`);
        } catch (error) {
            // No existing logs
        }
    }

    /**
     * Log an audit event
     */
    log(params: {
        eventType: AuditEventType;
        action: string;
        userId: string;
        resourceType: string;
        resourceId: string;
        ipAddress: string;
        userAgent: string;
        details?: Record<string, any>;
        result?: 'success' | 'failure' | 'partial';
        riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    }): AuditEvent {
        const event: AuditEvent = {
            id: this.generateEventId(),
            timestamp: new Date(),
            eventType: params.eventType,
            action: params.action,
            userId: params.userId,
            resourceType: params.resourceType,
            resourceId: params.resourceId,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
            details: params.details || {},
            result: params.result || 'success',
            riskLevel: params.riskLevel || this.calculateRiskLevel(params),
            previousHash: this.lastHash,
            hash: '' // Will be set below
        };

        // Calculate hash including previous hash for chain integrity
        event.hash = this.calculateHash(event);
        this.lastHash = event.hash;

        // Store event
        this.events.push(event);
        this.pendingEvents.push(event);

        // Emit for real-time monitoring
        this.emit('audit-event', event);

        // Check for security alerts
        if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
            this.emit('security-alert', event);
        }

        return event;
    }

    private generateEventId(): string {
        return `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    private calculateHash(event: AuditEvent): string {
        const data = JSON.stringify({
            id: event.id,
            timestamp: event.timestamp,
            eventType: event.eventType,
            action: event.action,
            userId: event.userId,
            resourceId: event.resourceId,
            previousHash: event.previousHash
        });
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    private calculateRiskLevel(params: any): 'low' | 'medium' | 'high' | 'critical' {
        const highRiskActions = ['delete', 'export', 'modify_security', 'admin'];
        const criticalActions = ['bulk_delete', 'key_rotation', 'permission_change'];

        if (criticalActions.some(a => params.action.includes(a))) return 'critical';
        if (highRiskActions.some(a => params.action.includes(a))) return 'high';
        if (params.eventType === 'authentication' && params.result === 'failure') return 'medium';
        return 'low';
    }

    /**
     * Verify the integrity of the audit chain
     */
    verifyChainIntegrity(): { valid: boolean; brokenAt?: number; details?: string } {
        let previousHash = '0'.repeat(64);

        for (let i = 0; i < this.events.length; i++) {
            const event = this.events[i];

            // Check previous hash link
            if (event.previousHash !== previousHash) {
                return {
                    valid: false,
                    brokenAt: i,
                    details: `Chain broken at event ${i}: expected previousHash ${previousHash}, got ${event.previousHash}`
                };
            }

            // Recalculate and verify hash
            const expectedHash = this.calculateHash(event);
            if (event.hash !== expectedHash) {
                return {
                    valid: false,
                    brokenAt: i,
                    details: `Hash mismatch at event ${i}: expected ${expectedHash}, got ${event.hash}`
                };
            }

            previousHash = event.hash;
        }

        return { valid: true };
    }

    /**
     * Query audit events
     */
    query(params: AuditQuery): AuditEvent[] {
        let results = [...this.events];

        if (params.startDate) {
            results = results.filter(e => new Date(e.timestamp) >= params.startDate!);
        }
        if (params.endDate) {
            results = results.filter(e => new Date(e.timestamp) <= params.endDate!);
        }
        if (params.userId) {
            results = results.filter(e => e.userId === params.userId);
        }
        if (params.eventType) {
            results = results.filter(e => e.eventType === params.eventType);
        }
        if (params.resourceType) {
            results = results.filter(e => e.resourceType === params.resourceType);
        }
        if (params.resourceId) {
            results = results.filter(e => e.resourceId === params.resourceId);
        }
        if (params.riskLevel) {
            results = results.filter(e => e.riskLevel === params.riskLevel);
        }

        // Apply pagination
        const offset = params.offset || 0;
        const limit = params.limit || 100;
        return results.slice(offset, offset + limit);
    }

    /**
     * Generate compliance report
     */
    async generateComplianceReport(
        reportType: ComplianceReport['reportType'],
        periodStart: Date,
        periodEnd: Date
    ): Promise<ComplianceReport> {
        const events = this.query({ startDate: periodStart, endDate: periodEnd, limit: 100000 });
        const integrity = this.verifyChainIntegrity();

        // Calculate summary statistics
        const summary: Record<string, number> = {};
        const eventTypeCounts: Record<string, number> = {};
        const riskCounts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };

        for (const event of events) {
            eventTypeCounts[event.eventType] = (eventTypeCounts[event.eventType] || 0) + 1;
            riskCounts[event.riskLevel]++;
        }

        summary.totalEvents = events.length;
        summary.uniqueUsers = new Set(events.map(e => e.userId)).size;
        summary.successfulActions = events.filter(e => e.result === 'success').length;
        summary.failedActions = events.filter(e => e.result === 'failure').length;
        Object.assign(summary, eventTypeCounts, riskCounts);

        // Detect anomalies
        const anomalies = this.detectAnomalies(events);

        const report: ComplianceReport = {
            reportType,
            generatedAt: new Date(),
            periodStart,
            periodEnd,
            events: reportType === 'SOC2' ? events : [], // Full events only for SOC2
            summary,
            anomalies,
            chainIntegrity: integrity.valid
        };

        // Save report
        const reportPath = path.join(
            this.persistPath,
            `compliance_${reportType}_${Date.now()}.json`
        );
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return report;
    }

    private detectAnomalies(events: AuditEvent[]): any[] {
        const anomalies: any[] = [];

        // Detect unusual login patterns
        const loginsByUser = new Map<string, AuditEvent[]>();
        events
            .filter(e => e.eventType === 'authentication')
            .forEach(e => {
                const existing = loginsByUser.get(e.userId) || [];
                existing.push(e);
                loginsByUser.set(e.userId, existing);
            });

        for (const [userId, logins] of loginsByUser) {
            const failedLogins = logins.filter(l => l.result === 'failure');
            if (failedLogins.length > 5) {
                anomalies.push({
                    type: 'excessive_failed_logins',
                    userId,
                    count: failedLogins.length,
                    severity: 'high'
                });
            }
        }

        // Detect unusual bulk operations
        const bulkOps = events.filter(e =>
            e.action.includes('bulk') || e.action.includes('batch')
        );
        if (bulkOps.length > 10) {
            anomalies.push({
                type: 'high_bulk_operation_volume',
                count: bulkOps.length,
                severity: 'medium'
            });
        }

        return anomalies;
    }

    /**
     * Flush pending events to disk
     */
    private async flushToDisk(): Promise<void> {
        if (this.pendingEvents.length === 0) return;

        const filename = `${new Date().toISOString().split('T')[0]}.audit.json`;
        const filepath = path.join(this.persistPath, filename);

        try {
            let existing: AuditEvent[] = [];
            try {
                const content = await fs.readFile(filepath, 'utf-8');
                existing = JSON.parse(content);
            } catch {
                // File doesn't exist yet
            }

            const combined = [...existing, ...this.pendingEvents];
            await fs.writeFile(filepath, JSON.stringify(combined, null, 2));

            this.pendingEvents = [];
        } catch (error) {
            console.error('Failed to flush audit logs:', error);
        }
    }

    /**
     * Get recent high-risk events for security dashboard
     */
    getSecurityAlerts(limit: number = 10): AuditEvent[] {
        return this.events
            .filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical')
            .slice(-limit)
            .reverse();
    }

    /**
     * Cleanup old events (maintain for compliance period)
     */
    async cleanup(retentionDays: number = 365): Promise<number> {
        const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        const before = this.events.length;

        this.events = this.events.filter(e => new Date(e.timestamp) >= cutoff);

        // Note: This breaks chain integrity - use with caution
        // In production, archive old events instead of deleting
        console.warn(`⚠️ Removed ${before - this.events.length} audit events older than ${retentionDays} days`);

        return before - this.events.length;
    }

    async destroy(): Promise<void> {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        await this.flushToDisk();
    }
}

export const auditLogger = new AuditLogger();

// Helper middleware for Express
export function auditMiddleware(action: string, resourceType: string) {
    return (req: any, res: any, next: any) => {
        const startTime = Date.now();

        res.on('finish', () => {
            auditLogger.log({
                eventType: 'data_access',
                action,
                userId: req.user?.id || 'anonymous',
                resourceType,
                resourceId: req.params?.id || 'N/A',
                ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                details: {
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    responseTime: Date.now() - startTime
                },
                result: res.statusCode < 400 ? 'success' : 'failure'
            });
        });

        next();
    };
}
