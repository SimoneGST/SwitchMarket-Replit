import { DocumentData, FieldValue } from 'firebase-admin/firestore';

// Interfacce per le collezioni Firestore
export interface FirestoreUser extends DocumentData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  userType: 'customer' | 'merchant';
  profileCompleted: boolean;
  pivaVerified: boolean;
  
  // Campi business per merchant
  businessName?: string;
  businessAddress?: string;
  city?: string;
  province?: string;
  cap?: string;
  partitaIva?: string;
  codiceFiscale?: string;
  legalForm?: string;
  businessHours?: string;
  businessDescription?: string;
  businessCategory?: string;
  businessSubcategory?: string;
  
  // Metadata
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

export interface FirestoreRequest extends DocumentData {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  budget: {
    min: number;
    max: number;
  };
  deliveryPreference: 'pickup' | 'delivery' | 'both';
  urgencyLevel: 'immediate' | '24h' | '48h' | 'few_days';
  location: {
    address: string;
    city: string;
    province: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  actionRadius: number; // in km
  status: 'active' | 'closed' | 'expired';
  expiresAt: FieldValue;
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

export interface FirestoreOffer extends DocumentData {
  id: string;
  requestId: string;
  merchantId: string;
  price: number;
  description: string;
  deliveryTime: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

export interface FirestoreConversation extends DocumentData {
  id: string;
  participants: string[]; // user IDs
  requestId?: string;
  offerId?: string;
  lastMessage?: string;
  lastMessageAt?: FieldValue;
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

export interface FirestoreMessage extends DocumentData {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  metadata?: any;
  createdAt: FieldValue;
}

export interface FirestoreProduct extends DocumentData {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory?: string;
  images: string[];
  inStock: boolean;
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

// Collection names as constants
export const COLLECTIONS = {
  USERS: 'users',
  REQUESTS: 'requests',
  OFFERS: 'offers',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  PRODUCTS: 'products',
  INTEGRATIONS: 'integrations',
  COPILOT_CONFIGS: 'copilotConfigs',
  COPILOT_ANALYTICS: 'copilotAnalytics'
} as const;