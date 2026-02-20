# Image Assets Organization

This directory contains all the image assets for the EHUT Transport Booking Platform.

## Directory Structure

### `/images/slider/`
Contains images used in the homepage carousel/slider.
- **index.json**: Lists all available slider images
- Images are automatically cycled through in the carousel component

### `/images/vehicles/`
Contains vehicle/bus images for display in booking forms and vehicle selection.
- **index.json**: Lists all available vehicle images
- Used to show vehicle options to users

### `/images/logos/`
Contains company logo variations.
- **index.json**: Lists all available logo files
- Includes PNG and SVG formats for different use cases

### `/images/icons/`
Reserved for UI icons and small graphics.
- Currently empty, can be populated with icon sets as needed

## Usage in Components

### Carousel Component
```javascript
// Automatically loads images from /images/slider/index.json
<Carousel className="h-64 md:h-96" />
```

### Vehicle Selection
```javascript
// Can load vehicle images from /images/vehicles/index.json
const vehicleImages = await fetch('/images/vehicles/index.json')
  .then(r => r.json())
  .then(data => data.vehicles);
```

### Logo Display
```javascript
// Can load logos from /images/logos/index.json
const logos = await fetch('/images/logos/index.json')
  .then(r => r.json())
  .then(data => data.logos);
```

## Adding New Images

1. Place images in the appropriate subdirectory
2. Update the corresponding `index.json` file to include the new image path
3. Ensure images are optimized for web (reasonable file sizes)
4. Use descriptive filenames when possible

## Image Guidelines

- **Slider Images**: High-quality, landscape-oriented images (recommended: 1200x600px or similar aspect ratio)
- **Vehicle Images**: Clear photos of vehicles/buses (recommended: 800x600px)
- **Logos**: Multiple formats (PNG for raster, SVG for vector scaling)
- **Icons**: Small, scalable graphics (preferably SVG format)