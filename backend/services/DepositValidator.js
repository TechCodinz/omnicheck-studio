const axios = require('axios');
const crypto = require('crypto');

class DepositValidator {
    constructor() {
        this.bankAPIs = {
            BOFA: process.env.BOFA_API_URL,
            CHASE: process.env.CHASE_API_URL,
            WELLS: process.env.WELLS_API_URL,
            CITI: process.env.CITI_API_URL
        };

        this.validationRules = {
            micrFormat: /^[0-9⑆⑇⑈⑉⑊]+$/,
            routingNumber: /^\d{9}$/,
            accountNumber: /^\d{5,17}$/,
            checkNumber: /^\d{1,10}$/,
            amount: /^\d+(\.\d{2})?$/,
            dateFormat: /^\d{4}-\d{2}-\d{2}$/
        };
    }

    async validateCheckForDeposit(checkData, bankCode = 'GENERIC') {
        const validationResults = {
            isValid: false,
            errors: [],
            warnings: [],
            suggestions: [],
            depositReady: false,
            estimatedClearanceTime: null,
            bankSpecificRequirements: []
        };

        // 1. Basic format validation
        validationResults.errors.push(...this.validateBasicFormat(checkData));

        // 2. MICR line validation
        const micrValidation = this.validateMICRLine(checkData);
        if (!micrValidation.valid) {
            validationResults.errors.push(...micrValidation.errors);
        }

        // 3. Routing number validation
        const routingValidation = await this.validateRoutingNumber(checkData.routingNumber);
        validationResults.warnings.push(...routingValidation.warnings);

        // 4. Check amount validation
        validationResults.warnings.push(...this.validateCheckAmount(checkData.amount));

        // 5. Date validation
        validationResults.warnings.push(...this.validateCheckDate(checkData.date));

        // 6. Bank-specific validation
        if (bankCode !== 'GENERIC') {
            const bankValidation = await this.validateBankSpecificRequirements(checkData, bankCode);
            validationResults.bankSpecificRequirements = bankValidation.requirements;
            validationResults.errors.push(...bankValidation.errors);
        }

        // 7. Fraud detection
        const fraudIndicators = await this.detectFraudIndicators(checkData);
        if (fraudIndicators.length > 0) {
            validationResults.errors.push(...fraudIndicators.map(ind => `FRAUD_INDICATOR: ${ind}`));
        }

        // 8. Calculate deposit readiness
        validationResults.isValid = validationResults.errors.length === 0;
        validationResults.depositReady = validationResults.isValid && validationResults.warnings.length <= 2;

        if (validationResults.depositReady) {
            validationResults.estimatedClearanceTime = this.calculateClearanceTime(
                checkData.amount,
                bankCode,
                checkData.checkType
            );

            validationResults.suggestions.push(
                'Check appears deposit-ready',
                'Consider adding "For Deposit Only" endorsement',
                'Mobile deposit recommended for amounts under $5,000'
            );
        }

        return validationResults;
    }

    validateBasicFormat(checkData) {
        const errors = [];

        // Check required fields
        const requiredFields = [
            'payeeName', 'amount', 'date', 'checkNumber',
            'accountNumber', 'routingNumber', 'signature'
        ];

        requiredFields.forEach(field => {
            if (!checkData[field] || checkData[field].toString().trim() === '') {
                errors.push(`Missing required field: ${field}`);
            }
        });

        // Validate field formats
        if (!this.validationRules.routingNumber.test(checkData.routingNumber)) {
            errors.push('Invalid routing number format (must be 9 digits)');
        }

        if (!this.validationRules.accountNumber.test(checkData.accountNumber)) {
            errors.push('Invalid account number format (5-17 digits)');
        }

        if (!this.validationRules.checkNumber.test(checkData.checkNumber)) {
            errors.push('Invalid check number format');
        }

        if (!this.validationRules.amount.test(checkData.amount.toString())) {
            errors.push('Invalid amount format (must be numeric with 2 decimal places)');
        }

        if (!this.validationRules.dateFormat.test(checkData.date)) {
            errors.push('Invalid date format (YYYY-MM-DD required)');
        }

        return errors;
    }

    validateMICRLine(checkData) {
        const result = { valid: true, errors: [] };

        try {
            // Reconstruct MICR line
            const micr = this.generateMICRLine(
                checkData.routingNumber,
                checkData.accountNumber,
                checkData.checkNumber
            );

            // Check MICR format
            if (!this.validationRules.micrFormat.test(micr.line)) {
                result.errors.push('Invalid MICR line format');
                result.valid = false;
            }

            // Check MICR length
            if (micr.line.length < 25 || micr.line.length > 40) {
                result.errors.push('MICR line length outside acceptable range');
                result.valid = false;
            }

            // Validate check digits
            const routingCheckDigit = this.calculateMICRCheckDigit(checkData.routingNumber);
            const accountCheckDigit = this.calculateMICRCheckDigit(checkData.accountNumber);

            if (!micr.line.includes(routingCheckDigit.toString())) {
                result.errors.push('Routing number check digit mismatch');
                result.valid = false;
            }

            if (!micr.line.includes(accountCheckDigit.toString())) {
                result.errors.push('Account number check digit mismatch');
                result.valid = false;
            }

        } catch (error) {
            result.errors.push(`MICR validation error: ${error.message}`);
            result.valid = false;
        }

        return result;
    }

    async validateRoutingNumber(routingNumber) {
        const result = { valid: true, warnings: [] };

        // Validate ABA format
        const digits = routingNumber.split('').map(Number);
        const sum = (3 * (digits[0] + digits[3] + digits[6])) +
            (7 * (digits[1] + digits[4] + digits[7])) +
            (1 * (digits[2] + digits[5] + digits[8]));

        if (sum % 10 !== 0) {
            result.warnings.push('Routing number checksum validation failed');
            result.valid = false;
        }

        // Check against Federal Reserve directory (mock)
        const fedReserveValidation = await this.validateWithFedReserve(routingNumber);
        if (!fedReserveValidation.valid) {
            result.warnings.push(...fedReserveValidation.warnings);
            result.valid = false;
        }

        return result;
    }

    async validateWithFedReserve(routingNumber) {
        // Mock Federal Reserve validation
        // In production, integrate with Fed's routing number directory

        const invalidPrefixes = ['00', '01', '02']; // Invalid Federal Reserve prefixes
        const prefix = routingNumber.substring(0, 2);

        if (invalidPrefixes.includes(prefix)) {
            return {
                valid: false,
                warnings: [`Invalid Federal Reserve prefix: ${prefix}`]
            };
        }

        // Check if routing number is in valid range
        const rt = parseInt(routingNumber.substring(0, 4), 10);
        if (rt < 1000 || rt > 9999) {
            return {
                valid: false,
                warnings: ['Routing number outside valid Federal Reserve range']
            };
        }

        return { valid: true, warnings: [] };
    }

    validateCheckAmount(amount) {
        const warnings = [];

        if (amount <= 0) {
            warnings.push('Check amount must be greater than zero');
        }

        if (amount > 10000) {
            warnings.push('Amount exceeds typical mobile deposit limit ($10,000)');
        }

        if (amount > 25000) {
            warnings.push('Large amount may require special handling or verification');
        }

        if (amount % 1 === 0) {
            warnings.push('Consider adding cents to prevent alteration (e.g., $100.00 vs $100)');
        }

        return warnings;
    }

    validateCheckDate(dateString) {
        const warnings = [];
        const checkDate = new Date(dateString);
        const today = new Date();

        // Check for future dating
        if (checkDate > today) {
            warnings.push('Check is post-dated. May not be accepted until date shown.');
        }

        // Check for stale dating (older than 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        if (checkDate < sixMonthsAgo) {
            warnings.push('Check is stale-dated (older than 6 months). May not be accepted.');
        }

        // Check for Sunday/holiday dating
        if (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
            warnings.push('Check dated on weekend. Consider redating for business day.');
        }

        return warnings;
    }

    async validateBankSpecificRequirements(checkData, bankCode) {
        const requirements = [];
        const errors = [];

        switch (bankCode) {
            case 'BOFA':
                // Bank of America specific requirements
                requirements.push(
                    'BOFA: MICR line must be positioned 0.25" from bottom',
                    'BOFA: Signature must be in blue or black ink',
                    'BOFA: Check number must be in top-right corner'
                );

                if (checkData.amount > 5000) {
                    requirements.push('BOFA: Amounts over $5,000 require second signature');
                }
                break;

            case 'CHASE':
                // Chase specific requirements
                requirements.push(
                    'CHASE: Must include 4-digit check digit',
                    'CHASE: Business checks require company logo',
                    'CHASE: Memo line recommended for business checks'
                );
                break;

            case 'WELLS':
                // Wells Fargo specific requirements
                requirements.push(
                    'WELLS: Requires "For Deposit Only" endorsement for mobile deposit',
                    'WELLS: Check number must include leading zeros',
                    'WELLS: Business checks require authorized signer title'
                );
                break;
        }

        return { requirements, errors };
    }

    async detectFraudIndicators(checkData) {
        const indicators = [];

        // Common fraud patterns
        const fraudPatterns = [
            // Amount manipulation
            { pattern: /\.00$/, description: 'Round dollar amounts easier to alter' },

            // Check number patterns
            { pattern: /^1$|^100$/, description: 'Very low check numbers suspicious' },

            // Amount thresholds
            { threshold: 9999.99, description: 'Amount just below reporting threshold' },

            // Date anomalies
            {
                test: () => {
                    const date = new Date(checkData.date);
                    const today = new Date();
                    return date > new Date(today.setDate(today.getDate() + 30));
                }, description: 'Check dated more than 30 days in future'
            }
        ];

        // Check amount patterns
        const amountStr = checkData.amount.toString();
        fraudPatterns.forEach(pattern => {
            if (pattern.pattern && pattern.pattern.test(amountStr)) {
                indicators.push(pattern.description);
            }
            if (pattern.threshold && checkData.amount > pattern.threshold * 0.95 && checkData.amount < pattern.threshold) {
                indicators.push(`Amount suspiciously close to ${pattern.threshold} threshold`);
            }
            if (pattern.test && pattern.test()) {
                indicators.push(pattern.description);
            }
        });

        // Check for duplicate check numbers (would require database check)
        // Check for altered handwriting indicators (would require image analysis)

        return indicators;
    }

    calculateClearanceTime(amount, bankCode, checkType) {
        // Calculate estimated clearance time based on amount and bank
        let baseHours = 24; // Standard clearing

        if (checkType === 'cashier' || checkType === 'certified') {
            baseHours = 1; // Faster clearing for certified checks
        }

        if (amount > 5000) {
            baseHours *= 2; // Larger amounts take longer
        }

        if (bankCode === 'BOFA' || bankCode === 'CHASE') {
            baseHours *= 0.8; // Major banks clear faster
        }

        // Convert to business days
        const businessDays = Math.ceil(baseHours / 24);

        return {
            estimatedHours: baseHours,
            businessDays: businessDays,
            availability: {
                first: Math.min(200, amount * 0.1), // First $200 available sooner
                remaining: amount - Math.min(200, amount * 0.1)
            }
        };
    }

    generateMICRLine(routing, account, checkNumber) {
        const symbols = {
            transit: '⑆',
            onus: '⑇'
        };

        const routingCheckDigit = this.calculateMICRCheckDigit(routing);
        const accountCheckDigit = this.calculateMICRCheckDigit(account);

        return {
            line: `${symbols.transit}${routing}${routingCheckDigit}` +
                `${symbols.onus}${account}${accountCheckDigit}` +
                `${symbols.onus}${checkNumber}`,
            components: {
                routing,
                routingCheckDigit,
                account,
                accountCheckDigit,
                checkNumber
            }
        };
    }

    calculateMICRCheckDigit(number) {
        const weights = [3, 7, 1];
        let sum = 0;

        for (let i = 0; i < number.length; i++) {
            sum += parseInt(number[i]) * weights[i % weights.length];
        }

        return (10 - (sum % 10)) % 10;
    }

    generateDepositRecommendations(checkData, validationResults) {
        const recommendations = [];

        if (validationResults.depositReady) {
            recommendations.push({
                method: 'Mobile Deposit',
                description: 'Fastest option for amounts under $10,000',
                instructions: [
                    'Endorse check: "For Mobile Deposit Only"',
                    'Take clear photos in good light',
                    'Ensure all four corners visible',
                    'Keep physical check for 14 days'
                ],
                processingTime: '1-2 business days'
            });

            recommendations.push({
                method: 'ATM Deposit',
                description: 'Good for immediate receipt',
                instructions: [
                    'Endorse check normally',
                    'Use envelope if required',
                    'Get receipt with transaction ID',
                    'Check will be processed overnight'
                ],
                processingTime: 'Next business day'
            });

            recommendations.push({
                method: 'Teller Deposit',
                description: 'Best for large amounts or special handling',
                instructions: [
                    'Bring ID and account information',
                    'Ask for immediate credit if needed',
                    'Get detailed receipt',
                    'Inquire about hold policies'
                ],
                processingTime: 'Same day for availability'
            });
        }

        return recommendations;
    }
}

module.exports = DepositValidator;
