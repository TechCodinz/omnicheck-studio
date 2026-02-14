/**
 * SignatureExtractorEngine - Precise Signature Isolation & Clean v1.5
 * 
 * Major Fixes:
 * - Aggressive Footer Removal: No longer protects "significant" blobs in the footer area.
 * - Targeted Line Breaking: Increased vConnect threshold to ensure cleaner separation.
 * - Search-Space adjustment: Broadened line detection search area.
 * - Solid Rendering: Ensures signature is bold and visible.
 */

export class SignatureExtractorEngine {
    public static async processSignature(dataUrl: string, options: {
        threshold?: number,
        removeLines?: boolean,
        tintColor?: string
    } = {}): Promise<string> {
        const { threshold = 215, removeLines = true, tintColor } = options;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('Canvas context');

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const width = canvas.width;
                const height = canvas.height;

                // Create a luminosity map for analysis
                const pixels = new Uint8ClampedArray(width * height);
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
                    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
                    pixels[i / 4] = (a < 50) ? 255 : luma;
                }

                if (removeLines) {
                    const lineMask = new Uint8Array(width * height).fill(0);

                    // --- STEP 1: DETECT SIGNATURE LINE ---
                    const rowDensity = new Int32Array(height).fill(0);
                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            if (pixels[y * width + x] < threshold) rowDensity[y]++;
                        }
                    }

                    let lineY = -1;
                    let maxDensity = 0;
                    // Detect signature line between 50% and 95% of height
                    const searchStart = Math.floor(height * 0.50);
                    const searchEnd = Math.floor(height * 0.95);

                    for (let y = searchStart; y < searchEnd; y++) {
                        if (rowDensity[y] > width * 0.35 && rowDensity[y] > maxDensity) {
                            maxDensity = rowDensity[y];
                            lineY = y;
                        }
                    }

                    // --- STEP 2: AGGRESSIVE LINE BREAK ---
                    if (lineY !== -1) {
                        const range = 5;
                        for (let y = lineY - range; y <= lineY + range; y++) {
                            if (y < 0 || y >= height) continue;
                            for (let x = 0; x < width; x++) {
                                const idx = y * width + x;
                                if (pixels[idx] < threshold) {
                                    // Vertical connectivity check (Total ink pixels above/below within 5px)
                                    let vConnect = 0;
                                    for (let k = 1; k <= 5; k++) {
                                        if (y - k >= 0 && pixels[(y - k) * width + x] < threshold) vConnect++;
                                        if (y + k < height && pixels[(y + k) * width + x] < threshold) vConnect++;
                                    }
                                    // If vertical connectivity is weak (< 3), it's likely part of the line. Break it.
                                    if (vConnect < 3) {
                                        lineMask[idx] = 1;
                                    }
                                }
                            }
                        }
                    }

                    // --- STEP 3: BLOB ANALYSIS & FOOTER PURGE ---
                    const visited = new Uint8Array(width * height).fill(0);
                    const labelMap = new Int32Array(width * height).fill(0);
                    let currentLabel = 0;
                    const blobStats: Record<number, { minY: number, maxY: number, area: number }> = {};

                    const stack: number[] = [];
                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            const idx = y * width + x;
                            if (pixels[idx] < threshold && lineMask[idx] === 0 && visited[idx] === 0) {
                                currentLabel++;
                                blobStats[currentLabel] = { minY: y, maxY: y, area: 0 };
                                stack.push(idx);
                                visited[idx] = 1;

                                while (stack.length > 0) {
                                    const curr = stack.pop()!;
                                    const cx = curr % width;
                                    const cy = Math.floor(curr / width);

                                    labelMap[curr] = currentLabel;
                                    blobStats[currentLabel].area++;
                                    if (cy < blobStats[currentLabel].minY) blobStats[currentLabel].minY = cy;
                                    if (cy > blobStats[currentLabel].maxY) blobStats[currentLabel].maxY = cy;

                                    const neighbors = [curr - 1, curr + 1, curr - width, curr + width];
                                    for (const n of neighbors) {
                                        if (n >= 0 && n < width * height) {
                                            if (Math.abs((n % width) - cx) > 1) continue;
                                            if (pixels[n] < threshold && lineMask[n] === 0 && visited[n] === 0) {
                                                visited[n] = 1;
                                                stack.push(n);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    let maxArea = 0;
                    let largestLabel = -1;
                    for (const lStr in blobStats) {
                        const l = parseInt(lStr);
                        if (blobStats[l].area > maxArea) {
                            maxArea = blobStats[l].area;
                            largestLabel = l;
                        }
                    }

                    // Final Decision: Keep OR Purge
                    for (const lStr in blobStats) {
                        const l = parseInt(lStr);
                        const stat = blobStats[l];

                        // Rule 1: Always keep the absolute largest blob (Safety)
                        if (l === largestLabel && stat.area > 20) continue;

                        // Rule 2: Keep blobs that start high (Top 60% of image)
                        const isHighBody = stat.minY < (height * 0.60);
                        if (isHighBody) continue;

                        // Rule 3: Purge anything else in the footer area (below line or bottom 20%)
                        const isBelowLine = (lineY !== -1 && stat.minY > lineY - 2);
                        const isBottomZone = stat.minY > (height * 0.80);

                        if (isBelowLine || isBottomZone) {
                            for (let i = 0; i < width * height; i++) {
                                if (labelMap[i] === l) lineMask[i] = 1;
                            }
                        }
                    }

                    // --- FINAL PASS: RENDER ---
                    const targetRGB = tintColor ? this.hexToRgb(tintColor) : { r: 10, g: 30, b: 80 };
                    for (let i = 0; i < data.length; i += 4) {
                        const idx = i / 4;
                        const isDark = pixels[idx] < threshold;
                        const isDeleted = lineMask[idx] === 1;

                        if (isDeleted || !isDark || pixels[idx] > 245) {
                            data[i + 3] = 0;
                        } else {
                            data[i] = targetRGB.r;
                            data[i + 1] = targetRGB.g;
                            data[i + 2] = targetRGB.b;
                            data[i + 3] = 255;
                        }
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL());
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    private static hexToRgb(hex: string): { r: number, g: number, b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 10, g: 30, b: 80 };
    }
}
