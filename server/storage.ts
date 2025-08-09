import {
  users,
  requests,
  offers,
  conversations,
  messages,
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
}

export const storage = new DatabaseStorage();
