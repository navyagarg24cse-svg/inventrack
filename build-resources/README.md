# Build Resources

Place your app icon here before building:

- `icon.ico` — Windows installer & taskbar icon (256×256 recommended)

## Generating an icon

If you don't have an .ico file, you can convert any PNG using:
- https://www.icoconverter.com/
- Or ImageMagick: `magick input.png -resize 256x256 icon.ico`

The icon is optional for development builds. electron-builder will use
a default Electron icon if `icon.ico` is missing.
