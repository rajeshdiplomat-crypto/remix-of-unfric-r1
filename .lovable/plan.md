

## Replace Auth Image with a Square-Aspect Image

The current image is portrait-oriented. The user wants a wider, nearly square image instead. I'll generate a new image with ~1:1 aspect ratio using the same editorial style.

**Steps:**

1. **Generate a new square image** (~1024x1024) with the same editorial aesthetic (woman writing in journal, warm golden light, minimal style)
2. **Replace `src/assets/auth-editorial.jpg`** with the new square image

No layout code changes needed — the current `h-full w-auto max-w-none object-center overflow-hidden` setup will handle the wider image correctly.

