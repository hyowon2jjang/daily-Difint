from PIL import Image, ImageDraw, ImageFont

def create_circular_integral_ico(output_filename="integral_circle.ico"):
    # Standard icon sizes for web and OS compatibility
    sizes = [16, 32, 48, 64, 128, 256]
    icon_layers = []

    for size in sizes:
        # Create canvas with transparency (RGBA)
        img = Image.new("RGBA", (size, size), (255, 255, 255, 0))
        draw = ImageDraw.Draw(img)

        # Draw the circular background
        padding = size * 0.05
        circle_box = [padding, padding, size - padding, size - padding]
        bg_color = (33, 37, 41, 255) # Dark slate grey
        draw.ellipse(circle_box, fill=bg_color)

        # Load font (System dependent - defaults to standard serif)
        try:
            # Adjust font size relative to icon size
            font = ImageFont.truetype("times.ttf", int(size * 0.7))
        except:
            font = ImageFont.load_default()

        # Center the integral symbol
        text = "∫"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        
        x = (size - text_w) // 2
        y = (size - text_h) // 2 - (size * 0.05) # Visual centering adjustment
        
        draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
        icon_layers.append(img)

    # Save as multi-resolution ICO
    icon_layers[0].save(
        output_filename,
        format="ICO",
        sizes=[(s, s) for s in sizes],
        append_images=icon_layers[1:]
    )

if __name__ == "__main__":
    create_circular_integral_ico()