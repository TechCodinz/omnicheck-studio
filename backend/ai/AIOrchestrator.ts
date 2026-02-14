/**
 * AIOrchestrator - Central AI Request Router
 * 
 * Provides unified access to all AI capabilities with:
 * - Intelligent model selection based on task type
 * - Caching for repeated queries
 * - Graceful degradation when services unavailable
 * - Load balancing across AI providers
 */

import { EventEmitter } from 'events';

// AI Provider Types
type AIProvider = 'openai' | 'anthropic' | 'ollama' | 'tensorflow' | 'local';
type TaskType = 'content_generation' | 'fraud_detection' | 'ocr' | 'classification' | 'embedding';

interface AIRequest {
    id: string;
    taskType: TaskType;
    payload: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
    timeout?: number;
}

interface AIResponse {
    requestId: string;
    provider: AIProvider;
    result: any;
    confidence: number;
    latencyMs: number;
    cached: boolean;
}

interface ProviderHealth {
    provider: AIProvider;
    status: 'healthy' | 'degraded' | 'offline';
    latencyAvgMs: number;
    successRate: number;
    lastCheck: Date;
}

interface CacheEntry {
    result: any;
    timestamp: number;
    ttl: number;
}

export class AIOrchestrator extends EventEmitter {
    private providers: Map<AIProvider, ProviderHealth> = new Map();
    private cache: Map<string, CacheEntry> = new Map();
    private requestQueue: AIRequest[] = [];
    private isProcessing = false;

    // Configuration
    private config = {
        defaultTimeout: 30000,
        cacheEnabled: true,
        cacheTTL: 3600000, // 1 hour
        maxRetries: 3,
        fallbackEnabled: true,
        loadBalancing: 'round-robin' as 'round-robin' | 'least-latency' | 'weighted'
    };

    // Provider priority for each task type
    private taskProviderMap: Record<TaskType, AIProvider[]> = {
        content_generation: ['openai', 'anthropic', 'ollama', 'local'],
        fraud_detection: ['tensorflow', 'openai', 'local'],
        ocr: ['tensorflow', 'local'],
        classification: ['tensorflow', 'openai', 'local'],
        embedding: ['openai', 'ollama', 'local']
    };

    constructor() {
        super();
        this.initializeProviders();
        this.startHealthMonitor();
    }

    private initializeProviders(): void {
        const defaultHealth: Omit<ProviderHealth, 'provider'> = {
            status: 'healthy',
            latencyAvgMs: 100,
            successRate: 1.0,
            lastCheck: new Date()
        };

        (['openai', 'anthropic', 'ollama', 'tensorflow', 'local'] as AIProvider[]).forEach(provider => {
            this.providers.set(provider, { provider, ...defaultHealth });
        });
    }

    private startHealthMonitor(): void {
        setInterval(() => this.checkProviderHealth(), 60000);
    }

    private async checkProviderHealth(): Promise<void> {
        for (const [provider, health] of this.providers) {
            try {
                const start = Date.now();
                await this.pingProvider(provider);
                const latency = Date.now() - start;

                health.latencyAvgMs = (health.latencyAvgMs * 0.7) + (latency * 0.3);
                health.status = latency < 5000 ? 'healthy' : 'degraded';
                health.lastCheck = new Date();
            } catch (error) {
                health.status = 'offline';
                health.successRate *= 0.9;
            }
        }
        this.emit('health-update', Array.from(this.providers.values()));
    }

    private async pingProvider(provider: AIProvider): Promise<boolean> {
        // Simplified health check - in production, make actual API calls
        switch (provider) {
            case 'openai':
                return !!process.env.OPENAI_API_KEY;
            case 'anthropic':
                return !!process.env.ANTHROPIC_API_KEY;
            case 'ollama':
                // Check if Ollama is running locally
                try {
                    const response = await fetch('http://localhost:11434/api/tags');
                    return response.ok;
                } catch {
                    return false;
                }
            case 'tensorflow':
            case 'local':
                return true; // Always available
            default:
                return false;
        }
    }

    /**
     * Main entry point for AI requests
     */
    async process(request: AIRequest): Promise<AIResponse> {
        const startTime = Date.now();

        // Check cache first
        if (this.config.cacheEnabled) {
            const cached = this.getFromCache(request);
            if (cached) {
                return {
                    requestId: request.id,
                    provider: 'local',
                    result: cached,
                    confidence: 1.0,
                    latencyMs: Date.now() - startTime,
                    cached: true
                };
            }
        }

        // Select best provider
        const provider = this.selectProvider(request.taskType);
        if (!provider) {
            throw new Error(`No available provider for task type: ${request.taskType}`);
        }

        // Execute with retry logic
        let lastError: Error | null = null;
        const providers = this.taskProviderMap[request.taskType];

        for (let i = 0; i < Math.min(this.config.maxRetries, providers.length); i++) {
            const currentProvider = providers[i];
            const providerHealth = this.providers.get(currentProvider);

            if (providerHealth?.status === 'offline') continue;

            try {
                const result = await this.executeWithProvider(currentProvider, request);

                // Cache successful result
                if (this.config.cacheEnabled) {
                    this.addToCache(request, result);
                }

                // Update provider stats
                if (providerHealth) {
                    providerHealth.successRate = Math.min(1, providerHealth.successRate + 0.01);
                }

                return {
                    requestId: request.id,
                    provider: currentProvider,
                    result,
                    confidence: this.calculateConfidence(result),
                    latencyMs: Date.now() - startTime,
                    cached: false
                };
            } catch (error) {
                lastError = error as Error;
                if (providerHealth) {
                    providerHealth.successRate *= 0.95;
                }
                console.warn(`Provider ${currentProvider} failed, trying fallback...`);
            }
        }

        throw lastError || new Error('All AI providers failed');
    }

    private selectProvider(taskType: TaskType): AIProvider | null {
        const candidates = this.taskProviderMap[taskType];

        switch (this.config.loadBalancing) {
            case 'least-latency':
                return candidates
                    .filter(p => this.providers.get(p)?.status !== 'offline')
                    .sort((a, b) =>
                        (this.providers.get(a)?.latencyAvgMs || Infinity) -
                        (this.providers.get(b)?.latencyAvgMs || Infinity)
                    )[0] || null;

            case 'weighted':
                const healthy = candidates.filter(p => {
                    const h = this.providers.get(p);
                    return h && h.status !== 'offline' && h.successRate > 0.5;
                });
                return healthy[Math.floor(Math.random() * healthy.length)] || null;

            case 'round-robin':
            default:
                return candidates.find(p => this.providers.get(p)?.status !== 'offline') || null;
        }
    }

    private async executeWithProvider(provider: AIProvider, request: AIRequest): Promise<any> {
        const timeout = request.timeout || this.config.defaultTimeout;

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        );

        const executionPromise = this.callProvider(provider, request);

        return Promise.race([executionPromise, timeoutPromise]);
    }

    private async callProvider(provider: AIProvider, request: AIRequest): Promise<any> {
        switch (provider) {
            case 'openai':
                return this.callOpenAI(request);
            case 'anthropic':
                return this.callAnthropic(request);
            case 'ollama':
                return this.callOllama(request);
            case 'tensorflow':
                return this.callTensorFlow(request);
            case 'local':
                return this.callLocal(request);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    private async callOpenAI(request: AIRequest): Promise<any> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OpenAI API key not configured');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: request.taskType === 'content_generation' ? 'gpt-4' : 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: this.getSystemPrompt(request.taskType) },
                    { role: 'user', content: JSON.stringify(request.payload) }
                ],
                temperature: 0.3,
                max_tokens: 1000
            })
        });

        if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
        const data = await response.json();
        return data.choices[0]?.message?.content;
    }

    private async callAnthropic(request: AIRequest): Promise<any> {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error('Anthropic API key not configured');

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2024-01-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1000,
                messages: [{ role: 'user', content: JSON.stringify(request.payload) }]
            })
        });

        if (!response.ok) throw new Error(`Anthropic error: ${response.status}`);
        const data = await response.json();
        return data.content[0]?.text;
    }

    private async callOllama(request: AIRequest): Promise<any> {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3',
                prompt: JSON.stringify(request.payload),
                stream: false
            })
        });

        if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
        const data = await response.json();
        return data.response;
    }

    private async callTensorFlow(request: AIRequest): Promise<any> {
        // TensorFlow.js processing for fraud detection and OCR
        switch (request.taskType) {
            case 'fraud_detection':
                return this.runFraudDetectionModel(request.payload);
            case 'ocr':
                return this.runOCRModel(request.payload);
            case 'classification':
                return this.runClassificationModel(request.payload);
            default:
                throw new Error(`TensorFlow doesn't support task: ${request.taskType}`);
        }
    }

    private async runFraudDetectionModel(payload: any): Promise<any> {
        // Placeholder for actual TensorFlow.js model
        return {
            fraudScore: Math.random() * 0.3, // Low fraud score for demo
            patterns: [],
            confidence: 0.95
        };
    }

    private async runOCRModel(payload: any): Promise<any> {
        // Use Tesseract.js in production
        return {
            text: 'Extracted text placeholder',
            confidence: 0.9
        };
    }

    private async runClassificationModel(payload: any): Promise<any> {
        return {
            category: 'business_check',
            confidence: 0.88
        };
    }

    private async callLocal(request: AIRequest): Promise<any> {
        // Fallback local processing without external APIs
        switch (request.taskType) {
            case 'content_generation':
                return this.generateLocalContent(request.payload);
            case 'fraud_detection':
                return this.localFraudHeuristics(request.payload);
            default:
                return { result: 'Local processing not available for this task' };
        }
    }

    private generateLocalContent(payload: any): any {
        // Simple rule-based content generation
        const amount = payload.amount || 0;
        const words = this.numberToWords(amount);
        return {
            amountInWords: words,
            memo: payload.memo || 'Payment',
            confidence: 0.7
        };
    }

    private localFraudHeuristics(payload: any): any {
        const flags: string[] = [];
        const amount = payload.amount || 0;

        if (amount > 10000) flags.push('high_amount');
        if (amount % 1000 === 0 && amount > 5000) flags.push('round_number');

        return {
            riskScore: flags.length * 20,
            flags,
            confidence: 0.6
        };
    }

    private numberToWords(num: number): string {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

        if (num === 0) return 'Zero';
        if (num < 10) return ones[num];
        if (num < 20) return teens[num - 10];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
        if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + this.numberToWords(num % 100) : '');
        if (num < 1000000) return this.numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + this.numberToWords(num % 1000) : '');
        return this.numberToWords(Math.floor(num / 1000000)) + ' Million' + (num % 1000000 ? ' ' + this.numberToWords(num % 1000000) : '');
    }

    private getSystemPrompt(taskType: TaskType): string {
        const prompts: Record<TaskType, string> = {
            content_generation: 'You are a professional financial document assistant. Generate precise, bank-compliant check content.',
            fraud_detection: 'You are a fraud detection expert. Analyze the provided check data for suspicious patterns.',
            ocr: 'You are an OCR specialist. Extract text from document images with high accuracy.',
            classification: 'You are a document classifier. Categorize financial documents accurately.',
            embedding: 'You are an embedding generator. Create semantic embeddings for financial documents.'
        };
        return prompts[taskType];
    }

    private calculateConfidence(result: any): number {
        if (typeof result?.confidence === 'number') return result.confidence;
        return 0.85; // Default confidence
    }

    // Cache methods
    private getCacheKey(request: AIRequest): string {
        return `${request.taskType}:${JSON.stringify(request.payload)}`;
    }

    private getFromCache(request: AIRequest): any | null {
        const key = this.getCacheKey(request);
        const entry = this.cache.get(key);

        if (!entry) return null;
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.result;
    }

    private addToCache(request: AIRequest, result: any): void {
        const key = this.getCacheKey(request);
        this.cache.set(key, {
            result,
            timestamp: Date.now(),
            ttl: this.config.cacheTTL
        });

        // Prune old entries
        if (this.cache.size > 1000) {
            const oldest = Array.from(this.cache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp)
                .slice(0, 100);
            oldest.forEach(([key]) => this.cache.delete(key));
        }
    }

    // Public API
    async generateCheckContent(checkData: any): Promise<any> {
        return this.process({
            id: `content_${Date.now()}`,
            taskType: 'content_generation',
            payload: checkData,
            priority: 'medium'
        });
    }

    async detectFraud(checkData: any): Promise<any> {
        return this.process({
            id: `fraud_${Date.now()}`,
            taskType: 'fraud_detection',
            payload: checkData,
            priority: 'high'
        });
    }

    async classifyDocument(imageBuffer: Buffer): Promise<any> {
        return this.process({
            id: `classify_${Date.now()}`,
            taskType: 'classification',
            payload: { image: imageBuffer.toString('base64') },
            priority: 'medium'
        });
    }

    getProviderStatus(): ProviderHealth[] {
        return Array.from(this.providers.values());
    }

    clearCache(): void {
        this.cache.clear();
    }
}

export const aiOrchestrator = new AIOrchestrator();
