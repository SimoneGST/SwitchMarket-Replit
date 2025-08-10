import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  User,
  Request,
  Offer,
  Conversation,
  Message,
  Product,
  Integration,
  CopilotConfig,
  CopilotSession,
} from "@shared/schema";

// User operations
export const users = {
  async get(id: string): Promise<User | null> {
    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as User) : null;
  },

  async create(userData: Partial<User>): Promise<User> {
    const docRef = doc(db, "users", userData.id!);
    const user = {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await updateDoc(docRef, user);
    
    // Return user with proper types
    const createdUser: User = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    return createdUser;
  },

  async update(id: string, data: Partial<User>): Promise<void> {
    const docRef = doc(db, "users", id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },
};

// Request operations
export const requests = {
  async create(requestData: Omit<Request, "id" | "createdAt" | "updatedAt">): Promise<Request> {
    const docRef = await addDoc(collection(db, "requests"), {
      ...requestData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
    });
    
    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as Request;
  },

  async get(id: string): Promise<Request | null> {
    const docRef = doc(db, "requests", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Request) : null;
  },

  async getAll(filters?: {
    category?: string;
    location?: string;
    priceMin?: number;
    priceMax?: number;
    status?: string;
    search?: string;
  }): Promise<Request[]> {
    let q = query(
      collection(db, "requests"),
      where("status", "==", filters?.status || "open"),
      orderBy("createdAt", "desc")
    );

    if (filters?.category) {
      q = query(q, where("category", "==", filters.category));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Request));
  },

  async getByUser(userId: string): Promise<Request[]> {
    const q = query(
      collection(db, "requests"),
      where("buyerId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Request));
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const docRef = doc(db, "requests", id);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  },
};

// Offer operations
export const offers = {
  async create(offerData: Omit<Offer, "id" | "createdAt" | "updatedAt">): Promise<Offer> {
    const docRef = await addDoc(collection(db, "offers"), {
      ...offerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as Offer;
  },

  async getByRequest(requestId: string): Promise<Offer[]> {
    const q = query(
      collection(db, "offers"),
      where("requestId", "==", requestId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Offer));
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const docRef = doc(db, "offers", id);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  },
};

// Conversation operations
export const conversations = {
  async create(conversationData: Omit<Conversation, "id" | "createdAt" | "lastMessageAt">): Promise<Conversation> {
    const docRef = await addDoc(collection(db, "conversations"), {
      ...conversationData,
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
    });
    
    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as Conversation;
  },

  async get(id: string): Promise<Conversation | null> {
    const docRef = doc(db, "conversations", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Conversation) : null;
  },

  async getByUser(userId: string): Promise<Conversation[]> {
    const q1 = query(
      collection(db, "conversations"),
      where("buyerId", "==", userId),
      orderBy("lastMessageAt", "desc")
    );
    
    const q2 = query(
      collection(db, "conversations"),
      where("sellerId", "==", userId),
      orderBy("lastMessageAt", "desc")
    );
    
    const [buyerSnap, sellerSnap] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);
    
    const conversations = [
      ...buyerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation)),
      ...sellerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation))
    ];
    
    // Remove duplicates and sort by lastMessageAt
    const uniqueConversations = conversations.filter((conv, index, self) => 
      index === self.findIndex(c => c.id === conv.id)
    );
    
    return uniqueConversations.sort((a, b) => 
      (b.lastMessageAt as any).toMillis() - (a.lastMessageAt as any).toMillis()
    );
  },
};

// Message operations
export const messages = {
  async create(conversationId: string, messageData: Omit<Message, "id" | "createdAt">): Promise<Message> {
    const messagesRef = collection(db, "conversations", conversationId, "messages");
    const docRef = await addDoc(messagesRef, {
      ...messageData,
      createdAt: serverTimestamp(),
    });
    
    // Update conversation's lastMessageAt
    const conversationRef = doc(db, "conversations", conversationId);
    await updateDoc(conversationRef, {
      lastMessageAt: serverTimestamp(),
    });
    
    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as Message;
  },

  async getByConversation(conversationId: string): Promise<Message[]> {
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
  },

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      where("senderId", "!=", userId),
      where("isRead", "==", false)
    );
    
    const querySnapshot = await getDocs(q);
    const updates = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { isRead: true })
    );
    
    await Promise.all(updates);
  },
};

// Product operations
export const products = {
  async create(productData: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const docRef = await addDoc(collection(db, "products"), {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const docSnap = await getDoc(docRef);
    return { ...docSnap.data(), id: docRef.id } as any as Product;
  },

  async getByUser(userId: string): Promise<Product[]> {
    const q = query(
      collection(db, "products"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as any as Product));
  },

  async update(id: string, data: Partial<Product>): Promise<void> {
    const docRef = doc(db, "products", id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },
};

export default {
  users,
  requests,
  offers,
  conversations,
  messages,
  products,
};