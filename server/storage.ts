import {
  users,
  requests,
  offers,
  conversations,
  messages,
  integrations,
  products,
  syncLogs,
  copilotConfigs,
  copilotSessions,
  copilotAnalytics,
  type User,
  type UpsertUser,
  type Request,
  type InsertRequest,
  type Offer,
  type InsertOffer,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Integration,
  type InsertIntegration,
  type Product,
  type InsertProduct,
  type SyncLog,
  type InsertSyncLog,
  type CopilotConfig,
  type InsertCopilotConfig,
  type CopilotSession,
  type InsertCopilotSession,
  type CopilotAnalytics,
  type InsertCopilotAnalytics,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, profileData: any): Promise<User>;
  
  // Request operations
  createRequest(request: InsertRequest): Promise<Request>;
  getRequest(id: string): Promise<Request | undefined>;
  getRequests(filters?: {
    category?: string;
    location?: string;
    priceMin?: number;
    priceMax?: number;
    status?: string;
    search?: string;
  }): Promise<Request[]>;
  getUserRequests(userId: string): Promise<Request[]>;
  updateRequestStatus(id: string, status: string): Promise<void>;
  
  // Offer operations
  createOffer(offer: InsertOffer): Promise<Offer>;
  getRequestOffers(requestId: string): Promise<Offer[]>;
  updateOfferStatus(id: string, status: string): Promise<void>;
  
  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: string): Promise<Message[]>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;

  // Integration operations
  getIntegrationsByUserId(userId: string): Promise<Integration[]>;
  getIntegrationById(id: number): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: number, data: Partial<InsertIntegration>): Promise<void>;

  // Product operations
  getProductsByUserId(userId: string): Promise<Product[]>;
  getProductByExternalId(integrationId: number, externalId: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<void>;

  // Sync log operations
  createSyncLog(syncLog: InsertSyncLog): Promise<SyncLog>;

  // Copilot operations
  getCopilotConfig(userId: string): Promise<CopilotConfig | undefined>;
  createCopilotConfig(config: InsertCopilotConfig): Promise<CopilotConfig>;
  updateCopilotConfig(userId: string, data: Partial<InsertCopilotConfig>): Promise<void>;
  
  // Copilot session operations
  createCopilotSession(session: InsertCopilotSession): Promise<CopilotSession>;
  getCopilotSession(id: string): Promise<CopilotSession | undefined>;
  updateCopilotSession(id: string, data: Partial<InsertCopilotSession>): Promise<void>;
  getMerchantActiveSessions(merchantId: string): Promise<CopilotSession[]>;
  
  // Analytics operations
  getCopilotAnalytics(userId: string, date: string): Promise<CopilotAnalytics | undefined>;
  upsertCopilotAnalytics(analytics: InsertCopilotAnalytics): Promise<CopilotAnalytics>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, profileData: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Request operations
  async createRequest(request: InsertRequest): Promise<Request> {
    const [newRequest] = await db
      .insert(requests)
      .values({
        ...request,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      })
      .returning();
    return newRequest;
  }

  async getRequest(id: string): Promise<Request | undefined> {
    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    return request;
  }

  async getRequests(filters?: {
    category?: string;
    location?: string;
    priceMin?: number;
    priceMax?: number;
    status?: string;
    search?: string;
  }): Promise<Request[]> {
    let query = db.select().from(requests);
    
    const conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(requests.category, filters.category));
    }
    
    if (filters?.location) {
      conditions.push(like(requests.location, `%${filters.location}%`));
    }
    
    if (filters?.priceMin !== undefined) {
      conditions.push(sql`${requests.priceMin} >= ${filters.priceMin}`);
    }
    
    if (filters?.priceMax !== undefined) {
      conditions.push(sql`${requests.priceMax} <= ${filters.priceMax}`);
    }
    
    if (filters?.status) {
      conditions.push(eq(requests.status, filters.status));
    } else {
      conditions.push(eq(requests.status, 'open'));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          like(requests.title, `%${filters.search}%`),
          like(requests.description, `%${filters.search}%`),
          sql`${requests.keywords} && ARRAY[${filters.search}]`
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(requests.createdAt));
  }

  async getUserRequests(userId: string): Promise<Request[]> {
    return await db
      .select()
      .from(requests)
      .where(eq(requests.buyerId, userId))
      .orderBy(desc(requests.createdAt));
  }

  async updateRequestStatus(id: string, status: string): Promise<void> {
    await db
      .update(requests)
      .set({ status, updatedAt: new Date() })
      .where(eq(requests.id, id));
  }

  // Offer operations
  async createOffer(offer: InsertOffer): Promise<Offer> {
    const [newOffer] = await db.insert(offers).values(offer).returning();
    return newOffer;
  }

  async getRequestOffers(requestId: string): Promise<Offer[]> {
    return await db
      .select()
      .from(offers)
      .where(eq(offers.requestId, requestId))
      .orderBy(desc(offers.createdAt));
  }

  async updateOfferStatus(id: string, status: string): Promise<void> {
    await db
      .update(offers)
      .set({ status, updatedAt: new Date() })
      .where(eq(offers.id, id));
  }

  // Conversation operations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)))
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    
    // Update conversation's lastMessageAt
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));
    
    return newMessage;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          sql`${messages.senderId} != ${userId}`,
          eq(messages.isRead, false)
        )
      );
  }
  // Integration operations
  async getIntegrationsByUserId(userId: string): Promise<Integration[]> {
    return await db.select().from(integrations).where(eq(integrations.userId, userId));
  }

  async getIntegrationById(id: number): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(eq(integrations.id, id));
    return integration;
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [created] = await db.insert(integrations).values(integration).returning();
    return created;
  }

  async updateIntegration(id: number, data: Partial<InsertIntegration>): Promise<void> {
    await db.update(integrations).set(data).where(eq(integrations.id, id));
  }

  // Product operations
  async getProductsByUserId(userId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.userId, userId));
  }

  async getProductByExternalId(integrationId: number, externalId: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(
      and(
        eq(products.integrationId, integrationId),
        eq(products.externalId, externalId)
      )
    );
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<void> {
    await db.update(products).set(data).where(eq(products.id, id));
  }

  // Sync log operations
  async createSyncLog(syncLog: InsertSyncLog): Promise<SyncLog> {
    const [created] = await db.insert(syncLogs).values(syncLog).returning();
    return created;
  }

  // Copilot operations
  async getCopilotConfig(userId: string): Promise<CopilotConfig | undefined> {
    const [config] = await db.select().from(copilotConfigs).where(eq(copilotConfigs.userId, userId));
    return config;
  }

  async createCopilotConfig(config: InsertCopilotConfig): Promise<CopilotConfig> {
    const [created] = await db.insert(copilotConfigs).values(config).returning();
    return created;
  }

  async updateCopilotConfig(userId: string, data: Partial<InsertCopilotConfig>): Promise<void> {
    await db.update(copilotConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(copilotConfigs.userId, userId));
  }

  // Copilot session operations
  async createCopilotSession(session: InsertCopilotSession): Promise<CopilotSession> {
    const [created] = await db.insert(copilotSessions).values(session).returning();
    return created;
  }

  async getCopilotSession(id: string): Promise<CopilotSession | undefined> {
    const [session] = await db.select().from(copilotSessions).where(eq(copilotSessions.id, id));
    return session;
  }

  async updateCopilotSession(id: string, data: Partial<InsertCopilotSession>): Promise<void> {
    await db.update(copilotSessions).set(data).where(eq(copilotSessions.id, id));
  }

  async getMerchantActiveSessions(merchantId: string): Promise<CopilotSession[]> {
    return await db.select().from(copilotSessions)
      .where(and(
        eq(copilotSessions.merchantId, merchantId),
        eq(copilotSessions.status, 'active')
      ));
  }

  // Analytics operations
  async getCopilotAnalytics(userId: string, date: string): Promise<CopilotAnalytics | undefined> {
    const [analytics] = await db.select().from(copilotAnalytics)
      .where(and(
        eq(copilotAnalytics.userId, userId),
        eq(copilotAnalytics.date, date)
      ));
    return analytics;
  }

  async upsertCopilotAnalytics(analytics: InsertCopilotAnalytics): Promise<CopilotAnalytics> {
    const [upserted] = await db.insert(copilotAnalytics)
      .values(analytics)
      .onConflictDoUpdate({
        target: [copilotAnalytics.userId, copilotAnalytics.date],
        set: analytics
      })
      .returning();
    return upserted;
  }
}

export const storage = new DatabaseStorage();
