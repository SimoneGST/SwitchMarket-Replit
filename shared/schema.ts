import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type", { length: 20 }).notNull().default("customer"), // customer, merchant
  businessName: varchar("business_name"),
  vatNumber: varchar("vat_number"), // P.IVA
  taxCode: varchar("tax_code"), // Codice Fiscale
  businessAddress: text("business_address"),
  businessPhone: varchar("business_phone"),
  businessCategory: varchar("business_category"),
  businessDescription: text("business_description"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const requests = pgTable("requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  priceMin: decimal("price_min", { precision: 10, scale: 2 }),
  priceMax: decimal("price_max", { precision: 10, scale: 2 }),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  actionRadius: integer("action_radius").notNull().default(10), // km di raggio massimo SOLO per ritiro
  deliveryPreference: varchar("delivery_preference", { length: 20 }).default("both"), // pickup, delivery, both
  urgencyLevel: varchar("urgency_level", { length: 20 }).default("few_days"), // 24h, 48h, few_days (solo per delivery)
  status: varchar("status", { length: 20 }).notNull().default("open"), // open, negotiating, closed
  attributes: jsonb("attributes"), // Array of key-value pairs for product attributes
  keywords: text("keywords").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => requests.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  condition: varchar("condition", { length: 50 }), // new, excellent, good, fair, poor
  warranty: text("warranty"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, rejected, negotiating
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => requests.id),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  offerId: varchar("offer_id").references(() => offers.id),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 20 }).notNull().default("text"), // text, offer, system
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  requests: many(requests),
  offers: many(offers),
  sentMessages: many(messages),
  buyerConversations: many(conversations, { relationName: "buyerConversations" }),
  sellerConversations: many(conversations, { relationName: "sellerConversations" }),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  buyer: one(users, {
    fields: [requests.buyerId],
    references: [users.id],
  }),
  offers: many(offers),
  conversations: many(conversations),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  request: one(requests, {
    fields: [offers.requestId],
    references: [requests.id],
  }),
  seller: one(users, {
    fields: [offers.sellerId],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  request: one(requests, {
    fields: [conversations.requestId],
    references: [requests.id],
  }),
  buyer: one(users, {
    fields: [conversations.buyerId],
    references: [users.id],
    relationName: "buyerConversations",
  }),
  seller: one(users, {
    fields: [conversations.sellerId],
    references: [users.id],
    relationName: "sellerConversations",
  }),
  offer: one(offers, {
    fields: [conversations.offerId],
    references: [offers.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Gestionale Integration Schema
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gestionaleType: varchar("gestionale_type", { length: 50 }).notNull(), // 'fattureincloud', 'danea', 'zucchetti', 'teamsystem'
  apiKey: varchar("api_key").notNull(),
  companyId: varchar("company_id"),
  baseUrl: varchar("base_url"),
  isActive: boolean("is_active").default(true),
  syncFrequency: varchar("sync_frequency", { length: 20 }).default('daily'), // 'realtime', 'hourly', 'daily'
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  integrationId: integer("integration_id").references(() => integrations.id, { onDelete: "cascade" }),
  externalId: varchar("external_id"), // ID nel gestionale esterno
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  sku: varchar("sku", { length: 100 }),
  barcode: varchar("barcode", { length: 50 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  quantity: integer("quantity").default(0),
  minQuantity: integer("min_quantity").default(0),
  unit: varchar("unit", { length: 20 }).default('pz'), // pz, kg, lt, mq, etc
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default('22.00'),
  isActive: boolean("is_active").default(true),
  images: text("images").array(), // URLs delle immagini
  attributes: jsonb("attributes"), // Attributi personalizzati
  syncStatus: varchar("sync_status", { length: 20 }).default('synced'), // 'synced', 'pending', 'error'
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const syncLogs = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").notNull().references(() => integrations.id, { onDelete: "cascade" }),
  syncType: varchar("sync_type", { length: 50 }).notNull(), // 'products', 'inventory', 'orders'
  status: varchar("status", { length: 20 }).notNull(), // 'success', 'error', 'partial'
  recordsProcessed: integer("records_processed").default(0),
  recordsSuccess: integer("records_success").default(0),
  recordsError: integer("records_error").default(0),
  errorDetails: text("error_details"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Relations
export const integrationRelations = relations(integrations, ({ one, many }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
  products: many(products),
  syncLogs: many(syncLogs),
}));

export const productRelations = relations(products, ({ one }) => ({
  user: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
  integration: one(integrations, {
    fields: [products.integrationId],
    references: [integrations.id],
  }),
}));

export const syncLogRelations = relations(syncLogs, ({ one }) => ({
  integration: one(integrations, {
    fields: [syncLogs.integrationId],
    references: [integrations.id],
  }),
}));

// Copilot configurations table
export const copilotConfigs = pgTable("copilot_configs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  businessHours: jsonb("business_hours").default({
    monday: { enabled: true, start: "09:00", end: "18:00" },
    tuesday: { enabled: true, start: "09:00", end: "18:00" },
    wednesday: { enabled: true, start: "09:00", end: "18:00" },
    thursday: { enabled: true, start: "09:00", end: "18:00" },
    friday: { enabled: true, start: "09:00", end: "18:00" },
    saturday: { enabled: true, start: "09:00", end: "13:00" },
    sunday: { enabled: false, start: "09:00", end: "18:00" }
  }).notNull(),
  autoResponses: jsonb("auto_responses").default({
    greeting: "Ciao! Sono Leonardo, l'assistente di {businessName}. Come posso aiutarti oggi?",
    unavailable: "Al momento non sono disponibile. Ti risponderò appena possibile!",
    closing: "Grazie per averci contattato! Ti ricontatteremo presto."
  }).notNull(),
  maxConcurrentChats: integer("max_concurrent_chats").default(5).notNull(),
  responseDelay: integer("response_delay").default(2000).notNull(), // milliseconds
  personalitySettings: jsonb("personality_settings").default({
    tone: "professionale", // professionale, amichevole, informale
    expertise: "generale", // generale, tecnico, commerciale
    proactivity: "medio" // basso, medio, alto
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Copilot chat sessions table
export const copilotSessions = pgTable("copilot_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  customerId: varchar("customer_id").references(() => users.id).notNull(),
  requestId: integer("request_id").references(() => requests.id),
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, completed, transferred, abandoned
  isAiHandled: boolean("is_ai_handled").default(true).notNull(),
  handoverReason: text("handover_reason"),
  satisfaction: integer("satisfaction"), // 1-5 rating
  summary: text("summary"),
  totalMessages: integer("total_messages").default(0),
  aiMessages: integer("ai_messages").default(0),
  humanMessages: integer("human_messages").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Copilot analytics table
export const copilotAnalytics = pgTable("copilot_analytics", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  totalChats: integer("total_chats").default(0),
  completedChats: integer("completed_chats").default(0),
  transferredChats: integer("transferred_chats").default(0),
  averageResponseTime: integer("average_response_time").default(0), // seconds
  customerSatisfaction: decimal("customer_satisfaction", { precision: 3, scale: 2 }), // average rating
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0"),
  conversionsCount: integer("conversions_count").default(0),
});

// Types
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = typeof syncLogs.$inferInsert;

export type CopilotConfig = typeof copilotConfigs.$inferSelect;
export type InsertCopilotConfig = typeof copilotConfigs.$inferInsert;
export type CopilotSession = typeof copilotSessions.$inferSelect;
export type InsertCopilotSession = typeof copilotSessions.$inferInsert;
export type CopilotAnalytics = typeof copilotAnalytics.$inferSelect;
export type InsertCopilotAnalytics = typeof copilotAnalytics.$inferInsert;

export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
