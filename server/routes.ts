import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertRequestSchema, insertOfferSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/auth/complete-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = req.body;
      
      const updatedUser = await storage.updateUserProfile(userId, profileData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Request routes
  app.post('/api/requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      };
      
      const requests = await storage.getRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.get('/api/requests/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.post('/api/offers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Clemente AI endpoint with Gemini
  app.post('/api/clemente/chat', isAuthenticated, async (req: any, res) => {
    try {
      const { message, context } = req.body;
      const { clementeChat } = await import('./gemini');
      
      const result = await clementeChat(message, context);
      res.json(result);
    } catch (error) {
      console.error("Error processing Clemente chat:", error);
      res.status(500).json({ message: "Failed to process chat" });
    }
  });

  // Leonardo AI endpoint for merchants
  app.post('/api/leonardo/chat', isAuthenticated, async (req: any, res) => {
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
  app.post('/api/objects/upload', isAuthenticated, async (req, res) => {
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
  app.get('/api/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrations = await storage.getIntegrationsByUserId(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  // Test integration connection
  app.post('/api/integrations/test', isAuthenticated, async (req: any, res) => {
    try {
      const { gestionaleType, apiKey, companyId, baseUrl } = req.body;
      const { createGestionaleService } = await import('./integrations/gestionaleService');
      
      const mockIntegration = {
        id: 0,
        userId: req.user.claims.sub,
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
  app.post('/api/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.post('/api/integrations/:id/sync', isAuthenticated, async (req: any, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const integration = await storage.getIntegrationById(integrationId);
      if (!integration || integration.userId !== userId) {
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
  app.get('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const products = await storage.getProductsByUserId(userId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
