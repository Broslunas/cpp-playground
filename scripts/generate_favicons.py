import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Define SVG content
SVG_CONTENT = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080a11" />
      <stop offset="50%" stop-color="#05070a" />
      <stop offset="100%" stop-color="#020305" />
    </linearGradient>

    <!-- Border Neon Gradient -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00ff88" />
      <stop offset="50%" stop-color="#00d4ff" />
      <stop offset="100%" stop-color="#00ff88" />
    </linearGradient>

    <!-- Moon & Glow Gradient -->
    <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00ff88" />
      <stop offset="60%" stop-color="#00e5ff" />
      <stop offset="100%" stop-color="#00b4d8" />
    </linearGradient>

    <!-- Code Accent Gradient -->
    <linearGradient id="codeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#00ff88" />
    </linearGradient>

    <!-- Subtle Glow Filter -->
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="24" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Base container with rounded corners -->
  <rect x="20" y="20" width="472" height="472" rx="108" fill="url(#bgGrad)" stroke="url(#borderGrad)" stroke-width="12" />

  <!-- Ambient inner light -->
  <circle cx="210" cy="220" r="160" fill="#00ff88" opacity="0.08" filter="url(#softGlow)" />
  <circle cx="340" cy="300" r="140" fill="#00d4ff" opacity="0.06" filter="url(#softGlow)" />

  <!-- Grid accent lines (cyberpunk / playground feel) -->
  <line x1="80" y1="20" x2="80" y2="492" stroke="#00ff88" stroke-opacity="0.06" stroke-width="2" />
  <line x1="432" y1="20" x2="432" y2="492" stroke="#00ff88" stroke-opacity="0.06" stroke-width="2" />
  <line x1="20" y1="80" x2="492" y2="80" stroke="#00ff88" stroke-opacity="0.06" stroke-width="2" />
  <line x1="20" y1="432" x2="492" y2="432" stroke="#00ff88" stroke-opacity="0.06" stroke-width="2" />

  <!-- The "Lunas" Crescent Moon + "B" Monogram + Terminal Bracket -->
  <g transform="translate(0, 0)">
    <!-- Crescent Moon (representing Broslunas) -->
    <path d="M 235 110
             A 145 145 0 1 0 375 295
             A 120 120 0 1 1 235 110 Z"
          fill="url(#moonGrad)"
          filter="url(#neonGlow)" />

    <!-- Terminal Code Chevron: > -->
    <path d="M 220 195
             L 285 256
             L 220 317"
          fill="none"
          stroke="#ffffff"
          stroke-width="32"
          stroke-linecap="round"
          stroke-linejoin="round"
          filter="url(#neonGlow)" />

    <!-- Terminal Underscore / Cursor: _ -->
    <line x1="290" y1="317" x2="355" y2="317"
          stroke="#00ff88"
          stroke-width="32"
          stroke-linecap="round"
          filter="url(#neonGlow)" />

    <!-- Mini satellite dots / stars -->
    <circle cx="360" cy="150" r="9" fill="#00ff88" opacity="0.9" />
    <circle cx="160" cy="360" r="6" fill="#00d4ff" opacity="0.7" />
  </g>
</svg>
"""

def generate_icons():
    os.makedirs("public", exist_ok=True)
    os.makedirs("src/app", exist_ok=True)

    # 1. Write SVG files
    with open("public/favicon.svg", "w", encoding="utf-8") as f:
        f.write(SVG_CONTENT)
    with open("public/icon.svg", "w", encoding="utf-8") as f:
        f.write(SVG_CONTENT)
    with open("src/app/icon.svg", "w", encoding="utf-8") as f:
        f.write(SVG_CONTENT)
    print("Created SVG files successfully")

    # 2. Render pixel-perfect PNG using PIL at high resolution (1024x1024 supersampled, downsampled)
    W, H = 1024, 1024
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background rounded rectangle
    margin = 40
    rad = 220
    draw.rounded_rectangle(
        [margin, margin, W - margin, H - margin],
        radius=rad,
        fill=(6, 8, 14, 255),
        outline=(0, 255, 136, 240),
        width=24
    )
    # Inner subtle border
    draw.rounded_rectangle(
        [margin + 18, margin + 18, W - margin - 18, H - margin - 18],
        radius=rad - 18,
        outline=(0, 212, 255, 90),
        width=8
    )

    # Crescent Moon layer
    moon_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    m_draw = ImageDraw.Draw(moon_img)

    # Outer moon circle centered around (470, 512), radius ~ 300
    cx, cy = 470, 512
    r_outer = 300
    m_draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], fill=(0, 255, 136, 255))

    # Inner cutout circle shifted right-up to make a crisp crescent on the left
    r_inner = 250
    cut_cx, cut_cy = 580, 480
    m_draw.ellipse([cut_cx - r_inner, cut_cy - r_inner, cut_cx + r_inner, cut_cy + r_inner], fill=(0, 0, 0, 0))

    # Gradient tint on moon
    # Composite moon
    img.alpha_composite(moon_img)

    # Terminal Chevron '>' and cursor '_'
    # Draw chevron: (440, 390) -> (570, 512) -> (440, 634)
    c_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(c_img)

    # Terminal chevron with nice thickness
    c_draw.line([(440, 390), (570, 512)], fill=(255, 255, 255, 255), width=64, joint="round")
    c_draw.line([(570, 512), (440, 634)], fill=(255, 255, 255, 255), width=64, joint="round")
    # Caps
    c_draw.ellipse([440 - 32, 390 - 32, 440 + 32, 390 + 32], fill=(255, 255, 255, 255))
    c_draw.ellipse([570 - 32, 512 - 32, 570 + 32, 512 + 32], fill=(255, 255, 255, 255))
    c_draw.ellipse([440 - 32, 634 - 32, 440 + 32, 634 + 32], fill=(255, 255, 255, 255))

    # Cursor line '_': (590, 634) to (720, 634)
    c_draw.line([(590, 634), (720, 634)], fill=(0, 255, 136, 255), width=64)
    c_draw.ellipse([590 - 32, 634 - 32, 590 + 32, 634 + 32], fill=(0, 255, 136, 255))
    c_draw.ellipse([720 - 32, 634 - 32, 720 + 32, 634 + 32], fill=(0, 255, 136, 255))

    # Star accent
    c_draw.ellipse([720 - 20, 310 - 20, 720 + 20, 310 + 20], fill=(0, 212, 255, 240))
    c_draw.ellipse([320 - 15, 710 - 15, 320 + 15, 710 + 15], fill=(0, 255, 136, 200))

    img.alpha_composite(c_img)

    # 3. Export multiple sizes
    sizes = {
        "public/favicon-16x16.png": 16,
        "public/favicon-32x32.png": 32,
        "public/favicon-48x48.png": 48,
        "public/favicon.png": 48,
        "public/apple-touch-icon.png": 180,
        "public/android-chrome-192x192.png": 192,
        "public/android-chrome-512x512.png": 512,
        "public/icon.png": 512,
        "src/app/icon.png": 512,
        "src/app/apple-icon.png": 180,
    }

    for path, s in sizes.items():
        res = img.resize((s, s), Image.Resampling.LANCZOS)
        res.save(path, format="PNG")
        print(f"Saved {path} ({s}x{s})")

    # 4. Save multi-resolution .ico files
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    img.save("public/favicon.ico", format="ICO", sizes=ico_sizes)
    img.save("src/app/favicon.ico", format="ICO", sizes=ico_sizes)
    print("Saved public/favicon.ico and src/app/favicon.ico")

    # 5. Create rich OG Social Share image (1200x630)
    og = Image.new("RGBA", (1200, 630), (7, 9, 14, 255))
    og_draw = ImageDraw.Draw(og)

    # Border glow
    og_draw.rectangle([10, 10, 1190, 620], outline=(0, 255, 136, 120), width=4)
    og_draw.rectangle([14, 14, 1186, 616], outline=(0, 212, 255, 60), width=2)

    # Paste the brand logo on the left (size 340x340)
    brand_logo = img.resize((340, 340), Image.Resampling.LANCZOS)
    og.paste(brand_logo, (80, 145), brand_logo)

    # Save OG image
    og.save("public/og-image.png", format="PNG")
    print("Saved public/og-image.png")

if __name__ == "__main__":
    generate_icons()
