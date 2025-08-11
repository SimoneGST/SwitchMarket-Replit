import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Firebase Auth middleware
const authenticate = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(' ')[1];
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');

    // Initialize Firebase Admin if not already initialized
    if (!getApps().length) {
      const serviceAccount = {
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };
      
      initializeApp({
        credential: cert(serviceAccount),
      });
    }

    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: "Unauthorized" });
  }
};
import { insertRequestSchema, insertOfferSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { copilotService } from "./copilotService";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Firebase Auth setup - no middleware needed since we check per route

  // Auth routes
  app.get('/api/auth/user', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/auth/complete-profile', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const profileData = req.body;
      
      const updatedUser = await storage.updateUserProfile(userId, profileData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Request routes
  app.post('/api/requests', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const requestData = insertRequestSchema.parse({
        ...req.body,
        buyerId: userId,
      });
      
      const request = await storage.createRequest(requestData);
      res.json(request);
    } catch (error) {
      console.error("Error creating request:", error);
      res.status(400).json({ message: "Failed to create request" });
    }
  });

  app.get('/api/requests', async (req, res) => {
    try {
      const filters = {
        category: req.query.category as string,
        location: req.query.location as string,
        priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
        priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
        status: req.query.status as string,
        search: req.query.search as string,
        merchantLat: req.query.merchantLat ? parseFloat(req.query.merchantLat as string) : undefined,
        merchantLng: req.query.merchantLng ? parseFloat(req.query.merchantLng as string) : undefined,
        merchantLocation: req.query.merchantLocation as string,
      };
      
      const requests = await storage.getRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.get('/api/requests/my', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const requests = await storage.getUserRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching user requests:", error);
      res.status(500).json({ message: "Failed to fetch user requests" });
    }
  });

  app.get('/api/requests/:id', async (req, res) => {
    try {
      const request = await storage.getRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching request:", error);
      res.status(500).json({ message: "Failed to fetch request" });
    }
  });

  // Offer routes
  app.post('/api/offers', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const offerData = insertOfferSchema.parse({
        ...req.body,
        sellerId: userId,
      });
      
      const offer = await storage.createOffer(offerData);
      res.json(offer);
    } catch (error) {
      console.error("Error creating offer:", error);
      res.status(400).json({ message: "Failed to create offer" });
    }
  });

  app.get('/api/requests/:id/offers', async (req, res) => {
    try {
      const offers = await storage.getRequestOffers(req.params.id);
      res.json(offers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  // Conversation routes
  app.get('/api/conversations', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/conversations', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const { requestId, sellerId, offerId } = req.body;
      
      const conversation = await storage.createConversation({
        requestId,
        buyerId: userId,
        sellerId,
        offerId,
      });
      
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(400).json({ message: "Failed to create conversation" });
    }
  });

  app.get('/api/conversations/:id/messages', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const conversationId = req.params.id;
      
      // Mark messages as read
      await storage.markMessagesAsRead(conversationId, userId);
      
      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/conversations/:id/messages', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const conversationId = req.params.id;
      
      const messageData = insertMessageSchema.parse({
        conversationId,
        senderId: userId,
        content: req.body.content,
        messageType: req.body.messageType || 'text',
      });
      
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(400).json({ message: "Failed to create message" });
    }
  });

  // Clemente AI endpoint with Gemini e memoria
  app.post('/api/clemente/chat', async (req: any, res) => {
    try {
      const { message, context, attachedFile } = req.body;
      const { clementeAI } = await import('./clemente');
      
      // Passa il context completo al chat per mantenere la memoria
      const result = await clementeAI.chatWithUser(message, context, attachedFile);
      res.json({
        response: result.text,
        generatedImage: result.generatedImage,
        collectedData: result.collectedData,
        productSchema: result.productSchema
      });
    } catch (error) {
      console.error("Error processing Clemente chat:", error);
      res.status(500).json({ 
        response: "Mi dispiace, ho avuto un problema tecnico. Puoi riprovare?",
        message: "Failed to process chat" 
      });
    }
  });

  // Genera richiesta dalla conversazione con Clemente
  app.post("/api/clemente/generate-request", async (req, res) => {
    try {
      const { conversationHistory } = req.body;
      const { clementeAI } = await import('./clemente');
      
      if (!conversationHistory || !Array.isArray(conversationHistory)) {
        return res.status(400).json({ error: 'Cronologia conversazione richiesta' });
      }
      
      const requestData = await clementeAI.generateRequestFromChat(conversationHistory);
      
      if (!requestData) {
        return res.status(400).json({ error: 'Non riesco a generare una richiesta dalla conversazione' });
      }
      
      res.json({ requestData });
    } catch (error: any) {
      console.error('Errore generazione richiesta da chat:', error);
      res.status(500).json({ error: error.message || 'Errore interno del server' });
    }
  });

  // Leonardo AI endpoint for merchants
  app.post('/api/leonardo/chat', authenticate, async (req: any, res) => {
    try {
      const { message, context } = req.body;
      const { leonardoChat } = await import('./gemini');
      
      const result = await leonardoChat(message, context);
      res.json(result);
    } catch (error) {
      console.error("Error processing Leonardo chat:", error);
      res.status(500).json({ message: "Failed to process chat" });
    }
  });

  // File upload for AI assistants
  app.post('/api/objects/upload', authenticate, async (req, res) => {
    try {
      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Serve uploaded files
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(404).json({ message: "File not found" });
    }
  });

  // Gestionale Integration Routes
  
  // Get user integrations
  app.get('/api/integrations', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const integrations = await storage.getIntegrationsByUserId(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  // Test integration connection
  app.post('/api/integrations/test', authenticate, async (req: any, res) => {
    try {
      const { gestionaleType, apiKey, companyId, baseUrl } = req.body;
      const { createGestionaleService } = await import('./integrations/gestionaleService');
      
      const mockIntegration = {
        id: 0,
        userId: req.user.uid,
        gestionaleType,
        apiKey,
        companyId,
        baseUrl,
        isActive: true,
        syncFrequency: 'daily',
        lastSync: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const service = createGestionaleService(mockIntegration);
      const isConnected = await service.testConnection();
      
      if (isConnected) {
        res.json({ success: true, message: "Connessione riuscita" });
      } else {
        res.status(400).json({ success: false, message: "Connessione fallita - verifica le credenziali" });
      }
    } catch (error) {
      console.error("Error testing integration:", error);
      res.status(500).json({ message: "Errore nel test della connessione" });
    }
  });

  // Create new integration
  app.post('/api/integrations', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const integrationData = {
        ...req.body,
        userId,
      };
      
      const integration = await storage.createIntegration(integrationData);
      res.json(integration);
    } catch (error) {
      console.error("Error creating integration:", error);
      res.status(500).json({ message: "Failed to create integration" });
    }
  });

  // Sync integration data
  app.post('/api/integrations/:id/sync', authenticate, async (req: any, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const userId = req.user.uid;
      
      const integration = await storage.getIntegrationById(integrationId);
      if (!integration || integration.sellerId !== userId) {
        return res.status(404).json({ message: "Integration not found" });
      }

      const { createGestionaleService } = await import('./integrations/gestionaleService');
      const { syncIntegrationProducts } = await import('./integrations/syncService');
      
      const service = createGestionaleService(integration);
      await syncIntegrationProducts(integration, service, storage);
      
      res.json({ success: true, message: "Sincronizzazione avviata" });
    } catch (error) {
      console.error("Error syncing integration:", error);
      res.status(500).json({ message: "Errore durante la sincronizzazione" });
    }
  });

  // Get products
  app.get('/api/products', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const products = await storage.getProductsByUserId(userId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // ===== COPILOT ROUTES =====
  
  // Get or create copilot configuration
  app.get('/api/copilot/config', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      let config = await storage.getCopilotConfig(userId);
      
      if (!config) {
        // Crea configurazione di default
        const user = await storage.getUser(userId);
        config = await storage.createCopilotConfig({
          userId,
          isEnabled: true,
          businessHours: {
            monday: { enabled: true, start: "09:00", end: "18:00" },
            tuesday: { enabled: true, start: "09:00", end: "18:00" },
            wednesday: { enabled: true, start: "09:00", end: "18:00" },
            thursday: { enabled: true, start: "09:00", end: "18:00" },
            friday: { enabled: true, start: "09:00", end: "18:00" },
            saturday: { enabled: true, start: "09:00", end: "13:00" },
            sunday: { enabled: false, start: "09:00", end: "18:00" }
          },
          autoResponses: {
            greeting: `Ciao! Sono Leonardo, l'assistente di ${user?.businessName || user?.firstName}. Come posso aiutarti oggi?`,
            unavailable: "Al momento non sono disponibile. Ti risponderò appena possibile!",
            closing: "Grazie per averci contattato! Ti ricontatteremo presto."
          },
          maxConcurrentChats: 5,
          responseDelay: 2000,
          personalitySettings: {
            tone: "professionale",
            expertise: "generale", 
            proactivity: "medio"
          }
        });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching copilot config:", error);
      res.status(500).json({ message: "Failed to fetch copilot config" });
    }
  });

  // Update copilot configuration
  app.put('/api/copilot/config', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      await storage.updateCopilotConfig(userId, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating copilot config:", error);
      res.status(500).json({ message: "Failed to update copilot config" });
    }
  });

  // Check copilot availability
  app.get('/api/copilot/availability/:merchantId', async (req, res) => {
    try {
      const merchantId = req.params.merchantId;
      const isAvailable = await copilotService.isCopilotAvailable(merchantId);
      res.json({ available: isAvailable });
    } catch (error) {
      console.error("Error checking copilot availability:", error);
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  // Initialize copilot session
  app.post('/api/copilot/session', authenticate, async (req: any, res) => {
    try {
      const customerId = req.user.uid;
      const { merchantId, requestId } = req.body;
      
      const session = await copilotService.initializeSession(merchantId, customerId, requestId);
      res.json(session);
    } catch (error) {
      console.error("Error initializing copilot session:", error);
      res.status(500).json({ message: "Failed to initialize session" });
    }
  });

  // Generate copilot response
  app.post('/api/copilot/message', authenticate, async (req: any, res) => {
    try {
      const { sessionId, message } = req.body;
      
      const response = await copilotService.generateResponse(sessionId, message);
      res.json(response);
    } catch (error) {
      console.error("Error generating copilot response:", error);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  // Transfer to human
  app.post('/api/copilot/transfer', authenticate, async (req: any, res) => {
    try {
      const { sessionId, reason } = req.body;
      
      await copilotService.transferToHuman(sessionId, reason);
      res.json({ success: true });
    } catch (error) {
      console.error("Error transferring to human:", error);
      res.status(500).json({ message: "Failed to transfer to human" });
    }
  });

  // Complete copilot session
  app.post('/api/copilot/complete', authenticate, async (req: any, res) => {
    try {
      const { sessionId, satisfaction, summary } = req.body;
      
      await copilotService.completeSession(sessionId, satisfaction, summary);
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing copilot session:", error);
      res.status(500).json({ message: "Failed to complete session" });
    }
  });

  // Get merchant active sessions
  app.get('/api/copilot/sessions', authenticate, async (req: any, res) => {
    try {
      const merchantId = req.user.uid;
      const sessions = await storage.getMerchantActiveSessions(merchantId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching active sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Get copilot analytics
  app.get('/api/copilot/analytics', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const days = parseInt(req.query.days as string) || 7;
      
      const stats = await copilotService.getPerformanceStats(userId, days);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching copilot analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // ===== PROFILE API =====
  app.get('/api/profile', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/profile/verify', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const profileData = req.body;
      
      console.log('🔍 Profile verification request:', {
        userId,
        profileData: { ...profileData, partitaIva: profileData.partitaIva ? '***' : undefined }
      });
      
      const updatedUser = await storage.updateUserProfile(userId, {
        ...profileData,
        profileVerified: true
      });
      
      console.log('✅ Profile updated successfully:', { userId, success: true });
      res.json(updatedUser);
    } catch (error) {
      console.error("❌ Error verifying profile:", error);
      res.status(500).json({ message: "Failed to verify profile", error: String(error) });
    }
  });

  // ===== LEONARDO CHAT API =====
  app.post('/api/leonardo/chat', authenticate, async (req: any, res) => {
    try {
      const { message, context, attachedFiles } = req.body;
      
      const { leonardoChat } = await import('./gemini');
      const response = await leonardoChat(message, context, attachedFiles || []);
      
      res.json(response);
    } catch (error) {
      console.error("Error in Leonardo chat:", error);
      res.status(500).json({ message: "Failed to process chat" });
    }
  });

  // Merchant-specific routes
  app.get('/api/merchant/stats', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      // Simula statistiche merchant per demo
      const stats = {
        todayChats: Math.floor(Math.random() * 50) + 10,
        avgResponseTime: Math.floor(Math.random() * 5) + 1,
        satisfaction: (Math.random() * 1 + 4).toFixed(1),
        conversions: Math.floor(Math.random() * 20) + 5,
        totalProducts: Math.floor(Math.random() * 100) + 25,
        activeOffers: Math.floor(Math.random() * 15) + 3,
        pendingOrders: Math.floor(Math.random() * 10) + 1,
        revenue: Math.floor(Math.random() * 5000) + 1000
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching merchant stats:", error);
      res.status(500).json({ message: "Failed to fetch merchant stats" });
    }
  });

  app.post('/api/merchant/verify', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const verificationData = req.body;

      // Validazione lato server
      if (!verificationData.businessName || verificationData.businessName.length < 2) {
        return res.status(400).json({ message: "Nome attività richiesto" });
      }

      if (!verificationData.taxType || !["piva", "cf"].includes(verificationData.taxType)) {
        return res.status(400).json({ message: "Tipo identificativo fiscale richiesto" });
      }

      // Validazione P.IVA o C.F. in base al tipo selezionato
      if (verificationData.taxType === "piva") {
        if (!verificationData.piva || verificationData.piva.length !== 11) {
          return res.status(400).json({ message: "Partita IVA non valida" });
        }
      } else {
        if (!verificationData.codiceFiscale || verificationData.codiceFiscale.length !== 16) {
          return res.status(400).json({ message: "Codice Fiscale non valido" });
        }
      }

      if (!verificationData.businessAddress || verificationData.businessAddress.length < 5) {
        return res.status(400).json({ message: "Indirizzo completo richiesto" });
      }

      if (!verificationData.city || verificationData.city.length < 2) {
        return res.status(400).json({ message: "Città richiesta" });
      }

      if (!verificationData.cap || !/^[0-9]{5}$/.test(verificationData.cap)) {
        return res.status(400).json({ message: "CAP non valido" });
      }

      if (!verificationData.province || verificationData.province.length !== 2) {
        return res.status(400).json({ message: "Provincia non valida" });
      }

      if (!verificationData.legalForm) {
        return res.status(400).json({ message: "Forma giuridica richiesta" });
      }

      // Aggiorna utente con dati verificati
      const updateData: any = {
        businessName: verificationData.businessName,
        businessAddress: verificationData.businessAddress,
        city: verificationData.city,
        cap: verificationData.cap,
        province: verificationData.province,
        legalForm: verificationData.legalForm,
        verificationStatus: 'verified',
        businessVerified: true,
        isActive: true
      };

      // Aggiungi il campo fiscale corretto
      if (verificationData.taxType === "piva") {
        updateData.piva = verificationData.piva;
        updateData.codiceFiscale = null;
      } else {
        updateData.codiceFiscale = verificationData.codiceFiscale;
        updateData.piva = null;
      }

      const user = await storage.updateUserProfile(userId, updateData);

      res.json({ 
        success: true, 
        message: "Verifica completata con successo",
        user: user 
      });
    } catch (error) {
      console.error("Error during merchant verification:", error);
      res.status(500).json({ message: "Errore durante la verifica. Riprova." });
    }
  });

  app.post('/api/merchant/complete-profile', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const profileData = req.body;
      
      // Salva il profilo completo
      const user = await storage.updateUserProfile(userId, {
        ...profileData,
        profileCompleted: true
      });

      // Crea automaticamente la configurazione Leonardo
      const existingConfig = await storage.getCopilotConfig(userId);
      if (!existingConfig) {
        await storage.createCopilotConfig({
          userId: userId,
          personality: "Professionale e cordiale, esperto nei prodotti dell'attività",
          autonomyLevel: "medium",
          isActive: true,
          autoRespond: true,
          maxConcurrentChats: 5,
          responseDelay: 2000,
          greetingMessage: `Ciao! Sono Leonardo, l'assistente di ${profileData.businessName || user.businessName}. Come posso aiutarti oggi?`,
          unavailableMessage: "Al momento non sono disponibile. Ti risponderò appena possibile!",
          businessHours: profileData.openingHours || {
            monday: { enabled: true, start: "09:00", end: "18:00" },
            tuesday: { enabled: true, start: "09:00", end: "18:00" },
            wednesday: { enabled: true, start: "09:00", end: "18:00" },
            thursday: { enabled: true, start: "09:00", end: "18:00" },
            friday: { enabled: true, start: "09:00", end: "18:00" },
            saturday: { enabled: true, start: "09:00", end: "13:00" },
            sunday: { enabled: false, start: "09:00", end: "18:00" },
          }
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error completing profile:", error);
      res.status(500).json({ message: "Failed to complete profile" });
    }
  });

  // Product routes  
  app.get('/api/products/my', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const products = await storage.getProductsByUserId(userId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/products', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const productData = {
        ...req.body,
        sellerId: userId
      };
      
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Integration routes
  app.get('/api/integrations', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const integrations = await storage.getIntegrationsByUserId(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  // Copilot configuration routes
  app.get('/api/copilot/config', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const config = await storage.getCopilotConfig(userId);
      res.json(config);
    } catch (error) {
      console.error("Error fetching copilot config:", error);
      res.status(500).json({ message: "Failed to fetch copilot config" });
    }
  });

  app.get('/api/copilot/analytics', authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const today = new Date().toISOString().split('T')[0];
      const analytics = await storage.getCopilotAnalytics(userId, today);
      res.json(analytics || {
        totalChats: Math.floor(Math.random() * 100) + 20,
        successfulConversions: Math.floor(Math.random() * 15) + 5,
        avgSatisfactionScore: (Math.random() * 1 + 4).toFixed(1),
        responseTime: Math.floor(Math.random() * 3) + 1
      });
    } catch (error) {
      console.error("Error fetching copilot analytics:", error);
      res.status(500).json({ message: "Failed to fetch copilot analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
