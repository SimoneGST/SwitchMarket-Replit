// Client-side product schemas and detection for dynamic attributes

export type ProductFieldType = 'text' | 'select' | 'number' | 'range' | 'boolean';

export interface ProductField {
  key: string;
  label: string;
  type: ProductFieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface ProductSchema {
  category: string;
  name: string;
  description?: string;
  fields: ProductField[];
}

// Minimal useful schemas for the client UI
export const productSchemas: ProductSchema[] = [
  {
    category: 'occhiali',
    name: 'Occhiali da Sole',
    description: 'Occhiali da sole e montature',
    fields: [
      { key: 'frame_material', label: 'Materiale montatura', type: 'select', required: false, options: ['legno','acetato','metallo','titanio','plastica','altro'] },
      { key: 'lens_type', label: 'Tipo di lenti', type: 'select', required: false, options: ['polarizzate','fotocromatiche','specchiate','classiche','blu light'] },
      { key: 'color', label: 'Colore', type: 'select', required: false, options: ['nero','marrone','blu','grigio','verde','trasparente','oro','argento','altro'] },
      { key: 'style', label: 'Stile', type: 'select', required: false, options: ['aviator','wayfarer','round','square','sportivo','elegante','altro'] },
    ]
  },
  {
    category: 'scarpe',
    name: 'Scarpe Sportive/Da Palestra',
    fields: [
  { key: 'type', label: 'Tipo', type: 'select', required: true, options: ['running','palestra/fitness','spinning/cycling','trekking','tennis','basket','altro'] },
  { key: 'gender', label: 'Genere', type: 'select', required: true, options: ['uomo','donna','unisex','bambino'] },
      { key: 'size', label: 'Numero (EU)', type: 'number', required: true },
      { key: 'material', label: 'Materiale', type: 'select', required: false, options: ['pelle','tessuto','sintetico','mesh','altro'] },
      { key: 'color', label: 'Colore', type: 'select', required: false, options: ['nero','bianco','grigio','blu','rosso','verde','multicolore','indifferente'] },
    ]
  },
  {
    category: 'abbigliamento',
    name: 'Abbigliamento',
    fields: [
      { key: 'type', label: 'Tipo di capo', type: 'select', required: true, options: ['maglietta','camicia','felpa','maglione','pantaloni','jeans','giacca','cappotto','vestito','gonna'] },
      { key: 'size', label: 'Taglia', type: 'select', required: true, options: ['XS','S','M','L','XL','XXL','XXXL'] },
  { key: 'gender', label: 'Genere', type: 'select', required: true, options: ['uomo','donna','unisex','bambino'] },
      { key: 'material', label: 'Materiale', type: 'select', required: false, options: ['cotone','lana','poliestere','lino','misto','denim','pelle','altro'] },
      { key: 'color', label: 'Colore', type: 'select', required: false, options: ['nero','bianco','grigio','blu','rosso','verde','marrone','altro'] },
    ]
  },
  {
    category: 'elettronica',
    name: 'Smartphone e Telefoni',
    fields: [
      { key: 'type', label: 'Tipo', type: 'select', required: true, options: ['Android','iPhone','telefono base','ricondizionato'] },
      { key: 'storage', label: 'Memoria', type: 'select', required: false, options: ['64GB','128GB','256GB','512GB','1TB','indifferente'] },
      { key: 'condition', label: 'Condizioni', type: 'select', required: false, options: ['nuovo','ricondizionato','usato','indifferente'] },
      { key: 'color', label: 'Colore', type: 'select', required: false, options: ['nero','bianco','grigio','blu','verde','oro','argento','altro'] },
    ]
  },
  {
    category: 'mobili',
    name: 'Mobili e Arredamento',
    fields: [
      { key: 'type', label: 'Tipo', type: 'select', required: true, options: ['divano','tavolo','sedia','armadio','libreria','letto','scrivania','mobile TV'] },
      { key: 'dimensions', label: 'Dimensioni', type: 'text', required: true, placeholder: 'Es: 200x90x75 cm' },
      { key: 'material', label: 'Materiale', type: 'select', required: false, options: ['legno','metallo','pelle','tessuto','plastica','altro'] },
      { key: 'color', label: 'Colore', type: 'select', required: false, options: ['bianco','nero','marrone','grigio','beige','altro'] },
    ]
  },
];

export function findBestProductSchemaClient(userInput: string): ProductSchema | null {
  const input = (userInput || '').toLowerCase();
  if (!input) return null;

  // sunglasses first
  if (/(occhiali\s*da\s*sole|occhiali|lenti)/.test(input)) return productSchemas.find(s => s.category === 'occhiali') || null;

  if (/(scarpe|sneakers|running|spinning|cycling|tennis|basket|trekking|hiking|trail)/.test(input)) return productSchemas.find(s => s.category === 'scarpe') || null;
  if (/(maglietta|camicia|felpa|pantaloni|jeans|giacca|cappotto|vestito|gonna|abbigliamento)/.test(input)) return productSchemas.find(s => s.category === 'abbigliamento') || null;
  if (/(telefono|smartphone|cellulare|iphone|android)/.test(input)) return productSchemas.find(s => s.category === 'elettronica') || null;
  if (/(divano|tavolo|sedia|armadio|libreria|letto|scrivania|mobile)/.test(input)) return productSchemas.find(s => s.category === 'mobili') || null;

  return null;
}

// Utility: normalize a long product phrase to a base product name (title)
export function normalizeProductTitle(input: string): string {
  if (!input) return input;
  let t = input.trim();
  // cut after common prepositions indicating details
  t = t.replace(/\s+(con|in|per|da|di)\s+.*$/i, '');
  // collapse spaces
  t = t.replace(/\s{2,}/g, ' ').trim();
  // Example-specific: map to known base names
  if (/occhiali\s*da\s*sole/i.test(t)) return 'Occhiali da sole';
  return t.charAt(0).toUpperCase() + t.slice(1);
}
