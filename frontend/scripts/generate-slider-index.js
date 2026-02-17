#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const sliderDir = path.join(publicDir, 'images', 'slider');
const rootImagesDir = path.join(__dirname, '..', '..', 'images');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFromRootIfEmpty() {
  ensureDir(sliderDir);
  const files = fs.readdirSync(sliderDir).filter(f => !f.startsWith('.'));
  if (files.length === 0 && fs.existsSync(rootImagesDir)) {
    const rootFiles = fs.readdirSync(rootImagesDir).filter(f => /\.(jpe?g|png|webp|svg)$/i.test(f));
    for (const f of rootFiles) {
      const src = path.join(rootImagesDir, f);
      const dest = path.join(sliderDir, f);
      try { fs.copyFileSync(src, dest); } catch (e) { /* ignore */ }
    }
  }
}

function buildIndex() {
  ensureDir(sliderDir);
  const entries = fs.readdirSync(sliderDir).filter(f => /\.(jpe?g|png|webp|svg)$/i.test(f));
  const list = entries.map(f => `/images/slider/${f}`);
  if (list.length === 0) {
    // create simple inline SVG fallback
    const fallbackPath = path.join(sliderDir, 'fallback.svg');
    if (!fs.existsSync(fallbackPath)) {
      const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 500'>\n  <rect width='100%' height='100%' fill='#0ea5a4'/>\n  <text x='50%' y='50%' fill='white' font-size='48' text-anchor='middle' font-family='Arial' dy='.3em'>HuteFast</text>\n</svg>`;
      fs.writeFileSync(fallbackPath, svg);
    }
    list.push('/images/slider/fallback.svg');
  }
  const indexPath = path.join(sliderDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify({ images: list }, null, 2));
  console.log('Wrote slider index with', list.length, 'entries');
}

copyFromRootIfEmpty();
buildIndex();

// exit
process.exit(0);
