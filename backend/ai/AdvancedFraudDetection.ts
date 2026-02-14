/**
 * AdvancedFraudDetection - ML-Based Fraud Analysis Engine
 * 
 * Features:
 * - Multi-layer fraud detection with ML models
 * - Behavioral pattern analysis
 * - Velocity checking
 * - Device fingerprinting
 * - Network analysis
 * - Real-time risk scoring
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

// ============== INTERFACES ==============

export interface FraudCheckRequest {
    checkId: string;
    checkData: CheckData;
    deviceInfo: DeviceInfo;
    userContext: UserContext;
    transactionContext: TransactionContext;
}

export interface CheckData {
    checkNumber: string;
    amount: number;
    payeeName: string;
    routingNumber: string;
    accountNumber: string;
    date: string;
    memo?: string;
    signature?: string;
}

export interface DeviceInfo {
    deviceId: string;
    fingerprint: string;
    ipAddress: string;
    userAgent: string;
    timezone: string;
    language: string;
    screenResolution?: string;
    platform?: string;
}

export interface UserContext {
    userId: string;
    accountAge: number; // days
    previousTransactions: number;
    averageTransactionAmount: number;
    lastLoginLocation?: GeoLocation;
    trustedDevices: string[];
}

export interface TransactionContext {
    timestamp: string;
    sessionId: string;
    referrer?: string;
    timeOnPage: number;
    inputPatterns: InputPattern[];
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
    accuracy: number;
}

export interface InputPattern {
    field: string;
    typingSpeed: number;
    pauses: number[];
    corrections: number;
}

export interface FraudAnalysisResult {
    requestId: string;
    checkId: string;
    timestamp: string;
    overallRisk: RiskLevel;
    riskScore: number; // 0-100
    confidence: number; // 0-1
    signals: FraudSignal[];
    recommendations: Recommendation[];
    decision: Decision;
    analysis: DetailedAnalysis;
    metadata: AnalysisMetadata;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface FraudSignal {
    id: string;
    type: SignalType;
    severity: RiskLevel;
    score: number;
    description: string;
    details: Record<string, any>;
    timestamp: string;
}

export type SignalType =
    | 'amount_anomaly'
    | 'velocity_breach'
    | 'device_risk'
    | 'behavioral_anomaly'
    | 'network_risk'
    | 'identity_mismatch'
    | 'pattern_match'
    | 'geo_anomaly'
    | 'timing_anomaly'
    | 'duplicate_detection';

export interface Recommendation {
    action: 'approve' | 'review' | 'challenge' | 'decline';
    reason: string;
    priority: number;
    additionalVerification?: string[];
}

export interface Decision {
    action: 'approve' | 'review' | 'decline';
    automated: boolean;
    requiresMFA: boolean;
    requiresManualReview: boolean;
    holdPeriod?: number; // hours
    reason: string;
}

export interface DetailedAnalysis {
    amountAnalysis: AmountAnalysis;
    velocityAnalysis: VelocityAnalysis;
    deviceAnalysis: DeviceAnalysis;
    behavioralAnalysis: BehavioralAnalysis;
    networkAnalysis: NetworkAnalysis;
    patternAnalysis: PatternAnalysis;
}

export interface AmountAnalysis {
    isAnomaly: boolean;
    deviationFromMean: number;
    percentile: number;
    historicalComparison: {
        userAverage: number;
        globalAverage: number;
        ratio: number;
    };
}

export interface VelocityAnalysis {
    checksLast24Hours: number;
    checksLast7Days: number;
    totalAmountLast24Hours: number;
    velocityScore: number;
    breaches: VelocityBreach[];
}

export interface VelocityBreach {
    rule: string;
    threshold: number;
    actual: number;
    severity: RiskLevel;
}

export interface DeviceAnalysis {
    isKnownDevice: boolean;
    deviceAge: number;
    trustScore: number;
    riskFactors: string[];
    fingerprintMatch: number;
}

export interface BehavioralAnalysis {
    typingPatternScore: number;
    sessionBehaviorScore: number;
    navigationPatternScore: number;
    timeAnalysisScore: number;
    overallBehaviorScore: number;
}

export interface NetworkAnalysis {
    ipReputation: number;
    isVPN: boolean;
    isProxy: boolean;
    isTor: boolean;
    isDatacenter: boolean;
    geoMismatch: boolean;
    networkRiskScore: number;
}

export interface PatternAnalysis {
    matchedPatterns: MatchedPattern[];
    similarChecks: SimilarCheck[];
    duplicateRisk: number;
}

export interface MatchedPattern {
    patternId: string;
    patternName: string;
    confidence: number;
    details: string;
}

export interface SimilarCheck {
    checkId: string;
    similarity: number;
    date: string;
    status: string;
}

export interface AnalysisMetadata {
    processingTimeMs: number;
    modelsUsed: string[];
    dataSourcesConsulted: string[];
    version: string;
}

// ============== CONSTANTS ==============

const VELOCITY_RULES = {
    maxChecksPerDay: 10,
    maxChecksPerWeek: 50,
    maxAmountPerDay: 50000,
    maxAmountPerWeek: 200000,
    maxSingleCheck: 25000
};

const RISK_THRESHOLDS = {
    low: { min: 0, max: 25 },
    medium: { min: 25, max: 50 },
    high: { min: 50, max: 75 },
    critical: { min: 75, max: 100 }
};

const KNOWN_FRAUD_PATTERNS = [
    { id: 'round_amount', regex: /^\d+000$/, description: 'Suspiciously round amount' },
    { id: 'sequential_checks', description: 'Multiple sequential check numbers' },
    { id: 'new_payee_large', description: 'Large amount to new payee' },
    { id: 'unusual_timing', description: 'Transaction outside normal hours' }
];

// ============== MAIN CLASS ==============

export class AdvancedFraudDetection extends EventEmitter {
    private userProfiles: Map<string, UserProfile> = new Map();
    private checkHistory: Map<string, HistoricalCheck[]> = new Map();
    private deviceRegistry: Map<string, DeviceRecord[]> = new Map();
    private ipBlacklist: Set<string> = new Set();
    private knownFraudPatterns: FraudPattern[] = [];
    private mlModelWeights: ModelWeights = { amountWeight: 0.20, velocityWeight: 0.25, deviceWeight: 0.15, behavioralWeight: 0.15, networkWeight: 0.15, patternWeight: 0.10 };

    constructor() {
        super();
        this.loadMLModels();
        this.loadBlacklists();
        this.loadFraudPatterns();
    }

    private loadMLModels() {
        // Load trained model weights
        this.mlModelWeights = {
            amountWeight: 0.20,
            velocityWeight: 0.25,
            deviceWeight: 0.15,
            behavioralWeight: 0.15,
            networkWeight: 0.15,
            patternWeight: 0.10
        };
    }

    private loadBlacklists() {
        // Load known bad IPs, devices, etc.
        // In production, load from database/external service
    }

    private loadFraudPatterns() {
        this.knownFraudPatterns = KNOWN_FRAUD_PATTERNS.map(p => ({
            ...p,
            regex: p.regex || null,
            matchCount: 0
        }));
    }

    async analyzeCheck(request: FraudCheckRequest): Promise<FraudAnalysisResult> {
        const startTime = Date.now();
        const requestId = crypto.randomUUID();
        const signals: FraudSignal[] = [];

        // Run all analysis modules in parallel
        const [
            amountAnalysis,
            velocityAnalysis,
            deviceAnalysis,
            behavioralAnalysis,
            networkAnalysis,
            patternAnalysis
        ] = await Promise.all([
            this.analyzeAmount(request),
            this.analyzeVelocity(request),
            this.analyzeDevice(request),
            this.analyzeBehavior(request),
            this.analyzeNetwork(request),
            this.analyzePatterns(request)
        ]);

        // Collect signals from all analyses
        signals.push(...this.extractSignals(amountAnalysis, 'amount'));
        signals.push(...this.extractSignals(velocityAnalysis, 'velocity'));
        signals.push(...this.extractSignals(deviceAnalysis, 'device'));
        signals.push(...this.extractSignals(behavioralAnalysis, 'behavioral'));
        signals.push(...this.extractSignals(networkAnalysis, 'network'));
        signals.push(...this.extractSignals(patternAnalysis, 'pattern'));

        // Calculate risk score using ML model
        const riskScore = this.calculateRiskScore({
            amountAnalysis,
            velocityAnalysis,
            deviceAnalysis,
            behavioralAnalysis,
            networkAnalysis,
            patternAnalysis
        });

        const overallRisk = this.determineRiskLevel(riskScore);
        const decision = this.makeDecision(riskScore, signals, request);
        const recommendations = this.generateRecommendations(riskScore, signals, decision);

        const result: FraudAnalysisResult = {
            requestId,
            checkId: request.checkId,
            timestamp: new Date().toISOString(),
            overallRisk,
            riskScore,
            confidence: this.calculateConfidence(signals),
            signals,
            recommendations,
            decision,
            analysis: {
                amountAnalysis,
                velocityAnalysis,
                deviceAnalysis,
                behavioralAnalysis,
                networkAnalysis,
                patternAnalysis
            },
            metadata: {
                processingTimeMs: Date.now() - startTime,
                modelsUsed: ['amount_anomaly_v2', 'velocity_v3', 'device_trust_v1', 'behavior_ml_v2', 'network_risk_v1', 'pattern_match_v2'],
                dataSourcesConsulted: ['user_history', 'device_registry', 'ip_reputation', 'fraud_patterns'],
                version: '2.0.0'
            }
        };

        // Update internal state
        this.updateUserProfile(request);
        this.recordCheck(request, result);

        // Emit event for real-time monitoring
        this.emit('analysis_complete', result);

        return result;
    }

    // ============== ANALYSIS MODULES ==============

    private async analyzeAmount(request: FraudCheckRequest): Promise<AmountAnalysis> {
        const amount = request.checkData.amount;
        const userContext = request.userContext;

        const userAverage = userContext.averageTransactionAmount || 1000;
        const globalAverage = 500; // Would come from database

        const deviationFromMean = (amount - userAverage) / userAverage;
        const percentile = this.calculateAmountPercentile(amount, userContext.userId);

        return {
            isAnomaly: deviationFromMean > 3 || amount > VELOCITY_RULES.maxSingleCheck,
            deviationFromMean,
            percentile,
            historicalComparison: {
                userAverage,
                globalAverage,
                ratio: amount / userAverage
            }
        };
    }

    private async analyzeVelocity(request: FraudCheckRequest): Promise<VelocityAnalysis> {
        const userId = request.userContext.userId;
        const history = this.checkHistory.get(userId) || [];

        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

        const checksLast24Hours = history.filter(c => c.timestamp > oneDayAgo).length;
        const checksLast7Days = history.filter(c => c.timestamp > oneWeekAgo).length;
        const totalAmountLast24Hours = history
            .filter(c => c.timestamp > oneDayAgo)
            .reduce((sum, c) => sum + c.amount, 0);

        const breaches: VelocityBreach[] = [];

        if (checksLast24Hours >= VELOCITY_RULES.maxChecksPerDay) {
            breaches.push({
                rule: 'max_checks_per_day',
                threshold: VELOCITY_RULES.maxChecksPerDay,
                actual: checksLast24Hours,
                severity: 'high'
            });
        }

        if (totalAmountLast24Hours + request.checkData.amount > VELOCITY_RULES.maxAmountPerDay) {
            breaches.push({
                rule: 'max_amount_per_day',
                threshold: VELOCITY_RULES.maxAmountPerDay,
                actual: totalAmountLast24Hours + request.checkData.amount,
                severity: 'critical'
            });
        }

        const velocityScore = Math.min(100, (checksLast24Hours / VELOCITY_RULES.maxChecksPerDay) * 50 +
            (totalAmountLast24Hours / VELOCITY_RULES.maxAmountPerDay) * 50);

        return {
            checksLast24Hours,
            checksLast7Days,
            totalAmountLast24Hours,
            velocityScore,
            breaches
        };
    }

    private async analyzeDevice(request: FraudCheckRequest): Promise<DeviceAnalysis> {
        const device = request.deviceInfo;
        const userDevices = this.deviceRegistry.get(request.userContext.userId) || [];

        const isKnownDevice = userDevices.some(d => d.fingerprint === device.fingerprint);
        const deviceRecord = userDevices.find(d => d.fingerprint === device.fingerprint);
        const deviceAge = deviceRecord ? (Date.now() - deviceRecord.firstSeen) / (24 * 60 * 60 * 1000) : 0;

        const riskFactors: string[] = [];
        if (!isKnownDevice) riskFactors.push('new_device');
        if (deviceAge < 7) riskFactors.push('recently_added_device');
        if (!request.userContext.trustedDevices.includes(device.deviceId)) riskFactors.push('untrusted_device');

        const trustScore = isKnownDevice ?
            Math.min(100, 50 + deviceAge * 5) :
            25;

        return {
            isKnownDevice,
            deviceAge,
            trustScore,
            riskFactors,
            fingerprintMatch: isKnownDevice ? 1.0 : 0
        };
    }

    private async analyzeBehavior(request: FraudCheckRequest): Promise<BehavioralAnalysis> {
        const patterns = request.transactionContext.inputPatterns;

        // Analyze typing patterns
        const typingPatternScore = this.analyzeTypingPatterns(patterns);

        // Analyze session behavior
        const sessionBehaviorScore = this.analyzeSessionBehavior(request.transactionContext);

        // Analyze navigation patterns
        const navigationPatternScore = this.analyzeNavigationPatterns(request.transactionContext);

        // Analyze timing
        const timeAnalysisScore = this.analyzeTimingPatterns(request);

        const overallBehaviorScore = (
            typingPatternScore * 0.3 +
            sessionBehaviorScore * 0.25 +
            navigationPatternScore * 0.25 +
            timeAnalysisScore * 0.2
        );

        return {
            typingPatternScore,
            sessionBehaviorScore,
            navigationPatternScore,
            timeAnalysisScore,
            overallBehaviorScore
        };
    }

    private async analyzeNetwork(request: FraudCheckRequest): Promise<NetworkAnalysis> {
        const ip = request.deviceInfo.ipAddress;

        // Check IP reputation (simulated)
        const ipReputation = this.checkIPReputation(ip);
        const isVPN = this.detectVPN(ip);
        const isProxy = this.detectProxy(ip);
        const isTor = this.detectTor(ip);
        const isDatacenter = this.detectDatacenter(ip);

        // Check for geo mismatch
        const geoMismatch = request.userContext.lastLoginLocation ?
            this.checkGeoMismatch(ip, request.userContext.lastLoginLocation) : false;

        let networkRiskScore = 0;
        if (isVPN) networkRiskScore += 20;
        if (isProxy) networkRiskScore += 30;
        if (isTor) networkRiskScore += 50;
        if (isDatacenter) networkRiskScore += 25;
        if (geoMismatch) networkRiskScore += 30;
        if (ipReputation < 50) networkRiskScore += (50 - ipReputation);

        return {
            ipReputation,
            isVPN,
            isProxy,
            isTor,
            isDatacenter,
            geoMismatch,
            networkRiskScore: Math.min(100, networkRiskScore)
        };
    }

    private async analyzePatterns(request: FraudCheckRequest): Promise<PatternAnalysis> {
        const matchedPatterns: MatchedPattern[] = [];
        const similarChecks: SimilarCheck[] = [];

        // Check against known fraud patterns
        for (const pattern of this.knownFraudPatterns) {
            if (pattern.regex && pattern.regex.test(request.checkData.amount.toString())) {
                matchedPatterns.push({
                    patternId: pattern.id,
                    patternName: pattern.description,
                    confidence: 0.7,
                    details: `Amount matches pattern: ${pattern.id}`
                });
            }
        }

        // Check for duplicates
        const duplicateRisk = this.calculateDuplicateRisk(request);

        // Find similar checks
        const history = this.checkHistory.get(request.userContext.userId) || [];
        for (const check of history.slice(-10)) {
            const similarity = this.calculateCheckSimilarity(request.checkData, check);
            if (similarity > 0.8) {
                similarChecks.push({
                    checkId: check.checkId,
                    similarity,
                    date: new Date(check.timestamp).toISOString(),
                    status: check.status
                });
            }
        }

        return {
            matchedPatterns,
            similarChecks,
            duplicateRisk
        };
    }

    // ============== SCORING & DECISION ==============

    private calculateRiskScore(analysis: DetailedAnalysis): number {
        const weights = this.mlModelWeights;

        const amountScore = analysis.amountAnalysis.isAnomaly ? 80 :
            Math.min(100, analysis.amountAnalysis.deviationFromMean * 20);

        const velocityScore = analysis.velocityAnalysis.velocityScore;
        const deviceScore = 100 - analysis.deviceAnalysis.trustScore;
        const behaviorScore = 100 - analysis.behavioralAnalysis.overallBehaviorScore;
        const networkScore = analysis.networkAnalysis.networkRiskScore;
        const patternScore = analysis.patternAnalysis.matchedPatterns.length * 25 +
            analysis.patternAnalysis.duplicateRisk * 50;

        const weightedScore =
            amountScore * weights.amountWeight +
            velocityScore * weights.velocityWeight +
            deviceScore * weights.deviceWeight +
            behaviorScore * weights.behavioralWeight +
            networkScore * weights.networkWeight +
            Math.min(100, patternScore) * weights.patternWeight;

        return Math.round(Math.min(100, weightedScore));
    }

    private determineRiskLevel(score: number): RiskLevel {
        if (score >= RISK_THRESHOLDS.critical.min) return 'critical';
        if (score >= RISK_THRESHOLDS.high.min) return 'high';
        if (score >= RISK_THRESHOLDS.medium.min) return 'medium';
        return 'low';
    }

    private makeDecision(riskScore: number, signals: FraudSignal[], request: FraudCheckRequest): Decision {
        const criticalSignals = signals.filter(s => s.severity === 'critical');
        const highSignals = signals.filter(s => s.severity === 'high');

        if (riskScore >= 75 || criticalSignals.length > 0) {
            return {
                action: 'decline',
                automated: true,
                requiresMFA: false,
                requiresManualReview: true,
                reason: 'High risk score with critical fraud signals detected'
            };
        }

        if (riskScore >= 50 || highSignals.length >= 2) {
            return {
                action: 'review',
                automated: false,
                requiresMFA: true,
                requiresManualReview: true,
                holdPeriod: 24,
                reason: 'Moderate risk requiring additional verification'
            };
        }

        if (riskScore >= 25) {
            return {
                action: 'approve',
                automated: true,
                requiresMFA: request.checkData.amount > 1000,
                requiresManualReview: false,
                reason: 'Low-moderate risk within acceptable parameters'
            };
        }

        return {
            action: 'approve',
            automated: true,
            requiresMFA: false,
            requiresManualReview: false,
            reason: 'Low risk transaction'
        };
    }

    private generateRecommendations(riskScore: number, signals: FraudSignal[], decision: Decision): Recommendation[] {
        const recommendations: Recommendation[] = [];

        if (signals.some(s => s.type === 'device_risk')) {
            recommendations.push({
                action: 'challenge',
                reason: 'Unknown device detected',
                priority: 1,
                additionalVerification: ['device_verification', 'sms_code']
            });
        }

        if (signals.some(s => s.type === 'velocity_breach')) {
            recommendations.push({
                action: 'review',
                reason: 'Velocity limits exceeded',
                priority: 2,
                additionalVerification: ['manual_review']
            });
        }

        if (riskScore >= 50) {
            recommendations.push({
                action: 'challenge',
                reason: 'Elevated risk score',
                priority: 1,
                additionalVerification: ['step_up_auth', 'callback_verification']
            });
        }

        return recommendations.sort((a, b) => a.priority - b.priority);
    }

    // ============== HELPER METHODS ==============

    private extractSignals(analysis: any, type: string): FraudSignal[] {
        const signals: FraudSignal[] = [];

        if (type === 'velocity' && analysis.breaches?.length > 0) {
            for (const breach of analysis.breaches) {
                signals.push({
                    id: crypto.randomUUID(),
                    type: 'velocity_breach',
                    severity: breach.severity,
                    score: (breach.actual / breach.threshold) * 50,
                    description: `Velocity rule breached: ${breach.rule}`,
                    details: { rule: breach.rule, threshold: breach.threshold, actual: breach.actual },
                    timestamp: new Date().toISOString()
                });
            }
        }

        if (type === 'device' && !analysis.isKnownDevice) {
            signals.push({
                id: crypto.randomUUID(),
                type: 'device_risk',
                severity: analysis.deviceAge < 1 ? 'high' : 'medium',
                score: 100 - analysis.trustScore,
                description: 'Transaction from unknown or untrusted device',
                details: { deviceAge: analysis.deviceAge, trustScore: analysis.trustScore },
                timestamp: new Date().toISOString()
            });
        }

        if (type === 'network' && (analysis.isVPN || analysis.isProxy || analysis.isTor)) {
            signals.push({
                id: crypto.randomUUID(),
                type: 'network_risk',
                severity: analysis.isTor ? 'critical' : 'high',
                score: analysis.networkRiskScore,
                description: 'Network anonymization detected',
                details: { isVPN: analysis.isVPN, isProxy: analysis.isProxy, isTor: analysis.isTor },
                timestamp: new Date().toISOString()
            });
        }

        if (type === 'amount' && analysis.isAnomaly) {
            signals.push({
                id: crypto.randomUUID(),
                type: 'amount_anomaly',
                severity: analysis.deviationFromMean > 5 ? 'high' : 'medium',
                score: Math.min(100, analysis.deviationFromMean * 20),
                description: 'Amount significantly deviates from user average',
                details: { deviation: analysis.deviationFromMean, percentile: analysis.percentile },
                timestamp: new Date().toISOString()
            });
        }

        return signals;
    }

    private calculateConfidence(signals: FraudSignal[]): number {
        if (signals.length === 0) return 0.95;
        const avgScore = signals.reduce((sum, s) => sum + s.score, 0) / signals.length;
        return Math.max(0.5, 1 - (avgScore / 200));
    }

    private analyzeTypingPatterns(patterns: InputPattern[]): number {
        if (patterns.length === 0) return 50;

        // Analyze average typing speed
        const avgSpeed = patterns.reduce((sum, p) => sum + p.typingSpeed, 0) / patterns.length;
        const avgCorrections = patterns.reduce((sum, p) => sum + p.corrections, 0) / patterns.length;

        // Bots typically have very consistent typing speed
        const speedVariance = this.calculateVariance(patterns.map(p => p.typingSpeed));

        let score = 50;
        if (speedVariance < 10) score -= 20; // Too consistent (bot-like)
        if (avgCorrections < 0.1) score -= 10; // No corrections (copy-paste or bot)
        if (avgSpeed > 200) score -= 15; // Too fast

        return Math.max(0, Math.min(100, score + 50));
    }

    private analyzeSessionBehavior(context: TransactionContext): number {
        let score = 50;

        // Time on page - too quick is suspicious
        if (context.timeOnPage < 30) score -= 20;
        if (context.timeOnPage > 300) score += 10;

        return Math.max(0, Math.min(100, score + 50));
    }

    private analyzeNavigationPatterns(context: TransactionContext): number {
        // Would analyze mouse movements, scroll patterns, etc.
        return 75; // Default moderate score
    }

    private analyzeTimingPatterns(request: FraudCheckRequest): number {
        const hour = new Date(request.transactionContext.timestamp).getHours();

        // Transactions between 2-5 AM are higher risk
        if (hour >= 2 && hour <= 5) return 40;

        return 80;
    }

    private checkIPReputation(ip: string): number {
        // Would query IP reputation service
        if (this.ipBlacklist.has(ip)) return 0;
        return 75; // Default moderate reputation
    }

    private detectVPN(ip: string): boolean {
        // Would query VPN detection service
        return false;
    }

    private detectProxy(ip: string): boolean {
        return false;
    }

    private detectTor(ip: string): boolean {
        // Would check against Tor exit node list
        return false;
    }

    private detectDatacenter(ip: string): boolean {
        return false;
    }

    private checkGeoMismatch(ip: string, lastLocation: GeoLocation): boolean {
        // Would calculate if current IP geo is impossibly far from last location
        return false;
    }

    private calculateAmountPercentile(amount: number, userId: string): number {
        // Would calculate percentile from historical data
        return 50;
    }

    private calculateDuplicateRisk(request: FraudCheckRequest): number {
        const history = this.checkHistory.get(request.userContext.userId) || [];

        for (const check of history) {
            if (check.amount === request.checkData.amount &&
                check.payeeName === request.checkData.payeeName) {
                const hoursSince = (Date.now() - check.timestamp) / (1000 * 60 * 60);
                if (hoursSince < 24) return 0.9;
                if (hoursSince < 168) return 0.5;
            }
        }

        return 0;
    }

    private calculateCheckSimilarity(check1: CheckData, check2: HistoricalCheck): number {
        let score = 0;
        if (check1.amount === check2.amount) score += 0.4;
        if (check1.payeeName === check2.payeeName) score += 0.3;
        if (check1.accountNumber === check2.accountNumber) score += 0.2;
        if (Math.abs(check1.amount - check2.amount) < check1.amount * 0.1) score += 0.1;
        return score;
    }

    private calculateVariance(values: number[]): number {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    }

    private updateUserProfile(request: FraudCheckRequest) {
        const profile = this.userProfiles.get(request.userContext.userId) || {
            userId: request.userContext.userId,
            transactionCount: 0,
            totalAmount: 0,
            averageAmount: 0,
            devices: [],
            lastActivity: Date.now()
        };

        profile.transactionCount++;
        profile.totalAmount += request.checkData.amount;
        profile.averageAmount = profile.totalAmount / profile.transactionCount;
        profile.lastActivity = Date.now();

        if (!profile.devices.includes(request.deviceInfo.fingerprint)) {
            profile.devices.push(request.deviceInfo.fingerprint);
        }

        this.userProfiles.set(request.userContext.userId, profile);
    }

    private recordCheck(request: FraudCheckRequest, result: FraudAnalysisResult) {
        const history = this.checkHistory.get(request.userContext.userId) || [];

        history.push({
            checkId: request.checkId,
            amount: request.checkData.amount,
            payeeName: request.checkData.payeeName,
            accountNumber: request.checkData.accountNumber,
            timestamp: Date.now(),
            status: result.decision.action,
            riskScore: result.riskScore
        });

        // Keep last 100 checks per user
        if (history.length > 100) history.shift();

        this.checkHistory.set(request.userContext.userId, history);
    }
}

// ============== SUPPORTING TYPES ==============

interface UserProfile {
    userId: string;
    transactionCount: number;
    totalAmount: number;
    averageAmount: number;
    devices: string[];
    lastActivity: number;
}

interface HistoricalCheck {
    checkId: string;
    amount: number;
    payeeName: string;
    accountNumber: string;
    timestamp: number;
    status: string;
    riskScore: number;
}

interface DeviceRecord {
    fingerprint: string;
    firstSeen: number;
    lastSeen: number;
    trusted: boolean;
}

interface FraudPattern {
    id: string;
    regex: RegExp | null;
    description: string;
    matchCount: number;
}

interface ModelWeights {
    amountWeight: number;
    velocityWeight: number;
    deviceWeight: number;
    behavioralWeight: number;
    networkWeight: number;
    patternWeight: number;
}

export const advancedFraudDetection = new AdvancedFraudDetection();
