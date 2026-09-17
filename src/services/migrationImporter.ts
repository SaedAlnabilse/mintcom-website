/**
 * Migration execution service — Phase 1 (frontend-only, zero backend changes).
 * Reuses the proven ProductsPage import flow: category auto-create,
 * add-on group + option auto-create, duplicate skip, FormData item create.
 * Adds chunked progress reporting so the UI can show a live bar.
 */
import api from '../config/api';
import { fetchAllPages } from '../utils/fetchAllPages';
import type { MappedProductRow } from '../utils/posImportMaps';

export interface MigrationImportResult {
  success: number;
  failed: number;
  errors: string[];
  createdCategories: string[];
  createdAddons: string[];
}

interface AddonSpec {
  name: string;
  options: { name: string; price: number }[];
}

function parseAddonsCell(cell: string): AddonSpec[] {
  const raw = (cell || '').trim();
  if (!raw) return [];
  const entries = /[;:|]/.test(raw) ? raw.split(';') : raw.split(',');
  const specs: AddonSpec[] = [];
  for (const entry of entries) {
    const [namePart, ...rest] = entry.split(':');
    const name = namePart.trim();
    if (!name) continue;
    const options = rest.join(':').split('|')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((part) => {
        const m = part.match(/\+\s*([\d.]+)\s*$/);
        const price = m ? Number(m[1]) : 0;
        const optName = m ? part.slice(0, m.index).trim() : part;
        return { name: optName, price: Number.isNaN(price) ? 0 : price };
      })
      .filter((o) => o.name.length > 0);
    specs.push({ name, options });
  }
  return specs;
}

type CategoryShape = { id: string; name: string };
type AttrShape = { id: string; name: string; subAttributes?: { name?: string }[] };
type ProductShape = { name: string; categoryId?: string };

export async function runMigrationImport(
  rows: MappedProductRow[],
  onProgress?: (done: number, total: number) => void,
): Promise<MigrationImportResult> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  const createdCategories: string[] = [];
  const createdAddons: string[] = [];

  // Category map (case-insensitive)
  let categoryMap = new Map<string, string>();
  try {
    const res = await api.get('/api/categories', { params: { includeInactive: true } });
    const cats = (Array.isArray(res.data) ? res.data : (res.data?.items ?? [])) as CategoryShape[];
    categoryMap = new Map(cats.map((c) => [c.name.toLowerCase().trim(), c.id]));
  } catch { /* keep empty, created on demand */ }

  // Add-on map
  type AddonEntry = { id: string; options: Set<string> };
  const toEntry = (a: AttrShape): [string, AddonEntry] => [
    a.name.toLowerCase().trim(),
    { id: a.id, options: new Set((a.subAttributes ?? []).map((s) => (s?.name || '').toLowerCase().trim()).filter(Boolean)) },
  ];
  let addonMap = new Map<string, AddonEntry>();
  try {
    const r = await api.get('/api/attributes');
    const attrs = (Array.isArray(r.data) ? r.data : (r.data?.items ?? [])) as AttrShape[];
    addonMap = new Map(attrs.map(toEntry));
  } catch { /* ignore */ }

  const resolveAddon = async (addonName: string): Promise<AddonEntry | null> => {
    const key = addonName.toLowerCase();
    const known = addonMap.get(key);
    if (known) return known;
    try {
      const res = await api.post('/api/attributes', { name: addonName, inputType: 'MULTI_SELECT', isRequired: false });
      const id = res.data?.id as string | undefined;
      if (id) {
        const entry: AddonEntry = { id, options: new Set() };
        addonMap.set(key, entry);
        createdAddons.push(addonName);
        return entry;
      }
    } catch {
      try {
        const refresh = await api.get('/api/attributes');
        const list = (Array.isArray(refresh.data) ? refresh.data : (refresh.data?.items ?? [])) as AttrShape[];
        const found = list.find((a) => a.name.toLowerCase().trim() === key);
        if (found) {
          const entry = toEntry(found)[1];
          addonMap.set(key, entry);
          return entry;
        }
      } catch { /* ignore */ }
    }
    return null;
  };

  // Existing products for duplicate detection
  const existing = new Set<string>();
  try {
    const prods = await fetchAllPages<ProductShape>(api, '/api/items', { includeInactive: true });
    prods.forEach((p) => existing.add(`${p.name.toLowerCase().trim()}|${p.categoryId || ''}`));
  } catch { /* ignore */ }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = row._rowNum || i + 2;
    const name = (row.name || '').trim();
    const priceStr = (row.price || '').trim();
    const categoryName = (row.category || '').trim() || 'Uncategorized';

    if (!name) { errors.push(`Row ${rowNum}: Name is required`); failed++; onProgress?.(i + 1, rows.length); continue; }
    if (!priceStr || Number.isNaN(Number(priceStr)) || Number(priceStr) < 0) {
      errors.push(`Row ${rowNum}: Price must be a valid positive number`); failed++; onProgress?.(i + 1, rows.length); continue;
    }

    let categoryId = categoryMap.get(categoryName.toLowerCase());
    if (!categoryId) {
      try {
        const catRes = await api.post('/api/categories', { name: categoryName, icon: 'tag', sortOrder: 0 });
        categoryId = catRes.data.id;
        categoryMap.set(categoryName.toLowerCase(), categoryId!);
        createdCategories.push(categoryName);
      } catch (catErr: unknown) {
        const msg = (catErr as { response?: { data?: { message?: string } } })?.response?.data?.message || '';
        if (msg.includes('Unique constraint')) {
          try {
            const rr = await api.get('/api/categories');
            const list = (Array.isArray(rr.data) ? rr.data : (rr.data?.items ?? [])) as CategoryShape[];
            const found = list.find((c) => c.name.toLowerCase().trim() === categoryName.toLowerCase());
            if (found) { categoryId = found.id; categoryMap.set(categoryName.toLowerCase(), categoryId!); }
          } catch { /* ignore */ }
        }
        if (!categoryId) { errors.push(`Row ${rowNum}: Failed to create category "${categoryName}"`); failed++; onProgress?.(i + 1, rows.length); continue; }
      }
    }

    const dupKey = `${name.toLowerCase()}|${categoryId}`;
    if (existing.has(dupKey)) { errors.push(`Row ${rowNum}: "${name}" already exists in "${categoryName}", skipped`); failed++; onProgress?.(i + 1, rows.length); continue; }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', priceStr);
    formData.append('categoryId', categoryId!);
    formData.append('trackStock', row.track_stock === 'true' ? 'true' : 'false');
    if (row.description?.trim()) formData.append('description', row.description.trim());
    if (row.cost_price?.trim() && !Number.isNaN(Number(row.cost_price))) formData.append('costPrice', row.cost_price.trim());
    if (row.available_stock?.trim() && !Number.isNaN(Number(row.available_stock))) formData.append('availableStock', row.available_stock.trim());
    formData.append('type', 'ITEM');
    formData.append('isAvailable', 'true');

    const specs = parseAddonsCell(row.addons || '');
    const attributeIds: string[] = [];
    const addonWarnings: string[] = [];
    for (const spec of specs) {
      const entry = await resolveAddon(spec.name);
      if (!entry) { addonWarnings.push(`Row ${rowNum}: Add-on "${spec.name}" could not be linked, skipped`); continue; }
      if (!attributeIds.includes(entry.id)) attributeIds.push(entry.id);
      for (const opt of spec.options) {
        if (entry.options.has(opt.name.toLowerCase())) continue;
        try {
          await api.post(`/api/attributes/${entry.id}/sub-attributes`, { name: opt.name, price: opt.price, isAvailable: true });
          entry.options.add(opt.name.toLowerCase());
        } catch { addonWarnings.push(`Row ${rowNum}: Option "${opt.name}" skipped`); }
      }
    }
    if (attributeIds.length > 0) formData.append('attributeIds', JSON.stringify(attributeIds));

    try {
      await api.post('/api/items', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      existing.add(dupKey);
      errors.push(...addonWarnings);
      success++;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (err as Error)?.message || 'Unknown error';
      errors.push(`Row ${rowNum}: Failed to create "${name}" - ${msg}`);
      failed++;
    }
    onProgress?.(i + 1, rows.length);
  }

  return { success, failed, errors, createdCategories, createdAddons };
}
