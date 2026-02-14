/**
 * CheckBackEngine - Endorsement Zone & Back-of-Check v1.0
 * 
 * Features:
 * - Standard endorsement area layout
 * - Mobile deposit endorsement text
 * - Restrictive endorsement options
 * - For Deposit Only stamps
 * - Account holder information
 * - Bank processing zones
 */

import { fabric } from 'fabric';

// Check back specifications (per banking standards)
const CHECK_BACK_SPECS = {
    endorsementArea: {
        topMargin: 0.25,      // inches from top
        width: 1.5,           // endorsement area width
        height: 3.0,          // endorsement area height
        position: 'right'     // typically on right side when flipped
    },
    restrictedArea: {
        fromTop: 1.5,         // area reserved for bank stamps
        height: 1.5
    },
    bankProcessingArea: {
        fromTop: 3.0,         // bottom portion for bank use
        height: 0.5
    }
};

export interface EndorsementConfig {
    type: 'blank' | 'forDeposit' | 'mobile' | 'restrictive' | 'custom';
    accountNumber?: string;
    bankName?: string;
    customText?: string;
    includeSignatureLine?: boolean;
    mobileDepositText?: string;
}

export interface CheckBackData {
    endorsementConfig: EndorsementConfig;
    includeProcessingArea: boolean;
    includeInstructions: boolean;
}

const DEFAULT_ENDORSEMENT_CONFIG: EndorsementConfig = {
    type: 'forDeposit',
    includeSignatureLine: true,
    mobileDepositText: 'For Mobile Deposit Only'
};

export class CheckBackEngine {

    // ============== GENERATE COMPLETE CHECK BACK ==============

    static generateCheckBack(
        width: number,
        height: number,
        config: EndorsementConfig = DEFAULT_ENDORSEMENT_CONFIG,
        dpi: number = 300
    ): fabric.Group {
        const scale = dpi / 72;
        const group = new fabric.Group([], {
            selectable: false,
            evented: false,
            name: 'check-back'
        });

        // Background
        group.add(new fabric.Rect({
            width, height,
            fill: '#fefefe',
            stroke: '#eee',
            strokeWidth: 1
        }));

        // Add endorsement area box
        const endorseBox = this.createEndorsementBox(width, height, scale);
        group.add(endorseBox);

        // Add endorsement content based on type
        const endorseContent = this.createEndorsementContent(width, height, config, scale);
        endorseContent.forEach(obj => group.add(obj));

        // Add bank processing area
        const processingArea = this.createProcessingArea(width, height, scale);
        group.add(processingArea);

        // Add instructions text
        const instructions = this.createInstructions(width, height, scale);
        instructions.forEach(obj => group.add(obj));

        // Add "DO NOT WRITE BELOW THIS LINE" indicator
        group.add(this.createDoNotWriteLine(width, height, scale));

        return group;
    }

    // ============== ENDORSEMENT BOX ==============

    private static createEndorsementBox(width: number, height: number, scale: number): fabric.Group {
        const boxWidth = 1.5 * 72 * scale;
        const boxHeight = height * 0.4;
        const x = width - boxWidth - (0.25 * 72 * scale);
        const y = 0.25 * 72 * scale;

        const group = new fabric.Group([
            // Box outline
            new fabric.Rect({
                width: boxWidth,
                height: boxHeight,
                fill: 'transparent',
                stroke: '#999',
                strokeWidth: 1,
                strokeDashArray: [5, 3]
            }),
            // Header text
            new fabric.Text('ENDORSE HERE', {
                fontSize: 8 * scale,
                fill: '#666',
                fontFamily: 'Arial',
                fontWeight: 'bold',
                left: 5,
                top: 5
            }),
            // X mark for signature
            new fabric.Text('X', {
                fontSize: 16 * scale,
                fill: '#333',
                fontFamily: 'Arial',
                left: 10,
                top: boxHeight * 0.3
            }),
            // Signature line
            new fabric.Line([30, boxHeight * 0.4, boxWidth - 10, boxHeight * 0.4], {
                stroke: '#333',
                strokeWidth: 1
            })
        ], {
            left: x,
            top: y,
            name: 'endorsement-box'
        });

        return group;
    }

    // ============== ENDORSEMENT CONTENT ==============

    private static createEndorsementContent(
        width: number,
        height: number,
        config: EndorsementConfig,
        scale: number
    ): fabric.Object[] {
        const objects: fabric.Object[] = [];
        const boxWidth = 1.5 * 72 * scale;
        const x = width - boxWidth - (0.25 * 72 * scale);
        const y = (0.25 * 72 * scale) + (0.5 * 72 * scale);

        switch (config.type) {
            case 'forDeposit':
                objects.push(new fabric.Text('FOR DEPOSIT ONLY', {
                    left: x + 10,
                    top: y,
                    fontSize: 10 * scale,
                    fill: '#000',
                    fontFamily: 'Arial',
                    fontWeight: 'bold'
                }));
                if (config.accountNumber) {
                    objects.push(new fabric.Text(`Acct: ${config.accountNumber}`, {
                        left: x + 10,
                        top: y + (15 * scale),
                        fontSize: 9 * scale,
                        fill: '#333',
                        fontFamily: 'Courier New'
                    }));
                }
                if (config.bankName) {
                    objects.push(new fabric.Text(config.bankName, {
                        left: x + 10,
                        top: y + (28 * scale),
                        fontSize: 8 * scale,
                        fill: '#333',
                        fontFamily: 'Arial'
                    }));
                }
                break;

            case 'mobile':
                objects.push(new fabric.Text(config.mobileDepositText || 'FOR MOBILE DEPOSIT ONLY', {
                    left: x + 10,
                    top: y,
                    fontSize: 9 * scale,
                    fill: '#000',
                    fontFamily: 'Arial',
                    fontWeight: 'bold'
                }));
                objects.push(new fabric.Text('at ' + (config.bankName || '[Bank Name]'), {
                    left: x + 10,
                    top: y + (12 * scale),
                    fontSize: 8 * scale,
                    fill: '#333',
                    fontFamily: 'Arial'
                }));
                if (config.accountNumber) {
                    objects.push(new fabric.Text(`Account: ****${config.accountNumber.slice(-4)}`, {
                        left: x + 10,
                        top: y + (25 * scale),
                        fontSize: 8 * scale,
                        fill: '#333',
                        fontFamily: 'Courier New'
                    }));
                }
                break;

            case 'restrictive':
                objects.push(new fabric.Text('PAY TO THE ORDER OF', {
                    left: x + 10,
                    top: y,
                    fontSize: 8 * scale,
                    fill: '#000',
                    fontFamily: 'Arial'
                }));
                objects.push(new fabric.Text(config.bankName || '[Bank Name]', {
                    left: x + 10,
                    top: y + (12 * scale),
                    fontSize: 10 * scale,
                    fill: '#000',
                    fontFamily: 'Arial',
                    fontWeight: 'bold'
                }));
                objects.push(new fabric.Text('FOR DEPOSIT ONLY', {
                    left: x + 10,
                    top: y + (28 * scale),
                    fontSize: 9 * scale,
                    fill: '#000',
                    fontFamily: 'Arial'
                }));
                break;

            case 'custom':
                if (config.customText) {
                    const lines = config.customText.split('\n');
                    lines.forEach((line, i) => {
                        objects.push(new fabric.Text(line, {
                            left: x + 10,
                            top: y + (i * 12 * scale),
                            fontSize: 9 * scale,
                            fill: '#000',
                            fontFamily: 'Arial'
                        }));
                    });
                }
                break;

            case 'blank':
            default:
                // Leave blank for manual endorsement
                break;
        }

        return objects;
    }

    // ============== BANK PROCESSING AREA ==============

    private static createProcessingArea(width: number, height: number, scale: number): fabric.Group {
        const areaHeight = 0.5 * 72 * scale;
        const y = height - areaHeight - (0.25 * 72 * scale);

        return new fabric.Group([
            new fabric.Rect({
                width: width - (0.5 * 72 * scale),
                height: areaHeight,
                fill: 'transparent',
                stroke: '#ccc',
                strokeWidth: 1,
                strokeDashArray: [3, 3]
            }),
            new fabric.Text('FINANCIAL INSTITUTION USE ONLY', {
                fontSize: 7 * scale,
                fill: '#999',
                fontFamily: 'Arial',
                left: 10,
                top: 5
            })
        ], {
            left: 0.25 * 72 * scale,
            top: y,
            name: 'processing-area'
        });
    }

    // ============== INSTRUCTIONS ==============

    private static createInstructions(width: number, height: number, scale: number): fabric.Object[] {
        const instructions = [
            'IMPORTANT: Sign exactly as your name appears on the front of this check.',
            'For added security, write "For Deposit Only" and your account number below your signature.',
            'Keep a copy of this check for your records.'
        ];

        return instructions.map((text, i) => new fabric.Text(text, {
            left: 0.25 * 72 * scale,
            top: (height * 0.55) + (i * 12 * scale),
            fontSize: 7 * scale,
            fill: '#666',
            fontFamily: 'Arial'
        }));
    }

    // ============== DO NOT WRITE LINE ==============

    private static createDoNotWriteLine(width: number, height: number, scale: number): fabric.Group {
        const y = height * 0.75;

        return new fabric.Group([
            new fabric.Line([0, 0, width - (0.5 * 72 * scale), 0], {
                stroke: '#999',
                strokeWidth: 1,
                strokeDashArray: [10, 5]
            }),
            new fabric.Text('— DO NOT WRITE, STAMP, OR SIGN BELOW THIS LINE —', {
                fontSize: 6 * scale,
                fill: '#999',
                fontFamily: 'Arial',
                left: width * 0.25,
                top: 3
            })
        ], {
            left: 0.25 * 72 * scale,
            top: y,
            name: 'do-not-write-line'
        });
    }

    // ============== MOBILE DEPOSIT ENDORSEMENT STAMP ==============

    static generateMobileDepositStamp(
        bankName: string,
        accountNumber: string
    ): fabric.Group {
        const group = new fabric.Group([], {
            name: 'mobile-deposit-stamp'
        });

        // Outer border
        group.add(new fabric.Rect({
            width: 180,
            height: 80,
            fill: 'transparent',
            stroke: 'rgba(0, 100, 0, 0.8)',
            strokeWidth: 2,
            rx: 5,
            ry: 5
        }));

        // Inner border
        group.add(new fabric.Rect({
            width: 170,
            height: 70,
            left: 5,
            top: 5,
            fill: 'transparent',
            stroke: 'rgba(0, 100, 0, 0.6)',
            strokeWidth: 1,
            rx: 3,
            ry: 3
        }));

        // Text
        group.add(new fabric.Text('FOR MOBILE DEPOSIT ONLY', {
            fontSize: 11,
            fill: 'rgba(0, 100, 0, 0.9)',
            fontFamily: 'Arial Black',
            left: 15,
            top: 12
        }));

        group.add(new fabric.Text(`at ${bankName}`, {
            fontSize: 9,
            fill: 'rgba(0, 100, 0, 0.8)',
            fontFamily: 'Arial',
            left: 15,
            top: 28
        }));

        group.add(new fabric.Text(`Acct: ****${accountNumber.slice(-4)}`, {
            fontSize: 10,
            fill: 'rgba(0, 100, 0, 0.8)',
            fontFamily: 'Courier New',
            left: 15,
            top: 45
        }));

        group.add(new fabric.Text(new Date().toLocaleDateString(), {
            fontSize: 8,
            fill: 'rgba(0, 100, 0, 0.6)',
            fontFamily: 'Arial',
            left: 15,
            top: 60
        }));

        // Add slight rotation for realism
        group.set('angle', (Math.random() - 0.5) * 4);

        return group;
    }

    // ============== ENDORSEMENT TEMPLATES ==============

    static getEndorsementTemplates(): Record<string, EndorsementConfig> {
        return {
            basic: {
                type: 'forDeposit',
                includeSignatureLine: true
            },
            mobile: {
                type: 'mobile',
                mobileDepositText: 'For Mobile Deposit Only',
                includeSignatureLine: true
            },
            business: {
                type: 'restrictive',
                includeSignatureLine: false
            },
            blank: {
                type: 'blank',
                includeSignatureLine: true
            }
        };
    }
}
