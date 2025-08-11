"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Initialize Firebase Admin
admin.initializeApp();
const app = (0, express_1.default)();
// Middleware CORS per tutti i domini
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5000',
        'https://switch-market-guastellasimone.replit.app',
        /\.replit\.app$/,
        /\.web\.app$/,
        /\.firebaseapp\.com$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Middleware per headers CORS manual in caso di problemi
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    }
    else {
        next();
    }
});
// Routes
app.get("/", (req, res) => {
    res.json({ message: "Switch Market API" });
});
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});
// Auth middleware
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split("Bearer ")[1];
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};
// Merchant verification route (public for now)
app.post("/api/merchant/verify", async (req, res) => {
    try {
        // Extract auth token manually for this route
        const token = req.headers.authorization?.split("Bearer ")[1];
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        const verificationData = req.body;
        // Update user document with verification data
        await admin.firestore().collection("users").doc(userId).update({
            businessName: verificationData.businessName,
            businessAddress: verificationData.businessAddress,
            city: verificationData.city,
            province: verificationData.province,
            cap: verificationData.cap,
            partitaIva: verificationData.partitaIva,
            codiceFiscale: verificationData.codiceFiscale,
            legalForm: verificationData.legalForm,
            pivaVerified: true,
            userType: 'merchant',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return res.json({ success: true, message: 'Verification completed' });
    }
    catch (error) {
        console.error('Error during verification:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// Merchant stats route
app.get("/api/merchant/stats", async (req, res) => {
    try {
        // Mock stats for now - replace with real Firestore queries
        const stats = {
            todayChats: Math.floor(Math.random() * 50) + 10,
            avgResponseTime: 2,
            satisfactionRate: 4.8
        };
        res.json(stats);
    }
    catch (error) {
        console.error('Error getting merchant stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Chat/AI endpoints (public)
app.post("/api/chat/clemente", async (req, res) => {
    try {
        const { message } = req.body;
        // Mock response for now - replace with actual Gemini AI integration
        const responses = [
            "Ciao! Come posso aiutarti oggi a trovare quello che cerchi?",
            "Perfetto! Sto cercando negozianti nella tua zona che possano aiutarti.",
            "Ho trovato alcuni risultati interessanti per te. Vuoi che ti mostri i dettagli?"
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        res.json({ response });
    }
    catch (error) {
        console.error('Error in Clemente chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Protected routes
app.use("/api", authenticateUser);
// User routes
app.get("/api/user", async (req, res) => {
    try {
        const userDoc = await admin
            .firestore()
            .collection("users")
            .doc(req.user.uid)
            .get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.json({ id: userDoc.id, ...userDoc.data() });
    }
    catch (error) {
        console.error("Error getting user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
app.get("/api/auth/user", async (req, res) => {
    try {
        const userDoc = await admin
            .firestore()
            .collection("users")
            .doc(req.user.uid)
            .get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.json({ id: userDoc.id, ...userDoc.data() });
    }
    catch (error) {
        console.error("Error getting user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
app.put("/api/user", async (req, res) => {
    try {
        await admin
            .firestore()
            .collection("users")
            .doc(req.user.uid)
            .update({
            ...req.body,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Request routes
app.post("/api/requests", async (req, res) => {
    try {
        const requestData = {
            ...req.body,
            buyerId: req.user.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        };
        const docRef = await admin
            .firestore()
            .collection("requests")
            .add(requestData);
        const doc = await docRef.get();
        res.json({ id: doc.id, ...doc.data() });
    }
    catch (error) {
        console.error("Error creating request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.get("/api/requests", async (req, res) => {
    try {
        const query = admin
            .firestore()
            .collection("requests")
            .where("status", "==", "open")
            .orderBy("createdAt", "desc")
            .limit(50);
        const snapshot = await query.get();
        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(requests);
    }
    catch (error) {
        console.error("Error getting requests:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.get("/api/requests/nearby", async (req, res) => {
    try {
        const requestsSnapshot = await admin.firestore().collection("requests")
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        const requests = requestsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(requests);
    }
    catch (error) {
        console.error('Error getting requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get("/api/requests/my", async (req, res) => {
    try {
        const query = admin
            .firestore()
            .collection("requests")
            .where("buyerId", "==", req.user.uid)
            .orderBy("createdAt", "desc");
        const snapshot = await query.get();
        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(requests);
    }
    catch (error) {
        console.error("Error getting user requests:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Offer routes
app.post("/api/offers", async (req, res) => {
    try {
        const offerData = {
            ...req.body,
            sellerId: req.user.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await admin
            .firestore()
            .collection("offers")
            .add(offerData);
        const doc = await docRef.get();
        res.json({ id: doc.id, ...doc.data() });
    }
    catch (error) {
        console.error("Error creating offer:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.get("/api/requests/:requestId/offers", async (req, res) => {
    try {
        const { requestId } = req.params;
        const query = admin
            .firestore()
            .collection("offers")
            .where("requestId", "==", requestId)
            .orderBy("createdAt", "desc");
        const snapshot = await query.get();
        const offers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(offers);
    }
    catch (error) {
        console.error("Error getting offers:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Conversation routes
app.post("/api/conversations", async (req, res) => {
    try {
        const conversationData = {
            ...req.body,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await admin
            .firestore()
            .collection("conversations")
            .add(conversationData);
        const doc = await docRef.get();
        res.json({ id: doc.id, ...doc.data() });
    }
    catch (error) {
        console.error("Error creating conversation:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.get("/api/conversations", async (req, res) => {
    try {
        const buyerQuery = admin
            .firestore()
            .collection("conversations")
            .where("buyerId", "==", req.user.uid);
        const sellerQuery = admin
            .firestore()
            .collection("conversations")
            .where("sellerId", "==", req.user.uid);
        const [buyerSnapshot, sellerSnapshot] = await Promise.all([
            buyerQuery.get(),
            sellerQuery.get()
        ]);
        const conversations = [
            ...buyerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            ...sellerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        ];
        // Remove duplicates and sort by lastMessageAt
        const uniqueConversations = conversations.filter((conv, index, self) => index === self.findIndex(c => c.id === conv.id));
        res.json(uniqueConversations);
    }
    catch (error) {
        console.error("Error getting conversations:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Message routes
app.post("/api/conversations/:conversationId/messages", async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messageData = {
            ...req.body,
            senderId: req.user.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await admin
            .firestore()
            .collection("conversations")
            .doc(conversationId)
            .collection("messages")
            .add(messageData);
        // Update conversation's lastMessageAt
        await admin
            .firestore()
            .collection("conversations")
            .doc(conversationId)
            .update({
            lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const doc = await docRef.get();
        res.json({ id: doc.id, ...doc.data() });
    }
    catch (error) {
        console.error("Error creating message:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.get("/api/conversations/:conversationId/messages", async (req, res) => {
    try {
        const { conversationId } = req.params;
        const query = admin
            .firestore()
            .collection("conversations")
            .doc(conversationId)
            .collection("messages")
            .orderBy("createdAt", "asc");
        const snapshot = await query.get();
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(messages);
    }
    catch (error) {
        console.error("Error getting messages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map