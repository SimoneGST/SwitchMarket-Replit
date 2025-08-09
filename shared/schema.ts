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
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
