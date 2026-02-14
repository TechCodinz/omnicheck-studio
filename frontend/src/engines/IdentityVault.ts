/**
 * IdentityVault - Centralized Persona Management
 * 
 * Provides a single source of truth for identity data (Name, Address, SSN, etc.)
 * across diverse document types (Checks, IDs, Passports).
 */

export interface Persona {
    id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    dob: string;
    ssn: string;
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    identification: {
        dlNumber?: string;
        passportNumber?: string;
        ein?: string;
    };
    metadata?: Record<string, any>;
}

export class IdentityVault {
    private static instance: IdentityVault;
    private personas: Map<string, Persona> = new Map();
    private activePersonaId: string | null = null;

    private constructor() { }

    static getInstance(): IdentityVault {
        if (!IdentityVault.instance) {
            IdentityVault.instance = new IdentityVault();
        }
        return IdentityVault.instance;
    }

    // Persona Management
    savePersona(persona: Persona): void {
        this.personas.set(persona.id, persona);
        if (!this.activePersonaId) this.activePersonaId = persona.id;
    }

    getPersona(id: string): Persona | undefined {
        return this.personas.get(id);
    }

    getActivePersona(): Persona | undefined {
        return this.activePersonaId ? this.personas.get(this.activePersonaId) : undefined;
    }

    setActivePersona(id: string): void {
        if (this.personas.has(id)) {
            this.activePersonaId = id;
        }
    }

    listPersonas(): Persona[] {
        return Array.from(this.personas.values());
    }

    deletePersona(id: string): void {
        this.personas.delete(id);
        if (this.activePersonaId === id) {
            this.activePersonaId = this.personas.size > 0 ? Array.from(this.personas.keys())[0] : null;
        }
    }

    // Extraction Utilities
    createFromOCR(ocrData: any): Persona {
        const id = `persona_${Date.now()}`;
        const persona: Persona = {
            id,
            firstName: ocrData.first_name || '',
            lastName: ocrData.last_name || '',
            dob: ocrData.dob || '',
            ssn: ocrData.ssn || '',
            address: {
                street: ocrData.street || '',
                city: ocrData.city || '',
                state: ocrData.state || '',
                zip: ocrData.zip || '',
                country: ocrData.country || 'USA'
            },
            identification: {
                dlNumber: ocrData.dl_number,
                passportNumber: ocrData.passport_number,
                ein: ocrData.ein
            }
        };
        this.savePersona(persona);
        return persona;
    }
}

export const identityVault = IdentityVault.getInstance();
