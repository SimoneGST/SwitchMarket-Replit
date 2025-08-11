// Sistema di schede prodotto intelligenti per Clemente AI
export interface ProductField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'range' | 'boolean';
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ProductSchema {
  category: string;
  subcategory?: string;
  name: string;
  description: string;
  fields: ProductField[];
  assistantInstructions: string;
}

// Definizione delle schede prodotto specifiche
export const productSchemas: ProductSchema[] = [
  {
    category: "scarpe",
    subcategory: "sportive",
    name: "Scarpe Sportive/Da Palestra",
    description: "Scarpe per attività fisica, palestra, running, fitness",
    fields: [
      {
        key: "type",
        label: "Tipo di scarpe",
        type: "select",
        required: true,
        options: ["running", "palestra/fitness", "spinning/cycling", "crossfit", "tennis", "calcio", "basket", "altro"]
      },
      {
        key: "size",
        label: "Numero di scarpe",
        type: "number",
        required: true,
        validation: { min: 35, max: 50 }
      },
      {
        key: "gender",
        label: "Genere",
        type: "select",
        required: true,
        options: ["uomo", "donna", "unisex"]
      },
      {
        key: "budget",
        label: "Budget",
        type: "range",
        required: true,
        placeholder: "Es: 50-150€"
      },
      {
        key: "brand",
        label: "Marca preferita",
        type: "select",
        required: false,
        options: ["Nike", "Adidas", "Puma", "New Balance", "Asics", "Under Armour", "nessuna preferenza"]
      },
      {
        key: "features",
        label: "Caratteristiche specifiche",
        type: "select",
        required: false,
        options: ["ammortizzazione extra", "traspiranti", "impermeabili", "leggere", "stabili", "con supporto arco plantare"]
      },
      {
        key: "color",
        label: "Colore preferito",
        type: "select",
        required: false,
        options: ["nero", "bianco", "grigio", "blu", "rosso", "verde", "multicolore", "indifferente"]
      }
    ],
    assistantInstructions: "Per scarpe sportive, raccogli SEMPRE numero e budget. Adatta le domande al tipo specifico (es: per spinning chiedi attacchi compatibili, per running chiedi ammortizzazione)."
  },
  {
    category: "abbigliamento",
    subcategory: "casual",
    name: "Abbigliamento Casual",
    description: "Vestiti per uso quotidiano: magliette, pantaloni, felpe, giacche",
    fields: [
      {
        key: "type",
        label: "Tipo di capo",
        type: "select",
        required: true,
        options: ["maglietta", "camicia", "felpa", "maglione", "pantaloni", "jeans", "giacca", "cappotto", "vestito", "gonna"]
      },
      {
        key: "size",
        label: "Taglia",
        type: "select",
        required: true,
        options: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]
      },
      {
        key: "gender",
        label: "Genere",
        type: "select",
        required: true,
        options: ["uomo", "donna", "unisex", "bambino"]
      },
      {
        key: "budget",
        label: "Budget",
        type: "range",
        required: true,
        placeholder: "Es: 20-80€"
      },
      {
        key: "brand",
        label: "Marca preferita",
        type: "text",
        required: false,
        placeholder: "Es: Zara, H&M, Nike..."
      },
      {
        key: "material",
        label: "Materiale preferito",
        type: "select",
        required: false,
        options: ["cotone", "lana", "poliestere", "misto", "denim", "pelle", "indifferente"]
      },
      {
        key: "color",
        label: "Colore",
        type: "select",
        required: false,
        options: ["nero", "bianco", "grigio", "blu", "rosso", "verde", "marrone", "multicolore", "indifferente"]
      },
      {
        key: "style",
        label: "Stile",
        type: "select",
        required: false,
        options: ["casual", "elegante", "sportivo", "vintage", "moderno", "indifferente"]
      }
    ],
    assistantInstructions: "Per abbigliamento, raccogli sempre taglia e budget. Adatta le domande al capo specifico (es: per camicie chiedi colletto, per pantaloni chiedi vestibilità)."
  },
  {
    category: "elettronica",
    subcategory: "smartphone",
    name: "Smartphone e Telefoni",
    description: "Telefoni cellulari, smartphone, accessori",
    fields: [
      {
        key: "type",
        label: "Tipo di telefono",
        type: "select",
        required: true,
        options: ["smartphone Android", "iPhone", "telefono base", "smartphone ricondizionato"]
      },
      {
        key: "budget",
        label: "Budget",
        type: "range",
        required: true,
        placeholder: "Es: 200-500€"
      },
      {
        key: "brand",
        label: "Marca preferita",
        type: "select",
        required: false,
        options: ["Apple", "Samsung", "Xiaomi", "Huawei", "OnePlus", "Google", "nessuna preferenza"]
      },
      {
        key: "storage",
        label: "Memoria interna",
        type: "select",
        required: false,
        options: ["64GB", "128GB", "256GB", "512GB", "1TB", "indifferente"]
      },
      {
        key: "screen_size",
        label: "Dimensione schermo",
        type: "select",
        required: false,
        options: ["fino a 5.5\"", "5.5-6\"", "6-6.5\"", "oltre 6.5\"", "indifferente"]
      },
      {
        key: "condition",
        label: "Condizioni",
        type: "select",
        required: true,
        options: ["nuovo", "ricondizionato", "usato", "indifferente"]
      },
      {
        key: "features",
        label: "Caratteristiche importanti",
        type: "select",
        required: false,
        options: ["buona fotocamera", "lunga durata batteria", "resistente", "dual SIM", "5G", "nessuna preferenza"]
      }
    ],
    assistantInstructions: "Per smartphone, raccogli sempre budget e condizioni. Focalizzati su marca, memoria e caratteristiche più importanti per l'utente."
  },
  {
    category: "casa",
    subcategory: "arredamento",
    name: "Mobili e Arredamento",
    description: "Mobili per casa: divani, tavoli, sedie, armadi, librerie",
    fields: [
      {
        key: "type",
        label: "Tipo di mobile",
        type: "select",
        required: true,
        options: ["divano", "poltrona", "tavolo", "sedia", "armadio", "libreria", "letto", "comodino", "scrivania", "mobile TV"]
      },
      {
        key: "dimensions",
        label: "Dimensioni",
        type: "text",
        required: true,
        placeholder: "Es: 2m x 1m, misure approssimative"
      },
      {
        key: "budget",
        label: "Budget",
        type: "range",
        required: true,
        placeholder: "Es: 100-500€"
      },
      {
        key: "material",
        label: "Materiale preferito",
        type: "select",
        required: false,
        options: ["legno", "metallo", "plastica", "tessuto", "pelle", "misto", "indifferente"]
      },
      {
        key: "color",
        label: "Colore",
        type: "select",
        required: false,
        options: ["bianco", "nero", "marrone", "grigio", "beige", "colorato", "indifferente"]
      },
      {
        key: "style",
        label: "Stile",
        type: "select",
        required: false,
        options: ["moderno", "classico", "vintage", "industriale", "scandinavo", "rustico", "indifferente"]
      },
      {
        key: "condition",
        label: "Condizioni",
        type: "select",
        required: true,
        options: ["nuovo", "usato in ottime condizioni", "usato", "da restaurare"]
      }
    ],
    assistantInstructions: "Per mobili, raccogli sempre dimensioni e budget. Importante capire lo spazio disponibile e lo stile della casa."
  },
  {
    category: "casa",
    subcategory: "elettrodomestici",
    name: "Elettrodomestici",
    description: "Elettrodomestici per casa: frigoriferi, lavatrici, forni, aspirapolveri",
    fields: [
      {
        key: "type",
        label: "Tipo di elettrodomestico",
        type: "select",
        required: true,
        options: ["frigorifero", "lavatrice", "lavastoviglie", "forno", "microonde", "aspirapolvere", "ferro da stiro", "ventilatore", "condizionatore"]
      },
      {
        key: "budget",
        label: "Budget",
        type: "range",
        required: true,
        placeholder: "Es: 200-800€"
      },
      {
        key: "capacity",
        label: "Capacità/Dimensioni",
        type: "text",
        required: false,
        placeholder: "Es: 7kg, 300L, dimensioni in cm"
      },
      {
        key: "energy_class",
        label: "Classe energetica",
        type: "select",
        required: false,
        options: ["A+++", "A++", "A+", "A", "B", "indifferente"]
      },
      {
        key: "brand",
        label: "Marca preferita",
        type: "select",
        required: false,
        options: ["Bosch", "Samsung", "LG", "Whirlpool", "Electrolux", "Indesit", "nessuna preferenza"]
      },
      {
        key: "features",
        label: "Caratteristiche specifiche",
        type: "text",
        required: false,
        placeholder: "Es: silenziosa, programmabile, WiFi"
      },
      {
        key: "condition",
        label: "Condizioni",
        type: "select",
        required: true,
        options: ["nuovo", "ricondizionato", "usato", "indifferente"]
      }
    ],
    assistantInstructions: "Per elettrodomestici, raccogli sempre budget e tipo specifico. Importante capire le dimensioni disponibili e le caratteristiche prioritarie."
  }
];

// Funzione per trovare la scheda più appropriata
export function findBestProductSchema(userInput: string): ProductSchema | null {
  const input = userInput.toLowerCase();
  
  // Mappature intelligenti per riconoscimento prodotti
  const categoryMappings = {
    // Scarpe e calzature
    'scarpe': ['scarpe', 'sneakers', 'running', 'sportive', 'ginnastica', 'tennis', 'calcio', 'basket', 'spinning', 'cycling'],
    'abbigliamento': ['maglietta', 'camicia', 'felpa', 'pantaloni', 'jeans', 'giacca', 'vestito', 'gonna', 'maglione'],
    'smartphone': ['telefono', 'smartphone', 'cellulare', 'iphone', 'android'],
    'mobili': ['divano', 'tavolo', 'sedia', 'armadio', 'letto', 'scrivania', 'libreria', 'poltrona', 'mobile'],
    'elettrodomestici': ['frigorifero', 'lavatrice', 'lavastoviglie', 'forno', 'microonde', 'aspirapolvere']
  };
  
  // Trova la categoria più appropriata
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    if (keywords.some(keyword => input.includes(keyword))) {
      // Trova la scheda specifica per quella categoria
      return productSchemas.find(schema => 
        schema.category === category || 
        schema.subcategory === category ||
        schema.name.toLowerCase().includes(category)
      ) || null;
    }
  }
  
  return null;
}

// Funzione per generare domande intelligenti basate sulla scheda
export function generateSmartQuestion(schema: ProductSchema, collectedData: any): string | null {
  const missingRequired = schema.fields.filter(field => 
    field.required && !collectedData[field.key]
  );
  
  if (missingRequired.length > 0) {
    const field = missingRequired[0];
    return formatQuestionForField(field);
  }
  
  const missingOptional = schema.fields.filter(field => 
    !field.required && !collectedData[field.key]
  );
  
  if (missingOptional.length > 0) {
    const field = missingOptional[0];
    return formatQuestionForField(field);
  }
  
  return null; // Tutte le informazioni raccolte
}

function formatQuestionForField(field: ProductField): string {
  let question = `${field.label}?`;
  
  if (field.options && field.options.length > 0) {
    const examples = field.options.slice(0, 4).join(', ');
    question += ` (${examples}${field.options.length > 4 ? '...' : ''})`;
  } else if (field.placeholder) {
    question += ` (${field.placeholder})`;
  }
  
  return question;
}

// Funzione per validare e strutturare i dati raccolti
export function validateCollectedData(schema: ProductSchema, data: any): { isValid: boolean; missingFields: string[]; errors: string[] } {
  const missingFields: string[] = [];
  const errors: string[] = [];
  
  schema.fields.forEach(field => {
    if (field.required && !data[field.key]) {
      missingFields.push(field.label);
    }
    
    if (data[field.key] && field.validation) {
      const value = data[field.key];
      
      if (field.type === 'number') {
        const num = parseFloat(value);
        if (field.validation.min && num < field.validation.min) {
          errors.push(`${field.label} deve essere almeno ${field.validation.min}`);
        }
        if (field.validation.max && num > field.validation.max) {
          errors.push(`${field.label} deve essere al massimo ${field.validation.max}`);
        }
      }
    }
  });
  
  return {
    isValid: missingFields.length === 0 && errors.length === 0,
    missingFields,
    errors
  };
}