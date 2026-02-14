import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

def create_bofa_uv_security_pro(output_base="calibrated_security_check_pattern", dpi=300):
    """
    Ultraviolet Security Pattern Pro Generator.
    Produces two outputs: 'visible' (daylight) and 'uv_glow' (365nm blacklight).
    """
    width = int(8.5 * dpi)
    height = int(3.5 * dpi)
    
    # 1. Buffers
    # Buffer A: Visible Spectrum (High Lightness L>90)
    visible_bg = (235, 245, 255, 255)
    img_visible = Image.new("RGBA", (width, height), visible_bg)
    draw_v = ImageDraw.Draw(img_visible)
    
    # Buffer B: UV/Fluorescent Spectrum (Dark/Black base for glow simulation)
    img_uv = Image.new("RGBA", (width, height), (0, 0, 0, 255))
    draw_u = ImageDraw.Draw(img_uv)

    # Global Colors & Fonts
    bofa_blue = (59, 90, 154, 255)
    micro_color = (40, 70, 110, 255)
    
    # Fluorescent UV Colors (Vivid Neon)
    uv_neon_green = (0, 255, 120, 255)
    uv_neon_blue = (50, 255, 255, 255)
    uv_neon_purple = (220, 100, 255, 255)
    uv_neon_yellow = (255, 255, 80, 255)

    try:
        font_micro = ImageFont.truetype("arial.ttf", 10)
        font_watermark = ImageFont.truetype("arial.ttf", 40)
    except:
        font_micro = ImageFont.load_default()
        font_watermark = ImageFont.load_default()

    # 2. Engine: Background Guilloché (Visible)
    print("Generating Visible Guilloché...")
    for r in range(0, int(math.sqrt(width**2 + height**2)), 10):
        points = []
        steps = 800
        for i in range(steps + 1):
            theta = (i / steps) * 2 * math.pi
            amp = 4 * math.sin(r * 0.02)
            r_prime = r + amp * math.sin(40 * theta)
            points.append((width//2 + r_prime * math.cos(theta), height//2 + r_prime * math.sin(theta)))
        draw_v.line(points, fill=(140, 180, 240, 30), width=1)

    # 3. Engine: UV Fluorescent Fibers (Hidden)
    print("Scattering Fluorescent UV fibers...")
    np.random.seed(42) # Consistent scatter
    uv_colors = [uv_neon_green, uv_neon_blue, uv_neon_purple, uv_neon_yellow]
    for _ in range(500): # High density for 300DPI
        x = np.random.randint(0, width)
        y = np.random.randint(0, height)
        # Fix: use Python's random choice or indexing for nested tuples/lists
        color = uv_colors[np.random.randint(0, len(uv_colors))]
        
        # Visible layer: 5% opacity (nearly invisible)
        visible_fiber = color[:3] + (15,) 
        draw_v.ellipse([x-2, y-2, x+2, y+2], fill=visible_fiber)
        
        # UV layer: 100% opacity glow
        draw_u.ellipse([x-3, y-3, x+3, y+3], fill=color)
        # Add a small glow bloom in UV
        draw_u.ellipse([x-6, y-6, x+6, y+6], outline=color[:3]+(50,), width=1)

    # 4. Engine: Hidden UV Overprint (Symbols)
    print("Adding UV-sensitive patterns...")
    for x in range(0, width, 400):
        for y in range(0, height, 300):
            # Normal: 2% opacity
            draw_v.text((x, y), "SECURE", fill=(0, 255, 200, 5), font=font_watermark)
            # UV: High glow
            draw_u.text((x, y), "SECURE", fill=(0, 255, 255, 180), font=font_watermark)

    # 5. Engine: Advanced Microprint Border
    print("Protecting with Microprint border...")
    m = 50
    micro_txt = "AUTHORIZED MICROPRINT SECURE DOCUMENT VOID IF COPIED " * 30
    draw_v.text((m, m-12), micro_txt, fill=micro_color, font=font_micro)
    draw_v.text((m, height-m+3), micro_txt, fill=micro_color, font=font_micro)

    # 6. Engine: Rainbow Hologram Medallion
    print("Forging Iridescent Hologram...")
    hx, hy = width - int(1.1 * dpi), height - int(0.9 * dpi)
    hr = 60
    # Conic simulation
    for i in range(360):
        hue = (i/360)
        r_v = int(127 + 127 * math.sin(hue * 2 * math.pi))
        g_v = int(127 + 127 * math.sin(hue * 2 * math.pi + 2*math.pi/3))
        b_v = int(127 + 127 * math.sin(hue * 2 * math.pi + 4*math.pi/3))
        draw_v.pieslice([hx-hr, hy-hr, hx+hr, hy+hr], i, i+1, fill=(r_v, g_v, b_v, 80))
    # Metallic specular
    draw_v.ellipse([hx-20, hy-20, hx+5, hy+5], fill=(255,255,255,150))

    # 7. Final Polish: Noise & Normal Watermark
    img_visible = img_visible.convert("RGB")
    arr = np.array(img_visible)
    noise = np.random.normal(0, 1.5, arr.shape).astype('int16')
    arr = np.clip(arr.astype('int16') + noise, 0, 255).astype('uint8')
    img_visible = Image.fromarray(arr)

    # 8. Placeholders
    draw_v = ImageDraw.Draw(img_visible)
    draw_v.rectangle([width-700, height//2-40, width-200, height//2+40], outline=(0,0,0,30)) # Amount
    draw_v.line([width-750, height-150, width-200, height-150], fill=(0,0,0,80), width=2)   # Signature

    # Save Outputs
    img_visible.save(f"{output_base}_visible.png")
    
    # UV Glow Polish: Enhance luminosity
    img_uv = img_uv.filter(ImageFilter.GaussianBlur(1)) # Soft fluorescent glow
    img_uv.save(f"{output_base}_uv_glow.png")
    
    print(f"Success! \n - Visible: {output_base}_visible.png\n - UV Glow: {output_base}_uv_glow.png")

if __name__ == "__main__":
    create_bofa_uv_security_pro()
