// Schede Prodotto per Clemente (backend Functions)
// Nota: versione ridotta e autonoma per l'uso nel backend

export interface ProductField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'range' | 'boolean';
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: { min?: number; max?: number; pattern?: string };
}

export interface ProductSchema {
  category: string;
  subcategory?: string;
  name: string;
  description: string;
  fields: ProductField[];
  assistantInstructions: string;
  requiredFields?: string[];
  categorySpecificFields?: string[];
  fieldDescriptions?: Record<string, string>;
  fieldTypes?: Record<string, 'text' | 'number' | 'select' | 'boolean'>;
  selectOptions?: Record<string, string[]>;
}

export const productSchemas: ProductSchema[] = [
  {
    category: 'scarpe',
    subcategory: 'sportive',
    name: 'Scarpe Sportive/Da Palestra',
    description: 'Scarpe per attività fisica, palestra, running, fitness',
    requiredFields: ['productName', 'size', 'color', 'brand'],
    categorySpecificFields: ['size', 'color', 'brand', 'material', 'condition'],
    fieldDescriptions: {
      productName: 'Nome specifico del prodotto',
      size: 'Numero/taglia delle scarpe (35-50)',
      color: 'Colore preferito o specifico',
      brand: 'Marca preferita (Nike, Adidas, etc.)',
      material: 'Materiale (pelle, tessuto, sintetico)',
      condition: 'Condizione (nuovo, usato, ricondizionato)'
    },
    fieldTypes: {
      productName: 'text',
      size: 'number',
      color: 'select',
      brand: 'select',
      material: 'select',
      condition: 'select'
    },
    selectOptions: {
      color: ['nero', 'bianco', 'grigio', 'blu', 'rosso', 'verde', 'altro'],
      brand: ['Nike', 'Adidas', 'Puma', 'New Balance', 'Asics', 'Under Armour', 'altro'],
      material: ['pelle', 'tessuto', 'sintetico', 'mesh', 'altro'],
      condition: ['new', 'used', 'refurbished']
    },
    fields: [
      { key: 'type', label: 'Tipo di scarpe', type: 'select', required: true, options: ['running', 'palestra/fitness', 'spinning/cycling', 'trekking', 'crossfit', 'tennis', 'calcio', 'basket', 'altro'] },
      { key: 'size', label: 'Numero di scarpe', type: 'number', required: true, validation: { min: 35, max: 50 } },
      { key: 'gender', label: 'Genere', type: 'select', required: true, options: ['uomo', 'donna', 'unisex'] },
      { key: 'budget', label: 'Budget', type: 'range', required: true, placeholder: 'Es: 50-150€' },
      { key: 'brand', label: 'Marca preferita', type: 'select', required: false, options: ['Nike', 'Adidas', 'Puma', 'New Balance', 'Asics', 'Under Armour', 'nessuna preferenza'] },
      { key: 'features', label: 'Caratteristiche specifiche', type: 'select', required: false, options: ['ammortizzazione extra', 'traspiranti', 'impermeabili', 'leggere', 'stabili', 'con supporto arco plantare'] },
      { key: 'color', label: 'Colore preferito', type: 'select', required: false, options: ['nero', 'bianco', 'grigio', 'blu', 'rosso', 'verde', 'multicolore', 'indifferente'] },
    ],
    assistantInstructions: 'Per scarpe sportive, raccogli SEMPRE numero e budget. Per spinning chiedi attacchi compatibili; per running chiedi ammortizzazione.',
  },
  {
    category: 'abbigliamento',
    subcategory: 'casual',
    name: 'Abbigliamento Casual',
    description: 'Vestiti per uso quotidiano: magliette, pantaloni, felpe, giacche',
    requiredFields: ['productName', 'size', 'color'],
    categorySpecificFields: ['size', 'color', 'brand', 'material', 'condition'],
    fieldDescriptions: {
      productName: 'Nome specifico del capo',
      size: 'Taglia (XS, S, M, L, XL, etc.)',
      color: 'Colore del capo',
      brand: 'Marca (opzionale)',
      material: 'Materiale (cotone, poliestere, etc.)',
      condition: 'Condizione (nuovo, usato, ricondizionato)'
    },
    fieldTypes: { productName: 'text', size: 'select', color: 'select', brand: 'text', material: 'select', condition: 'select' },
    selectOptions: { size: ['XS','S','M','L','XL','XXL','XXXL'], color: ['nero','bianco','grigio','blu','rosso','verde','altro'], material: ['cotone','poliestere','lana','lino','misto','altro'], condition: ['new','used','refurbished'] },
    fields: [
      { key: 'type', label: 'Tipo di capo', type: 'select', required: true, options: ['maglietta','camicia','felpa','maglione','pantaloni','jeans','giacca','cappotto','vestito','gonna'] },
      { key: 'size', label: 'Taglia', type: 'select', required: true, options: ['XS','S','M','L','XL','XXL','XXXL'] },
      { key: 'gender', label: 'Genere', type: 'select', required: true, options: ['uomo','donna','unisex','bambino'] },
      { key: 'budget', label: 'Budget', type: 'range', required: true, placeholder: 'Es: 20-80€' },
      { key: 'brand', label: 'Marca preferita', type: 'text', required: false, placeholder: 'Es: Zara, H&M, Nike...' },
      { key: 'material', label: 'Materiale', type: 'select', required: false, options: ['cotone','lana','poliestere','misto','denim','pelle','indifferente'] },
      { key: 'color', label: 'Colore', type: 'select', required: false, options: ['nero','bianco','grigio','blu','rosso','verde','marrone','multicolore','indifferente'] },
      { key: 'style', label: 'Stile', type: 'select', required: false, options: ['casual','elegante','sportivo','vintage','moderno','indifferente'] },
    ],
    assistantInstructions: 'Per abbigliamento, raccogli sempre taglia e budget. Adatta al capo specifico.',
  },
  {
    category: 'elettronica',
    subcategory: 'smartphone',
    name: 'Smartphone e Telefoni',
    description: 'Telefoni cellulari, smartphone, accessori',
    fields: [
      { key: 'type', label: 'Tipo di telefono', type: 'select', required: true, options: ['smartphone Android','iPhone','telefono base','smartphone ricondizionato'] },
      { key: 'budget', label: 'Budget', type: 'range', required: true, placeholder: 'Es: 200-500€' },
      { key: 'brand', label: 'Marca preferita', type: 'select', required: false, options: ['Apple','Samsung','Xiaomi','Huawei','OnePlus','Google','nessuna preferenza'] },
      { key: 'storage', label: 'Memoria interna', type: 'select', required: false, options: ['64GB','128GB','256GB','512GB','1TB','indifferente'] },
      { key: 'screen_size', label: 'Dimensione schermo', type: 'select', required: false, options: ['fino a 5.5"','5.5-6"','6-6.5"','oltre 6.5"','indifferente'] },
      { key: 'condition', label: 'Condizioni', type: 'select', required: true, options: ['nuovo','ricondizionato','usato','indifferente'] },
      { key: 'features', label: 'Caratteristiche importanti', type: 'select', required: false, options: ['buona fotocamera','lunga durata batteria','resistente','dual SIM','5G','nessuna preferenza'] },
    ],
    assistantInstructions: 'Per smartphone, raccogli sempre budget e condizioni; marca e memoria se possibile.',
  },
  {
    category: 'casa',
    subcategory: 'arredamento',
    name: 'Mobili e Arredamento',
    description: 'Mobili per casa: divani, tavoli, sedie, armadi, librerie',
    fields: [
      { key: 'type', label: 'Tipo di mobile', type: 'select', required: true, options: ['divano','poltrona','tavolo','sedia','armadio','libreria','letto','comodino','scrivania','mobile TV'] },
      { key: 'dimensions', label: 'Dimensioni', type: 'text', required: true, placeholder: 'Es: 2m x 1m, misure approssimative' },
      { key: 'budget', label: 'Budget', type: 'range', required: true, placeholder: 'Es: 100-500€' },
      { key: 'material', label: 'Materiale', type: 'select', required: false, options: ['legno','metallo','plastica','tessuto','pelle','misto','indifferente'] },
      { key: 'color', label: 'Colore', type: 'select', required: false, options: ['bianco','nero','marrone','grigio','beige','colorato','indifferente'] },
      { key: 'style', label: 'Stile', type: 'select', required: false, options: ['moderno','classico','vintage','industriale','scandinavo','rustico','indifferente'] },
      { key: 'condition', label: 'Condizioni', type: 'select', required: true, options: ['nuovo','usato in ottime condizioni','usato','da restaurare'] },
    ],
    assistantInstructions: 'Per mobili, raccogli sempre dimensioni e budget. Importante lo stile.',
  },
  {
    category: 'casa',
    subcategory: 'elettrodomestici',
    name: 'Elettrodomestici',
    description: 'Frigoriferi, lavatrici, forni, aspirapolveri',
    fields: [
      { key: 'type', label: 'Tipo di elettrodomestico', type: 'select', required: true, options: ['frigorifero','lavatrice','lavastoviglie','forno','microonde','aspirapolvere','ferro da stiro','ventilatore','condizionatore'] },
      { key: 'budget', label: 'Budget', type: 'range', required: true, placeholder: 'Es: 200-800€' },
      { key: 'capacity', label: 'Capacità/Dimensioni', type: 'text', required: false, placeholder: 'Es: 7kg, 300L, dimensioni in cm' },
      { key: 'energy_class', label: 'Classe energetica', type: 'select', required: false, options: ['A+++','A++','A+','A','B','indifferente'] },
      { key: 'brand', label: 'Marca preferita', type: 'select', required: false, options: ['Bosch','Samsung','LG','Whirlpool','Electrolux','Indesit','nessuna preferenza'] },
      { key: 'features', label: 'Caratteristiche', type: 'text', required: false, placeholder: 'Es: silenziosa, programmabile, WiFi' },
      { key: 'condition', label: 'Condizioni', type: 'select', required: true, options: ['nuovo','ricondizionato','usato','indifferente'] },
    ],
    assistantInstructions: 'Per elettrodomestici, chiedi budget e tipo; verifica dimensioni disponibili.',
  },
];

export function findBestProductSchema(userInput: string): ProductSchema | null {
  const input = (userInput || '').toLowerCase();
  const categoryMappings: Record<string, string[]> = {
  scarpe: ['scarpe','sneakers','running','sportive','ginnastica','tennis','calcio','basket','spinning','cycling','trekking','hiking','trail'],
    abbigliamento: ['maglietta','camicia','felpa','pantaloni','jeans','giacca','vestito','gonna','maglione'],
    smartphone: ['telefono','smartphone','cellulare','iphone','android'],
    mobili: ['divano','tavolo','sedia','armadio','letto','scrivania','libreria','poltrona','mobile'],
    elettrodomestici: ['frigorifero','lavatrice','lavastoviglie','forno','microonde','aspirapolvere'],
  };
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    if (keywords.some((kw) => input.includes(kw))) {
      return (
        productSchemas.find((s) => s.category === category || s.subcategory === category || s.name.toLowerCase().includes(category)) || null
      );
    }
  }
  return null;
}

export function generateSmartQuestion(schema: ProductSchema, collectedData: Record<string, any>): string | null {
  if (!schema) return null;
  const missingRequired = schema.fields.filter((f) => f.required && !collectedData?.[f.key]);
  if (missingRequired.length) return formatQuestionForField(missingRequired[0]);
  const missingOptional = schema.fields.filter((f) => !f.required && !collectedData?.[f.key]);
  if (missingOptional.length) return formatQuestionForField(missingOptional[0]);
  return null;
}

export function formatQuestionForField(field: ProductField): string {
  switch (field.key) {
    case 'budget': return 'Hai un budget di riferimento?';
    case 'condition': return 'Preferisci nuovo o va bene usato?';
    case 'size': return 'Che numero/taglia?';
  case 'gender': return 'È per uomo, donna, unisex o bambino?';
  case 'type': return 'Che tipo preferisci? (esempi dalle opzioni proposte)';
    case 'brand': return 'Hai una marca preferita o va bene qualsiasi?';
    default: {
      if (field.options?.length) {
        const ex = field.options.slice(0, 3).join(', ');
        return `Per ${field.label.toLowerCase()}, preferenze? Es. ${ex}.`;
      }
      return `${field.label}?`;
    }
  }
}

export function collectAttributesFromSchema(schema: ProductSchema | null, collected: Record<string, any>): Record<string, any> | undefined {
  if (!schema) return undefined;
  const attrs: Record<string, any> = {};
  for (const f of schema.fields) {
    if (collected[f.key] != null && collected[f.key] !== '') {
      attrs[f.key] = collected[f.key];
    }
  }
  return Object.keys(attrs).length ? attrs : undefined;
}
