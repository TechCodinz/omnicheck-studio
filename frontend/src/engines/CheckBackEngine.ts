import { fabric } from 'fabric';

/**
 * CheckBackEngine - v40 Draggable Fix & Styles
 * 
 * Changes:
 * - Added unique 'id' to EVERY fabric object for persistence.
 * - Implemented 'style' logic:
 *   - 'mobile': Checkbox + Instruction Text
 *   - 'business' / 'standard': Clean endorsement area
 */
export class CheckBackEngine {
    static generateCheckBack(width: number, height: number, config: any, scaleFactor: number, depositConfig?: any, signatureImage?: string | null): fabric.Object[] {
        const objects: fabric.Object[] = [];
        const scale = scaleFactor / 72;
        const style = config.style || 'mobile'; // Default to mobile if not specified

        // 0. Base Draggable Backgrounds (User can adjust split manually)
        const endorsementX = width - (1.5 * 72 * scale);

        // Left Panel (Main Security Body - Light Blue)
        objects.push(new fabric.Rect({
            id: 'back-bg-left', // UNIQUE ID
            left: 0,
            top: 0,
            width: endorsementX,
            height: height,
            fill: '#e3f2fd',
            selectable: true, evented: true, hasControls: true, lockRotation: true
        } as any));

        // Right Panel (Endorsement Zone - Clean White)
        objects.push(new fabric.Rect({
            id: 'back-bg-right', // UNIQUE ID
            left: endorsementX,
            top: 0,
            width: width - endorsementX,
            height: height,
            fill: '#ffffff',
            selectable: true, evented: true, hasControls: true, lockRotation: true
        } as any));

        // 1. Watermark (Horizontal Center - Draggable, Big & Bold)
        this.addHorizontalWatermark(width, height, scale, objects);

        // 2. Endorsement Zone (Right Side - All elements unlocked)
        this.addUnlockedEndorsementZone(width, height, scale, objects, style, depositConfig, signatureImage);

        // 3. Security Box (Left Side - All elements unlocked)
        this.addUnlockedSecurityBox(width, height, scale, objects);

        // 4. Fed Reserve Text (Far Left - Draggable)
        this.addUnlockedLegalText(width, height, scale, objects);

        return objects;
    }

    private static addHorizontalWatermark(width: number, height: number, scale: number, objects: fabric.Object[]): void {
        const commonProps = {
            left: width / 2,
            fontSize: 110 * scale,
            fontFamily: 'Arial Black, Arial',
            fontWeight: 900,
            fill: 'rgba(180, 180, 180, 0.18)',
            originX: 'center',
            originY: 'center',
            selectable: true, evented: true, hasControls: true,
            charSpacing: 50
        };

        objects.push(new fabric.Text("ORIGINAL", {
            ...commonProps,
            id: 'watermark-original', // UNIQUE ID
            top: (height * 0.38)
        } as any));

        objects.push(new fabric.Text("DOCUMENT", {
            ...commonProps,
            id: 'watermark-document', // UNIQUE ID
            top: (height * 0.62)
        } as any));
    }

    private static addUnlockedEndorsementZone(width: number, height: number, scale: number, objects: fabric.Object[], style: string, config?: any, signatureImage?: string | null): void {
        const zoneWidth = 1.5 * 72 * scale;
        const zoneX = width - zoneWidth;

        // --- Divider Line ---
        objects.push(new fabric.Line([zoneX, 0, zoneX, height], {
            id: 'endorse-divider', // UNIQUE ID
            stroke: '#999', strokeWidth: 1.2 * scale,
            selectable: true, evented: true, hasControls: true
        } as any));

        // --- Endorsement Elements ---

        // "ENDORSE HERE" Header
        objects.push(new fabric.Text("ENDORSE HERE", {
            id: 'endorse-header', // UNIQUE ID
            left: width - (15 * scale),
            top: 40 * scale,
            fontSize: 10 * scale,
            fontWeight: 'bold',
            fontFamily: 'Arial',
            fill: '#333',
            angle: 90,
            selectable: true, evented: true, hasControls: true
        } as any));

        // Signature X
        const xPosX = zoneX + (zoneWidth * 0.3);
        objects.push(new fabric.Text("X", {
            id: 'endorse-x', // UNIQUE ID
            left: xPosX - (15 * scale),
            top: 60 * scale,
            fontSize: 16 * scale,
            fontFamily: 'Arial',
            fill: '#000',
            angle: 90,
            selectable: true, evented: true, hasControls: true
        } as any));

        // 3 Signature Lines
        const lineStartTop = 60 * scale;
        const lineEndTop = height * 0.55;

        for (let i = 0; i < 3; i++) {
            const lx = xPosX + (i * 35 * scale);
            objects.push(new fabric.Line([lx, lineStartTop, lx, lineEndTop], {
                id: `endorse-line-${i}`, // UNIQUE ID
                stroke: '#ccc', strokeWidth: 1.5 * scale,
                selectable: true, evented: true, hasControls: true
            } as any));
        }

        // --- Mobile Deposit Area (Conditionally Rendered) ---
        if (style === 'mobile') {
            const mobileY = height * 0.68;

            // Instruction: "CHECK HERE IF MOBILE DEPOSIT"
            objects.push(new fabric.Text("CHECK HERE IF MOBILE DEPOSIT", {
                id: 'mobile-instruction', // UNIQUE ID
                left: zoneX + (zoneWidth * 0.75),
                top: mobileY,
                fontSize: 7 * scale,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fill: '#222',
                angle: 90,
                originX: 'center',
                selectable: true, evented: true, hasControls: true
            } as any));

            // Checkbox: Standard Square
            objects.push(new fabric.Rect({
                id: 'mobile-checkbox', // UNIQUE ID
                left: zoneX + (zoneWidth * 0.85),
                top: mobileY,
                width: 16 * scale,
                height: 16 * scale,
                fill: 'transparent',
                stroke: '#222',
                strokeWidth: 1.5 * scale,
                angle: 90,
                originX: 'center',
                originY: 'center',
                selectable: true, evented: true, hasControls: true
            } as any));
        }

        // Warning Text (Always present)
        objects.push(new fabric.Text("DO NOT WRITE, SIGN OR STAMP BELOW THIS LINE", {
            id: 'endorse-warning', // UNIQUE ID
            left: zoneX + (zoneWidth * 0.5),
            top: height * 0.88,
            fontSize: 6 * scale,
            fontWeight: '800',
            fontFamily: 'Arial',
            fill: '#444',
            angle: 90,
            originX: 'center',
            selectable: true, evented: true, hasControls: true
        } as any));

        objects.push(new fabric.Text("RESERVED FOR FINANCIAL INSTITUTION USE*", {
            id: 'endorse-reserved', // UNIQUE ID
            left: zoneX + (zoneWidth * 0.2),
            top: height * 0.92,
            fontSize: 5 * scale,
            fontFamily: 'Arial',
            fill: '#888',
            angle: 90,
            originX: 'center',
            selectable: true, evented: true, hasControls: true
        } as any));
    }

    private static addUnlockedSecurityBox(width: number, height: number, scale: number, objects: fabric.Object[]): void {
        const boxLeft = 60 * scale;
        const boxTop = 40 * scale;
        const boxW = 120 * scale;
        const boxH = height * 0.82;

        // Security Box Rect
        objects.push(new fabric.Rect({
            id: 'security-box-frame', // UNIQUE ID
            left: boxLeft, top: boxTop, width: boxW, height: boxH,
            fill: 'transparent', stroke: '#888', strokeWidth: 1.2 * scale,
            selectable: true, evented: true, hasControls: true
        } as any));

        // "SECURITY FEATURES" Header
        objects.push(new fabric.Text("SECURITY FEATURES", {
            id: 'security-header', // UNIQUE ID
            left: boxLeft + (25 * scale),
            top: height / 2,
            fontSize: 9 * scale,
            fontWeight: 'bold',
            fontFamily: 'Arial',
            fill: '#111',
            angle: 90,
            originX: 'center',
            originY: 'center',
            selectable: true, evented: true, hasControls: true
        } as any));

        // Refined detailed feature list
        const features = [
            "• AUTHENTIC DOCUMENT WATERMARK",
            "• ROUTING NUMBER VERIFICATION",
            "• SECURITY SCREEN BACKDROP",
            "• MICROPRINTING ALONG LINES (MP)",
            "• CHEMICAL SENSITIVE PAPER STOCK",
            "• FLUORESCENT FIBER TECHNOLOGY"
        ];

        features.forEach((f, i) => {
            objects.push(new fabric.Text(f, {
                id: `security-feature-${i}`, // UNIQUE ID
                left: boxLeft + (50 * scale) + (i * 15 * scale),
                top: height / 2,
                fontSize: 6.5 * scale,
                fontFamily: 'Arial',
                fontWeight: '600',
                fill: '#222',
                angle: 90,
                originX: 'center',
                originY: 'center',
                selectable: true, evented: true, hasControls: true
            } as any));
        });
    }

    private static addUnlockedLegalText(width: number, height: number, scale: number, objects: fabric.Object[]): void {
        objects.push(new fabric.Text("FEDERAL RESERVE REG CC COMPLIANT", {
            id: 'legal-text-compliance', // UNIQUE ID
            left: 15 * scale,
            top: height / 2,
            fontSize: 5 * scale,
            fontWeight: 'bold',
            fontFamily: 'Arial',
            fill: '#999',
            angle: 90,
            originX: 'center',
            originY: 'center',
            selectable: true, evented: true, hasControls: true
        } as any));
    }
}
