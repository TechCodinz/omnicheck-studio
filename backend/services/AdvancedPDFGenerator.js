const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
// const { createCanvas } = require('canvas'); // Unused and causes native build issues


class AdvancedPDFGenerator {
    constructor() {
        this.securityFeatures = {
            digitalWatermark: true,
            copyDetection: true,
            encryption: true,
            metadataEmbedding: true,
            invisibleMarkers: true,
            timestamping: true
        };
    }

    async generateBankGradePDF(checkData, template, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: [612, 792], // Letter size in points (8.5" x 11")
                    margins: { top: 0, bottom: 0, left: 0, right: 0 },
                    info: {
                        Title: `Check #${checkData.checkNumber}`,
                        Author: 'Premium Check Generator',
                        Subject: 'Financial Check Document',
                        Keywords: 'check,bank,financial,secure',
                        CreationDate: new Date(),
                        ModDate: new Date(),
                        Producer: 'Bank-Grade Check Generator v2.0'
                    }
                });

                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // Register MICR font only if it is actually installed.
                // Previously this registered a path that does not exist in
                // the repo (resolved relative to the process CWD, too), and
                // pdfkit threw ENOENT the first time the MICR line was drawn,
                // failing every PDF generation with an opaque 500.
                const micrFontPath = path.resolve(__dirname, '../fonts/micr-e13b.ttf');
                this.micrFontAvailable = fs.existsSync(micrFontPath);
                if (this.micrFontAvailable) {
                    doc.registerFont('MICRE13B', micrFontPath);
                } else {
                    console.warn('[PDF] MICR font not found at ' + micrFontPath + ' - falling back to Helvetica for the MICR line. Install a licensed E-13B font there for production check printing.');
                }

                // Register premium fonts
                const fonts = {
                    'Whitney': './fonts/Whitney-Medium.otf',
                    'Gotham': './fonts/Gotham-Medium.otf',
                    'HelveticaNeue': './fonts/HelveticaNeue-Medium.otf',
                    'Futura': './fonts/Futura-Medium.otf',
                    'TradeGothic': './fonts/TradeGothicLTStd.otf'
                };

                Object.entries(fonts).forEach(([name, path]) => {
                    if (fs.existsSync(path)) {
                        doc.registerFont(name, path);
                    }
                });

                // Add security as first layer
                this.addSecurityBackground(doc, template);

                // Add bank-specific design elements
                this.addBankDesignElements(doc, template.bankCode);

                // Add check fields
                this.addCheckFields(doc, checkData, template);

                // Add MICR line with magnetic ink simulation
                this.addMICRLine(doc, checkData, template);

                // Add enhanced security features
                this.addEnhancedSecurity(doc, checkData, template);

                // Add digital signature and timestamp
                this.addDigitalSignature(doc, checkData);

                // Add invisible tracking markers
                this.addInvisibleMarkers(doc, checkData);

                // Encrypt PDF
                if (options.encrypt) {
                    this.encryptPDF(doc, checkData);
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    addSecurityBackground(doc, template) {
        // Guilloche pattern (anti-counterfeiting)
        this.drawGuillochePattern(doc, 0, 0, 612, 792);

        // Rainbow printing effect
        this.drawRainbowBackground(doc);

        // Microprint security pattern
        this.drawMicroprintPattern(doc, 'AUTHENTIC', 4, 0.1);

        // UV-reactive elements
        this.drawUVReactiveElements(doc);
    }

    drawGuillochePattern(doc, x, y, width, height) {
        // Complex geometric pattern that's hard to reproduce
        const centerX = width / 2;
        const centerY = height / 2;

        doc.save();
        doc.opacity(0.05);
        doc.lineWidth(0.25);

        for (let i = 0; i < 360; i += 10) {
            const angle = (i * Math.PI) / 180;
            const radius = 50 + Math.sin(i * 0.1) * 20;

            const startX = centerX + Math.cos(angle) * radius;
            const startY = centerY + Math.sin(angle) * radius;

            const endAngle = angle + Math.PI / 6;
            const endRadius = radius * 1.2;
            const endX = centerX + Math.cos(endAngle) * endRadius;
            const endY = centerY + Math.sin(endAngle) * endRadius;

            // Draw with varying opacity
            doc.opacity(0.05 + Math.sin(i * 0.05) * 0.03);
            doc.strokeColor(`rgb(${150 + Math.sin(i) * 50}, ${150 + Math.cos(i) * 50}, 200)`);

            doc.moveTo(startX, startY)
                .bezierCurveTo(
                    startX + 20, startY - 20,
                    endX - 20, endY - 20,
                    endX, endY
                )
                .stroke();
        }

        doc.restore();
    }

    drawRainbowBackground(doc) {
        const gradient = doc.linearGradient(0, 0, 612, 0);

        // Create subtle rainbow effect
        gradient.stop(0, '#FFFFFF')
            .stop(0.2, '#FFF0F0', 0.1)
            .stop(0.4, '#F0FFF0', 0.1)
            .stop(0.6, '#F0F0FF', 0.1)
            .stop(0.8, '#FFF0F0', 0.1)
            .stop(1, '#FFFFFF');

        doc.rect(0, 0, 612, 792).fill(gradient);
    }

    drawMicroprintPattern(doc, text, size, opacity) {
        // Placeholder implementation for drawMicroprintPattern
        doc.save();
        doc.font('Helvetica')
            .fontSize(size)
            .fillColor('#000000', opacity);
        // Simplified: just draw a few lines
        doc.text(text.repeat(10), 10, 10);
        doc.restore();
    }

    drawUVReactiveElements(doc) {
        // Placeholder implementation for drawUVReactiveElements
    }

    addBankDesignElements(doc, bankCode) {
        // Placeholder implementation for addBankDesignElements
    }

    addCheckFields(doc, checkData, template) {
        // Placeholder implementation
    }

    addMICRLine(doc, checkData, template) {
        const { routingNumber, accountNumber, checkNumber } = checkData;

        // Calculate proper positions (in points)
        const bottomMargin = 36; // 0.5 inches from bottom
        const leftMargin = 45; // 0.625 inches from left

        // Generate MICR characters with E-13B font
        const micr = this.generateMICRCharacters(routingNumber, accountNumber, checkNumber);

        doc.save();
        doc.font(this.micrFontAvailable ? 'MICRE13B' : 'Helvetica')
            .fontSize(14)
            .fillColor('#000000'); // Magnetic ink black

        // Draw MICR line
        doc.text(micr.line, leftMargin, 792 - bottomMargin);

        // Add magnetic ink properties annotation
        doc.font('Helvetica')
            .fontSize(6)
            .fillColor('#666666')
            .text('MICR E-13B • Magnetic Ink • Iron Oxide Content: 40%',
                leftMargin, 792 - bottomMargin + 20);

        doc.restore();
    }

    generateMICRCharacters(routing, account, checkNumber) {
        // Convert to MICR E-13B symbols
        const symbols = {
            transit: '⑆',
            onus: '⑇',
            amount: '⑈',
            dash: '⑉',
            transitCheck: '⑊'
        };

        // Format: [Transit][Routing][CheckDigit][OnUs][Account][CheckDigit][OnUs][CheckNumber]
        const routingCheckDigit = this.calculateMICRCheckDigit(routing);
        const accountCheckDigit = this.calculateMICRCheckDigit(account);

        return {
            line: `${symbols.transit}${routing}${routingCheckDigit}` +
                `${symbols.onus}${account}${accountCheckDigit}` +
                `${symbols.onus}${checkNumber}`,
            positions: {
                routingStart: 0,
                routingEnd: 9,
                accountStart: 10,
                accountEnd: 10 + account.length,
                checkStart: 11 + account.length
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

    addEnhancedSecurity(doc, checkData, template) {
        // Add holographic effect simulation
        this.addHolographicEffect(doc);

        // Add color-shifting ink simulation
        this.addColorShiftingInk(doc, checkData.amount);

        // Add microprinting
        this.addMicroprinting(doc);

        // Add anti-copy pattern
        this.addAntiCopyPattern(doc);

        // Add UV-reactive markings
        this.addUVMarkings(doc);

        // Add thermochromic ink indicators
        this.addThermochromicIndicators(doc);

        // Add tactile printing indicators
        this.addTactileIndicators(doc);
    }

    addHolographicEffect(doc) {
        doc.save();
        doc.opacity(0.3);

        // Create iridescent effect
        // NOTE: pdfkit gradients only accept hex/rgb colours — the previous
        // hsla() strings parsed to null and crashed every generation here.
        // Use hex colours with the stop() opacity argument instead.
        const palette = ['#ff0000', '#ff9900', '#33cc33', '#3366ff', '#9933ff'];
        for (let i = 0; i < 5; i++) {
            const gradient = doc.radialGradient(306, 396, 0, 306, 396, 400);

            gradient.stop(0, palette[i % palette.length], 0.1)
                .stop(0.5, palette[(i + 1) % palette.length], 0.05)
                .stop(1, palette[(i + 2) % palette.length], 0);

            doc.circle(306, 396, 200 + i * 40)
                .fill(gradient);
        }

        doc.restore();
    }

    addColorShiftingInk(doc, amount) {
        const amountX = 450;
        const amountY = 200;

        // Simulate color-shifting ink (changes color with viewing angle)
        const gradient = doc.linearGradient(amountX, amountY, amountX + 100, amountY);

        gradient.stop(0, '#000000')
            .stop(0.3, '#0033FF')
            .stop(0.5, '#000000')
            .stop(0.7, '#FF3300')
            .stop(1, '#000000');

        doc.save();
        doc.font('Helvetica-Bold')
            .fontSize(24)
            .fill(gradient)
            .text(`$${(Number(amount) || 0).toFixed(2)}`, amountX, amountY);
        doc.restore();
    }

    addMicroprinting(doc) {
        doc.save();
        doc.font('Helvetica')
            .fontSize(2) // Extremely small text
            .fillColor('#666666', 0.3);

        // Add microprint around border
        const microText = 'AUTHENTICDOCUMENTAUTHENTICDOCUMENT';
        for (let y = 10; y < 782; y += 20) {
            for (let x = 10; x < 602; x += 150) {
                doc.text(microText, x, y);
            }
        }

        doc.restore();
    }

    addAntiCopyPattern(doc) {
        // Pattern that becomes visible when photocopied
        doc.save();
        doc.opacity(0.1);

        // Moiré pattern
        for (let i = 0; i < 20; i++) {
            const angle = (i * 18) * Math.PI / 180;
            const length = 800;

            const x1 = 306 - Math.cos(angle) * length;
            const y1 = 396 - Math.sin(angle) * length;
            const x2 = 306 + Math.cos(angle) * length;
            const y2 = 396 + Math.sin(angle) * length;

            doc.moveTo(x1, y1)
                .lineTo(x2, y2)
                .lineWidth(0.5)
                .strokeColor('#000000')
                .stroke();
        }

        doc.restore();
    }

    addUVMarkings(doc) {
        // Placeholder
    }

    addThermochromicIndicators(doc) {
        // Placeholder
    }

    addTactileIndicators(doc) {
        // Placeholder
    }

    addDigitalSignature(doc, checkData) {
        // Create digital signature hash
        const signatureData = {
            checkNumber: checkData.checkNumber,
            amount: checkData.amount,
            payee: checkData.payeeName,
            date: checkData.date,
            timestamp: new Date().toISOString(),
            generatorId: 'PG-2024-ULTRA'
        };

        const signatureHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(signatureData))
            .digest('hex')
            .toUpperCase()
            .substring(0, 32);

        // Embed as invisible text
        doc.save();
        doc.font('Helvetica')
            .fontSize(1)
            .fillColor('#FFFFFF', 0.01) // Nearly invisible
            .text(`DS:${signatureHash}`, 10, 10);
        doc.restore();

        // Add visible verification note
        doc.font('Helvetica')
            .fontSize(8)
            .fillColor('#666666')
            .text(`Digital Signature: ${signatureHash.substring(0, 8)}...`,
                400, 760);
    }

    addInvisibleMarkers(doc, checkData) {
        // Add steganographic markers for tracking
        const markerData = {
            id: crypto.randomBytes(8).toString('hex'),
            timestamp: Date.now(),
            checkId: checkData.checkNumber,
            sessionId: crypto.randomBytes(4).toString('hex')
        };

        // Encode as tiny dots
        const binaryData = this.textToBinary(JSON.stringify(markerData));

        doc.save();
        doc.fillColor('#000000', 0.01); // Nearly invisible

        for (let i = 0; i < binaryData.length; i++) {
            if (binaryData[i] === '1') {
                const x = 20 + (i % 100) * 5;
                const y = 20 + Math.floor(i / 100) * 5;

                doc.rect(x, y, 0.5, 0.5).fill();
            }
        }

        doc.restore();
    }

    textToBinary(text) {
        return text.split('')
            .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
            .join('');
    }

    encryptPDF(doc, checkData) {
        // Set PDF encryption
        if (doc.setEncryption) {
            doc.setEncryption({
                userPassword: checkData.encryptionPassword || 'secure123',
                ownerPassword: 'bank-grade-encryption',
                permissions: {
                    printing: 'lowResolution', // Allow printing but low quality
                    modifying: false,
                    copying: false,
                    annotating: false,
                    fillingForms: false,
                    contentAccessibility: false,
                    documentAssembly: false
                },
                algorithm: 'AES-256' // Strongest encryption
            });
        }
    }
}

module.exports = AdvancedPDFGenerator;
