import { Integration, Product /*, InsertProduct, SyncLog */ } from "@shared/schema";

export interface GestionaleProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  sku?: string;
  barcode?: string;
  price: number;
  costPrice?: number;
  quantity: number;
  unit?: string;
  vatRate?: number;
  isActive?: boolean;
  images?: string[];
  attributes?: Record<string, any>;
}

export abstract class BaseGestionaleService {
  // Use a loose type for integration to avoid mismatches with schema exports during triage
  protected integration: any;

  constructor(integration: any) {
    this.integration = integration;
  }

  abstract testConnection(): Promise<boolean>;
  abstract getProducts(): Promise<GestionaleProduct[]>;
  abstract updateInventory(productId: string, quantity: number): Promise<boolean>;
  abstract createProduct(product: Partial<GestionaleProduct>): Promise<string>;
  abstract updateProduct(productId: string, product: Partial<GestionaleProduct>): Promise<boolean>;
}

// Fatture in Cloud Integration
export class FattureInCloudService extends BaseGestionaleService {
  private readonly BASE_URL = 'https://api-v2.fattureincloud.it';

  async testConnection(): Promise<boolean> {
    try {
      const integrationAny: any = this.integration;
      const companyId = integrationAny.companyId;
      const apiKey = String(integrationAny.apiKey || '');
      const response = await fetch(`${this.BASE_URL}/c/${companyId}/info/user`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('FIC connection test failed:', error);
      return false;
    }
  }

  async getProducts(): Promise<GestionaleProduct[]> {
    try {
      const integrationAny: any = this.integration;
      const companyId = integrationAny.companyId;
      const apiKey = String(integrationAny.apiKey || '');
      const response = await fetch(`${this.BASE_URL}/c/${companyId}/products`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return data.data?.map((item: any) => ({
        id: item.id?.toString(),
        name: item.name || '',
        description: item.description,
        category: item.category,
        sku: item.code,
        price: parseFloat(item.net_price || '0'),
        costPrice: parseFloat(item.net_cost || '0'),
        quantity: parseInt(item.stock || '0'),
        unit: item.measure,
        vatRate: parseFloat(item.vat?.percentage || '22'),
        isActive: item.in_stock !== false,
      })) || [];
    } catch (error) {
      console.error('FIC get products failed:', error);
      throw error;
    }
  }

  async updateInventory(productId: string, quantity: number): Promise<boolean> {
    try {
      const integrationAny: any = this.integration;
      const companyId = integrationAny.companyId;
      const apiKey = String(integrationAny.apiKey || '');
      const response = await fetch(`${this.BASE_URL}/c/${companyId}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            stock: quantity
          }
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('FIC update inventory failed:', error);
      return false;
    }
  }

  async createProduct(product: Partial<GestionaleProduct>): Promise<string> {
    throw new Error('Create product not implemented for Fatture in Cloud');
  }

  async updateProduct(productId: string, product: Partial<GestionaleProduct>): Promise<boolean> {
    try {
      const integrationAny: any = this.integration;
      const companyId = integrationAny.companyId;
      const apiKey = String(integrationAny.apiKey || '');
      const response = await fetch(`${this.BASE_URL}/c/${companyId}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            name: product.name,
            description: product.description,
            code: product.sku,
            net_price: product.price,
            net_cost: product.costPrice,
            stock: product.quantity,
          }
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('FIC update product failed:', error);
      return false;
    }
  }
}

// Danea EasyFatt Integration
export class DaneaService extends BaseGestionaleService {
  private readonly BASE_URL = (this.integration && this.integration.baseUrl) || 'http://localhost:57888';

  async testConnection(): Promise<boolean> {
    try {
      const apiKey = String(this.integration?.apiKey || '');
      const response = await fetch(`${this.BASE_URL}/api/info`, {
        headers: {
          'X-API-KEY': apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Danea connection test failed:', error);
      return false;
    }
  }

  async getProducts(): Promise<GestionaleProduct[]> {
    try {
      const apiKey = String(this.integration?.apiKey || '');
      const response = await fetch(`${this.BASE_URL}/api/products`, {
        headers: {
          'X-API-KEY': apiKey,
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return data.map((item: any) => ({
        id: item.Codice?.toString(),
        name: item.Descrizione || '',
        description: item.DescrizioneEstesa,
        category: item.Categoria,
        brand: item.Marca,
        sku: item.Codice,
        barcode: item.CodiceEAN,
        price: parseFloat(item.PrezzoVendita || '0'),
        costPrice: parseFloat(item.CostoAcquisto || '0'),
        quantity: parseInt(item.GiacenzaAttuale || '0'),
        unit: item.UnitaMisura || 'pz',
        vatRate: parseFloat(item.AliquotaIva || '22'),
        isActive: item.Attivo !== false,
      }));
    } catch (error) {
      console.error('Danea get products failed:', error);
      throw error;
    }
  }

  async updateInventory(productId: string, quantity: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/products/${productId}/inventory`, {
        method: 'PUT',
        headers: {
          'X-API-KEY': this.integration.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ GiacenzaAttuale: quantity }),
      });
      return response.ok;
    } catch (error) {
      console.error('Danea update inventory failed:', error);
      return false;
    }
  }

  async createProduct(product: Partial<GestionaleProduct>): Promise<string> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.integration.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Codice: product.sku,
          Descrizione: product.name,
          DescrizioneEstesa: product.description,
          Categoria: product.category,
          Marca: product.brand,
          PrezzoVendita: product.price,
          CostoAcquisto: product.costPrice,
          GiacenzaAttuale: product.quantity || 0,
          UnitaMisura: product.unit || 'pz',
          AliquotaIva: product.vatRate || 22,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.Codice?.toString() || '';
      }
      throw new Error('Failed to create product');
    } catch (error) {
      console.error('Danea create product failed:', error);
      throw error;
    }
  }

  async updateProduct(productId: string, product: Partial<GestionaleProduct>): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'X-API-KEY': this.integration.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Descrizione: product.name,
          DescrizioneEstesa: product.description,
          Categoria: product.category,
          Marca: product.brand,
          PrezzoVendita: product.price,
          CostoAcquisto: product.costPrice,
          GiacenzaAttuale: product.quantity,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('Danea update product failed:', error);
      return false;
    }
  }
}

// TeamSystem Integration  
export class TeamSystemService extends BaseGestionaleService {
  private readonly BASE_URL = 'https://api.teamsystem.com';

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${this.integration.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('TeamSystem connection test failed:', error);
      return false;
    }
  }

  async getProducts(): Promise<GestionaleProduct[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/inventory/products`, {
        headers: {
          'Authorization': `Bearer ${this.integration.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return data.items?.map((item: any) => ({
        id: item.id?.toString(),
        name: item.name || '',
        description: item.description,
        category: item.category,
        brand: item.brand,
        sku: item.code,
        barcode: item.barcode,
        price: parseFloat(item.sellPrice || '0'),
        costPrice: parseFloat(item.buyPrice || '0'),
        quantity: parseInt(item.stock || '0'),
        unit: item.unitOfMeasure || 'pz',
        vatRate: parseFloat(item.vatPercentage || '22'),
        isActive: item.isActive !== false,
      })) || [];
    } catch (error) {
      console.error('TeamSystem get products failed:', error);
      throw error;
    }
  }

  async updateInventory(productId: string, quantity: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/inventory/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.integration.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock: quantity }),
      });
      return response.ok;
    } catch (error) {
      console.error('TeamSystem update inventory failed:', error);
      return false;
    }
  }

  async createProduct(product: Partial<GestionaleProduct>): Promise<string> {
    throw new Error('Create product not implemented for TeamSystem');
  }

  async updateProduct(productId: string, product: Partial<GestionaleProduct>): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/inventory/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.integration.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          sellPrice: product.price,
          buyPrice: product.costPrice,
          stock: product.quantity,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('TeamSystem update product failed:', error);
      return false;
    }
  }
}

// Factory Pattern per creare il servizio corretto
export function createGestionaleService(integration: Integration | any): BaseGestionaleService {
  const gestType = (integration as any)?.gestionaleType || (integration as any)?.type || '';
  switch (gestType) {
    case 'fattureincloud':
      return new FattureInCloudService(integration);
    case 'danea':
      return new DaneaService(integration);
    case 'teamsystem':
      return new TeamSystemService(integration);
    default:
      throw new Error(`Gestionale type ${gestType} not supported`);
  }
}