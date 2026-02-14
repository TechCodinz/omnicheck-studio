import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_bofa_v2_security_plate(output_path="bofa_v2_security_plate.png", dpi=300):
    """
    Standalone generator for high-fidelity check security patterns.
    Dimensions: 8.5 x 3.5 inches at 300 DPI = 2550 x 1050 pixels.
    """
    # 1. Setup Canvas
    width = int(8.5 * dpi)
    height = int(3.5 * dpi)
    bg_color = (255, 255, 255)
    img = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # Colors
    bofa_blue = (59, 90, 154) # #3b5a9a
    light_blue = (217, 238, 252) # #d9eefc
    teal_tint = (203, 221, 232, 100)
    
    # 2. Engine: Fine Radial Guilloché (Starburst Background)
    print("Generating Radial Guilloché...")
    cx, cy = width - int(1.13 * dpi), height - int(0.8 * dpi) # Hologram anchor
    
    # Render multiple layers of radial waves to create Moiré interference
    for r in range(10, int(math.sqrt(width**2 + height**2)), 6):
        points = []
        # high-density theta for professional smoothness
        steps = 720 
        for i in range(steps + 1):
            theta = (i / steps) * 2 * math.pi
            # Guilloché Equation: r' = r + amp * sin(freq * theta)
            amp = r * 0.02
            freq = 48
            r_prime = r + amp * math.sin(freq * theta)
            x = cx + r_prime * math.cos(theta)
            y = cy + r_prime * math.sin(theta)
            points.append((x, y))
        draw.line(points, fill=light_blue, width=1)

    # 3. Engine: Flexible Border Engine
    def draw_border(style="BRAIDED"):
        m = 45 # Margin
        band_width = 15
        
        if style == "BRAIDED":
            print("Generating Braided Ribbon Border...")
            draw.rectangle([m, m, width - m, height - m], outline=bofa_blue, width=band_width)
            segments = [
                ((m, m), (width - m, m)), ((width - m, m), (width - m, height - m)),
                ((width - m, height - m), (m, height - m)), ((m, height - m), (m, m))
            ]
            for start, end in segments:
                dx, dy = end[0] - start[0], end[1] - start[1]
                length, angle = math.sqrt(dx**2 + dy**2), math.atan2(dy, dx)
                for t in range(0, int(length)):
                    freq, amp = 0.5, band_width * 0.35
                    def get_pt(t_val, y_val):
                        return (start[0] + t_val * math.cos(angle) - y_val * math.sin(angle),
                                start[1] + t_val * math.sin(angle) + y_val * math.cos(angle))
                    draw.point(get_pt(t, math.sin(t * freq) * amp), fill=(255, 255, 255))
                    draw.point(get_pt(t, math.sin(t * freq + math.pi) * amp), fill=(255, 255, 255))

        elif style == "SPIRO":
            print("Generating Spiro-Loop Border...")
            # Draws a chain of bulging loops
            segments = [((m, m), (width - m, m)), ((width - m, m), (width - m, height - m)),
                        ((width - m, height - m), (m, height - m)), ((m, height - m), (m, m))]
            for start, end in segments:
                dx, dy = end[0] - start[0], end[1] - start[1]
                length, angle = math.sqrt(dx**2 + dy**2), math.atan2(dy, dx)
                points = []
                for t in np.linspace(0, length, int(length * 2)):
                    # Spiro equation for scalloped edge
                    freq, amp = 0.3, 10
                    y = abs(math.sin(t * freq)) * amp
                    x_adj = t - (math.sin(t * freq * 2) * 2)
                    gx = start[0] + x_adj * math.cos(angle) - y * math.sin(angle)
                    gy = start[1] + x_adj * math.sin(angle) + y * math.cos(angle)
                    points.append((gx, gy))
                draw.line(points, fill=bofa_blue, width=2)

        elif style == "MICROPRINT":
            print("Generating Microprint Border...")
            micro_font = ImageFont.load_default()
            txt = "AUTHORIZED DOCUMENT " * 50
            draw.text((m, m-10), txt, fill=bofa_blue, font=micro_font) # Top
            draw.text((m, height-m+5), txt, fill=bofa_blue, font=micro_font) # Bottom

    # Choose Border Style here: ["BRAIDED", "SPIRO", "MICROPRINT"]
    draw_border("BRAIDED") 

    # 4. Engine: Shining Hologram & Heat Sensitive Icon
    print("Generating Hologram & Heat Icon...")
    h_cx, h_cy = cx, cy
    h_radius = 50
    # Metallic Medallion Blend
    for r in range(h_radius, 0, -1):
        # Shift colors from Gold to Silver to simulate iridescence
        color = (212 - r, 175 - r//2, 55 + r, 255)
        draw.ellipse([h_cx - r, h_cy - r, h_cx + r, h_cy + r], outline=color, width=2)
    
    # Specular highlight
    draw.ellipse([h_cx - 15, h_cy - 15, h_cx - 5, h_cy - 5], fill=(255, 255, 255, 180))

    # Heat Sensitive Thumbprint (Approx)
    t_x, t_y = width - int(0.6 * dpi), height - int(1.2 * dpi)
    draw.ellipse([t_x - 30, t_y - 45, t_x + 30, t_y + 45], fill=(200, 200, 200, 80)) # Light grey reactive base
    draw.text((t_x, t_y), "🔒", fill=(0,0,0,150), anchor="mm", font=ImageFont.load_default())

    # 5. Engine: Shared Fonts & Microprint
    try:
        # Attempt to load a small font (at 300 DPI, 10pt is legible but small)
        font = ImageFont.truetype("arial.ttf", 10)
    except:
        font = ImageFont.load_default()

    print("Generating Microprint...")
    micro_text = "ORIGINAL DOCUMENT HAS A COLORED BACKGROUND AND MICROPRINTING " * 10
    draw.text((width - 60, height // 2), micro_text, fill=bofa_blue, font=font, direction="ttb", anchor="mm")

    # 6. Final Polish: Noise & Watermark
    img = img.convert("RGBA")
    # Subtle "AUTHENTIC" Watermark
    wm = Image.new("RGBA", (width, height), (0,0,0,0))
    wmdraw = ImageDraw.Draw(wm)
    for y in range(0, height, 300):
        for x in range(0, width, 500):
            wmdraw.text((x, y), "AUTHENTIC", fill=(0,0,0,10), font=font)
    
    img = Image.alpha_composite(img, wm)
    
    # Save Output
    img.save(output_path)
    print(f"Success! High-fidelity security plate saved to: {output_path}")

if __name__ == "__main__":
    create_bofa_v2_security_plate()
