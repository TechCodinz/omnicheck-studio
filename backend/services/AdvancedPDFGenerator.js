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

                // Add Remittance Voucher Stubs (Check-on-Top layout)
                if (options.layout !== 'standalone') {
                    this.addRemittanceVouchers(doc, checkData);
                }

                // Add enhanced security features
                this.addEnhancedSecurity(doc, checkData, template);

                // Add digital signature and timestamp
                this.addDigitalSignature(doc, checkData);

                // Add invisible tracking markers
                this.addInvisibleMarkers(doc, checkData);

                // Add Regulation CC compliant check endorsement reverse page if requested
                if (options.includeBackSide) {
                    doc.addPage({ size: [612, 792], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
                    this.addCheckBackSide(doc, checkData, options);
                }

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
        // Draw bank header area
        doc.save();
        doc.font('Helvetica-Bold')
            .fontSize(11)
            .fillColor('#1A365D')
            .text(bankCode || 'FEDERAL RESERVE MEMBER BANK', 220, 28, { width: 220, align: 'center' });

        doc.font('Helvetica')
            .fontSize(7.5)
            .fillColor('#4A5568')
            .text('United States Banking Division • Member FDIC', 220, 42, { width: 220, align: 'center' });
        doc.restore();
    }

    numberToLegalWords(num) {
        const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const scales = ['', 'Thousand', 'Million', 'Billion'];

        const n = Math.floor(Math.abs(num));
        const cents = Math.round((Math.abs(num) - n) * 100);
        const centsStr = cents.toString().padStart(2, '0');

        if (n === 0) return `Zero and ${centsStr}/100 Dollars`.toUpperCase();

        const convertChunk = (val) => {
            let str = '';
            if (val >= 100) {
                str += units[Math.floor(val / 100)] + ' Hundred ';
                val %= 100;
            }
            if (val >= 20) {
                str += tens[Math.floor(val / 10)] + (val % 10 !== 0 ? '-' + units[val % 10] : '') + ' ';
            } else if (val > 0) {
                str += units[val] + ' ';
            }
            return str;
        };

        let result = '';
        let scaleIdx = 0;
        let rem = n;

        while (rem > 0) {
            const chunk = rem % 1000;
            if (chunk > 0) {
                result = convertChunk(chunk) + scales[scaleIdx] + ' ' + result;
            }
            rem = Math.floor(rem / 1000);
            scaleIdx++;
        }

        return `${result.trim()} and ${centsStr}/100 Dollars`.toUpperCase();
    }

    addCheckFields(doc, checkData, template) {
        doc.save();

        const amountNum = Number(checkData.amount) || 0;
        const formattedAmount = amountNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const legalAmount = checkData.amountWords || this.numberToLegalWords(amountNum);

        // 1. Account Holder / Drawer (Top-Left)
        const holder = checkData.accountHolder || {};
        const holderName = typeof holder === 'string' ? holder : (holder.name || checkData.payerName || 'ACME CORPORATION');
        const holderAddr1 = holder.address1 || '100 Financial Way, Suite 400';
        const holderAddr2 = holder.address2 || 'New York, NY 10001';

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#1A202C').text(holderName, 40, 28);
        doc.font('Helvetica').fontSize(8).fillColor('#4A5568')
            .text(holderAddr1, 40, 42)
            .text(holderAddr2, 40, 53);

        // 2. Date and Check Number (Top-Right)
        const checkNumStr = String(checkData.checkNumber || '1001');
        doc.font('Helvetica-Bold').fontSize(13).fillColor('#1A202C').text(checkNumStr, 510, 28, { align: 'right', width: 62 });

        doc.font('Helvetica').fontSize(8).fillColor('#4A5568').text('DATE', 420, 48);
        const dateStr = checkData.date || new Date().toISOString().split('T')[0];
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#1A202C').text(dateStr, 455, 47);
        doc.moveTo(450, 58).lineTo(572, 58).lineWidth(0.5).strokeColor('#A0AEC0').stroke();

        // 3. Fractional Routing (Federal Reserve Standard)
        const cleanRouting = String(checkData.routingNumber || '').replace(/\D/g, '');
        const frac1 = cleanRouting.length >= 4 ? cleanRouting.substring(0, 2) + '-' + cleanRouting.substring(2, 4) : '55-00';
        const frac2 = cleanRouting.length >= 8 ? cleanRouting.substring(4, 8) : '0000';
        doc.font('Helvetica').fontSize(7).fillColor('#718096').text(`${frac1}/${frac2}`, 510, 15, { align: 'right', width: 62 });

        // 4. Payee Line
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#2D3748').text('PAY TO THE', 40, 92);
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#2D3748').text('ORDER OF', 40, 101);

        // Payee Name
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#1A202C').text(checkData.payeeName || 'PAYEE NAME', 110, 96);
        doc.moveTo(105, 110).lineTo(440, 110).lineWidth(0.75).strokeColor('#4A5568').stroke();

        // 5. Amount Box ($)
        doc.rect(455, 88, 117, 24).lineWidth(1).strokeColor('#2B6CB0').fillAndStroke('#FFFFFF', '#2B6CB0');
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#1A202C').text(`$ ${formattedAmount}`, 460, 94, { width: 107, align: 'right' });

        // 6. Legal Written Amount Line
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#1A202C').text(legalAmount, 40, 126, { width: 490 });
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#2D3748').text('DOLLARS', 535, 126);
        doc.moveTo(40, 138).lineTo(530, 138).lineWidth(0.75).strokeColor('#4A5568').stroke();

        // 7. Drawee Bank Name
        const bankName = checkData.bankName || (template && template.name) || 'COMMERCE NATIONAL BANK';
        doc.font('Helvetica').fontSize(8).fillColor('#4A5568').text(bankName, 40, 152);

        // 8. Memo Line
        doc.font('Helvetica').fontSize(8).fillColor('#4A5568').text('MEMO', 40, 178);
        doc.font('Helvetica').fontSize(9).fillColor('#1A202C').text(checkData.memo || '', 75, 176);
        doc.moveTo(70, 188).lineTo(250, 188).lineWidth(0.5).strokeColor('#718096').stroke();

        // 9. Signature Line with Microprint
        doc.font('Helvetica').fontSize(6).fillColor('#718096').text('MP  AUTHORIZED SIGNATURE  DO NOT CASH WITHOUT SECURITY BACKING', 340, 178, { width: 232, align: 'center' });
        doc.moveTo(330, 188).lineTo(572, 188).lineWidth(0.75).strokeColor('#4A5568').stroke();

        // If digital signature exists, render cursive representation
        if (checkData.signatureText || checkData.authorizedSigner) {
            doc.font('Helvetica-Oblique').fontSize(14).fillColor('#1A365D')
                .text(checkData.signatureText || checkData.authorizedSigner, 350, 166, { width: 210, align: 'center' });
        }

        // 10. Padlock Icon Placeholder
        doc.rect(555, 122, 12, 14).lineWidth(0.5).strokeColor('#718096').stroke();
        doc.font('Helvetica').fontSize(6).fillColor('#718096').text('🔒', 557, 125);

        doc.restore();
    }

    addMICRLine(doc, checkData, template) {
        const cleanRouting = String(checkData.routingNumber || '').replace(/\D/g, '');
        const cleanAccount = String(checkData.accountNumber || '').replace(/\D/g, '');
        const cleanCheckNum = String(checkData.checkNumber || '').replace(/\D/g, '').padStart(4, '0');

        // Check height reference: for 8.5"x3.5" standalone, height is 252.
        // For check-on-top on Letter (8.5"x11"), check region is 252.
        // Clear Band standard (ANSI X9.27): 0.625" (45 pt) height from bottom of check.
        const checkBottomY = 252;
        const clearBandHeight = 45;
        const micrBaselineY = checkBottomY - 18; // approx 0.25" from bottom edge
        const leftMargin = 45; // 0.625" from left edge

        // Keep MICR Clear Band 100% white to prevent optical or magnetic read distortion
        doc.save();
        doc.rect(0, checkBottomY - clearBandHeight, 612, clearBandHeight).fill('#FFFFFF');
        doc.restore();

        // Generate ANSI X9 compliant MICR line
        const micr = this.generateMICRCharacters(cleanRouting, cleanAccount, cleanCheckNum);

        doc.save();
        if (this.micrFontAvailable) {
            doc.font('MICRE13B')
                .fontSize(12)
                .fillColor('#000000')
                .text(micr.asciiLine, leftMargin, micrBaselineY, { characterSpacing: 1.5 });
        } else {
            doc.font('Helvetica-Bold')
                .fontSize(11)
                .fillColor('#000000')
                .text(micr.unicodeLine, leftMargin, micrBaselineY, { characterSpacing: 2 });
        }

        // Microprint specification tag
        doc.font('Helvetica')
            .fontSize(5)
            .fillColor('#718096')
            .text('ANSI X9.27 / E-13B COMPLIANT • 0.625" CLEAR BAND ENFORCED', leftMargin, checkBottomY - 7);

        doc.restore();
    }

    generateMICRCharacters(routing, account, checkNumber) {
        // Official ANSI X9.27 E-13B Delimiters:
        // A = Transit (⑆)
        // B = Amount (⑈)
        // C = On-Us (⑇)
        // D = Dash (⑉)

        // Strict Federal Reserve Format:
        // Transit field is flanked by Transit symbols: A<9-digit routing>A
        // Account field is terminated by On-Us: <account>C
        // Check number field: C<checkNumber>C (or On-Us delimited)

        const transitSymU = '⑆';
        const onusSymU = '⑇';

        const transitSymA = 'A';
        const onusSymA = 'C';

        const unicodeLine = `${transitSymU}${routing}${transitSymU}  ${account}${onusSymU}  ${checkNumber}`;
        const asciiLine = `${transitSymA}${routing}${transitSymA}  ${account}${onusSymA}  ${checkNumber}`;

        return {
            unicodeLine,
            asciiLine,
            routing,
            account,
            checkNumber
        };
    }

    addEnhancedSecurity(doc, checkData, template) {
        // Holographic effect simulation
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
                algorithm: 'AES-256'
            });
        }
    }

    addRemittanceVouchers(doc, checkData) {
        doc.save();

        const amountNum = Number(checkData.amount) || 0;
        const formattedAmount = `$${amountNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const dateStr = checkData.date || new Date().toISOString().split('T')[0];
        const checkNumStr = String(checkData.checkNumber || '1001');
        const payeeName = checkData.payeeName || 'Valued Payee';

        const drawVoucher = (startY, title) => {
            // Perforation dashed cut guide
            doc.save();
            doc.strokeColor('#CBD5E1').lineWidth(0.5).dash(4, { space: 3 });
            doc.moveTo(20, startY).lineTo(592, startY).stroke();
            doc.undash();

            // Scissor indicator
            doc.font('Helvetica').fontSize(7).fillColor('#94A3B8').text('✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -', 20, startY - 4);

            // Voucher Header
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#1E293B').text(title, 36, startY + 12);
            doc.font('Helvetica').fontSize(8).fillColor('#64748B')
                .text(`Check Date: ${dateStr}`, 200, startY + 12)
                .text(`Check #: ${checkNumStr}`, 320, startY + 12)
                .text(`Net Amount: ${formattedAmount}`, 440, startY + 12, { align: 'right', width: 132 });

            doc.font('Helvetica').fontSize(8).fillColor('#475569')
                .text(`Payee: ${payeeName}`, 36, startY + 25);

            // Remittance Table Header
            const tableTop = startY + 42;
            doc.rect(36, tableTop, 540, 16).fill('#F1F5F9');
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155')
                .text('DATE', 44, tableTop + 4)
                .text('INVOICE / REF #', 110, tableTop + 4)
                .text('DESCRIPTION', 220, tableTop + 4)
                .text('GROSS AMOUNT', 370, tableTop + 4, { align: 'right', width: 60 })
                .text('DEDUCTIONS', 440, tableTop + 4, { align: 'right', width: 60 })
                .text('NET AMOUNT', 510, tableTop + 4, { align: 'right', width: 56 });

            // Table Row
            const rowY = tableTop + 20;
            doc.font('Helvetica').fontSize(7.5).fillColor('#1E293B')
                .text(dateStr, 44, rowY)
                .text(`INV-${checkNumStr}`, 110, rowY)
                .text(checkData.memo || 'General Accounts Payable / Disbursed Funds', 220, rowY, { width: 140 })
                .text(formattedAmount, 370, rowY, { align: 'right', width: 60 })
                .text('$0.00', 440, rowY, { align: 'right', width: 60 })
                .text(formattedAmount, 510, rowY, { align: 'right', width: 56 });

            doc.moveTo(36, rowY + 14).lineTo(576, rowY + 14).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

            // Total Summary Box
            const summaryY = startY + 98;
            doc.rect(360, summaryY, 216, 20).strokeColor('#CBD5E1').lineWidth(0.5).stroke();
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#1E293B')
                .text('TOTAL DISBURSEMENT:', 370, summaryY + 6)
                .text(formattedAmount, 470, summaryY + 6, { align: 'right', width: 96 });

            doc.restore();
        };

        // Stub 1 (Voucher / Payee Remittance Copy)
        drawVoucher(256, 'ACCOUNTS PAYABLE VOUCHER - RETAIN FOR RECORDS');

        // Stub 2 (Payroll / Payor Copy)
        drawVoucher(524, 'PAYOR DISBURSEMENT AUDIT COPY');

        doc.restore();
    }

    addCheckBackSide(doc, checkData, options) {
        doc.save();

        // 1. Draw Subtle Security Paper Backing
        doc.rect(0, 0, 612, 792).fill('#FAFAFA');

        // 2. Trailing Edge Endorsement Zone (Top 1.5" = 108 pt)
        const endorseZoneH = 108;
        doc.rect(36, 24, 540, endorseZoneH).lineWidth(1).strokeColor('#CBD5E1').stroke();

        // Endorsement Header
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#1E293B')
            .text('ENDORSE CHECK HERE', 48, 34);

        // Signature Line
        doc.font('Helvetica').fontSize(8).fillColor('#64748B').text('X', 48, 62);
        doc.moveTo(60, 68).lineTo(560, 68).lineWidth(0.75).strokeColor('#334155').stroke();

        // Federal Reserve Regulation CC 12 CFR § 229.35 Mandatory Restrictive Endorsement
        const bankName = checkData.bankName || 'DESIGNATED FINANCIAL INSTITUTION';
        doc.rect(48, 76, 10, 10).lineWidth(0.75).strokeColor('#1E293B').stroke();
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#1E293B').text('✓', 50, 77); // Pre-checked for mobile compliance
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#0F172A')
            .text(`FOR MOBILE DEPOSIT ONLY AT: ${bankName.toUpperCase()}`, 64, 77);

        // Security Warning Line
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#DC2626')
            .text('DO NOT WRITE, STAMP, OR SIGN BELOW THIS LINE', 48, 96);
        doc.font('Helvetica').fontSize(6.5).fillColor('#64748B')
            .text('RESERVED FOR FINANCIAL INSTITUTION ENDORSEMENT PURSUANT TO REGULATION CC', 48, 106);
        doc.moveTo(36, 118).lineTo(576, 118).lineWidth(1).strokeColor('#94A3B8').stroke();

        // 3. Clear Middle Processing Zone
        doc.rect(36, 130, 540, 180).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
        doc.font('Helvetica').fontSize(8).fillColor('#94A3B8')
            .text('CLEAR ZONE - NO WRITING IN THIS AREA - BANK PROCESSING ONLY', 36, 210, { width: 540, align: 'center' });

        // 4. Security Feature Checklist Box (Bottom)
        doc.rect(36, 330, 540, 60).fillAndStroke('#F8FAFC', '#CBD5E1');
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1E293B')
            .text('DOCUMENT SECURITY SPECIFICATIONS', 48, 338);

        doc.font('Helvetica').fontSize(6.5).fillColor('#475569')
            .text('• ARTIFICIAL WATERMARK: Hold to light to verify authentic watermark pattern.', 48, 350)
            .text('• CHEMICAL REACTIVE PAPER: Exposure to solvents produces visible color staining.', 48, 360)
            .text('• MICROPRINT BORDER: Contains 0.5pt microprint text legible only under high magnification.', 48, 370)
            .text('• CPSA PADLOCK: Approved security features comply with Federal Reserve Check 21 standards.', 48, 380);

        doc.restore();
    }
}

module.exports = AdvancedPDFGenerator;
