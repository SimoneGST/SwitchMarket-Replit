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
  userType: varchar("user_type", { length: 20 }).default("customer"), // customer, merchant
  phone: varchar("phone"),
  address: varchar("address"),
  city: varchar("city"),
  postalCode: varchar("postal_code"),
  // Campi per negozianti
  businessName: varchar("business_name"),
  businessType: varchar("business_type"),
  partitaIva: varchar("partita_iva"), // P.IVA
  codiceFiscale: varchar("codice_fiscale"), // Codice Fiscale
  businessAddress: varchar("business_address"),
  businessCity: varchar("business_city"),
  businessPostalCode: varchar("business_postal_code"),
  businessDescription: text("business_description"),
  businessWebsite: varchar("business_website"),
  businessHours: text("business_hours"),
  profileVerified: boolean("profile_verified").default(false),
  pivaVerified: boolean("piva_verified").default(false),
  cfVerified: boolean("cf_verified").default(false),
  verificationDocuments: jsonb("verification_documents"), // Array of document URLs
  copilotConfig: jsonb("copilot_config"), // Leonardo AI settings
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

// Tabella prodotti per negozianti
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  condition: varchar("condition", { length: 50 }).notNull(), // new, excellent, good, fair, poor
  stock: integer("stock").notNull().default(1),
  images: text("images").array(), // Array of image URLs
  attributes: jsonb("attributes"), // Product specifications
  keywords: text("keywords").array(),
  isActive: boolean("is_active").default(true),
  sku: varchar("sku"), // Stock Keeping Unit
  weight: decimal("weight", { precision: 8, scale: 3 }), // in kg
  dimensions: jsonb("dimensions"), // { length, width, height }
  warranty: text("warranty"),
  brand: varchar("brand"),
  model: varchar("model"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabella collegamenti gestionali
export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // fatture_cloud, danea, teamsystem
  name: varchar("name").notNull(),
  apiKey: varchar("api_key"),
  apiSecret: varchar("api_secret"),
  endpoint: varchar("endpoint"),
  isActive: boolean("is_active").default(true),
  config: jsonb("config"), // Integration-specific settings
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabella configurazioni copilot Leonardo
export const copilotConfigs = pgTable("copilot_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  personality: text("personality").notNull().default("Professionale e cordiale"),
  autonomyLevel: varchar("autonomy_level", { length: 20 }).default("medium"), // low, medium, high
  autoRespond: boolean("auto_respond").default(false),
  businessHours: jsonb("business_hours"), // { start, end, days }
  templates: jsonb("templates"), // Pre-defined response templates
  escalationRules: jsonb("escalation_rules"), // When to escalate to human
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  requests: many(requests),
  offers: many(offers),
  sentMessages: many(messages),
  buyerConversations: many(conversations, { relationName: "buyerConversations" }),
  sellerConversations: many(conversations, { relationName: "sellerConversations" }),
  products: many(products),
  integrations: many(integrations),
  copilotConfig: one(copilotConfigs),
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

export const productsRelations = relations(products, ({ one }) => ({
  seller: one(users, {
    fields: [products.sellerId],
    references: [users.id],
  }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  seller: one(users, {
    fields: [integrations.sellerId],
    references: [users.id],
  }),
}));

export const copilotConfigsRelations = relations(copilotConfigs, ({ one }) => ({
  seller: one(users, {
    fields: [copilotConfigs.sellerId],
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

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCopilotConfigSchema = createInsertSchema(copilotConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type CopilotConfig = typeof copilotConfigs.$inferSelect;

// Copilot chat sessions table
export const copilotSessions = pgTable("copilot_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  customerId: varchar("customer_id").references(() => users.id).notNull(),
  requestId: varchar("request_id").references(() => requests.id),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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

// Copilot events (fine-grained telemetry for suggestions/actions)
export const copilotEvents = pgTable("copilot_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // suggestionAccepted, suggestionRejected, suggestionModified, suggestionClarifyRequested, autofillApplied, etc.
  suggestionId: varchar("suggestion_id"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
