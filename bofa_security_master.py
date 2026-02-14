import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_bofa_security_master(output_path="bofa_v2_security_master.png", dpi=300):
    """
    High-Fidelity Security Pattern Master Generator.
    Aesthetics matched to Bank of America Business/Personal V2.
    """
    # 1. Dimensions & Canvas setup (8.5" x 3.5")
    width = int(8.5 * dpi)
    height = int(3.5 * dpi)
    
    # RGB Calibration: Ultra-pale blue base (L>90)
    base_color = (235, 245, 255, 255) # Soft Alice Blue Tones
    img = Image.new("RGBA", (width, height), base_color)
    draw = ImageDraw.Draw(img)

    # Colors
    primary_blue = (59, 90, 154, 255)    # BofA Navy
    guilloche_blue = (100, 140, 200, 40) # Low-opacity 15-20%
    microprint_color = (50, 80, 120, 255) 

    # 2. Engine: High-Frequency Guilloché Background
    print("Layering Guilloché textures...")
    # Center patterns slightly off-center for asymmetric security look
    cx, cy = width // 2, height // 2
    
    # Layer A: fine radial starburst
    for r in range(10, int(math.sqrt(width**2 + height**2)), 8):
        points = []
        steps = 1000
        for i in range(steps + 1):
            theta = (i / steps) * 2 * math.pi
            # Subtle interference amplitude
            amp = 3 * math.sin(r * 0.05) 
            r_prime = r + amp * math.sin(60 * theta)
            points.append((cx + r_prime * math.cos(theta), cy + r_prime * math.sin(theta)))
        draw.line(points, fill=guilloche_blue, width=1)

    # 3. Engine: Advanced Microprint Border (Tiny Text)
    print("Rendering Microprint border...")
    try:
        # 4-6pt font at 300dpi is approx 16-24px. 
        # But for 'true' microprint that looks solid, we use very small font.
        font_size = 12 
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()

    border_text = "AUTHORIZED DOCUMENT BANK OF AMERICA MICROPRINT SECURITY " * 40
    margin = 50
    # Top/Bottom borders
    draw.text((margin, margin - 15), border_text, fill=microprint_color, font=font)
    draw.text((margin, height - margin + 5), border_text, fill=microprint_color, font=font)
    
    # 4. Engine: Conic-Gradient Hologram (Rainbow Iridescence)
    print("Generating Conic-Gradient Hologram...")
    h_cx, h_cy = width - int(1.2 * dpi), height - int(0.8 * dpi)
    h_radius = 60
    
    # Create angular segments to simulate a conic/rainbow gradient
    h_img = Image.new("RGBA", (h_radius * 2, h_radius * 2), (0,0,0,0))
    h_draw = ImageDraw.Draw(h_img)
    center = (h_radius, h_radius)
    
    for angle in range(0, 360):
        # Calc hue-based color
        # Cyan-Magenta-Yellow-Green sweep
        h = (angle / 360)
        # Convert simple angle to a metallic-shifted RGB
        r_val = int(127 + 127 * math.sin(h * 2 * math.pi))
        g_val = int(127 + 127 * math.sin(h * 2 * math.pi + 2*math.pi/3))
        b_val = int(127 + 127 * math.sin(h * 2 * math.pi + 4*math.pi/3))
        
        h_draw.pieslice([0, 0, h_radius*2, h_radius*2], angle, angle+1, fill=(r_val, g_val, b_val, 60))

    # Add metallic starburst highlights
    for i in range(16):
        a = (i / 16) * 2 * math.pi
        h_draw.line([h_radius, h_radius, h_radius + h_radius * math.cos(a), h_radius + h_radius * math.sin(a)], fill=(255, 255, 255, 100), width=2)
    
    # Overlay the hologram medallion
    img.alpha_composite(h_img, (h_cx - h_radius, h_cy - h_radius))

    # 5. Simulation: Paper Texture & True Watermark
    print("Applying Watermark & Texture...")
    # Watermark: Low-opacity "BANK"
    wm_overlay = Image.new("RGBA", (width, height), (0,0,0,0))
    wm_draw = ImageDraw.Draw(wm_overlay)
    for y in range(0, height, 400):
        for x in range(0, width, 600):
            wm_draw.text((x, y), "BANK", fill=(255, 255, 255, 15), font=font)
    img = Image.alpha_composite(img, wm_overlay)

    # Noise for paper texture
    arr = np.array(img)
    noise = np.random.normal(0, 2, arr.shape).astype('int16')
    arr = np.clip(arr.astype('int16') + noise, 0, 255).astype('uint8')
    img = Image.fromarray(arr)

    # 6. Placeholders for Data
    draw = ImageDraw.Draw(img)
    # Amount Rect
    draw.rectangle([width - 800, height // 2 - 40, width - 200, height // 2 + 40], outline=(0,0,0,30), width=1)
    # Signature Line
    draw.line([width - 800, height - 200, width - 200, height - 200], fill=(0,0,0,80), width=2)
    
    # Save output
    img.save(output_path)
    print(f"Master Security Plate generated: {output_path}")

if __name__ == "__main__":
    create_bofa_security_master()
