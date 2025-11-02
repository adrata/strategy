#!/usr/bin/env python3

from PIL import Image, ImageDraw, ImageFont
import os

def create_dmg_background():
    # Create a 660x400 background image with macOS style
    img = Image.new('RGB', (660, 400), color='#f5f5f7')
    draw = ImageDraw.Draw(img)
    
    # Add subtle gradient effect
    for y in range(400):
        alpha = int(255 * (1 - y / 400 * 0.1))
        color = (245 - y//20, 245 - y//20, 247 - y//20)
        draw.line([(0, y), (660, y)], fill=color)
    
    # Add instructions text
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 14)
    except:
        try:
            font = ImageFont.load_default()
        except:
            font = None
    
    if font:
        text = "Drag Adrata to Applications to install"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (660 - text_width) // 2
        draw.text((text_x, 320), text, fill='#666666', font=font)
    
    # Add arrow pointing from app to Applications
    draw.line([(280, 190), (380, 190)], fill='#007AFF', width=2)
    # Arrow head
    draw.polygon([(375, 185), (385, 190), (375, 195)], fill='#007AFF')
    
    # Save the background
    img.save('dmg-background.png')
    print('✅ Created professional DMG background: dmg-background.png')

if __name__ == '__main__':
    try:
        create_dmg_background()
    except ImportError:
        print('❌ PIL (Pillow) not installed. Installing...')
        os.system('pip3 install Pillow')
        create_dmg_background()
    except Exception as e:
        print(f'❌ Error creating background: {e}')
        print('Creating simple fallback...')
        # Create a minimal white background as fallback
        img = Image.new('RGB', (660, 400), color='white')
        img.save('dmg-background.png')
        print('✅ Created simple white background') 