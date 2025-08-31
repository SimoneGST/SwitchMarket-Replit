import {
  users,
  requests,
  offers,
  conversations,
  messages,
  integrations,
  products,
  copilotConfigs,
  copilotSessions,
  copilotAnalytics,
  copilotEvents,
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
  type Product,
  type CopilotConfig,
} from "@shared/schema";
// Import del DB solo quando necessario per evitare errori in assenza di DATABASE_URL
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

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
  getIntegrationById(id: string): Promise<Integration | undefined>;
  createIntegration(integration: any): Promise<Integration>;
  updateIntegration(id: string, data: any): Promise<void>;

  // Product operations
  getProductsByUserId(userId: string): Promise<Product[]>;
  getProductByExternalId(integrationId: string, externalId: string): Promise<Product | undefined>;
  createProduct(product: any): Promise<Product>;
  updateProduct(id: string, data: any): Promise<void>;

  // Sync log operations
  createSyncLog(syncLog: any): Promise<any>;

  // Copilot operations
  getCopilotConfig(userId: string): Promise<CopilotConfig | undefined>;
  createCopilotConfig(config: any): Promise<CopilotConfig>;
  updateCopilotConfig(userId: string, data: any): Promise<void>;
  
  // Copilot session operations
  createCopilotSession(session: any): Promise<any>;
  getCopilotSession(id: string): Promise<any | undefined>;
  updateCopilotSession(id: string, data: any): Promise<void>;
  getMerchantActiveSessions(merchantId: string): Promise<any[]>;
  
  // Analytics operations
  getCopilotAnalytics(userId: string, date: string): Promise<any | undefined>;
  upsertCopilotAnalytics(analytics: any): Promise<any>;
  // Event-level telemetry
  createCopilotEvent(event: { userId: string; eventType: string; suggestionId?: string | null; payload?: any }): Promise<any>;
  getCopilotEvents(userId: string, opts?: { from?: string; to?: string; eventType?: string }): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  private async getDb() {
    const { db } = await import("./db");
    return db;
  }
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const db = await this.getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
  const db = await this.getDb();
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
  const db = await this.getDb();
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
  const db = await this.getDb();
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
  const db = await this.getDb();
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
    merchantLat?: number;
    merchantLng?: number;
    merchantLocation?: string;
  }): Promise<Request[]> {
  const db = await this.getDb();
  console.log('🔍 Filtri ricevuti:', filters);
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
    
    let allRequests: Request[];
    if (conditions.length > 0) {
  allRequests = await db.select().from(requests)
        .where(and(...conditions))
        .orderBy(desc(requests.createdAt));
    } else {
  allRequests = await db.select().from(requests)
        .orderBy(desc(requests.createdAt));
    }
    
    // Se sono fornite coordinate del negoziante, filtra per raggio d'azione
    if (filters?.merchantLat && filters?.merchantLng) {
      return allRequests.filter(request => {
        if (!request.latitude || !request.longitude) return false;
        
        const distance = this.calculateDistance(
          filters.merchantLat!,
          filters.merchantLng!,
          parseFloat(request.latitude),
          parseFloat(request.longitude)
        );
        
        console.log(`📍 Distanza ${request.title}: ${distance.toFixed(2)}km (max: ${request.actionRadius}km)`);
        return distance <= request.actionRadius;
      });
    }

    return allRequests;
  }

  async getUserRequests(userId: string): Promise<Request[]> {
  const db = await this.getDb();
  return await db
      .select()
      .from(requests)
      .where(eq(requests.buyerId, userId))
      .orderBy(desc(requests.createdAt));
  }

  async updateRequestStatus(id: string, status: string): Promise<void> {
  const db = await this.getDb();
  await db
      .update(requests)
      .set({ status, updatedAt: new Date() })
      .where(eq(requests.id, id));
  }

  // Offer operations
  async createOffer(offer: InsertOffer): Promise<Offer> {
  const db = await this.getDb();
  const [newOffer] = await db.insert(offers).values(offer).returning();
    return newOffer;
  }

  async getRequestOffers(requestId: string): Promise<Offer[]> {
  const db = await this.getDb();
  return await db
      .select()
      .from(offers)
      .where(eq(offers.requestId, requestId))
      .orderBy(desc(offers.createdAt));
  }

  async updateOfferStatus(id: string, status: string): Promise<void> {
  const db = await this.getDb();
  await db
      .update(offers)
      .set({ status, updatedAt: new Date() })
      .where(eq(offers.id, id));
  }

  // Calcola distanza in km usando formula di Haversine
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Raggio della Terra in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  // Conversation operations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
  const db = await this.getDb();
  const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
  const db = await this.getDb();
  return await db
      .select()
      .from(conversations)
      .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)))
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
  const db = await this.getDb();
  const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
  const db = await this.getDb();
  const [newMessage] = await db.insert(messages).values(message).returning();
    
    // Update conversation's lastMessageAt
  await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));
    
    return newMessage;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
  const db = await this.getDb();
  return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  const db = await this.getDb();
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
    const db = await this.getDb();
    return await db.select().from(integrations).where(eq(integrations.sellerId, userId));
  }

  async getIntegrationById(id: string): Promise<Integration | undefined> {
    const db = await this.getDb();
    const [integration] = await db.select().from(integrations).where(eq(integrations.id, id));
    return integration;
  }

  async createIntegration(integration: any): Promise<Integration> {
    const db = await this.getDb();
    const [created] = await db.insert(integrations).values(integration).returning();
    return created;
  }

  async updateIntegration(id: string, data: any): Promise<void> {
    const db = await this.getDb();
    await db.update(integrations).set(data).where(eq(integrations.id, id));
  }

  // Product operations
  async getProductsByUserId(userId: string): Promise<Product[]> {
    const db = await this.getDb();
    return await db.select().from(products).where(eq(products.sellerId, userId));
  }

  async getProductByExternalId(_integrationId: string, _externalId: string): Promise<Product | undefined> {
    // Campo non presente nello schema corrente: ritorna undefined
    return undefined;
  }

  async createProduct(product: any): Promise<Product> {
    const db = await this.getDb();
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: string, data: any): Promise<void> {
    const db = await this.getDb();
    await db.update(products).set(data).where(eq(products.id, id));
  }

  // Sync log operations
  async createSyncLog(_syncLog: any): Promise<any> {
    // Tabella non definita nello schema corrente
    return { id: nanoid(), ..._syncLog };
  }

  // Copilot operations
  async getCopilotConfig(userId: string): Promise<CopilotConfig | undefined> {
    const db = await this.getDb();
    const [config] = await db.select().from(copilotConfigs).where(eq(copilotConfigs.sellerId, userId));
    return config;
  }

  async createCopilotConfig(config: any): Promise<CopilotConfig> {
    const db = await this.getDb();
    const [created] = await db.insert(copilotConfigs).values(config).returning();
    return created;
  }

  async updateCopilotConfig(userId: string, data: any): Promise<void> {
    const db = await this.getDb();
    await db.update(copilotConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(copilotConfigs.sellerId, userId));
  }

  // Copilot session operations
  async createCopilotSession(session: any): Promise<any> {
    const db = await this.getDb();
    const [created] = await db.insert(copilotSessions).values(session).returning();
    return created;
  }

  async getCopilotSession(id: string): Promise<any | undefined> {
    const db = await this.getDb();
    const [session] = await db.select().from(copilotSessions).where(eq(copilotSessions.id, id));
    return session as any;
  }

  async updateCopilotSession(id: string, data: any): Promise<void> {
    const db = await this.getDb();
    await db.update(copilotSessions).set(data).where(eq(copilotSessions.id, id));
  }

  async getMerchantActiveSessions(merchantId: string): Promise<any[]> {
    const db = await this.getDb();
    return await db.select().from(copilotSessions)
      .where(and(
        eq(copilotSessions.merchantId, merchantId),
        eq(copilotSessions.status, 'active')
      )) as any[];
  }

  // Analytics operations
  async getCopilotAnalytics(userId: string, date: string): Promise<any | undefined> {
    const db = await this.getDb();
    const [analytics] = await db.select().from(copilotAnalytics)
      .where(and(
        eq(copilotAnalytics.userId, userId),
        eq(copilotAnalytics.date, date)
      ));
    return analytics as any;
  }

  async upsertCopilotAnalytics(analytics: any): Promise<any> {
    const db = await this.getDb();
    const [upserted] = await db.insert(copilotAnalytics)
      .values(analytics)
      .onConflictDoUpdate({
        target: [copilotAnalytics.userId, copilotAnalytics.date],
        set: analytics
      })
      .returning();
    return upserted as any;
  }

  // Event operations
  async createCopilotEvent(event: { userId: string; eventType: string; suggestionId?: string | null; payload?: any }): Promise<any> {
    const db = await this.getDb();
    try {
      const [created] = await db.insert(copilotEvents).values({
        userId: event.userId,
        eventType: event.eventType,
        suggestionId: event.suggestionId || null,
        payload: event.payload || null,
      }).returning();
      return created;
    } catch (err) {
      // If DB insert fails (dev), fall back to in-memory store
      this as any; // noop to satisfy TS in patching context
      const ev = { id: `local-${Date.now()}`, userId: event.userId, eventType: event.eventType, suggestionId: event.suggestionId || null, payload: event.payload || null, createdAt: new Date().toISOString() };
      (this as any)._copilotEvents = (this as any)._copilotEvents || [];
      (this as any)._copilotEvents.push(ev);
      return ev;
    }
  }

  async getCopilotEvents(userId: string, opts: { from?: string; to?: string; eventType?: string } = {}): Promise<any[]> {
    const db = await this.getDb();
    try {
      const rows = await db.select().from(copilotEvents).where(eq(copilotEvents.userId, userId));
      return rows as any[];
    } catch (err) {
      return (this as any)._copilotEvents ? (this as any)._copilotEvents.filter((e: any) => e.userId === userId) : [];
    }
  }
}

// In-memory fallback storage for local development without a DB
class MemoryStorage implements IStorage {
  private _users: any[] = [];
  private _requests: any[] = [];
  private _offers: any[] = [];
  private _conversations: any[] = [];
  private _messages: any[] = [];
  private _integrations: any[] = [];
  private _products: any[] = [];
  private _copilotConfigs: any[] = [];
  private _copilotSessions: any[] = [];
  private _copilotAnalytics: any[] = [];
  private _copilotEvents: any[] = [];

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this._users.find(u => u.id === id);
  }
  async upsertUser(user: UpsertUser): Promise<User> {
    const existing = this._users.find(u => u.id === user.id);
    if (existing) {
      Object.assign(existing, user, { updatedAt: new Date() });
      return existing as User;
    }
    const created = { ...user, createdAt: new Date(), updatedAt: new Date() } as any;
    this._users.push(created);
    return created as User;
  }
  async updateUserProfile(id: string, profileData: any): Promise<User> {
    const u = this._users.find(u => u.id === id);
    if (!u) throw new Error('User not found');
    Object.assign(u, profileData, { updatedAt: new Date() });
    return u as User;
  }

  // Requests
  async createRequest(request: InsertRequest): Promise<Request> {
    const item: any = {
      id: nanoid(),
      ...request,
      status: request?.status ?? 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    this._requests.push(item);
    return item as Request;
  }
  async getRequest(id: string): Promise<Request | undefined> {
    return this._requests.find(r => r.id === id);
  }
  async getRequests(filters?: any): Promise<Request[]> {
    let items = [...this._requests];
    if (filters?.category) items = items.filter(r => r.category === filters.category);
    if (filters?.location) items = items.filter(r => (r.location || '').toLowerCase().includes(String(filters.location).toLowerCase()));
    if (filters?.priceMin != null) items = items.filter(r => !r.priceMin || Number(r.priceMin) >= Number(filters.priceMin));
    if (filters?.priceMax != null) items = items.filter(r => !r.priceMax || Number(r.priceMax) <= Number(filters.priceMax));
    if (filters?.status) items = items.filter(r => r.status === filters.status); else items = items.filter(r => r.status === 'open');
    if (filters?.search) {
      const s = String(filters.search).toLowerCase();
      items = items.filter(r => (r.title || '').toLowerCase().includes(s) || (r.description || '').toLowerCase().includes(s));
    }
    // Optional geo filter by merchant location if provided
    if (filters?.merchantLat != null && filters?.merchantLng != null) {
      // naive: keep as-is (no geo calculation in memory mode)
    }
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as Request[];
  }
  async getUserRequests(userId: string): Promise<Request[]> {
    return this._requests.filter(r => r.buyerId === userId) as Request[];
  }
  async updateRequestStatus(id: string, status: string): Promise<void> {
    const r = this._requests.find(r => r.id === id);
    if (r) { r.status = status; r.updatedAt = new Date(); }
  }

  // Offers
  async createOffer(offer: InsertOffer): Promise<Offer> {
    const o: any = { id: nanoid(), ...offer, createdAt: new Date(), updatedAt: new Date() };
    this._offers.push(o);
    return o as Offer;
  }
  async getRequestOffers(requestId: string): Promise<Offer[]> {
    return this._offers.filter(o => o.requestId === requestId) as Offer[];
  }
  async updateOfferStatus(id: string, status: string): Promise<void> {
    const o = this._offers.find(o => o.id === id);
    if (o) { o.status = status; o.updatedAt = new Date(); }
  }

  // Conversations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const c: any = { id: nanoid(), lastMessageAt: new Date(), createdAt: new Date(), ...conversation };
    this._conversations.push(c);
    return c as Conversation;
  }
  async getUserConversations(userId: string): Promise<Conversation[]> {
    return this._conversations.filter(c => c.buyerId === userId || c.sellerId === userId) as Conversation[];
  }
  async getConversation(id: string): Promise<Conversation | undefined> {
    return this._conversations.find(c => c.id === id) as Conversation | undefined;
  }

  // Messages
  async createMessage(message: InsertMessage): Promise<Message> {
    const m: any = { id: nanoid(), createdAt: new Date(), isRead: false, ...message };
    this._messages.push(m);
    const c = this._conversations.find(c => c.id === message.conversationId);
    if (c) c.lastMessageAt = new Date();
    return m as Message;
  }
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return this._messages.filter(m => m.conversationId === conversationId) as Message[];
  }
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    this._messages.forEach(m => { if (m.conversationId === conversationId && m.senderId !== userId) m.isRead = true; });
  }

  // Integrations
  async getIntegrationsByUserId(userId: string): Promise<Integration[]> {
    return this._integrations.filter(i => i.sellerId === userId) as Integration[];
  }
  async getIntegrationById(id: any): Promise<Integration | undefined> {
    return this._integrations.find(i => i.id === id) as Integration | undefined;
  }
  async createIntegration(integration: any): Promise<Integration> {
    const item: any = { id: nanoid(), createdAt: new Date(), updatedAt: new Date(), ...integration };
    this._integrations.push(item);
    return item as Integration;
  }
  async updateIntegration(id: any, data: any): Promise<void> {
    const it = this._integrations.find(i => i.id === id);
    if (it) Object.assign(it, data, { updatedAt: new Date() });
  }

  // Products
  async getProductsByUserId(userId: string): Promise<Product[]> {
    return this._products.filter(p => p.userId === userId) as Product[];
  }
  async getProductByExternalId(integrationId: any, externalId: string): Promise<Product | undefined> {
    return this._products.find(p => p.integrationId === integrationId && p.externalId === externalId) as Product | undefined;
  }
  async createProduct(product: any): Promise<Product> {
    const item: any = { id: nanoid(), createdAt: new Date(), updatedAt: new Date(), ...product };
    this._products.push(item);
    return item as Product;
  }
  async updateProduct(id: any, data: any): Promise<void> {
    const p = this._products.find(p => p.id === id);
    if (p) Object.assign(p, data, { updatedAt: new Date() });
  }

  // Sync log
  async createSyncLog(_syncLog: any): Promise<any> {
    return { id: nanoid(), ..._syncLog };
  }

  // Copilot config
  async getCopilotConfig(userId: string): Promise<CopilotConfig | undefined> {
    return this._copilotConfigs.find(c => c.sellerId === userId) as CopilotConfig | undefined;
  }
  async createCopilotConfig(config: any): Promise<CopilotConfig> {
    const item: any = { id: nanoid(), createdAt: new Date(), updatedAt: new Date(), ...config };
    this._copilotConfigs.push(item);
    return item as CopilotConfig;
  }
  async updateCopilotConfig(userId: string, data: any): Promise<void> {
    const c = this._copilotConfigs.find(c => c.sellerId === userId);
    if (c) Object.assign(c, data, { updatedAt: new Date() });
  }

  // Copilot sessions
  async createCopilotSession(session: any): Promise<any> {
    const item: any = { id: nanoid(), createdAt: new Date(), ...session };
    this._copilotSessions.push(item);
    return item;
  }
  async getCopilotSession(id: string): Promise<any | undefined> {
    return this._copilotSessions.find(s => s.id === id);
  }
  async updateCopilotSession(id: string, data: any): Promise<void> {
    const s = this._copilotSessions.find(s => s.id === id);
    if (s) Object.assign(s, data);
  }
  async getMerchantActiveSessions(merchantId: string): Promise<any[]> {
    return this._copilotSessions.filter(s => s.merchantId === merchantId && s.status === 'active');
  }

  // Analytics
  async getCopilotAnalytics(userId: string, date: string): Promise<any | undefined> {
    return this._copilotAnalytics.find(a => a.userId === userId && a.date === date);
  }
  async upsertCopilotAnalytics(analytics: any): Promise<any> {
    const existing = this._copilotAnalytics.find(a => a.userId === analytics.userId && a.date === analytics.date);
    if (existing) { Object.assign(existing, analytics); return existing; }
    const item = { id: nanoid(), ...analytics };
    this._copilotAnalytics.push(item);
    return item;
  }

  // Events (in-memory)
  async createCopilotEvent(event: { userId: string; eventType: string; suggestionId?: string | null; payload?: any }): Promise<any> {
    const ev = { id: nanoid(), userId: event.userId, eventType: event.eventType, suggestionId: event.suggestionId || null, payload: event.payload || null, createdAt: new Date() };
    this._copilotEvents.push(ev);
    return ev;
  }

  async getCopilotEvents(userId: string, opts: { from?: string; to?: string; eventType?: string } = {}): Promise<any[]> {
    return this._copilotEvents.filter(e => e.userId === userId && (!opts.eventType || e.eventType === opts.eventType));
  }
}

// Firestore-backed storage for copilot events (fallback when running on Firebase)
import admin from 'firebase-admin';

class FirestoreStorage implements IStorage {
  private db: admin.firestore.Firestore | null = null;
  private enabled: boolean = false;
  constructor() {
    // Only initialize Firebase Admin if emulator or credentials are available.
    // Otherwise fall back to in-memory storage to keep local development working.
    try {
      const hasEmulator = typeof process.env.FIRESTORE_EMULATOR_HOST !== 'undefined' && process.env.FIRESTORE_EMULATOR_HOST !== '';
      const hasCreds = typeof process.env.GOOGLE_APPLICATION_CREDENTIALS !== 'undefined' && process.env.GOOGLE_APPLICATION_CREDENTIALS !== '';

      if (!admin.apps.length && (hasEmulator || hasCreds)) {
        admin.initializeApp();
      }

      // If admin was initialized (or already was), set up firestore client
      if (admin.apps.length) {
        this.db = admin.firestore();
        this.enabled = true;
      } else {
        // leave db null and use fallback memory storage
        this.db = null;
        this.enabled = false;
      }
    } catch (e) {
      // If any error occurs, disable Firestore usage and fall back
      console.warn('Firestore init failed, using in-memory fallback for copilot events:', String(e));
      this.db = null;
      this.enabled = false;
    }
  }

  // Implement only the copilot event methods used by server; delegate others to MemoryStorage
  private fallback = new MemoryStorage();

  async createCopilotEvent(event: { userId: string; eventType: string; suggestionId?: string | null; payload?: any }): Promise<any> {
    if (!this.enabled || !this.db) {
      // Firestore not available in this environment: delegate to in-memory fallback
      return this.fallback.createCopilotEvent(event);
    }
    const doc = {
      userId: event.userId,
      eventType: event.eventType,
      suggestionId: event.suggestionId || null,
      payload: event.payload || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    } as any;
    const ref = await this.db.collection('copilot_events').add(doc);
    const snap = await ref.get();
    return { id: ref.id, ...(snap.data() || {}) };
  }

  async getCopilotEvents(userId: string, opts: { from?: string; to?: string; eventType?: string } = {}): Promise<any[]> {
    if (!this.enabled || !this.db) {
      return this.fallback.getCopilotEvents(userId, opts);
    }
    let q: FirebaseFirestore.Query = this.db.collection('copilot_events').where('userId', '==', userId).orderBy('createdAt', 'desc');
    if (opts.eventType) q = q.where('eventType', '==', opts.eventType);
    if (opts.from) q = q.where('createdAt', '>=', new Date(opts.from));
    if (opts.to) q = q.where('createdAt', '<=', new Date(opts.to));
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }

  // delegate other methods to in-memory fallback to keep behavior safe
  // ... only minimal delegation is implemented below
  async getUser(id: string) { return this.fallback.getUser(id); }
  async upsertUser(user: UpsertUser) { return this.fallback.upsertUser(user); }
  async updateUserProfile(id: string, profileData: any) { return this.fallback.updateUserProfile(id, profileData); }
  async createRequest(request: InsertRequest) { return this.fallback.createRequest(request); }
  async getRequest(id: string) { return this.fallback.getRequest(id); }
  async getRequests(filters?: any) { return this.fallback.getRequests(filters); }
  async getUserRequests(userId: string) { return this.fallback.getUserRequests(userId); }
  async updateRequestStatus(id: string, status: string) { return this.fallback.updateRequestStatus(id, status); }
  async createOffer(offer: InsertOffer) { return this.fallback.createOffer(offer); }
  async getRequestOffers(requestId: string) { return this.fallback.getRequestOffers(requestId); }
  async updateOfferStatus(id: string, status: string) { return this.fallback.updateOfferStatus(id, status); }
  async createConversation(conversation: InsertConversation) { return this.fallback.createConversation(conversation); }
  async getUserConversations(userId: string) { return this.fallback.getUserConversations(userId); }
  async getConversation(id: string) { return this.fallback.getConversation(id); }
  async createMessage(message: InsertMessage) { return this.fallback.createMessage(message); }
  async getConversationMessages(conversationId: string) { return this.fallback.getConversationMessages(conversationId); }
  async markMessagesAsRead(conversationId: string, userId: string) { return this.fallback.markMessagesAsRead(conversationId, userId); }
  async getIntegrationsByUserId(userId: string) { return this.fallback.getIntegrationsByUserId(userId); }
  async getIntegrationById(id: string) { return this.fallback.getIntegrationById(id); }
  async createIntegration(integration: any) { return this.fallback.createIntegration(integration); }
  async updateIntegration(id: string, data: any) { return this.fallback.updateIntegration(id, data); }
  async getProductsByUserId(userId: string) { return this.fallback.getProductsByUserId(userId); }
  async getProductByExternalId(integrationId: string, externalId: string) { return this.fallback.getProductByExternalId(integrationId, externalId); }
  async createProduct(product: any) { return this.fallback.createProduct(product); }
  async updateProduct(id: string, data: any) { return this.fallback.updateProduct(id, data); }
  async createSyncLog(syncLog: any) { return this.fallback.createSyncLog(syncLog); }
  async getCopilotConfig(userId: string) { return this.fallback.getCopilotConfig(userId); }
  async createCopilotConfig(config: any) { return this.fallback.createCopilotConfig(config); }
  async updateCopilotConfig(userId: string, data: any) { return this.fallback.updateCopilotConfig(userId, data); }
  async createCopilotSession(session: any) { return this.fallback.createCopilotSession(session); }
  async getCopilotSession(id: string) { return this.fallback.getCopilotSession(id); }
  async updateCopilotSession(id: string, data: any) { return this.fallback.updateCopilotSession(id, data); }
  async getMerchantActiveSessions(merchantId: string) { return this.fallback.getMerchantActiveSessions(merchantId); }
  async getCopilotAnalytics(userId: string, date: string) { return this.fallback.getCopilotAnalytics(userId, date); }
  async upsertCopilotAnalytics(analytics: any) { return this.fallback.upsertCopilotAnalytics(analytics); }
}

// Choose storage: if USE_FIRESTORE=true then use FirestoreStorage; else DatabaseStorage (if DATABASE_URL) or MemoryStorage
export const storage: IStorage = process.env.USE_FIRESTORE === 'true' ? new FirestoreStorage() : (process.env.DATABASE_URL ? new DatabaseStorage() : new MemoryStorage());
