
export interface CheckData {
    id: string;
    checkNumber: string;
    amount: number;
    payeeName: string;
    date: string;
    memo?: string;
    routingNumber: string;
    accountNumber: string;
    companyLogo?: string;
    // Add other necessary properties
}

export interface UniversalOptimization {
    enhancedFeatures: {
        mobileDeposit?: MobileOptimization;
        digitalBanks?: DigitalBankOptimization;
        prepaidCards?: PrepaidOptimization;
        printReady?: boolean; // Type simplified for brevity
        emailReady?: EmailOptimization;
        mailReady?: MailOptimization;
    };
    compatibilityScores: Record<string, number>;
    recommendedBanks: string[];
    depositMethods: string[];
    warnings: string[];
    optimizationsApplied: string[];
}

export interface MobileOptimization {
    cornerMarkers: any;
    glareReduction: any;
    imageEnhancement: any;
    autoCropGuides: any;
    qrCode: any;
}

export interface DigitalBankOptimization {
    enhancedSecurity: any;
    verificationFeatures: any;
    compliance: any;
}

export interface PrepaidOptimization {
    endorsementArea: any;
    limitsDisplay: any;
    feeInformation: any;
    customerService: any;
}

export interface EmailOptimization {
    format: string;
    compression: any;
    security: any;
    metadata: any;
}

export interface MailOptimization {
    envelopeTemplate: any;
    printingGuide: any;
    mailingInstructions: any;
}

export interface DepositInstructions {
    bank: string;
    method: string;
    steps: string[];
    tips: string[];
    estimatedTime: string;
    fees: string;
    limits: string;
}

export interface QRCodeData {
    data: string;
    type: string;
    size: number;
    margin: number;
    color: { dark: string; light: string };
    logo: string | null;
    logoSize: number;
    logoBackgroundColor: string;
}


export class UniversalBankCompatibility {
    // Comprehensive bank database with specific requirements
    private bankSpecs: any = {
        // Traditional Banks
        BOFA: {
            name: 'Bank of America',
            mobileApp: 'Bank of America Mobile Banking',
            acceptance: 100,
            requirements: {
                micr: { height: '0.125"', position: '0.25" from bottom' },
                layout: '3.5" x 8.5"',
                signature: 'must be handwritten simulation',
                security: ['watermark', 'security-fibers', 'microprint']
            },
            mobileFeatures: {
                cornerMarkers: true,
                glareReduction: true,
                autoCrop: true
            }
        },

        CHASE: {
            name: 'Chase Bank',
            mobileApp: 'Chase Mobile',
            acceptance: 100,
            requirements: {
                micr: { font: 'E-13B', ink: 'magnetic' },
                routingNumber: 'valid ABA with check digit',
                amount: { maxMobile: 10000 },
                date: { staleDays: 180 }
            },
            depositMethods: ['mobile', 'atm', 'branch', 'mail']
        },

        // Digital Banks & Prepaid
        CHIME: {
            name: 'Chime Financial',
            mobileApp: 'Chime Mobile Banking',
            acceptance: 98,
            specialRequirements: {
                // Chime accepts mobile deposits only
                depositMethod: 'mobile-only',
                // Enhanced requirements for digital-only banks
                imageQuality: 'high',
                cornersVisible: true,
                noShadows: true,
                micrReadable: 'must be perfectly clear',
                // Chime specific: Must show account holder name clearly
                accountHolderVisible: true,
                // For prepaid cards attached to checking
                prepaidCompatible: true,
                // Chime doesn't accept third-party checks easily
                payeeMustMatchAccount: true
            },
            optimization: {
                brightness: 1.2,
                contrast: 1.3,
                sharpness: 1.1,
                removeShadows: true,
                addBorder: 'white 10px'
            },
            limits: {
                daily: 10000,
                monthly: 50000,
                perCheck: 5000, // Conservative limit for Chime
                holdPeriod: '5 business days' // Longer holds for new accounts
            }
        },

        CASHAPP: {
            name: 'Cash App',
            type: 'prepaid/fintech',
            acceptance: 95,
            requirements: {
                checkType: ['personal', 'payroll', 'government'],
                amount: { min: 1, max: 25000 },
                age: 'less than 90 days',
                issuer: 'US banks only'
            },
            mobileOptimization: {
                qrCode: true,
                endorsementArea: 'highlighted',
                trackingNumber: 'required'
            }
        },

        VENMO: {
            name: 'Venmo',
            type: 'payments/fintech',
            acceptance: 90,
            requirements: {
                endorsement: '"For mobile deposit only to Venmo account"',
                memo: 'Venmo username recommended',
                imageQuality: 'excellent'
            }
        },

        PAYPAL: {
            name: 'PayPal',
            type: 'digital wallet',
            acceptance: 92,
            requirements: {
                checkTypes: ['personal', 'business', 'payroll'],
                holdPeriod: '3-5 business days',
                fees: '1% for instant deposit',
                limits: {
                    daily: 10000,
                    monthly: 50000
                }
            }
        },

        NETSPEND: {
            name: 'NetSpend',
            type: 'prepaid card',
            acceptance: 88,
            requirements: {
                mobileOnly: true,
                endorsement: 'Required on back',
                verification: 'ID may be required',
                limits: {
                    daily: 5000,
                    monthly: 15000
                }
            }
        },

        GREENDOT: {
            name: 'GreenDot',
            type: 'prepaid card/bank',
            acceptance: 85,
            requirements: {
                mobileDeposit: true,
                inNetwork: 'Walmart, Walgreens, CVS',
                fees: 'up to $4.95 per deposit',
                limits: {
                    daily: 3000,
                    monthly: 10000
                }
            }
        },

        // Government & Specialty
        TREASURY: {
            name: 'US Treasury',
            type: 'government',
            acceptance: 100,
            requirements: {
                format: 'Treasury Check',
                security: 'highest level',
                voidIfCopied: true,
                microprint: 'required',
                serialNumber: 'must be valid'
            }
        },

        // International Compatibility
        HSBC: {
            name: 'HSBC',
            international: true,
            acceptance: 95,
            requirements: {
                currency: 'USD',
                routing: 'US routing number required',
                endorsement: 'For US accounts only'
            }
        }
    };

    // Universal check optimization
    optimizeForAllBanks(check: CheckData): UniversalOptimization {
        const optimizations: UniversalOptimization = {
            enhancedFeatures: {},
            compatibilityScores: {},
            recommendedBanks: [],
            depositMethods: [],
            warnings: [],
            optimizationsApplied: []
        };

        // 1. Mobile Deposit Optimization
        optimizations.enhancedFeatures.mobileDeposit = this.optimizeForMobile(check);

        // 2. Digital Bank Optimization
        optimizations.enhancedFeatures.digitalBanks = this.optimizeForDigital(check);

        // 3. Prepaid Card Optimization
        optimizations.enhancedFeatures.prepaidCards = this.optimizeForPrepaid(check);

        // 4. Print Optimization
        optimizations.enhancedFeatures.printReady = this.optimizeForPrinting(check);

        // 5. Email Optimization
        optimizations.enhancedFeatures.emailReady = this.optimizeForEmail(check);

        // 6. Mail Optimization
        optimizations.enhancedFeatures.mailReady = this.optimizeForMail(check);

        // Calculate compatibility scores
        Object.keys(this.bankSpecs).forEach(bankCode => {
            optimizations.compatibilityScores[bankCode] =
                this.calculateCompatibilityScore(check, bankCode);
        });

        // Recommend banks based on check type and amount
        optimizations.recommendedBanks = this.recommendBanks(check);

        // Recommend deposit methods
        optimizations.depositMethods = this.recommendDepositMethods(check);

        return optimizations;
    }

    private optimizeForMobile(check: CheckData): MobileOptimization {
        return {
            cornerMarkers: {
                enabled: true,
                color: '#000000',
                size: '15px',
                position: { tl: true, tr: true, bl: true, br: true }
            },
            glareReduction: {
                matteBackground: true,
                antiReflectiveCoating: true,
                shadowElimination: true
            },
            imageEnhancement: {
                brightness: 1.1,
                contrast: 1.2,
                sharpness: 1.05,
                noiseReduction: true
            },
            autoCropGuides: {
                enabled: true,
                color: '#FF0000',
                opacity: 0.3
            },
            qrCode: {
                enabled: true,
                data: this.generateDepositQRData(check),
                position: 'bottom-right',
                size: '100x100px'
            }
        };
    }

    private optimizeForDigital(check: CheckData): DigitalBankOptimization {
        return {
            enhancedSecurity: {
                // Digital banks need extra security
                digitalWatermark: true,
                invisibleTracking: true,
                timestamp: Date.now(),
                // geotag: 'optional' // Removed for strict types if not needed or make interface looser
            },
            verificationFeatures: {
                accountHolderVerification: true,
                amountVerificationBox: true,
                signatureVerificationZone: true
            },
            compliance: {
                kycReady: true, // Know Your Customer
                amlReady: true, // Anti-Money Laundering
                fraudDetectionMarkers: true
            }
        };
    }

    private optimizeForPrepaid(check: CheckData): PrepaidOptimization {
        return {
            endorsementArea: {
                highlighted: true,
                instructions: 'For mobile deposit only',
                requiredText: 'Endorsement required on back'
            },
            limitsDisplay: {
                showDailyLimit: true,
                showMonthlyLimit: true,
                showHoldPeriod: true
            },
            feeInformation: {
                displayPotentialFees: true,
                estimatedFees: this.calculatePrepaidFees(check.amount)
            },
            customerService: {
                phoneNumber: '1-800-CHIME-BANK',
                website: 'chime.com/deposit-help',
                hours: '24/7'
            }
        };
    }

    private optimizeForEmail(check: CheckData): EmailOptimization {
        return {
            format: 'PDF/A-2u', // Universal PDF format
            compression: {
                enabled: true,
                quality: 'high',
                targetSize: '500KB'
            },
            security: {
                passwordProtection: true,
                encryption: 'AES-256',
                watermark: 'Confidential'
            },
            metadata: {
                title: `Check #${check.checkNumber}`,
                subject: `Payment to ${check.payeeName}`,
                keywords: ['check', 'payment', 'financial']
            }
        };
    }

    private optimizeForMail(check: CheckData): MailOptimization {
        return {
            envelopeTemplate: {
                windowPosition: 'aligned with address',
                returnAddress: 'optional',
                postageArea: 'top-right'
            },
            printingGuide: {
                cropMarks: true,
                bleedArea: '0.125"',
                safeZone: '0.25" from edges'
            },
            mailingInstructions: {
                postage: 'First Class recommended',
                tracking: 'USPS tracking recommended',
                insurance: 'For amounts over $500'
            }
        };
    }

    private optimizeForPrinting(check: CheckData): boolean {
        return true;
    }

    private calculateCompatibilityScore(check: CheckData, bankCode: string): number {
        return 100; // Placeholder
    }

    private recommendBanks(check: CheckData): string[] {
        return ['BOFA', 'CHASE'];
    }

    private recommendDepositMethods(check: CheckData): string[] {
        return ['Mobile', 'Branch'];
    }

    private calculatePrepaidFees(amount: number): string {
        return '$0.00';
    }

    private generateDepositQRData(check: CheckData): string {
        return `DEPOSIT:${check.amount}`;
    }

    private getBestDepositMethod(bankCode: string, amount: number): string {
        return 'Mobile';
    }

    // Generate deposit instructions for each bank
    generateDepositInstructions(check: CheckData, bankCode: string): DepositInstructions {
        const bank = this.bankSpecs[bankCode];
        const instructions: DepositInstructions = {
            bank: bank ? bank.name : bankCode,
            method: this.getBestDepositMethod(bankCode, check.amount),
            steps: [],
            tips: [],
            estimatedTime: '',
            fees: '',
            limits: ''
        };

        switch (bankCode) {
            case 'CHIME':
                instructions.method = 'mobile';
                instructions.steps = [
                    'Open Chime mobile app',
                    'Tap "Move Money" then "Deposit Check"',
                    'Take photos of front and back',
                    'Ensure all corners are visible',
                    'No shadows or glare on check',
                    'MICR line must be clearly readable',
                    'Endorse back with "For mobile deposit only"',
                    'Enter amount exactly as shown',
                    'Submit and wait for confirmation'
                ];
                instructions.tips = [
                    'Deposit before 7 PM ET for same-day processing',
                    'First $200 available immediately',
                    'Remaining balance available in 5 business days',
                    'Keep physical check for 14 days',
                    'Do NOT attempt to deposit elsewhere'
                ];
                instructions.estimatedTime = '1-5 business days';
                instructions.fees = 'No fees for standard deposit';
                instructions.limits = '$10,000 daily, $50,000 monthly';
                break;

            case 'CASHAPP':
                instructions.method = 'mobile';
                instructions.steps = [
                    'Open Cash App',
                    'Tap Banking tab (building icon)',
                    'Select "Deposit Check"',
                    'Enter check amount',
                    'Take photos of front and back',
                    'Endorse with signature and "For Cash App mobile deposit only"',
                    'Review and confirm'
                ];
                instructions.tips = [
                    'Available to users with activated Cash Card',
                    'Deposits may take 1-4 business days',
                    'Instant deposit available for 1% fee',
                    'Government checks may have longer holds'
                ];
                break;

            // Add other banks...
        }

        return instructions;
    }

    // Generate universal QR code for mobile deposit
    generateUniversalQR(check: CheckData): QRCodeData {
        const depositData = {
            checkNumber: check.checkNumber,
            amount: check.amount,
            payee: check.payeeName,
            routing: check.routingNumber,
            account: check.accountNumber,
            date: check.date,
            memo: check.memo,
            depositInstructions: this.generateDepositInstructions(check, 'CHIME'),
            timestamp: Date.now(),
            generator: 'UltraCheck Pro',
            version: '2.0'
        };

        return {
            data: JSON.stringify(depositData),
            type: 'deposit-instructions',
            size: 256,
            margin: 4,
            color: {
                dark: '#000000',
                light: '#ffffff'
            },
            logo: check.companyLogo || null,
            logoSize: 60,
            logoBackgroundColor: '#ffffff'
        };
    }
}
