import { Integration, Product, InsertProduct, SyncLog, InsertSyncLog } from "@shared/schema";
import { BaseGestionaleService, GestionaleProduct } from "./gestionaleService";
import { DatabaseStorage } from "../storage";

export async function syncIntegrationProducts(
  integration: Integration,
  gestionaleService: BaseGestionaleService,
  storage: DatabaseStorage
): Promise<SyncLog> {
  const startTime = new Date();
  let recordsProcessed = 0;
  let recordsSuccess = 0;
  let recordsError = 0;
  const errors: string[] = [];

  try {
    // Test connection first
    const isConnected = await gestionaleService.testConnection();
    if (!isConnected) {
      throw new Error("Unable to connect to gestionale");
    }

    // Fetch products from gestionale
    const gestionaleProducts = await gestionaleService.getProducts();
    recordsProcessed = gestionaleProducts.length;

    // Process each product
    for (const gestionaleProduct of gestionaleProducts) {
      try {
        await syncSingleProduct(gestionaleProduct, integration, storage);
        recordsSuccess++;
      } catch (error) {
        recordsError++;
        errors.push(`Product ${gestionaleProduct.id}: ${error}`);
        console.error(`Error syncing product ${gestionaleProduct.id}:`, error);
      }
    }

    // Update integration last sync time
    await storage.updateIntegration(integration.id, {
      lastSync: new Date(),
      updatedAt: new Date(),
    });

    // Log sync results
    const syncLog: InsertSyncLog = {
      integrationId: integration.id,
      syncType: 'products',
      status: recordsError === 0 ? 'success' : recordsError < recordsProcessed ? 'partial' : 'error',
      recordsProcessed,
      recordsSuccess,
      recordsError,
      errorDetails: errors.length > 0 ? errors.join('\n') : null,
      startedAt: startTime,
      completedAt: new Date(),
    };

    return await storage.createSyncLog(syncLog);

  } catch (error) {
    console.error("Sync failed:", error);
    
    const syncLog: InsertSyncLog = {
      integrationId: integration.id,
      syncType: 'products',
      status: 'error',
      recordsProcessed,
      recordsSuccess,
      recordsError: recordsProcessed,
      errorDetails: `Sync failed: ${error}`,
      startedAt: startTime,
      completedAt: new Date(),
    };

    return await storage.createSyncLog(syncLog);
  }
}

async function syncSingleProduct(
  gestionaleProduct: GestionaleProduct,
  integration: Integration,
  storage: DatabaseStorage
): Promise<void> {
  // Check if product already exists
  const existingProduct = await storage.getProductByExternalId(
    integration.id, 
    gestionaleProduct.id
  );

  const productData: InsertProduct = {
    userId: integration.userId,
    integrationId: integration.id,
    externalId: gestionaleProduct.id,
    name: gestionaleProduct.name,
    description: gestionaleProduct.description,
    category: gestionaleProduct.category,
    brand: gestionaleProduct.brand,
    sku: gestionaleProduct.sku,
    barcode: gestionaleProduct.barcode,
    price: gestionaleProduct.price.toString(),
    costPrice: gestionaleProduct.costPrice?.toString(),
    quantity: gestionaleProduct.quantity,
    unit: gestionaleProduct.unit || 'pz',
    vatRate: gestionaleProduct.vatRate?.toString() || '22.00',
    isActive: gestionaleProduct.isActive !== false,
    images: gestionaleProduct.images,
    attributes: gestionaleProduct.attributes,
    syncStatus: 'synced',
    lastSyncAt: new Date(),
    updatedAt: new Date(),
  };

  if (existingProduct) {
    // Update existing product
    await storage.updateProduct(existingProduct.id, productData);
  } else {
    // Create new product
    await storage.createProduct(productData);
  }
}