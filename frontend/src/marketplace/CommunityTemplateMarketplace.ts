/**
 * CommunityTemplateMarketplace - User Template Sharing System
 * 
 * Features:
 * - Upload and share document templates
 * - Clone templates from community
 * - Template rating and reviews
 * - Categories and search
 * - Template versioning
 * - Usage analytics
 * - Premium templates
 */

import { EventEmitter } from 'events';

// ============== TYPES ==============

export type DocCategory =
    | 'passport' | 'drivers_license' | 'national_id' | 'ssn_card'
    | 'birth_certificate' | 'visa' | 'tax_document' | 'bank_statement'
    | 'pay_stub' | 'utility_bill' | 'insurance_card' | 'green_card' | 'work_permit';

export interface SharedTemplate {
    id: string;
    category: DocCategory;
    country: string;
    countryCode: string;
    region?: string;
    name: string;
    description: string;
    version: string;
    fields: any[];
    layout: any;
    uploadedBy: { id: string; username: string; verified: boolean };
    downloads: number;
    likes: number;
    rating: number;
    reviews: any[];
    tags: string[];
    isPremium: boolean;
    price?: number;
    isPublic: boolean;
    isApproved: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UploadRequest {
    file?: File | Blob;
    templateData: any;
    category: DocCategory;
    country: string;
    region?: string;
    tags: string[];
    description: string;
    isPublic: boolean;
}

export interface SearchParams {
    category?: DocCategory;
    country?: string;
    query?: string;
    tags?: string[];
    minRating?: number;
    sortBy?: 'popular' | 'newest' | 'rating';
    page?: number;
    limit?: number;
}

// ============== MARKETPLACE ENGINE ==============

export class CommunityTemplateMarketplace extends EventEmitter {
    private templates: Map<string, SharedTemplate> = new Map();
    private userUploads: Map<string, string[]> = new Map();
    private userDownloads: Map<string, string[]> = new Map();

    constructor() {
        super();
        this.initializeSampleData();
    }

    async uploadTemplate(userId: string, request: UploadRequest): Promise<SharedTemplate> {
        const template: SharedTemplate = {
            id: `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            category: request.category,
            country: request.country,
            countryCode: request.country.slice(0, 2).toUpperCase(),
            region: request.region,
            name: request.templateData?.name || `Custom ${request.category}`,
            description: request.description,
            version: '1.0',
            fields: request.templateData?.fields || [],
            layout: request.templateData?.layout || {},
            uploadedBy: { id: userId, username: `user_${userId.slice(0, 6)}`, verified: false },
            downloads: 0,
            likes: 0,
            rating: 0,
            reviews: [],
            tags: request.tags,
            isPremium: false,
            isPublic: request.isPublic,
            isApproved: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.templates.set(template.id, template);

        const uploads = this.userUploads.get(userId) || [];
        uploads.push(template.id);
        this.userUploads.set(userId, uploads);

        this.emit('template_uploaded', template);
        return template;
    }

    async cloneDocument(userId: string, file: File | Blob, metadata: {
        name: string;
        category: DocCategory;
        country: string;
        description: string;
        isPublic: boolean;
    }): Promise<SharedTemplate> {
        // Simulate OCR extraction delay
        await new Promise(r => setTimeout(r, 1500));

        return this.uploadTemplate(userId, {
            file,
            templateData: { name: metadata.name, fields: this.extractFields() },
            category: metadata.category,
            country: metadata.country,
            tags: [metadata.category, metadata.country.toLowerCase()],
            description: metadata.description,
            isPublic: metadata.isPublic
        });
    }

    private extractFields(): any[] {
        return [
            { id: 'f1', name: 'fullName', label: 'Full Name', type: 'text', required: true },
            { id: 'f2', name: 'idNumber', label: 'ID Number', type: 'text', required: true },
            { id: 'f3', name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
            { id: 'f4', name: 'photo', label: 'Photo', type: 'photo', required: true }
        ];
    }

    async search(params: SearchParams): Promise<{ templates: SharedTemplate[]; total: number }> {
        let results = Array.from(this.templates.values());

        if (params.category) results = results.filter(t => t.category === params.category);
        if (params.country) results = results.filter(t => t.country.toLowerCase().includes(params.country!.toLowerCase()));
        if (params.query) {
            const q = params.query.toLowerCase();
            results = results.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
        }
        if (params.minRating) results = results.filter(t => t.rating >= params.minRating!);

        results = results.filter(t => t.isPublic);

        switch (params.sortBy) {
            case 'popular': results.sort((a, b) => b.downloads - a.downloads); break;
            case 'newest': results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
            case 'rating': results.sort((a, b) => b.rating - a.rating); break;
        }

        const page = params.page || 1;
        const limit = params.limit || 20;
        const paginated = results.slice((page - 1) * limit, page * limit);

        return { templates: paginated, total: results.length };
    }

    async download(userId: string, templateId: string): Promise<SharedTemplate> {
        const template = this.templates.get(templateId);
        if (!template) throw new Error('Template not found');

        template.downloads++;

        const downloads = this.userDownloads.get(userId) || [];
        if (!downloads.includes(templateId)) {
            downloads.push(templateId);
            this.userDownloads.set(userId, downloads);
        }

        return template;
    }

    async like(userId: string, templateId: string): Promise<void> {
        const template = this.templates.get(templateId);
        if (template) template.likes++;
    }

    async fork(userId: string, templateId: string): Promise<SharedTemplate> {
        const original = this.templates.get(templateId);
        if (!original) throw new Error('Template not found');

        return this.uploadTemplate(userId, {
            templateData: { ...original, name: `${original.name} (Fork)` },
            category: original.category,
            country: original.country,
            region: original.region,
            tags: [...original.tags, 'fork'],
            description: `Forked from ${original.name}`,
            isPublic: true
        });
    }

    getStats() {
        const templates = Array.from(this.templates.values());
        return {
            totalTemplates: templates.length,
            totalDownloads: templates.reduce((s, t) => s + t.downloads, 0),
            topTemplates: [...templates].sort((a, b) => b.downloads - a.downloads).slice(0, 10)
        };
    }

    getUserUploads(userId: string): SharedTemplate[] {
        return (this.userUploads.get(userId) || []).map(id => this.templates.get(id)!).filter(Boolean);
    }

    getUserDownloads(userId: string): SharedTemplate[] {
        return (this.userDownloads.get(userId) || []).map(id => this.templates.get(id)!).filter(Boolean);
    }

    private initializeSampleData(): void {
        const samples = [
            { name: 'US Passport 2024', category: 'passport' as DocCategory, country: 'United States', downloads: 5420, rating: 4.8, tags: ['usa', 'passport'] },
            { name: 'UK Passport', category: 'passport' as DocCategory, country: 'United Kingdom', downloads: 3210, rating: 4.7, tags: ['uk', 'passport'] },
            { name: 'California DL', category: 'drivers_license' as DocCategory, country: 'United States', downloads: 4100, rating: 4.9, tags: ['california', 'dl'] },
            { name: 'Texas DL', category: 'drivers_license' as DocCategory, country: 'United States', downloads: 3850, rating: 4.8, tags: ['texas', 'dl'] },
            { name: 'SSN Card', category: 'ssn_card' as DocCategory, country: 'United States', downloads: 6200, rating: 4.9, tags: ['ssn'] },
            { name: 'German ID', category: 'national_id' as DocCategory, country: 'Germany', downloads: 2100, rating: 4.6, tags: ['germany', 'id'] }
        ];

        samples.forEach((s, i) => {
            const t: SharedTemplate = {
                id: `sample_${i}`,
                category: s.category,
                country: s.country,
                countryCode: s.country.slice(0, 2).toUpperCase(),
                name: s.name,
                description: `High-quality ${s.name} template`,
                version: '2024',
                fields: [],
                layout: {},
                uploadedBy: { id: 'system', username: 'DocMaster', verified: true },
                downloads: s.downloads,
                likes: Math.floor(s.downloads * 0.15),
                rating: s.rating,
                reviews: [],
                tags: s.tags,
                isPremium: false,
                isPublic: true,
                isApproved: true,
                createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.templates.set(t.id, t);
        });
    }
}

export const communityMarketplace = new CommunityTemplateMarketplace();
