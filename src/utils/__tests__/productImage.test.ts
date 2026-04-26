import { describe, expect, it } from 'vitest';

import {
  buildPollinationsImageUrl,
  buildPollinationsProductPrompt,
  buildProductImagePrompt,
  buildProductImageSignature,
  createProductFallbackDataUrl,
  createProductFallbackSvg,
  hashPromptToSeed,
  sanitizeProductImageFilename,
} from '../productImage';

describe('productImage helpers', () => {
  it('sanitizes product image filenames into stable ascii slugs', () => {
    expect(sanitizeProductImageFilename('  Cafe Latte  ')).toBe('cafe-latte');
    expect(sanitizeProductImageFilename('Crème brûlée')).toBe('creme-brulee');
    expect(sanitizeProductImageFilename('***')).toBe('product');
  });

  it('builds a richer prompt from product context', () => {
    const prompt = buildProductImagePrompt({
      name: 'Organic Espresso',
      categoryName: 'Coffee',
      description: 'Double shot with a smooth crema and no sugar.',
      type: 'ITEM',
    });

    expect(prompt).toContain('Organic Espresso');
    expect(prompt).toContain('Category: Coffee.');
    expect(prompt).toContain('clean background');
    expect(prompt).toContain('no watermark');
  });

  it('builds a stricter Pollinations prompt for product generation', () => {
    const prompt = buildPollinationsProductPrompt({
      name: 'Espresso',
      categoryName: 'Coffee',
      description: 'Double shot with thick crema.',
      type: 'ITEM',
    });

    expect(prompt).toContain('studio product photo of Espresso Coffee');
    expect(prompt).toContain('centered on clean white background');
    expect(prompt).toContain('realistic');
    expect(prompt).toContain('no watermark');
  });

  it('creates a deterministic signature from relevant product fields', () => {
    const a = buildProductImageSignature({
      name: 'Organic Espresso',
      categoryName: 'Coffee',
      description: 'Double shot',
      type: 'ITEM',
    });

    const b = buildProductImageSignature({
      name: ' organic   espresso ',
      categoryName: 'coffee',
      description: 'Double shot',
      type: 'ITEM',
    });

    const c = buildProductImageSignature({
      name: 'Organic Espresso',
      categoryName: 'Coffee',
      description: 'Iced and sweet',
      type: 'ITEM',
    });

    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('creates a fallback svg that includes escaped product content', () => {
    const svg = createProductFallbackSvg({
      name: 'Tomato & Basil <Soup>',
      categoryName: 'Seasonal',
      description: 'Rich and fresh',
      type: 'ITEM',
    });

    expect(svg).toContain('Tomato &amp; Basil &lt;Soup&gt;');
    expect(svg).toContain('Seasonal');
    expect(svg).toContain('<svg');
  });

  it('returns a data url for fallback previews', () => {
    const dataUrl = createProductFallbackDataUrl({
      name: 'Sparkling Water',
      categoryName: 'Drinks',
      type: 'ITEM',
    });

    expect(dataUrl.startsWith('data:image/svg+xml')).toBe(true);
    expect(decodeURIComponent(dataUrl)).toContain('Sparkling Water');
  });

  it('creates deterministic Pollinations seeds and image urls', () => {
    const prompt = 'professional studio food photography of Espresso.';
    const seedA = hashPromptToSeed(prompt);
    const seedB = hashPromptToSeed(prompt);
    const url = buildPollinationsImageUrl(prompt, seedA);

    expect(seedA).toBe(seedB);
    expect(seedA).toBeGreaterThan(0);
    expect(url).toContain('https://gen.pollinations.ai/prompt/');
    expect(url).toContain(`seed=${seedA}`);
    expect(url).toContain('width=512');
    expect(url).toContain('height=512');
    expect(url).toContain('nologo=true');
  });
});
