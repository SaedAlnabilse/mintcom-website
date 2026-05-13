export interface ProductImageContext {
  name: string;
  description?: string;
  categoryName?: string;
  type?: 'ITEM' | 'ADDON';
}

const FALLBACK_IMAGE_SIZE = 1024;
const OPENVERSE_IMAGE_SEARCH_URL = 'https://api.openverse.org/v1/images/';
const OPENVERSE_ALLOWED_LICENSES = 'cc0,by,by-sa,pdm';
const OPENVERSE_PAGE_SIZE = 12;
const FREEGEN_SIGNER_URL = 'https://prompt-signer.freegen.app';
const FREEGEN_GENERATOR_URL = 'https://image-generator.freegen.app';
const FREEGEN_WEBSOCKET_URL = 'wss://websocket-bridge.freegen.app/ws';
const FREEGEN_RATIO_ID = '1:1';
const FREEGEN_RESULT_TIMEOUT_MS = 45000;
const POLLINATIONS_PROXY_IMAGE_URL = '/external/pollinations/prompt/';
const POLLINATIONS_IMAGE_URL = 'https://gen.pollinations.ai/prompt/';
const POLLINATIONS_IMAGE_SIZE = 512;
const POLLINATIONS_CACHE_KEY = 'pollinations-product-image-cache-v1';
const POLLINATIONS_IMAGE_TIMEOUT_MS = 20000;
const POLLINATIONS_TOTAL_TIMEOUT_MS = 45000;

const FOOD_AND_DRINK_HINTS = [
  'coffee',
  'espresso',
  'latte',
  'mocha',
  'tea',
  'juice',
  'smoothie',
  'cake',
  'dessert',
  'cookie',
  'pastry',
  'pizza',
  'burger',
  'sandwich',
  'salad',
  'pasta',
  'rice',
  'chicken',
  'beef',
  'fries',
  'ice cream',
  'drink',
  'beverage',
  'meal',
  'food',
  'snack',
];

const FOOD_PRESENTATION_HINTS = [
  'coffee',
  'espresso',
  'latte',
  'drink',
  'beverage',
  'cup',
  'mug',
  'glass',
  'food',
  'meal',
  'plate',
  'dessert',
  'pastry',
];

const PRODUCT_PRESENTATION_HINTS = [
  'product',
  'packaging',
  'isolated',
  'bottle',
  'box',
  'container',
  'brand',
  'label',
];

const DRINK_SERVING_HINTS = [
  'espresso',
  'coffee',
  'latte',
  'mocha',
  'tea',
  'juice',
  'smoothie',
  'shake',
  'milk',
  'water',
  'soda',
];

const PLATED_FOOD_HINTS = [
  'burger',
  'pizza',
  'sandwich',
  'salad',
  'pasta',
  'rice',
  'chicken',
  'beef',
  'fries',
  'dessert',
  'cake',
  'cookie',
  'pastry',
  'ice cream',
];

const NOISY_SCENE_HINTS = [
  'cat',
  'dog',
  'animal',
  'street',
  'road',
  'sidewalk',
  'building',
  'city',
  'person',
  'portrait',
  'statue',
  'sculpture',
  'car',
  'painting',
  'illustration',
  'drawing',
  'meme',
  'toy',
];

const SOURCE_SCORE_ADJUSTMENTS: Record<string, number> = {
  stocksnap: 10,
  rawpixel: 8,
  wikimedia: 6,
  museumsvictoria: 4,
  flickr: -10,
};

export interface OpenSourceImageResult {
  title?: string;
  url?: string;
  thumbnail?: string;
  creator?: string;
  source?: string;
  category?: string;
  filetype?: string;
  license?: string;
  width?: number;
  height?: number;
  tags?: Array<{ name?: string }>;
  fields_matched?: string[];
}

interface OpenSourceSearchResponse {
  results?: OpenSourceImageResult[];
}

export interface OpenSourceProductImageAsset {
  file: File;
  previewUrl: string;
  result: OpenSourceImageResult;
  score: number;
}

interface FreeGenSignedPrompt {
  prompt: string;
  ts: number;
  sig: string;
}

interface FreeGenGeneratorResponse {
  job_id?: string;
  status?: string;
  image_data_url?: string;
  error?: string;
}

interface FreeGenSocketMessage {
  type?: string;
  message?: string;
  image_data?: string;
  image_data_url?: string;
}

export interface GeneratedProductImageAsset {
  file: File;
  previewUrl: string;
  prompt: string;
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function tokenize(value: string) {
  return collapseWhitespace(value)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => collapseWhitespace(value)).filter(Boolean))];
}

function escapeSvg(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function trimSentence(value: string, maxLength = 110) {
  const normalized = collapseWhitespace(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function wrapText(value: string, maxCharactersPerLine = 18, maxLines = 2) {
  const words = collapseWhitespace(value).split(' ').filter(Boolean);

  if (words.length === 0) {
    return ['Product'];
  }

  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharactersPerLine) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;

    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine);
  }

  if (words.length > 0) {
    const rendered = lines.join(' ');
    const original = words.join(' ');
    if (rendered.length < original.length) {
      const lastLineIndex = lines.length - 1;
      lines[lastLineIndex] = trimSentence(lines[lastLineIndex], maxCharactersPerLine);
    }
  }

  return lines.slice(0, maxLines);
}

function getProductInitials(name: string) {
  const parts = collapseWhitespace(name).split(' ').filter(Boolean);

  if (parts.length === 0) {
    return 'P';
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

function buildPalette(seed: string) {
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  const palettes = [
    ['#0F172A', '#1E293B', '#7CC39F', '#DCFCE7'],
    ['#111827', '#1F2937', '#38BDF8', '#E0F2FE'],
    ['#172554', '#1E3A8A', '#60A5FA', '#DBEAFE'],
    ['#14532D', '#166534', '#4ADE80', '#DCFCE7'],
    ['#3F1D2E', '#6B214A', '#F472B6', '#FCE7F3'],
  ];

  return palettes[hash % palettes.length];
}

function isFoodOrDrink(context: ProductImageContext) {
  const haystack = [
    context.name,
    context.description,
    context.categoryName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return FOOD_AND_DRINK_HINTS.some((hint) => haystack.includes(hint));
}

function getContextHaystack(context: ProductImageContext) {
  return [
    context.name,
    context.description,
    context.categoryName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function buildFoodServingHint(context: ProductImageContext) {
  const haystack = getContextHaystack(context);

  if (DRINK_SERVING_HINTS.some((hint) => haystack.includes(hint))) {
    return 'served in a clean cup, mug, glass, or bottle that matches the product';
  }

  if (PLATED_FOOD_HINTS.some((hint) => haystack.includes(hint))) {
    return 'served neatly on a simple plate or tray with minimal props';
  }

  return 'presented cleanly and clearly as the single food or drink item';
}

function encodeBase64Ascii(value: string) {
  if (typeof btoa === 'function') {
    return btoa(value);
  }

  const globalBuffer = (globalThis as {
    Buffer?: {
      from(input: string, encoding?: string): { toString(encoding: string): string };
    };
  }).Buffer;

  if (globalBuffer) {
    return globalBuffer.from(value, 'utf-8').toString('base64');
  }

  throw new Error('Base64 encoder is not available');
}

function createAbortError() {
  try {
    return new DOMException('The operation was aborted.', 'AbortError');
  } catch {
    const error = new Error('The operation was aborted.');
    error.name = 'AbortError';
    return error;
  }
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

function isNetworkFetchError(error: unknown) {
  return error instanceof TypeError;
}

function createTimeoutSignal(timeoutMs: number, parentSignal?: AbortSignal) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const cleanup = () => {
    clearTimeout(timeoutId);
    parentSignal?.removeEventListener('abort', handleParentAbort);
  };

  const handleParentAbort = () => {
    controller.abort();
  };

  if (parentSignal?.aborted) {
    controller.abort();
  } else {
    parentSignal?.addEventListener('abort', handleParentAbort, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup,
  };
}

export function sanitizeProductImageFilename(value: string) {
  const collapsed = collapseWhitespace(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const sanitized = collapsed
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return sanitized || 'product';
}

export function buildProductImageSignature(context: ProductImageContext) {
  return [
    collapseWhitespace(context.name).toLowerCase(),
    collapseWhitespace(context.categoryName || '').toLowerCase(),
    collapseWhitespace(context.description || '').toLowerCase(),
    context.type || 'ITEM',
  ].join('|');
}

export function buildProductImagePrompt(context: ProductImageContext) {
  const name = collapseWhitespace(context.name);
  const categoryName = collapseWhitespace(context.categoryName || '');
  const description = collapseWhitespace(context.description || '');
  const photographyStyle = isFoodOrDrink(context)
    ? 'realistic studio food photography'
    : 'realistic ecommerce product photography';
  const itemTypeHint = context.type === 'ADDON'
    ? 'single add-on item'
    : 'single product item';

  const sections = [
    `${photographyStyle} of ${name}.`,
    categoryName ? `Category: ${categoryName}.` : '',
    description ? `Product details: ${trimSentence(description)}.` : '',
    `${itemTypeHint}, centered, clean background, soft shadow, square composition, high detail, no text, no watermark, no collage, no people.`,
  ].filter(Boolean);

  return sections.join(' ');
}

export function buildFreeGenProductPrompt(context: ProductImageContext) {
  const name = collapseWhitespace(context.name);
  const categoryName = collapseWhitespace(context.categoryName || '');
  const description = collapseWhitespace(context.description || '');
  const isFood = isFoodOrDrink(context);
  const framing = context.type === 'ADDON'
    ? 'single add-on product'
    : 'single catalog product';
  const subjectDirection = isFood
    ? buildFoodServingHint(context)
    : 'isolated on a clean white or light neutral studio background';
  const photographyStyle = isFood
    ? 'professional studio food photography'
    : 'professional ecommerce product photography';

  return [
    `${photographyStyle} of ${name}.`,
    categoryName ? `Category: ${categoryName}.` : '',
    description ? `Product details: ${trimSentence(description, 140)}.` : '',
    `Show the exact named product only as a ${framing}.`,
    `Composition: centered square crop, ${subjectDirection}, soft studio lighting, realistic textures, sharp focus, catalog-ready.`,
    'No people, no hands, no animals, no statues, no street scene, no extra products, no packaging clutter, no labels, no text, no watermark, no collage.',
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildPollinationsProductPrompt(context: ProductImageContext) {
  const name = collapseWhitespace(context.name);
  const categoryName = collapseWhitespace(context.categoryName || '');
  const subject = [name, categoryName].filter(Boolean).join(' ').trim() || name;
  return `studio product photo of ${subject}, centered on clean white background, realistic, high detail, no text, no watermark`;
}

export function hashPromptToSeed(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash << 5) - hash + character.charCodeAt(0);
    hash |= 0;
  }

  return Math.abs(hash) || 1;
}

export function buildPollinationsImageUrl(
  prompt: string,
  seed: number,
  baseUrl = POLLINATIONS_IMAGE_URL
) {
  const encodedPrompt = encodeURIComponent(prompt);
  const query = new URLSearchParams({
    width: String(POLLINATIONS_IMAGE_SIZE),
    height: String(POLLINATIONS_IMAGE_SIZE),
    seed: String(seed),
    nologo: 'true',
    safe: 'true',
  });

  return `${baseUrl}${encodedPrompt}?${query.toString()}`;
}

export function buildOpenSourceSearchQueries(context: ProductImageContext) {
  const name = collapseWhitespace(context.name);
  const categoryName = collapseWhitespace(context.categoryName || '');

  if (!name) {
    return [];
  }

  const categorySuffix = categoryName && !name.toLowerCase().includes(categoryName.toLowerCase())
    ? ` ${categoryName}`
    : '';

  if (isFoodOrDrink(context)) {
    return uniqueStrings([
      `"${name}"${categorySuffix} beverage`,
      `${name}${categorySuffix} coffee drink`,
      `${name}${categorySuffix}`,
    ]);
  }

  return uniqueStrings([
    `"${name}"${categorySuffix} product`,
    `${name}${categorySuffix} product photo`,
    `${name}${categorySuffix}`,
  ]);
}

function getOpenSourceSearchableText(result: OpenSourceImageResult) {
  return [
    result.title || '',
    result.creator || '',
    ...(result.tags || []).map((tag) => tag.name || ''),
  ].join(' ');
}

export function scoreOpenSourceImageResult(result: OpenSourceImageResult, context: ProductImageContext) {
  const searchableText = getOpenSourceSearchableText(result);
  const searchableTokens = new Set(tokenize(searchableText));
  const title = collapseWhitespace(result.title || '').toLowerCase();
  const name = collapseWhitespace(context.name).toLowerCase();
  const primaryTokens = tokenize(context.name);
  const supportiveHints = isFoodOrDrink(context) ? FOOD_PRESENTATION_HINTS : PRODUCT_PRESENTATION_HINTS;
  const supportiveMatches = supportiveHints.filter((hint) => searchableText.toLowerCase().includes(hint)).length;
  const noisyMatches = NOISY_SCENE_HINTS.filter((hint) => searchableText.toLowerCase().includes(hint)).length;
  let score = 0;

  if (title === name) {
    score += 45;
  } else if (title.includes(name) && name) {
    score += 28;
  }

  const matchedPrimaryTokens = primaryTokens.filter((token) => searchableTokens.has(token)).length;
  score += matchedPrimaryTokens * 10;

  if (matchedPrimaryTokens === primaryTokens.length && primaryTokens.length > 0) {
    score += 12;
  }

  if ((result.fields_matched || []).includes('title')) {
    score += 12;
  }

  if ((result.category || '').toLowerCase() === 'photograph') {
    score += 10;
  }

  if (result.license === 'cc0' || result.license === 'pdm') {
    score += 6;
  } else if (result.license === 'by' || result.license === 'by-sa') {
    score += 3;
  }

  const sourceKey = (result.source || '').toLowerCase();
  score += SOURCE_SCORE_ADJUSTMENTS[sourceKey] || 0;

  if (result.width && result.height) {
    const shortestEdge = Math.min(result.width, result.height);
    const aspectRatio = result.width / result.height;
    const distanceFromSquare = Math.abs(1 - aspectRatio);

    if (shortestEdge >= 1600) {
      score += 12;
    } else if (shortestEdge >= 1200) {
      score += 8;
    } else if (shortestEdge >= 800) {
      score += 4;
    } else {
      score -= 6;
    }

    if (distanceFromSquare <= 0.2) {
      score += 8;
    } else if (distanceFromSquare <= 0.4) {
      score += 4;
    } else {
      score -= 4;
    }
  }

  if (isFoodOrDrink(context)) {
    if (supportiveMatches > 0) {
      score += 14;
    } else {
      score -= 18;
    }
  } else if (supportiveMatches > 0) {
    score += 8;
  }

  if (noisyMatches > 0) {
    score -= supportiveMatches > 0 ? noisyMatches * 4 : noisyMatches * 10;
  }

  if (!result.title) {
    score -= 6;
  }

  return score;
}

function buildOpenverseSearchUrl(query: string) {
  const url = new URL(OPENVERSE_IMAGE_SEARCH_URL);
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', query);
  url.searchParams.set('page_size', String(OPENVERSE_PAGE_SIZE));
  url.searchParams.set('size', 'large');
  url.searchParams.set('aspect_ratio', 'square');
  url.searchParams.set('categories', 'photograph');
  url.searchParams.set('license', OPENVERSE_ALLOWED_LICENSES);
  return url.toString();
}

function getFileExtensionFromResult(result: OpenSourceImageResult, blobType: string) {
  const candidate = (result.filetype || blobType || '')
    .replace(/^image\//, '')
    .replace(/[^a-z0-9]+/gi, '')
    .toLowerCase();

  if (candidate === 'jpeg') {
    return 'jpg';
  }

  if (candidate) {
    return candidate;
  }

  return 'jpg';
}

async function downloadOpenSourceImage(
  result: OpenSourceImageResult,
  context: ProductImageContext,
  signal?: AbortSignal
) {
  const candidateUrls = uniqueStrings([result.url || '', result.thumbnail || '']);

  for (const candidateUrl of candidateUrls) {
    try {
      const response = await fetch(candidateUrl, {
        headers: {
          Accept: 'image/*',
        },
        signal,
      });

      if (!response.ok) {
        continue;
      }

      const blob = await response.blob();

      if (!blob.size) {
        continue;
      }

      const extension = getFileExtensionFromResult(result, blob.type);
      const safeName = sanitizeProductImageFilename(context.name);
      const file = new File([blob], `${safeName}-open-source.${extension}`, {
        type: blob.type || `image/${extension}`,
      });

      return {
        file,
        previewUrl: URL.createObjectURL(file),
      };
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw error;
      }
    }
  }

  return null;
}

export async function searchOpenSourceProductImage(
  context: ProductImageContext,
  signal?: AbortSignal
): Promise<OpenSourceProductImageAsset | null> {
  const queries = buildOpenSourceSearchQueries(context);

  for (const query of queries) {
    const response = await fetch(buildOpenverseSearchUrl(query), {
      headers: {
        Accept: 'application/json',
      },
      signal,
    });

    if (!response.ok) {
      continue;
    }

    const payload = await response.json() as OpenSourceSearchResponse;
    const rankedResults = (payload.results || [])
      .map((result) => ({
        result,
        score: scoreOpenSourceImageResult(result, context),
      }))
      .sort((left, right) => right.score - left.score);

    const bestMatch = rankedResults.find((candidate) => candidate.score >= 28);

    if (!bestMatch) {
      continue;
    }

    const asset = await downloadOpenSourceImage(bestMatch.result, context, signal);

    if (asset) {
      return {
        ...asset,
        result: bestMatch.result,
        score: bestMatch.score,
      };
    }
  }

  return null;
}

function isUsableImageSource(value: unknown): value is string {
  return typeof value === 'string' && /^(data:image\/|https?:\/\/)/i.test(value);
}

export function extractProductImageSource(payload: unknown): string | null {
  if (isUsableImageSource(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidateKeys = ['image_data_url', 'image_data', 'image', 'dataUrl', 'imageUrl'];

  for (const key of candidateKeys) {
    const value = (payload as Record<string, unknown>)[key];
    if (isUsableImageSource(value)) {
      return value;
    }
  }

  return null;
}

export function extractProductImageDataUrl(payload: unknown) {
  const imageSource = extractProductImageSource(payload);

  if (typeof imageSource === 'string' && imageSource.startsWith('data:image/')) {
    return imageSource;
  }

  return null;
}

function readPollinationsCache(seed: number) {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const rawCache = localStorage.getItem(POLLINATIONS_CACHE_KEY);

    if (!rawCache) {
      return null;
    }

    const cache = JSON.parse(rawCache) as Record<string, string>;
    const cachedImage = cache[String(seed)];
    return typeof cachedImage === 'string' && cachedImage.startsWith('data:image/')
      ? cachedImage
      : null;
  } catch {
    return null;
  }
}

function writePollinationsCache(seed: number, dataUrl: string) {
  if (typeof localStorage === 'undefined' || !dataUrl.startsWith('data:image/')) {
    return;
  }

  try {
    const rawCache = localStorage.getItem(POLLINATIONS_CACHE_KEY);
    const cache = rawCache ? JSON.parse(rawCache) as Record<string, string> : {};
    const entries = Object.entries(cache).slice(-11);
    const nextCache = Object.fromEntries(entries);
    nextCache[String(seed)] = dataUrl;
    localStorage.setItem(POLLINATIONS_CACHE_KEY, JSON.stringify(nextCache));
  } catch {
    // Ignore cache write errors such as storage limits.
  }
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image data.'));
    reader.readAsDataURL(blob);
  });
}

async function loadRemoteImageToDataUrl(imageUrl: string, signal?: AbortSignal) {
  if (typeof Image === 'undefined' || typeof document === 'undefined') {
    throw new Error('Browser image loading is not available.');
  }

  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    let settled = false;

    const settle = (resolver: typeof resolve | typeof reject, value: string | Error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', handleAbort);
      image.onload = null;
      image.onerror = null;
      resolver(value as never);
    };

    const handleAbort = () => {
      settle(reject, createAbortError());
    };

    const timeoutId = globalThis.setTimeout(() => {
      settle(reject, new Error('Timed out while loading the Pollinations image.'));
    }, POLLINATIONS_IMAGE_TIMEOUT_MS);

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    signal?.addEventListener('abort', handleAbort, { once: true });

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || POLLINATIONS_IMAGE_SIZE;
        canvas.height = image.naturalHeight || POLLINATIONS_IMAGE_SIZE;
        const context2d = canvas.getContext('2d');

        if (!context2d) {
          throw new Error('Canvas 2D context is not available.');
        }

        context2d.drawImage(image, 0, 0, canvas.width, canvas.height);
        settle(resolve, canvas.toDataURL('image/jpeg', 0.92));
      } catch (error) {
        settle(reject, error instanceof Error ? error : new Error('Failed to render the Pollinations image.'));
      }
    };

    image.onerror = () => {
      settle(reject, new Error('Pollinations image failed to load.'));
    };

    image.src = imageUrl;
  });
}

async function resolvePollinationsDataUrl(
  imageUrl: string,
  signal?: AbortSignal,
  timeoutMs = POLLINATIONS_IMAGE_TIMEOUT_MS
) {
  // Try fetch first; this works reliably through the Vite dev proxy and Cloudflare worker proxy,
  // and avoids CORS issues that can affect the Image element approach.
  const attempt = createTimeoutSignal(timeoutMs, signal);

  try {
    const response = await fetch(imageUrl, {
      headers: {
        Accept: 'image/*',
      },
      signal: attempt.signal,
    });

    if (!response.ok) {
      throw new Error(`Pollinations request failed with status ${response.status}.`);
    }

    // Guard against proxy misconfiguration returning HTML instead of an image
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('Pollinations proxy returned HTML instead of an image.');
    }

    const blob = await response.blob();

    if (!blob.size) {
      throw new Error('Pollinations returned an empty image.');
    }

    // Verify the blob is actually an image
    if (!blob.type.startsWith('image/')) {
      throw new Error(`Pollinations returned unexpected content type: ${blob.type}`);
    }

    return blobToDataUrl(blob);
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    if (isAbortError(error)) {
      throw new Error('Timed out while loading the Pollinations image.');
    }

    if (!isNetworkFetchError(error)) {
      throw error;
    }

    // Fall back to the Image element approach only for network/CORS fetch failures.
    return loadRemoteImageToDataUrl(imageUrl, signal);
  } finally {
    attempt.cleanup();
  }
}

export async function generatePollinationsProductImage(
  context: ProductImageContext,
  signal?: AbortSignal
): Promise<GeneratedProductImageAsset> {
  const prompt = buildPollinationsProductPrompt(context);
  const seed = hashPromptToSeed(`${buildProductImageSignature(context)}|pollinations`);
  const retryPrompt = `studio product photo of ${collapseWhitespace(context.name)}, clean white background, realistic`;
  const cachedImage = readPollinationsCache(seed);
  const safeName = sanitizeProductImageFilename(context.name);

  if (cachedImage) {
    return {
      file: await dataUrlToFile(cachedImage, `${safeName}-pollinations.jpg`, 'image/jpeg', signal),
      previewUrl: cachedImage,
      prompt,
    };
  }

  const candidateUrls = uniqueStrings([
    buildPollinationsImageUrl(prompt, seed, POLLINATIONS_PROXY_IMAGE_URL),
    buildPollinationsImageUrl(prompt, seed, POLLINATIONS_IMAGE_URL),
    buildPollinationsImageUrl(retryPrompt, seed, POLLINATIONS_PROXY_IMAGE_URL),
    buildPollinationsImageUrl(retryPrompt, seed, POLLINATIONS_IMAGE_URL),
  ]);

  try {
    let lastError: Error | null = null;
    let dataUrl: string | null = null;
    const deadline = Date.now() + POLLINATIONS_TOTAL_TIMEOUT_MS;

    for (const imageUrl of candidateUrls) {
      const timeRemaining = deadline - Date.now();

      if (timeRemaining <= 0) {
        lastError = new Error('Timed out while generating the product image.');
        break;
      }

      try {
        dataUrl = await resolvePollinationsDataUrl(
          imageUrl,
          signal,
          Math.min(POLLINATIONS_IMAGE_TIMEOUT_MS, timeRemaining)
        );
        break;
      } catch (error) {
        if (signal?.aborted || isAbortError(error)) {
          throw error;
        }

        lastError = error instanceof Error ? error : new Error('Pollinations request failed.');
      }
    }

    if (!dataUrl) {
      throw lastError || new Error('Pollinations did not return an image.');
    }

    writePollinationsCache(seed, dataUrl);
    const file = await dataUrlToFile(dataUrl, `${safeName}-pollinations.jpg`, 'image/jpeg', signal);

    return {
      file,
      previewUrl: dataUrl,
      prompt,
    };
  } catch (error) {
    if (cachedImage) {
      return {
        file: await dataUrlToFile(cachedImage, `${safeName}-pollinations.jpg`, 'image/jpeg', signal),
        previewUrl: cachedImage,
        prompt,
      };
    }

    throw error;
  }
}

async function createFreeGenWebSocketAuth(jobId: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = new TextEncoder().encode(`${jobId}${timestamp}`);
  const digest = await crypto.subtle.digest('SHA-256', message);
  const hashHex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return `${encodeBase64Ascii(hashHex).substring(0, 20)}:${timestamp}`;
}

async function waitForFreeGenImageSource(jobId: string, signal?: AbortSignal) {
  const auth = await createFreeGenWebSocketAuth(jobId);

  return new Promise<string>((resolve, reject) => {
    const socket = new WebSocket(FREEGEN_WEBSOCKET_URL);
    let settled = false;

    const settle = (resolver: typeof resolve | typeof reject, value: string | Error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);

      if (signal) {
        signal.removeEventListener('abort', handleAbort);
      }

      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        try {
          socket.close();
        } catch {
          // Ignore close errors from already-closing sockets.
        }
      }

      resolver(value as never);
    };

    const handleAbort = () => {
      settle(reject, createAbortError());
    };

    const timeoutId = globalThis.setTimeout(() => {
      settle(reject, new Error('Timed out while waiting for a FreeGen image.'));
    }, FREEGEN_RESULT_TIMEOUT_MS);

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    signal?.addEventListener('abort', handleAbort, { once: true });

    socket.addEventListener('open', () => {
      if (signal?.aborted) {
        handleAbort();
        return;
      }

      socket.send(JSON.stringify({
        type: 'subscribe',
        job_id: jobId,
        auth,
      }));
    });

    socket.addEventListener('message', (event) => {
      let message: FreeGenSocketMessage | null = null;

      try {
        message = JSON.parse(String(event.data)) as FreeGenSocketMessage;
      } catch {
        return;
      }

      if (message?.type === 'result') {
        const imageSource = extractProductImageSource(message);

        if (!imageSource) {
          settle(reject, new Error('FreeGen returned a result without an image.'));
          return;
        }

        settle(resolve, imageSource);
        return;
      }

      if (message?.type === 'error') {
        settle(reject, new Error(message.message || 'FreeGen failed to generate an image.'));
      }
    });

    socket.addEventListener('error', () => {
      settle(reject, new Error('FreeGen websocket connection failed.'));
    });

    socket.addEventListener('close', () => {
      if (!settled) {
        settle(reject, new Error('FreeGen connection closed before an image was returned.'));
      }
    });
  });
}

export async function generateFreeGenProductImage(
  context: ProductImageContext,
  signal?: AbortSignal
): Promise<GeneratedProductImageAsset> {
  const prompt = buildFreeGenProductPrompt(context);
  const signerResponse = await fetch(FREEGEN_SIGNER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
    signal,
  });

  if (!signerResponse.ok) {
    throw new Error(`FreeGen signer request failed with status ${signerResponse.status}.`);
  }

  const signedPrompt = await signerResponse.json() as FreeGenSignedPrompt;
  const generatorResponse = await fetch(FREEGEN_GENERATOR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      ts: signedPrompt.ts,
      sig: signedPrompt.sig,
      ratio_id: FREEGEN_RATIO_ID,
    }),
    signal,
  });

  if (!generatorResponse.ok) {
    let errorMessage = `FreeGen generator request failed with status ${generatorResponse.status}.`;

    try {
      const errorPayload = await generatorResponse.json() as { error?: string };
      if (errorPayload?.error) {
        errorMessage = errorPayload.error;
      }
    } catch {
      // Ignore JSON parse errors and keep the status-based message.
    }

    throw new Error(errorMessage);
  }

  const payload = await generatorResponse.json() as FreeGenGeneratorResponse;
  let imageSource = extractProductImageSource(payload);

  if (!imageSource && payload.job_id) {
    imageSource = await waitForFreeGenImageSource(payload.job_id, signal);
  }

  if (!imageSource) {
    throw new Error('FreeGen did not return an image.');
  }

  const safeName = sanitizeProductImageFilename(context.name);
  const file = await dataUrlToFile(imageSource, `${safeName}-freegen.jpg`, 'image/jpeg', signal);
  const previewUrl = imageSource.startsWith('data:image/')
    ? imageSource
    : URL.createObjectURL(file);

  return {
    file,
    previewUrl,
    prompt,
  };
}

export function createProductFallbackSvg(context: ProductImageContext) {
  const name = collapseWhitespace(context.name) || 'Product';
  const categoryName = collapseWhitespace(context.categoryName || '');
  const description = trimSentence(context.description || '', 72);
  const initials = getProductInitials(name);
  const nameLines = wrapText(name, 18, 2);
  const [background, card, accent, accentSoft] = buildPalette(buildProductImageSignature(context));

  const metaLabel = categoryName || (context.type === 'ADDON' ? 'Add-on' : 'Product');
  const subtitle = description || 'Ready for your catalog';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${FALLBACK_IMAGE_SIZE}" height="${FALLBACK_IMAGE_SIZE}" viewBox="0 0 ${FALLBACK_IMAGE_SIZE} ${FALLBACK_IMAGE_SIZE}" role="img" aria-label="${escapeSvg(name)}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${background}" />
          <stop offset="100%" stop-color="${card}" />
        </linearGradient>
        <linearGradient id="accent" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="${accentSoft}" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="28" flood-color="#020617" flood-opacity="0.22" />
        </filter>
      </defs>

      <rect width="${FALLBACK_IMAGE_SIZE}" height="${FALLBACK_IMAGE_SIZE}" fill="url(#bg)" rx="72" />
      <circle cx="826" cy="214" r="168" fill="${accent}" opacity="0.12" />
      <circle cx="174" cy="846" r="180" fill="${accentSoft}" opacity="0.18" />

      <rect x="112" y="112" width="800" height="800" rx="56" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.16)" filter="url(#shadow)" />

      <rect x="176" y="176" width="244" height="64" rx="32" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.12)" />
      <text x="298" y="217" text-anchor="middle" fill="#F8FAFC" font-size="28" font-family="Inter, Arial, sans-serif" font-weight="700" letter-spacing="0">${escapeSvg(trimSentence(metaLabel, 20))}</text>

      <circle cx="512" cy="430" r="144" fill="url(#accent)" />
      <circle cx="512" cy="430" r="112" fill="rgba(255,255,255,0.14)" />
      <text x="512" y="460" text-anchor="middle" fill="#FFFFFF" font-size="110" font-family="Inter, Arial, sans-serif" font-weight="800" letter-spacing="0">${escapeSvg(initials)}</text>

      <text x="512" y="666" text-anchor="middle" fill="#F8FAFC" font-size="56" font-family="Inter, Arial, sans-serif" font-weight="800" letter-spacing="0">
        <tspan x="512" dy="0">${escapeSvg(nameLines[0] || 'Product')}</tspan>
        ${nameLines[1] ? `<tspan x="512" dy="66">${escapeSvg(nameLines[1])}</tspan>` : ''}
      </text>

      <text x="512" y="820" text-anchor="middle" fill="rgba(248,250,252,0.82)" font-size="28" font-family="Inter, Arial, sans-serif" font-weight="500" letter-spacing="0">${escapeSvg(subtitle)}</text>
    </svg>
  `.trim();
}

export function createProductFallbackDataUrl(context: ProductImageContext) {
  const svg = createProductFallbackSvg(context);
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export async function dataUrlToFile(
  dataUrl: string,
  fileName: string,
  fallbackMimeType?: string,
  signal?: AbortSignal
) {
  const dataUrlMatch = dataUrl.match(/^data:([^;,]+)?((?:;[^,]*)?),(.*)$/s);

  if (!dataUrlMatch) {
    const response = await fetch(dataUrl, { signal });

    if (!response.ok) {
      throw new Error(`Image download failed with status ${response.status}.`);
    }

    const blob = await response.blob();
    const mimeType = blob.type || fallbackMimeType || 'application/octet-stream';
    return new File([blob], fileName, { type: mimeType });
  }

  const mimeType = dataUrlMatch[1] || fallbackMimeType || 'application/octet-stream';
  const metadata = dataUrlMatch[2] || '';
  const payload = dataUrlMatch[3] || '';
  let fileContents: Uint8Array;

  if (metadata.includes(';base64')) {
    const binary = atob(payload);
    fileContents = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      fileContents[index] = binary.charCodeAt(index);
    }
  } else {
    fileContents = new TextEncoder().encode(decodeURIComponent(payload));
  }

  const arrayBuffer = new ArrayBuffer(fileContents.byteLength);
  new Uint8Array(arrayBuffer).set(fileContents);

  return new File([arrayBuffer], fileName, { type: mimeType });
}

async function convertSvgDataUrlToPngDataUrl(svgDataUrl: string) {
  if (typeof document === 'undefined') {
    throw new Error('Document is not available');
  }

  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
    throw new Error('Canvas conversion is unavailable in jsdom');
  }

  const canvas = document.createElement('canvas');
  canvas.width = FALLBACK_IMAGE_SIZE;
  canvas.height = FALLBACK_IMAGE_SIZE;

  const context2d = canvas.getContext('2d');

  if (!context2d) {
    throw new Error('Canvas 2D context is not available');
  }

  const image = new Image();
  image.decoding = 'async';

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      image.onload = null;
      image.onerror = null;
      reject(new Error('Timed out while rendering fallback SVG'));
    }, 1500);

    image.onload = () => {
      clearTimeout(timeoutId);
      resolve();
    };
    image.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Failed to load fallback SVG'));
    };
    image.src = svgDataUrl;
  });

  context2d.clearRect(0, 0, FALLBACK_IMAGE_SIZE, FALLBACK_IMAGE_SIZE);
  context2d.drawImage(image, 0, 0, FALLBACK_IMAGE_SIZE, FALLBACK_IMAGE_SIZE);

  return canvas.toDataURL('image/png');
}

export async function createProductFallbackImageAsset(context: ProductImageContext) {
  const safeName = sanitizeProductImageFilename(context.name);
  const svgDataUrl = createProductFallbackDataUrl(context);

  try {
    const pngDataUrl = await convertSvgDataUrlToPngDataUrl(svgDataUrl);
    const file = await dataUrlToFile(pngDataUrl, `${safeName}-fallback.png`, 'image/png');
    return {
      dataUrl: pngDataUrl,
      file,
    };
  } catch {
    const file = await dataUrlToFile(svgDataUrl, `${safeName}-fallback.svg`, 'image/svg+xml');
    return {
      dataUrl: svgDataUrl,
      file,
    };
  }
}
