import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

export class HandwritingEngine {
    private penPressureCurves: Map<string, number[]> = new Map();
    public inkColors: Map<string, THREE.Color> = new Map();
    private paperTexture: THREE.Texture | null = null;

    constructor() {
        this.initializeInkColors();
        this.initializePenProfiles();
    }

    private initializeInkColors() {
        // Real pen ink colors with subtle variations
        this.inkColors.set('blue-black', new THREE.Color(0x1a237e));
        this.inkColors.set('royal-blue', new THREE.Color(0x2962ff));
        this.inkColors.set('black', new THREE.Color(0x212121));
        this.inkColors.set('red', new THREE.Color(0xd32f2f));
        this.inkColors.set('green', new THREE.Color(0x388e3c));
        this.inkColors.set('purple', new THREE.Color(0x7b1fa2));

        // Gel pen colors
        this.inkColors.set('gel-blue', new THREE.Color(0x2196f3));
        this.inkColors.set('gel-black', new THREE.Color(0x424242));
        this.inkColors.set('gel-red', new THREE.Color(0xf44336));

        // Fountain pen inks (with sheen)
        this.inkColors.set('fountain-blue', new THREE.Color(0x0d47a1));
        this.inkColors.set('fountain-black', new THREE.Color(0x1a1a1a));
        this.inkColors.set('fountain-burgundy', new THREE.Color(0x880e4f));
    }

    private initializePenProfiles() {
        // Pen pressure curves for different pen types
        this.penPressureCurves.set('ballpoint', [
            0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0, 0.9, 0.8, 0.7, 0.5, 0.3, 0.1
        ]);

        this.penPressureCurves.set('fountain', [
            0.2, 0.4, 0.7, 0.9, 1.0, 1.0, 1.0, 0.9, 0.7, 0.5, 0.3, 0.2, 0.1
        ]);

        this.penPressureCurves.set('gel', [
            0.3, 0.6, 0.8, 0.9, 0.95, 1.0, 0.95, 0.9, 0.8, 0.6, 0.4, 0.2, 0.1
        ]);

        this.penPressureCurves.set('rollerball', [
            0.4, 0.7, 0.9, 1.0, 1.0, 1.0, 1.0, 0.9, 0.8, 0.6, 0.4, 0.2, 0.1
        ]);
    }

    // Create realistic handwritten signature
    createHandwrittenSignature(
        text: string,
        penType: string = 'ballpoint',
        inkColor: string = 'blue-black',
        options: HandwritingOptions = {}
    ): THREE.Group {
        const group = new THREE.Group();
        const points = this.generateHandwritingPoints(text, penType, options);

        // Create line geometry with pressure variation
        const geometry = new LineGeometry();
        const positions: number[] = [];
        const pressures: number[] = [];

        points.forEach((point, index) => {
            positions.push(point.x, point.y, 0);
            pressures.push(point.pressure);

            // Add subtle randomness to positions for natural variation
            if (index > 0 && index < points.length - 1) {
                const jitter = 0.1;
                positions[positions.length - 3] += (Math.random() - 0.5) * jitter;
                positions[positions.length - 2] += (Math.random() - 0.5) * jitter;
            }
        });

        if (positions.length > 0) {
            geometry.setPositions(positions);
            // Note: LineGeometry does not typically support custom attributes like 'pressure' in standard shaders without modification, 
            // but we'll include it as per request.
            // geometry.setAttribute('pressure', new THREE.BufferAttribute(new Float32Array(pressures), 1)); 

            // Create line material with ink properties
            const material = new LineMaterial({
                color: this.inkColors.get(inkColor)?.getHex() || 0x0000ff,
                linewidth: options.lineWidth || 0.005,
                transparent: true,
                opacity: 0.9,
                dashed: false,
                alphaToCoverage: true,
                worldUnits: true
            });

            const line = new Line2(geometry, material);
            line.computeLineDistances();

            // Add ink bleed effect
            this.addInkBleedEffect(line, penType, inkColor);

            // Add pen stroke texture
            this.addPenStrokeTexture(line, penType);

            group.add(line);
        }

        return group;
    }

    private generateHandwritingPoints(
        text: string,
        penType: string,
        options: HandwritingOptions
    ): HandwritingPoint[] {
        const points: HandwritingPoint[] = [];
        const pressureCurve = this.penPressureCurves.get(penType) || this.penPressureCurves.get('ballpoint')!;

        // Generate points for each character
        let x = 0;
        let y = 0;

        for (const char of text) {
            const charPoints = this.generateCharacterPoints(char, x, y, penType, options);

            // Apply pressure variations based on pen type
            charPoints.forEach((point, index) => {
                const pressureIndex = Math.min(index, pressureCurve.length - 1);
                point.pressure = pressureCurve[pressureIndex] * (0.8 + Math.random() * 0.4);

                // Add natural hand tremor
                if (options.withTremor) {
                    point.x += (Math.random() - 0.5) * 0.05;
                    point.y += (Math.random() - 0.5) * 0.05;
                }
            });

            points.push(...charPoints);

            // Move to next character position
            x += this.getCharacterWidth(char) * (options.letterSpacing || 1.0);

            // Add natural baseline variation
            y += (Math.random() - 0.5) * 0.1;
        }

        return points;
    }

    private getCharacterWidth(char: string): number {
        return 1; // Placeholder
    }

    private getCharacterStrokes(char: string): StrokeDefinition[] {
        // Very basic placeholder strokes
        return [{
            startX: 0, startY: 0, endX: 1, endY: 1
        }];
    }

    private generateStrokePoints(stroke: StrokeDefinition, startX: number, startY: number, penType: string): HandwritingPoint[] {
        // Placeholder implementation to connect start to end
        const points: HandwritingPoint[] = [];
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            points.push({
                x: startX + (stroke.endX - stroke.startX) * t,
                y: startY + (stroke.endY - stroke.startY) * t,
                pressure: 0.5
            });
        }
        return points;
    }

    private generateCharacterPoints(
        char: string,
        startX: number,
        startY: number,
        penType: string,
        options: HandwritingOptions
    ): HandwritingPoint[] {
        const points: HandwritingPoint[] = [];

        // Character stroke definitions
        const strokes = this.getCharacterStrokes(char);

        strokes.forEach(stroke => {
            const strokePoints = this.generateStrokePoints(stroke, startX, startY, penType);

            // Apply individual stroke characteristics
            strokePoints.forEach((point, index) => {
                // Start and end of strokes are lighter
                if (index < 3 || index > strokePoints.length - 4) {
                    point.pressure *= 0.7;
                }

                // Middle of strokes have more pressure
                if (index > strokePoints.length / 3 && index < strokePoints.length * 2 / 3) {
                    point.pressure *= 1.2;
                }
            });

            points.push(...strokePoints);

            // Lift pen between strokes (except for cursive)
            if (!options.cursive) {
                points.push({
                    x: startX + stroke.endX,
                    y: startY + stroke.endY,
                    pressure: 0,
                    penDown: false
                });
            }
        });

        return points;
    }

    private addInkBleedEffect(line: Line2, penType: string, inkColor: string) {
        // Create ink bleed halo
        const bleedGeometry = line.geometry.clone();
        const bleedMaterial = new LineMaterial({
            color: this.inkColors.get(inkColor)?.getHex() || 0x0000ff,
            linewidth: line.material.linewidth * 1.5,
            transparent: true,
            opacity: 0.3,
            dashed: false
        });

        const bleedLine = new Line2(bleedGeometry, bleedMaterial);
        bleedLine.renderOrder = line.renderOrder - 1;
        // line.parent is possibly null here if not added to parent yet
        // line.add(bleedLine) is better
        line.add(bleedLine);
    }

    private addPenStrokeTexture(line: Line2, penType: string) {
        // Create canvas for pen stroke texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d')!;

        // Generate pen tip texture
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );

        if (penType === 'fountain') {
            gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
            gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else if (penType === 'gel') {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.2, 'rgba(200, 200, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
            gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply as line texture
        const texture = new THREE.CanvasTexture(canvas);
        // Cast to any to bypass type check if map property is missing in definition
        (line.material as any).map = texture;
    }

    // Real-time handwriting capture
    startHandwritingCapture(
        canvas: HTMLCanvasElement,
        onSignatureComplete: (signatureData: SignatureData) => void
    ): HandwritingCaptureSession {
        const ctx = canvas.getContext('2d')!;
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        let points: Array<{ x: number, y: number, pressure: number }> = [];

        // Set up drawing context
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#1a237e';

        const handleMouseDown = (e: MouseEvent) => {
            isDrawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY];
            points.push({ x: lastX, y: lastY, pressure: 1.0 });
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDrawing) return;

            ctx.lineWidth = 2 + Math.random() * 0.5; // Natural variation
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();

            [lastX, lastY] = [e.offsetX, e.offsetY];

            // Calculate pressure based on speed
            const speed = Math.sqrt(
                Math.pow(e.movementX, 2) + Math.pow(e.movementY, 2)
            );
            const pressure = Math.max(0.5, Math.min(1.5, 2 - speed / 10));

            points.push({ x: e.offsetX, y: e.offsetY, pressure });
        };

        const handleMouseUp = () => {
            if (isDrawing) {
                isDrawing = false;

                // Process captured signature
                const signatureData = this.processCapturedSignature(points, canvas);
                onSignatureComplete(signatureData);

                points = [];
            }
        };

        // Touch support for mobile
        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('touchstart', handleTouchStart);

        return {
            stop: () => {
                canvas.removeEventListener('mousedown', handleMouseDown);
                canvas.removeEventListener('mousemove', handleMouseMove);
                canvas.removeEventListener('mouseup', handleMouseUp);
                canvas.removeEventListener('touchstart', handleTouchStart);
            }
        };
    }

    private processCapturedSignature(
        points: Array<{ x: number, y: number, pressure: number }>,
        canvas: HTMLCanvasElement
    ): SignatureData {
        // Normalize points
        const normalizedPoints = points.map(p => ({
            x: p.x / canvas.width,
            y: p.y / canvas.height,
            pressure: p.pressure
        }));

        // Calculate signature metrics
        const bounds = this.calculateBounds(normalizedPoints);
        const smoothness = this.calculateSmoothness(normalizedPoints);
        const consistency = this.calculateConsistency(normalizedPoints);

        return {
            points: normalizedPoints,
            bounds,
            smoothness,
            consistency,
            timestamp: Date.now(),
            vectorData: this.pointsToVectorData(normalizedPoints)
        };
    }

    private calculateBounds(points: NormalizedPoint[]): BoundingBox {
        // Placeholder
        return { minX: 0, minY: 0, maxX: 1, maxY: 1, width: 1, height: 1 };
    }

    private calculateSmoothness(points: NormalizedPoint[]): number { return 1; }
    private calculateConsistency(points: NormalizedPoint[]): number { return 1; }

    private pointsToVectorData(points: NormalizedPoint[]): VectorSignature {
        const strokes: VectorStroke[] = [];
        let currentStroke: VectorPoint[] = [];

        points.forEach((point, index) => {
            currentStroke.push({
                x: point.x,
                y: point.y,
                pressure: point.pressure
            });

            // Break stroke if there's a large gap
            if (index < points.length - 1) {
                const nextPoint = points[index + 1];
                const distance = Math.sqrt(
                    Math.pow(nextPoint.x - point.x, 2) +
                    Math.pow(nextPoint.y - point.y, 2)
                );

                if (distance > 0.05) { // Threshold for new stroke
                    if (currentStroke.length > 1) {
                        strokes.push({
                            points: [...currentStroke],
                            startTime: index,
                            endTime: index + currentStroke.length
                        });
                    }
                    currentStroke = [];
                }
            }
        });

        // Add final stroke
        if (currentStroke.length > 1) {
            strokes.push({
                points: currentStroke,
                startTime: points.length - currentStroke.length,
                endTime: points.length
            });
        }

        return {
            strokes,
            boundingBox: this.calculateBounds(points),
            totalDuration: points.length
        };
    }
}

// Types
export interface HandwritingOptions {
    cursive?: boolean;
    letterSpacing?: number;
    lineWidth?: number;
    withTremor?: boolean;
    pressureVariation?: number;
}

interface HandwritingPoint {
    x: number;
    y: number;
    pressure: number;
    penDown?: boolean;
}

interface StrokeDefinition {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    controlPoints?: Array<{ x: number, y: number }>;
}

export interface HandwritingCaptureSession {
    stop: () => void;
}

export interface SignatureData {
    points: NormalizedPoint[];
    bounds: BoundingBox;
    smoothness: number;
    consistency: number;
    timestamp: number;
    vectorData: VectorSignature;
}

interface NormalizedPoint {
    x: number;
    y: number;
    pressure: number;
}

interface VectorSignature {
    strokes: VectorStroke[];
    boundingBox: BoundingBox;
    totalDuration: number;
}

interface VectorStroke {
    points: VectorPoint[];
    startTime: number;
    endTime: number;
}

interface VectorPoint {
    x: number;
    y: number;
    pressure: number;
}

interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
}
