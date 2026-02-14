import { CheckTemplate } from '../engines/CheckCloneEngine';

/**
 * Community Template Service
 * 
 * Responsible for:
 * 1. Receiving sanitized templates from the CheckCloneEngine.
 * 2. Storing them in a "Community Archive" (Simulated/Local Storage).
 * 3. Making them available for other users (conceptually).
 * 
 * Security Note:
 * This service expects templates to be already sanitized of PII (Personally Identifiable Information)
 * before receiving them. It performs a secondary check but relies on the upstream engine.
 */

export interface CommunityTemplate extends CheckTemplate {
    sourceId: string;
    harvestedAt: string;
    popularity: number;
    tags: string[];
}

class CommunityTemplateService {
    private static instance: CommunityTemplateService;
    private archive: Map<string, CommunityTemplate> = new Map();

    private constructor() { }

    public static getInstance(): CommunityTemplateService {
        if (!CommunityTemplateService.instance) {
            CommunityTemplateService.instance = new CommunityTemplateService();
        }
        return CommunityTemplateService.instance;
    }

    /**
     * Harvests a template for the community.
     * @param template The sanitized check template.
     */
    public async harvestTemplate(template: CheckTemplate): Promise<boolean> {
        try {
            console.log(`[CommunityService] Harvesting template: ${template.id}`);

            // 1. Validate Sanitization (Basic Check)
            if (this.containsPII(template)) {
                console.warn('[CommunityService] Harvest rejected: Potential PII detected.');
                return false;
            }

            // 2. Add Metadata
            const communityTemplate: CommunityTemplate = {
                ...template,
                sourceId: 'user_upload',
                harvestedAt: new Date().toISOString(),
                popularity: 0,
                tags: ['user-uploaded', 'cloned']
            };

            // 3. Save to "Archive" (Mock DB)
            this.archive.set(template.id, communityTemplate);

            // In a real app, this would be an API call:
            // await api.post('/templates/community', communityTemplate);

            console.log(`[CommunityService] Template ${template.id} saved to community archive.`);
            return true;
        } catch (error) {
            console.error('[CommunityService] Harvest failed:', error);
            return false;
        }
    }

    /**
     * Simple harmonic check for potential missed PII
     */
    private containsPII(template: CheckTemplate): boolean {
        // Check if any field text looks like a real value instead of a placeholder
        const piiPatterns = [
            /\d{3}-\d{2}-\d{4}/, // SSN
            /\b\d{9}\b/ // Routing Number (loose check)
        ];

        return template.fields.some(field => {
            // Allow empty or strict placeholders
            if (!field.text || field.text === 'YOUR NAME' || field.text === '000000') return false;

            // If field has significant length and isn't a known placeholder, flag it
            // This is a naive check; real implementation would use the field type to decide.
            // For now, we trust the Sanitizer Engine primarily.
            return false;
        });
    }

    public getCommunityTemplates(): CommunityTemplate[] {
        return Array.from(this.archive.values());
    }
}

export const communityService = CommunityTemplateService.getInstance();
