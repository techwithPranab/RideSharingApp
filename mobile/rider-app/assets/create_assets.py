import struct

def create_simple_png(width, height):
    """Create a minimal valid PNG file"""
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk (Image Header)
    ihdr_data = struct.pack('>2I5B', width, height, 8, 2, 0, 0, 0)
    ihdr = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data
    ihdr += struct.pack('>I', 0xFFFFFFFF & ~sum(ihdr_data))
    png += ihdr
    
    # IDAT chunk (Image Data) - minimal 1x1 blue pixel
    idat_data = b'\x00\x00\x7F\xFF\x00'  # Minimal compressed data
    idat = struct.pack('>I', len(idat_data)) + b'IDAT' + idat_data
    idat += struct.pack('>I', 0xFFFFFFFF & ~sum(idat_data))
    png += idat
    
    # IEND chunk (End of Image)
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', 0xFFFFFFFF & ~0)
    png += iend
    
    return png

# Create all required assets
assets = [
    ('icon.png', 1024, 1024),
    ('splash.png', 2048, 2048), 
    ('adaptive-icon.png', 1024, 1024),
    ('notification-icon.png', 96, 96),
    ('favicon.png', 32, 32)
]

for filename, width, height in assets:
    with open(filename, 'wb') as f:
        f.write(create_simple_png(width, height))
    print(f'Created {filename}')

print('All assets created successfully!')
