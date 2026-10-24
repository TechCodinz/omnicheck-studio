/**
 * EncryptionService - Bank-Grade Data Protection
 * 
 * Features:
 * - AES-256-GCM encryption for data at rest
 * - Field-level encryption for PII
 * - Automatic key rotation
 * - Secure key derivation (PBKDF2)
 */

import crypto from 'crypto';

interface EncryptedData {
    ciphertext: string;
    iv: string;
    tag: string;
    version: number;
    algorithm: string;
}

interface EncryptionKey {
    id: string;
    key: Buffer;
    createdAt: Date;
    rotateAt: Date;
    status: 'active' | 'rotating' | 'retired';
}

interface PIIField {
    fieldName: string;
    encrypted: boolean;
    sensitivity: 'low' | 'medium' | 'high' | 'critical';
}

export class EncryptionService {
    private algorithm: 'aes-256-gcm' = 'aes-256-gcm';
    private keyLength = 32; // 256 bits
    private ivLength = 16;
    private tagLength = 16;
    private currentKeyVersion = 1;
    private keys: Map<string, EncryptionKey> = new Map();

    // PII fields that require encryption
    private piiFields: PIIField[] = [
        { fieldName: 'accountNumber', encrypted: true, sensitivity: 'critical' },
        { fieldName: 'routingNumber', encrypted: true, sensitivity: 'critical' },
        { fieldName: 'checkNumber', encrypted: true, sensitivity: 'high' },
        { fieldName: 'payeeName', encrypted: true, sensitivity: 'medium' },
        { fieldName: 'amount', encrypted: true, sensitivity: 'high' },
        { fieldName: 'signature', encrypted: true, sensitivity: 'critical' },
        { fieldName: 'micrLine', encrypted: true, sensitivity: 'critical' }
    ];

    constructor() {
        this.initializeMasterKey();
    }

    private initializeMasterKey(): void {
        // In production, use AWS KMS, HashiCorp Vault, or similar
        const masterKeyEnv = process.env.ENCRYPTION_MASTER_KEY;
        let masterKeyBuffer: Buffer;

        if (masterKeyEnv) {
            masterKeyBuffer = Buffer.from(masterKeyEnv, 'hex');
        } else {
            // Generate a new key for development (should be persisted securely)
            masterKeyBuffer = crypto.randomBytes(this.keyLength);
            console.warn('⚠️ Generated new encryption key - persist ENCRYPTION_MASTER_KEY for production');
        }

        const keyId = `key_v${this.currentKeyVersion}`;
        this.keys.set(keyId, {
            id: keyId,
            key: masterKeyBuffer,
            createdAt: new Date(),
            rotateAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            status: 'active'
        });
    }

    /**
     * Encrypt data using AES-256-GCM
     */
    encrypt(plaintext: string): EncryptedData {
        const activeKey = this.getActiveKey();
        const iv = crypto.randomBytes(this.ivLength);

        const cipher = crypto.createCipheriv(this.algorithm, activeKey.key, iv, {
            authTagLength: this.tagLength
        });

        let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
        ciphertext += cipher.final('hex');
        const tag = cipher.getAuthTag();

        return {
            ciphertext,
            iv: iv.toString('hex'),
            tag: tag.toString('hex'),
            version: this.currentKeyVersion,
            algorithm: this.algorithm
        };
    }

    /**
     * Decrypt data
     */
    decrypt(encryptedData: EncryptedData): string {
        const keyId = `key_v${encryptedData.version}`;
        const key = this.keys.get(keyId);

        if (!key) {
            throw new Error(`Encryption key version ${encryptedData.version} not found`);
        }

        const decipher = crypto.createDecipheriv(
            encryptedData.algorithm as 'aes-256-gcm',
            key.key,
            Buffer.from(encryptedData.iv, 'hex'),
            { authTagLength: this.tagLength }
        );

        decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

        let plaintext = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
        plaintext += decipher.final('utf8');

        return plaintext;
    }

    /**
     * Encrypt specific PII fields in an object
     */
    encryptPII<T extends Record<string, any>>(data: T): T {
        const encrypted: Record<string, any> = { ...data };

        for (const field of this.piiFields) {
            if (field.encrypted && encrypted[field.fieldName] !== undefined) {
                const value = encrypted[field.fieldName];
                if (typeof value === 'string' || typeof value === 'number') {
                    encrypted[field.fieldName] = this.encrypt(String(value));
                }
            }
        }

        return encrypted as T;
    }

    /**
     * Decrypt specific PII fields in an object
     */
    decryptPII<T extends Record<string, any>>(data: T): T {
        const decrypted: Record<string, any> = { ...data };

        for (const field of this.piiFields) {
            if (field.encrypted && decrypted[field.fieldName]) {
                const encryptedField = decrypted[field.fieldName];
                if (this.isEncryptedData(encryptedField)) {
                    decrypted[field.fieldName] = this.decrypt(encryptedField);
                }
            }
        }

        return decrypted as T;
    }

    /**
     * Hash sensitive data for comparison without exposing raw value
     */
    hash(data: string): string {
        const salt = process.env.HASH_SALT || 'default-salt-change-in-production';
        return crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512').toString('hex');
    }

    /**
     * Generate a secure token
     */
    generateSecureToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Derive an encryption key from password
     */
    deriveKey(password: string, salt?: string): { key: Buffer; salt: string } {
        const usedSalt = salt || crypto.randomBytes(16).toString('hex');
        const key = crypto.pbkdf2Sync(password, usedSalt, 100000, this.keyLength, 'sha512');
        return { key, salt: usedSalt };
    }

    /**
     * Rotate encryption keys
     */
    async rotateKey(): Promise<void> {
        // Mark current key as rotating
        const currentKeyId = `key_v${this.currentKeyVersion}`;
        const currentKey = this.keys.get(currentKeyId);
        if (currentKey) {
            currentKey.status = 'rotating';
        }

        // Generate new key
        this.currentKeyVersion++;
        const newKeyId = `key_v${this.currentKeyVersion}`;
        const newKey = crypto.randomBytes(this.keyLength);

        this.keys.set(newKeyId, {
            id: newKeyId,
            key: newKey,
            createdAt: new Date(),
            rotateAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            status: 'active'
        });

        // Retire old key after grace period (keep for decryption)
        if (currentKey) {
            setTimeout(() => {
                currentKey.status = 'retired';
            }, 24 * 60 * 60 * 1000); // 24 hours
        }

        console.log(`🔑 Key rotated to version ${this.currentKeyVersion}`);
    }

    /**
     * Check if data appears to be encrypted
     */
    private isEncryptedData(data: any): data is EncryptedData {
        return (
            data &&
            typeof data === 'object' &&
            typeof data.ciphertext === 'string' &&
            typeof data.iv === 'string' &&
            typeof data.tag === 'string' &&
            typeof data.version === 'number'
        );
    }

    private getActiveKey(): EncryptionKey {
        const keyId = `key_v${this.currentKeyVersion}`;
        const key = this.keys.get(keyId);
        if (!key || key.status !== 'active') {
            throw new Error('No active encryption key available');
        }
        return key;
    }

    /**
     * Encrypt a file/buffer
     */
    encryptBuffer(buffer: Buffer): { encrypted: Buffer; metadata: Omit<EncryptedData, 'ciphertext'> } {
        const activeKey = this.getActiveKey();
        const iv = crypto.randomBytes(this.ivLength);

        const cipher = crypto.createCipheriv(this.algorithm, activeKey.key, iv, {
            authTagLength: this.tagLength
        });

        const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
        const tag = cipher.getAuthTag();

        return {
            encrypted,
            metadata: {
                iv: iv.toString('hex'),
                tag: tag.toString('hex'),
                version: this.currentKeyVersion,
                algorithm: this.algorithm
            }
        };
    }

    /**
     * Decrypt a file/buffer
     */
    decryptBuffer(encrypted: Buffer, metadata: Omit<EncryptedData, 'ciphertext'>): Buffer {
        const keyId = `key_v${metadata.version}`;
        const key = this.keys.get(keyId);

        if (!key) {
            throw new Error(`Key version ${metadata.version} not found`);
        }

        const decipher = crypto.createDecipheriv(
            metadata.algorithm as 'aes-256-gcm',
            key.key,
            Buffer.from(metadata.iv, 'hex'),
            { authTagLength: this.tagLength }
        );

        decipher.setAuthTag(Buffer.from(metadata.tag, 'hex'));

        return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    }

    /**
     * Get key rotation status
     */
    getKeyStatus(): { version: number; rotateAt: Date; status: string }[] {
        return Array.from(this.keys.values()).map(k => ({
            version: parseInt(k.id.replace('key_v', '')),
            rotateAt: k.rotateAt,
            status: k.status
        }));
    }
}

export const encryptionService = new EncryptionService();
