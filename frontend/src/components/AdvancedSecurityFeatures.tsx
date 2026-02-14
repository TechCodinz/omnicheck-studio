import React, { useRef, useEffect } from 'react';
import { fabric } from 'fabric';

export class AdvancedSecurityRenderer {
    private canvas: fabric.Canvas;
    private securityLayers: fabric.Object[] = [];

    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    // Add thermochromic ink simulation (color changes with temperature)
    addThermochromicInk(text: string, x: number, y: number): void {
        const thermochromicText = new fabric.Text(text, {
            left: x,
            top: y,
            fontSize: 12,
            fontFamily: 'Arial',
            fill: 'linear-gradient(45deg, #000000 0%, #ff0000 50%, #000000 100%)',
            opacity: 0.9,
            shadow: new fabric.Shadow({
                color: 'rgba(255, 0, 0, 0.3)',
                blur: 10,
                offsetX: 2,
                offsetY: 2
            }),
            data: { type: 'thermochromic' }
        });

        this.canvas.add(thermochromicText);
        this.securityLayers.push(thermochromicText);
    }

    // Add holographic security thread
    addHolographicThread(): void {
        const thread = new fabric.Rect({
            left: 50,
            top: 150,
            width: 700,
            height: 3,
            fill: new fabric.Gradient({
                type: 'linear',
                coords: { x1: 0, y1: 0, x2: 700, y2: 0 },
                colorStops: [
                    { offset: 0, color: '#ff0000' },
                    { offset: 0.2, color: '#00ff00' },
                    { offset: 0.4, color: '#0000ff' },
                    { offset: 0.6, color: '#ffff00' },
                    { offset: 0.8, color: '#ff00ff' },
                    { offset: 1, color: '#00ffff' }
                ]
            }),
            opacity: 0.7,
            selectable: false,
            evented: false
        });

        this.canvas.add(thread);
        this.securityLayers.push(thread);
    }

    // Add microprinting (visible under magnification)
    addMicroprinting(pattern: string = 'AUTHENTIC', x: number, y: number): void {
        const microText = new fabric.Text(pattern, {
            left: x,
            top: y,
            fontSize: 2, // Extremely small - only visible with magnification
            fontFamily: 'Arial',
            fill: '#000000',
            opacity: 0.3,
            selectable: false,
            evented: false
        });

        // Create pattern
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 5; j++) {
                const clone = fabric.util.object.clone(microText);
                clone.set({
                    left: x + (i * 40),
                    top: y + (j * 20)
                });
                this.canvas.add(clone);
                this.securityLayers.push(clone);
            }
        }
    }

    // Add UV-reactive ink markings
    addUVMarkings(): void {
        const uvPatterns = [
            { text: 'VALID', x: 100, y: 100 },
            { text: 'SECURE', x: 500, y: 200 },
            { text: 'BANK', x: 300, y: 300 }
        ];

        uvPatterns.forEach(pattern => {
            const uvText = new fabric.Text(pattern.text, {
                left: pattern.x,
                top: pattern.y,
                fontSize: 20,
                fontFamily: 'Arial',
                fill: 'rgba(0, 255, 255, 0.1)', // Cyan color visible under UV
                opacity: 0.05,
                selectable: false,
                evented: false,
                data: { visibleUnderUV: true }
            });

            this.canvas.add(uvText);
            this.securityLayers.push(uvText);
        });
    }

    // Add tactile ink (raised printing simulation)
    addTactileInk(text: string, x: number, y: number): void {
        const tactileEffect = new fabric.Group([], {
            left: x,
            top: y,
            selectable: false,
            evented: false
        });

        // Base layer
        const baseText = new fabric.Text(text, {
            fontSize: 14,
            fontFamily: 'Arial',
            fill: '#000000',
            fontWeight: 'bold'
        });

        // Shadow layer for 3D effect
        const shadowText = new fabric.Text(text, {
            fontSize: 14,
            fontFamily: 'Arial',
            fill: '#808080',
            left: 1,
            top: 1,
            opacity: 0.5
        });

        tactileEffect.addWithUpdate(shadowText);
        tactileEffect.addWithUpdate(baseText);

        this.canvas.add(tactileEffect);
        this.securityLayers.push(tactileEffect);
    }

    // Add copy void pantograph
    addCopyVoidPantograph(): void {
        const pantograph = new fabric.Group([], {
            left: 200,
            top: 250,
            selectable: false,
            evented: false
        });

        // Pattern that becomes visible when copied
        const pattern = 'VOIDVOIDVOIDVOIDVOIDVOIDVOIDVOID';
        for (let i = 0; i < 5; i++) {
            const voidText = new fabric.Text(pattern, {
                fontSize: 8,
                fontFamily: 'Arial',
                fill: 'rgba(255, 0, 0, 0.1)',
                angle: i * 15
            });
            pantograph.addWithUpdate(voidText);
        }

        this.canvas.add(pantograph);
        this.securityLayers.push(pantograph);
    }

    // Add invisible digital watermark
    addDigitalWatermark(data: string): void {
        const binaryData = this.textToBinary(data);
        const watermark = new fabric.Group([], {
            left: 50,
            top: 50,
            opacity: 0.01, // Nearly invisible
            selectable: false,
            evented: false
        });

        // Encode data as tiny dots
        for (let i = 0; i < binaryData.length; i++) {
            if (binaryData[i] === '1') {
                const dot = new fabric.Circle({
                    radius: 0.5,
                    left: (i % 100) * 5,
                    top: Math.floor(i / 100) * 5,
                    fill: '#000000'
                });
                watermark.addWithUpdate(dot);
            }
        }

        this.canvas.add(watermark);
        this.securityLayers.push(watermark);
    }

    // Add security fibers (colored threads in paper simulation)
    addSecurityFibers(): void {
        const fiberColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];

        for (let i = 0; i < 50; i++) {
            const fiber = new fabric.Line([0, 0, 20, 0], {
                left: Math.random() * 800,
                top: Math.random() * 350,
                stroke: fiberColors[Math.floor(Math.random() * fiberColors.length)],
                strokeWidth: 0.5,
                opacity: 0.3,
                selectable: false,
                evented: false
            });

            this.canvas.add(fiber);
            this.securityLayers.push(fiber);
        }
    }

    // Add anti-scan pattern (breaks when scanned)
    addAntiScanPattern(): void {
        const pattern = new fabric.Group([], {
            left: 100,
            top: 100,
            selectable: false,
            evented: false
        });

        // Moiré pattern
        for (let i = 0; i < 10; i++) {
            const line = new fabric.Line([0, 0, 600, 0], {
                stroke: '#000000',
                strokeWidth: 0.5,
                opacity: 0.1,
                angle: i * 18
            });
            pattern.addWithUpdate(line);
        }

        this.canvas.add(pattern);
        this.securityLayers.push(pattern);
    }

    // Add bank-specific security features
    addBankSpecificFeatures(bankCode: string): void {
        const bankFeatures: Record<string, Function> = {
            'BOFA': () => this.addBankOfAmericaFeatures(),
            'CHASE': () => this.addChaseFeatures(),
            'WELLS': () => this.addWellsFargoFeatures(),
            'CITI': () => this.addCitiFeatures(),
            'USAA': () => this.addUSAAFeatures()
        };

        if (bankFeatures[bankCode]) {
            bankFeatures[bankCode]();
        }
    }

    private addBankOfAmericaFeatures(): void {
        // Bank of America specific security patterns
        const boaLogo = new fabric.Text('BOA', {
            left: 400,
            top: 50,
            fontSize: 8,
            fontFamily: 'Arial',
            fill: 'rgba(0, 100, 200, 0.1)',
            opacity: 0.05,
            selectable: false,
            evented: false
        });

        this.canvas.add(boaLogo);
        this.securityLayers.push(boaLogo);
    }

    private addChaseFeatures(): void {
        // Chase blue watermark pattern
        const chasePattern = new fabric.Circle({
            left: 350,
            top: 175,
            radius: 50,
            fill: 'rgba(0, 100, 200, 0.05)',
            stroke: 'rgba(0, 100, 200, 0.1)',
            strokeWidth: 1,
            selectable: false,
            evented: false
        });

        this.canvas.add(chasePattern);
        this.securityLayers.push(chasePattern);
    }

    private addWellsFargoFeatures(): void {
        // Placeholder for Wells Fargo features as they were missing in original prompt but referenced
        const wfPattern = new fabric.Rect({
            left: 300,
            top: 100,
            width: 50,
            height: 50,
            fill: 'rgba(242, 109, 33, 0.05)',
            selectable: false,
            evented: false
        });
        this.canvas.add(wfPattern);
        this.securityLayers.push(wfPattern);
    }

    private addCitiFeatures(): void {
        // Placeholder for Citi features
        const citiPattern = new fabric.Rect({
            left: 100,
            top: 300,
            width: 60,
            height: 30,
            fill: 'rgba(0, 59, 112, 0.05)',
            selectable: false,
            evented: false
        });
        this.canvas.add(citiPattern);
        this.securityLayers.push(citiPattern);
    }

    private addUSAAFeatures(): void {
        // Placeholder for USAA features
        const usaaPattern = new fabric.Rect({
            left: 500,
            top: 50,
            width: 40,
            height: 40,
            fill: 'rgba(0, 91, 140, 0.05)',
            selectable: false,
            evented: false
        });
        this.canvas.add(usaaPattern);
        this.securityLayers.push(usaaPattern);
    }

    // Convert text to binary for watermark encoding
    private textToBinary(text: string): string {
        return text.split('').map(char => {
            return char.charCodeAt(0).toString(2).padStart(8, '0');
        }).join('');
    }
}
