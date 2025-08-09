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

  // Clemente AI simulation endpoint
  app.post('/api/clemente/chat', isAuthenticated, async (req: any, res) => {
    try {
      const { message, context } = req.body;
      
      // Simulate AI response based on message content
      let response = "Mi dispiace, non ho capito bene. Puoi essere più specifico?";
      let extractedData = {};
      
      if (message.toLowerCase().includes('iphone')) {
        response = "Perfetto! Vedo che stai cercando un iPhone. Puoi dirmi il modello specifico e la capacità di storage che preferisci?";
        extractedData = {
          category: "Elettronica",
          subcategory: "Telefonia",
          keywords: ["iphone", "apple", "smartphone"]
        };
      } else if (message.toLowerCase().includes('bicicletta')) {
        response = "Interessante! Che tipo di bicicletta stai cercando? Da città, mountain bike, da corsa?";
        extractedData = {
          category: "Sport e Tempo Libero",
          subcategory: "Ciclismo",
          keywords: ["bicicletta", "bike", "ciclismo"]
        };
      } else if (message.match(/\d+gb/i)) {
        response = "Ottimo! Ho notato che hai specificato la capacità di storage. Hai un budget in mente per questo acquisto?";
        const storage = message.match(/(\d+)gb/i)?.[1];
        extractedData = {
          attributes: [
            { key: "Storage", value: `${storage}GB`, weight: 0.8, required: false }
          ]
        };
      } else if (message.match(/€?\d+/)) {
        response = "Perfetto! Ho preso nota del budget. Hai preferenze per il colore o le condizioni del prodotto?";
        const prices = message.match(/€?(\d+)/g);
        if (prices && prices.length >= 2) {
          extractedData = {
            priceMin: parseInt(prices[0].replace('€', '')),
            priceMax: parseInt(prices[1].replace('€', ''))
          };
        }
      } else if (message.toLowerCase().includes('colore') || message.toLowerCase().includes('grafite') || message.toLowerCase().includes('nero') || message.toLowerCase().includes('bianco')) {
        response = "Ottimo! Ho aggiornato le tue preferenze. Quale città o zona ti interessa per la ricerca?";
        const colors = ['grafite', 'nero', 'bianco', 'blu', 'rosso'];
        const foundColor = colors.find(color => message.toLowerCase().includes(color));
        if (foundColor) {
          extractedData = {
            attributes: [
              { key: "Colore", value: foundColor, weight: 0.6, required: false }
            ]
          };
        }
      } else if (message.toLowerCase().includes('milano') || message.toLowerCase().includes('roma') || message.toLowerCase().includes('torino')) {
        response = "Perfetto! Ho tutti i dettagli necessari per creare la tua richiesta. Dai un'occhiata all'anteprima a destra e dimmi se va bene così!";
        const cities = ['Milano', 'Roma', 'Torino'];
        const foundCity = cities.find(city => message.toLowerCase().includes(city.toLowerCase()));
        if (foundCity) {
          extractedData = {
            location: `${foundCity}, Italia`
          };
        }
      }
      
      res.json({
        response,
        extractedData,
        isComplete: message.toLowerCase().includes('milano') || message.toLowerCase().includes('roma') || message.toLowerCase().includes('torino')
      });
    } catch (error) {
      console.error("Error processing Clemente chat:", error);
      res.status(500).json({ message: "Failed to process chat" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
