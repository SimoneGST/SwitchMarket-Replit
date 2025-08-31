import * as functions from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

// Initialize Firebase Admin
admin.initializeApp();

const app = express();

// Resend email is optional; we only read from process.env.RESEND_API_KEY at runtime.

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

app.use(cors(corsOptions));
// Increase body size limits to support image/document uploads from the client
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
// Error handler to convert body size errors into friendly messages
app.use((err: any, _req: any, res: any, next: any) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({ error: 'FILE_TOO_LARGE', message: 'File troppo grande. Limite 20MB.', maxBytes: 20 * 1024 * 1024 });
  }
  next(err);
});

// Middleware per headers CORS manual in caso di problemi
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
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
const authenticateUser = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Require verified email for sensitive actions
const requireVerified = (req: any, res: any, next: any) => {
  try {
    const verified = !!req.user?.email_verified;
    if (!verified) {
      return res.status(403).json({ error: 'EMAIL_NOT_VERIFIED', message: 'Verifica la tua email per continuare.' });
    }
    next();
  } catch (e) {
    return res.status(403).json({ error: 'EMAIL_NOT_VERIFIED' });
  }
};

// Merchant verification route (public for now)
app.post("/api/merchant/verify", authenticateUser, requireVerified, async (req: any, res) => {
  try {
    // Extract auth token manually for this route
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    const body = req.body || {};
    // Normalize field names: accept both piva and partitaIva
    const verificationData: any = {
      ...body,
      partitaIva: body.partitaIva || body.piva || undefined,
    };
    
    // Validazione campi obbligatori
    const requiredFields = [
      'businessName', 'businessAddress', 'city', 'province', 'cap', 'legalForm'
    ];
    for (const field of requiredFields) {
      if (!verificationData[field] || typeof verificationData[field] !== 'string' || verificationData[field].trim().length === 0) {
        return res.status(400).json({ error: `Campo obbligatorio mancante o non valido: ${field}` });
      }
    }
    // Validazione identificativo fiscale
    if (!verificationData.taxType || !['piva', 'cf'].includes(verificationData.taxType)) {
      return res.status(400).json({ error: 'Tipo identificativo fiscale non valido' });
    }
    if (verificationData.taxType === 'piva') {
      if (!verificationData.partitaIva || verificationData.partitaIva.length !== 11) {
        return res.status(400).json({ error: 'Partita IVA non valida' });
      }
    } else {
      if (!verificationData.codiceFiscale || verificationData.codiceFiscale.length !== 16) {
        return res.status(400).json({ error: 'Codice Fiscale non valido' });
      }
    }
    // Controlla che il documento utente esista prima di aggiornare
    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();
    const basePayload: Record<string, any> = {
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
    };
    const filteredPayload = Object.fromEntries(
      Object.entries(basePayload).filter(([_, v]) => v !== undefined)
    );
    if (!userDoc.exists) {
      await userRef.set({
        ...filteredPayload,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } else {
      await userRef.update({
        ...filteredPayload,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    return res.json({ success: true, message: 'Verification completed' });
  } catch (error) {
    console.error('Error during verification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Merchant stats route
app.get("/api/merchant/stats", async (req: any, res) => {
  try {
    // Mock stats for now - replace with real Firestore queries
    const stats = {
      todayChats: Math.floor(Math.random() * 50) + 10,
      avgResponseTime: 2,
      satisfactionRate: 4.8
    };
    
    res.json(stats);
  } catch (error) {
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
  } catch (error) {
    console.error('Error in Clemente chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leonardo assist parser (MVP heuristic parser, no external LLM)
app.post("/api/assist/parse", async (req, res) => {
  try {
    const { prompt, allowedFields = [], context = {} } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt mancante o non valido' });
    }

    const p = prompt.trim();
    const updates: Record<string, string> = {};

    // Extract P.IVA (11 digits)
    const pivaMatch = p.match(/(?:(?:p\.?\s*iva|partita\s*iva)\s*[:\-]?\s*)?(\d{11})/i);
    if (pivaMatch?.[1] && allowedFields.includes('piva')) {
      updates.piva = pivaMatch[1];
    }

    // Extract Codice Fiscale (16 alphanum)
    const cfMatch = p.match(/([A-Z0-9]{16})/i);
    if (cfMatch?.[1] && allowedFields.includes('codiceFiscale')) {
      const cf = cfMatch[1].toUpperCase();
      if (!/^[0-9]{11}$/.test(cf)) updates.codiceFiscale = cf;
    }

    // Business name (after keywords)
    const nameMatch = p.match(/(?:ragione\s*sociale|nome\s*(?:dell'?attivit[aà])?)\s*[:\-]?\s*([^,\n]+?)(?=(?:,|\n|\.|$))/i);
    if (nameMatch?.[1] && allowedFields.includes('businessName')) {
      updates.businessName = nameMatch[1].trim();
    }

    // Legal form
    const legalForms: Record<string, string> = {
      'srl': 'srl', 's.r.l': 'srl', 'spa': 'spa', 's.p.a': 'spa', 'snc': 'snc', 'sas': 'sas',
      'ditta individuale': 'ditta_individuale', 'libero professionista': 'libero_professionista', 'artigiano': 'artigiano', 'cooperativa': 'cooperativa', 'associazione': 'associazione', 'fondazione': 'fondazione'
    };
    for (const k of Object.keys(legalForms)) {
      if (new RegExp(`\b${k}\b`, 'i').test(p) && allowedFields.includes('legalForm')) {
        updates.legalForm = legalForms[k];
        break;
      }
    }

    // Address, CAP, city, province
    const addrMatch = p.match(/(?:via|viale|corso|piazza)\s+[^,\n]+\s*\d*/i);
    if (addrMatch && allowedFields.includes('businessAddress')) {
      updates.businessAddress = addrMatch[0].trim();
    }
    const capMatch = p.match(/\b(\d{5})\b/);
    if (capMatch && allowedFields.includes('cap')) {
      updates.cap = capMatch[1];
    }
    const provMatch = p.match(/\b([A-Z]{2})\b/);
    if (provMatch && allowedFields.includes('province')) {
      updates.province = provMatch[1].toUpperCase();
    }
    // City: try find after "a" or "in" before comma
    const cityMatch = p.match(/\b(?:a|in)\s+([A-ZÀ-Ù][a-zA-ZÀ-ÿ'\s]+?)(?=,|\.|$)/);
    if (cityMatch && allowedFields.includes('city')) {
      updates.city = cityMatch[1].trim();
    }

    // Decide taxType
    if (updates.piva && allowedFields.includes('taxType')) {
      updates.taxType = 'piva';
    } else if (updates.codiceFiscale && allowedFields.includes('taxType')) {
      updates.taxType = 'cf';
    }

    // --- Product field extraction (MVP heuristics) ---
    // Name / Title
    if (allowedFields.includes('name')) {
      const nameByLabel = p.match(/\b(?:nome|titolo|prodotto|articolo)\b\s*[:\-]?\s*([^\n,\.]{3,80})/i);
      if (nameByLabel?.[1]) updates.name = nameByLabel[1].trim();
    }
    // Description
    if (allowedFields.includes('description')) {
      const descByLabel = p.match(/\b(?:descrizione|dettagli|note)\b\s*[:\-]?\s*([\s\S]{10,})/i);
      if (descByLabel?.[1]) {
        // stop at next labeled field keyword if any
        const cut = descByLabel[1].split(/\b(categoria|prezzo|condizioni|stock|marca|modello|peso|garanzia|keywords?)\b\s*:?.*/i)[0];
        updates.description = cut.trim();
      }
    }
    // Category
    if (allowedFields.includes('category')) {
      const categories = [
        'Abbigliamento','Scarpe','Accessori','Elettronica','Casa e Giardino','Sport e Tempo Libero',
        'Auto e Moto','Libri','Strumenti Musicali','Giocattoli','Bellezza e Salute','Alimentari','Altro'
      ];
      for (const c of categories) {
        if (new RegExp(`\\b${c.replace(/ /g,'\\s*')}\\b`, 'i').test(p)) { updates.category = c; break; }
      }
      const catByLabel = p.match(/\b(?:categoria)\b\s*[:\-]?\s*([^\n,\.]{3,40})/i);
      if (!updates.category && catByLabel?.[1]) updates.category = catByLabel[1].trim();
    }
    // Subcategory
    if (allowedFields.includes('subcategory')) {
      const subByLabel = p.match(/\b(?:sottocategoria)\b\s*[:\-]?\s*([^\n,\.]{3,40})/i);
      if (subByLabel?.[1]) updates.subcategory = subByLabel[1].trim();
    }
    // Price (supports €, comma/point)
    if (allowedFields.includes('price')) {
      const priceMatch = p.match(/(?:€|eur|euro)?\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,][0-9]{1,2})?|[0-9]+(?:[\.,][0-9]{1,2})?)\s*(?:€|eur|euro)?/i);
      if (priceMatch?.[1]) {
        const normalized = priceMatch[1].replace(/\./g,'').replace(',', '.');
        updates.price = String(parseFloat(normalized));
      }
    }
    // Condition mapping
    if (allowedFields.includes('condition')) {
      const map: Record<string,string> = { 'nuovo':'new','nuova':'new','eccellente':'excellent','ottimo':'excellent','buono':'good','discreto':'fair','da riparare':'poor','rotto':'poor' };
      for (const k of Object.keys(map)) {
        if (new RegExp(`\b${k}\b`, 'i').test(p)) { updates.condition = map[k]; break; }
      }
      const condByLabel = p.match(/\b(?:condizione|condizioni)\b\s*[:\-]?\s*([^\n,\.]{3,20})/i);
      if (!updates.condition && condByLabel?.[1]) {
        const v = condByLabel[1].toLowerCase();
        if (map[v]) updates.condition = map[v];
      }
    }
    // Stock
    if (allowedFields.includes('stock')) {
      const stockMatch = p.match(/\b(?:stock|quantit[aà]|pezzi)\b\s*[:\-]?\s*(\d{1,6})/i);
      if (stockMatch?.[1]) updates.stock = stockMatch[1];
    }
    // Brand & Model
    if (allowedFields.includes('brand')) {
      const brandMatch = p.match(/\b(?:marca|brand)\b\s*[:\-]?\s*([^\n,\.,]{2,40})/i);
      if (brandMatch?.[1]) updates.brand = brandMatch[1].trim();
    }
    if (allowedFields.includes('model')) {
      const modelMatch = p.match(/\b(?:modello|model)\b\s*[:\-]?\s*([^\n,\.,]{1,40})/i);
      if (modelMatch?.[1]) updates.model = modelMatch[1].trim();
    }
    // Weight (kg or g)
    if (allowedFields.includes('weight')) {
      const weightKg = p.match(/\b([0-9]+(?:[\.,][0-9]+)?)\s*kg\b/i);
      const weightG = p.match(/\b([0-9]+)\s*g\b/i);
      if (weightKg?.[1]) {
        updates.weight = String(parseFloat(weightKg[1].replace(',', '.')));
      } else if (weightG?.[1]) {
        updates.weight = String(parseFloat(weightG[1]) / 1000);
      }
    }
    // Warranty
    if (allowedFields.includes('warranty')) {
      const warr = p.match(/\b(\d{1,3})\s*(?:mesi|mese|month|months)\b/i);
      if (warr?.[1]) updates.warranty = `${warr[1]} mesi`;
    }
    // Keywords
    if (allowedFields.includes('keywords')) {
      const kw = p.match(/\b(?:keywords?|tag)\b\s*[:\-]?\s*([^\n]+)$/i);
      if (kw?.[1]) updates.keywords = kw[1].trim();
    }

    // --- Integration credentials extraction ---
    const lower = p.toLowerCase();
    if (allowedFields.includes('apiKey')) {
      const m = p.match(/(?:api\s*key)\s*[:\-]?\s*([A-Za-z0-9_\-]{6,})/i);
      if (m?.[1]) updates.apiKey = m[1].trim();
    }
    if (allowedFields.includes('apiSecret')) {
      const m = p.match(/(?:api\s*secret|secret\s*key)\s*[:\-]?\s*([A-Za-z0-9_\-]{6,})/i);
      if (m?.[1]) updates.apiSecret = m[1].trim();
    }
    if (allowedFields.includes('companyId')) {
      const m = p.match(/(?:company\s*id|id\s*azienda)\s*[:\-]?\s*([A-Za-z0-9_\-]+)/i);
      if (m?.[1]) updates.companyId = m[1].trim();
    }
    if (allowedFields.includes('endpoint')) {
      const m = p.match(/\b(https?:\/\/[\w\-\.]+(?:\:[0-9]+)?(?:\/[\w\-\.\/%]*)?)\b/i);
      if (m?.[1]) updates.endpoint = m[1].trim();
    }
    if (allowedFields.includes('username')) {
      const m = p.match(/(?:user\s*name|username|utente)\s*[:\-]?\s*([\w\.@\-]{3,})/i);
      if (m?.[1]) updates.username = m[1].trim();
    }
    if (allowedFields.includes('password')) {
      const m = p.match(/(?:password|pwd)\s*[:\-]?\s*([^\s]{4,})/i);
      if (m?.[1]) updates.password = m[1].trim();
    }
    if (allowedFields.includes('database')) {
      const m = p.match(/(?:database|db\s*name)\s*[:\-]?\s*([A-Za-z0-9_\-]+)/i);
      if (m?.[1]) updates.database = m[1].trim();
    }

    return res.json({ updates });
  } catch (error) {
    console.error('Assist parse error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== Clemente (Buyer) Chat Endpoints =====
// Lightweight chat handler compatible with client expectations
app.post("/api/clemente/chat", async (req: any, res) => {
  try {
  const { message, context, attachedFile } = req.body || {};
    const text: string = typeof message === 'string' ? message.trim() : '';
    const debug: any = { path: 'clemente/chat', ts: Date.now(), ai: { keyPresent: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY), usedForAttachment: false, usedForReply: false }, attachment: null as any, notes: [] as string[] };

    // Richiede almeno un testo o un allegato
    if (!text && !attachedFile) {
      return res.status(400).json({ error: 'MISSING_INPUT', message: "Inserisci un messaggio o allega un file.", debug });
    }

  const greetings = ["ciao", "salve", "buongiorno", "buonasera", "hello", "hi"];
  const isGreeting = greetings.some(g => text.toLowerCase().startsWith(g));

  // Minimal memory: see what we already have and enrich with heuristics from last user message
  const collected = (context?.collectedData || {}) as Record<string, any>;
  const { extractFromText, buildRequestDraft, classifyCategory } = await import('./clemente-guidelines.js');
  const { findBestProductSchema, generateSmartQuestion, collectAttributesFromSchema, formatQuestionForField } = await import('./product-schemas.js');
    if (text) {
      const extra = extractFromText(text);
      Object.assign(collected, Object.fromEntries(Object.entries(extra).filter(([_,v]) => v !== undefined && v !== null && v !== '')));
    }

    // If there's an attachment, try to extract info using Gemini (if available)
  if (attachedFile && (attachedFile.base64 || attachedFile.data || attachedFile.url)) {
      try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        // Normalize incoming fields
        let mime: string | undefined = attachedFile.mimeType || attachedFile.type;
        let b64: string | undefined = attachedFile.base64 || attachedFile.data;
    debug.attachment = { name: attachedFile.name || null, mime: mime || null, hasBase64: !!b64, hasUrl: !!attachedFile.url };

        // If only URL is provided, try to fetch and convert to base64
        if (!b64 && attachedFile.url) {
          try {
            const resp = await fetch(attachedFile.url);
            const ab = await resp.arrayBuffer();
            // Prefer content-type from response if mime not provided
            mime = mime || resp.headers.get('content-type') || undefined;
            // Convert to base64
            b64 = Buffer.from(ab).toString('base64');
      debug.notes.push('Fetched attachment URL to base64');
          } catch (e) {
            console.warn('Could not fetch attachedFile.url, fallback to filename heuristics:', e);
      debug.notes.push('Fetch attachment URL failed');
          }
        }

        // Some clients may send data URLs; strip any prefix
        if (b64 && b64.includes(',')) {
          b64 = b64.split(',').pop();
        }

    if (apiKey && b64 && mime) {
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI: any = new (GoogleGenerativeAI as any)(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const system = `Estrai dal file i dettagli utili per una richiesta prodotto locale.
Rispondi SOLO in JSON con campi opzionali: {"productName","brand","model","color","size","material","technicalSpecs","compatibility","expectations","budgetMin","budgetMax"}.`;
          const result = await model.generateContent([
            system,
            { inlineData: { data: b64, mimeType: mime } },
          ]);
          const txt = (result as any)?.response?.text?.() || '';
          const clean = txt.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          try {
            const json = JSON.parse(clean);
            if (json && typeof json === 'object') {
              Object.assign(collected, Object.fromEntries(Object.entries(json).filter(([_,v]) => v !== undefined && v !== null && v !== '')));
      debug.ai.usedForAttachment = true;
            }
          } catch {}
        } else {
          // Fallback: try extract from filename
          const name: string = attachedFile.name || '';
          const fallback = extractFromText(name.replace(/[_\-]/g, ' '));
          Object.assign(collected, Object.fromEntries(Object.entries(fallback).filter(([_,v]) => v !== undefined && v !== null && v !== '')));
        }
      } catch (err) {
        console.warn('Attachment extraction failed:', err);
    debug.notes.push('Attachment extraction failed');
      }
    }
    // Se manca la categoria, prova a dedurla automaticamente (no domande sulla categoria)
    if (!collected.category) {
      const basis = [
        collected.productName,
        collected.brand,
        collected.model,
        collected.technicalSpecs,
        collected.expectations,
        text,
      ].filter(Boolean).join(' ');
  const guessed = classifyCategory(basis);
      if (guessed) collected.category = guessed;
  debug.categoryGuessed = guessed || null;
    }

  const needed: Array<{ key: string; prompt: string }> = [];
    if (!collected.productName && !collected.title) needed.push({ key: 'productName', prompt: 'Ok, di che prodotto parliamo esattamente? (es. scarpe da spinning con chiusura BOA)' });
    if (collected.budgetMin == null || collected.budgetMax == null) needed.push({ key: 'budget', prompt: 'Hai un budget indicativo? (es. 50-150€)' });
    if (!collected.location) needed.push({ key: 'location', prompt: 'In che città/area vuoi cercare?' });

  // Riconoscimento scheda prodotto adatta
  const schemaFromMsg = findBestProductSchema(text || collected.productName || '');
  const activeSchema = schemaFromMsg || (context?.currentSchema || null);

  // Prova a generare una domanda mirata in base allo schema; prima copri i REQUIRED mancanti in ordine logico
  let reply: string | undefined;
  if (activeSchema) {
    try {
      const required = (activeSchema as any).fields?.filter((f: any) => f.required) || [];
      const missingRequired = required.filter((f: any) => collected[f.key] == null || collected[f.key] === '');
      if (missingRequired.length) {
        reply = formatQuestionForField(missingRequired[0]);
      } else {
        reply = generateSmartQuestion(activeSchema as any, collected) || undefined;
      }
    } catch {
      reply = generateSmartQuestion(activeSchema as any, collected) || undefined;
    }
  }

    // Try AI (Gemini) for intelligent reply + structured extraction
  try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (apiKey) {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI: any = new (GoogleGenerativeAI as any)(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const { CLEMENTE_GUIDELINES } = await import('./clemente-guidelines.js');

        const conv = Array.isArray((req as any).body?.conversationHistory)
          ? (req as any).body.conversationHistory
          : (Array.isArray(context?.conversationHistory) ? context.conversationHistory : []);
        const lastTurns = conv.slice(-12).map((m: any) => `${m?.isAI ? 'Clemente' : 'Cliente'}: ${String(m?.content || '').trim()}`).join('\n');

  const stateJson = JSON.stringify({ collectedData: collected, productSchema: activeSchema || null });
        const instruction = `Regole output: rispondi SOLO in JSON con schema esatto e messaggi brevi:
{
  "assistantMessage": "max 2 frasi, 1 domanda mirata SOLO su un campo mancante",
  "collectedUpdates": { /* campi da aggiungere/aggiornare, opzionali */ },
  "requestDraft": { /* bozza richiesta coerente coi dati */ },
  "readyToGenerate": true|false
}
Non aggiungere testo fuori dal JSON. Evita ripetizioni e non richiedere campi già forniti.`;

        const prompt = [
          CLEMENTE_GUIDELINES,
          instruction,
          `Stato attuale: ${stateJson}`,
          `Conversazione (ultimi turni):\n${lastTurns}`,
          `Nuovo messaggio utente: ${text}`,
        ].join('\n\n');

        const result = await model.generateContent(prompt);
        const raw = (result as any)?.response?.text?.() || '';
        const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(clean);

        if (parsed?.collectedUpdates && typeof parsed.collectedUpdates === 'object') {
          Object.assign(collected, Object.fromEntries(Object.entries(parsed.collectedUpdates).filter(([_,v]) => v !== undefined && v !== null && v !== '')));
        }
  if (parsed?.assistantMessage) reply = String(parsed.assistantMessage);

        // Se la bozza non è fornita, costruisci dalla raccolta corrente
        var aiRequestDraft = parsed?.requestDraft && typeof parsed.requestDraft === 'object' ? parsed.requestDraft : undefined;
        if (!aiRequestDraft) {
          aiRequestDraft = buildRequestDraft(collected);
        }
        var aiReady = !!parsed?.readyToGenerate;
        const outSchema = (parsed?.productSchema && typeof parsed.productSchema === 'object') ? parsed.productSchema : (activeSchema || null);
        if (aiRequestDraft && outSchema) {
          const attrs = collectAttributesFromSchema(outSchema as any, { ...collected, ...(aiRequestDraft as any) }) || {};
          // Auto-fill common fields from collected
          const extras: Record<string, any> = {};
          if ((collected as any).size && attrs.size == null) extras.size = (collected as any).size;
          if ((collected as any).material && attrs.material == null) extras.material = (collected as any).material;
          if ((collected as any).color && attrs.color == null) extras.color = (collected as any).color;
          // Domain-specific normalization for Abbigliamento
          try {
            const schemaCat = String((outSchema as any)?.category || '').toLowerCase();
            if (schemaCat === 'abbigliamento') {
              // Guess type from text
              const t = (text || '').toLowerCase();
              if (!attrs.type) {
                if (/maglietta|t\s*-?\s*shirt/.test(t)) extras.type = 'maglietta';
                else if (/camicia/.test(t)) extras.type = 'camicia';
                else if (/felpa/.test(t)) extras.type = 'felpa';
                else if (/pantaloncini|short/.test(t)) extras.type = 'pantaloni';
              }
              // Gender default if required
              if (!attrs.gender) extras.gender = 'unisex';
              // Color canonicalization (map to schema options)
              const colorMap: Record<string,string> = { 'blu scuro':'blu', 'azzurro':'blu', 'nero':'nero', 'bianco':'bianco', 'grigio':'grigio', 'verde':'verde', 'rosso':'rosso', 'marrone':'marrone' };
              const col = (extras.color || attrs.color || (collected as any).color);
              if (typeof col === 'string') {
                const low = col.toLowerCase().trim();
                const mapped = colorMap[low];
                if (mapped) extras.color = mapped;
              }
              // Budget range formatting for attribute "budget" if the schema has it
              const hasBudgetField = Array.isArray((outSchema as any).fields) && (outSchema as any).fields.some((f: any) => f.key === 'budget');
              if (hasBudgetField && !attrs.budget) {
                const bmin = (aiRequestDraft as any).budgetMin ?? (collected as any).budgetMin;
                const bmax = (aiRequestDraft as any).budgetMax ?? (collected as any).budgetMax;
                if (typeof bmin === 'number' && typeof bmax === 'number') extras.budget = `${bmin}-${bmax}€`;
                else if (typeof bmax === 'number') extras.budget = `0-${bmax}€`;
              }
            }
          } catch {}
          const mergedAttrs = { ...attrs, ...extras };
          if (Object.keys(mergedAttrs).length) (aiRequestDraft as any).attributes = mergedAttrs;
        }

        // Costruisci payload e ritorna subito
        const payload = {
          response: {
            message: reply || 'Ok, dimmi qualche dettaglio in più così perfeziono la richiesta.',
            generatedImage: null,
            collectedData: collected,
            productSchema: outSchema,
            requestDraft: aiRequestDraft,
            readyToGenerate: aiReady,
            debug,
          },
          message: reply || 'Ok, dimmi qualche dettaglio in più così perfeziono la richiesta.',
          generatedImage: null,
          collectedData: collected,
          productSchema: outSchema,
          requestDraft: aiRequestDraft,
          readyToGenerate: aiReady,
          debug,
        };
        return res.json(payload);
      }
    } catch (aiErr) {
      console.warn('Clemente AI fallback (errore AI):', aiErr);
      debug.notes.push('AI reply failed, using fallback');
    }

  // Fallback rule-based reply
    if (!reply) {
      if (isGreeting) {
        reply = 'Ciao! Sono Clemente. Dimmi cosa stai cercando e ti aiuterò a creare una richiesta perfetta per i negozianti della tua zona.';
  } else if (needed.length > 0) {
        reply = needed[0].prompt;
      } else {
        reply = 'Ottimo! Vuoi che generi la richiesta e la pubblichi per i negozianti?';
      }
    }

    // Build a live request draft (aggiungi attributi schema se disponibili)
    const requestDraft = (() => {
      const draft = buildRequestDraft(collected);
      const attrs = collectAttributesFromSchema(activeSchema || null, collected) || {};
      const extras: Record<string, any> = {};
      if ((collected as any).size && attrs.size == null) extras.size = (collected as any).size;
      if ((collected as any).material && attrs.material == null) extras.material = (collected as any).material;
      if ((collected as any).color && attrs.color == null) extras.color = (collected as any).color;
      // Abbigliamento normalization (fallback path)
      try {
        const schemaCat = String((activeSchema as any)?.category || '').toLowerCase();
        if (schemaCat === 'abbigliamento') {
          const t = (text || '').toLowerCase();
          if (!attrs.type) {
            if (/maglietta|t\s*-?\s*shirt/.test(t)) extras.type = 'maglietta';
            else if (/camicia/.test(t)) extras.type = 'camicia';
            else if (/felpa/.test(t)) extras.type = 'felpa';
            else if (/pantaloncini|short/.test(t)) extras.type = 'pantaloni';
          }
          if (!attrs.gender) extras.gender = 'unisex';
          const colorMap: Record<string,string> = { 'blu scuro':'blu', 'azzurro':'blu', 'nero':'nero', 'bianco':'bianco', 'grigio':'grigio', 'verde':'verde', 'rosso':'rosso', 'marrone':'marrone' };
          const col = (extras.color || attrs.color || (collected as any).color);
          if (typeof col === 'string') {
            const low = col.toLowerCase().trim();
            const mapped = colorMap[low];
            if (mapped) extras.color = mapped;
          }
          const hasBudgetField = Array.isArray((activeSchema as any)?.fields) && (activeSchema as any).fields.some((f: any) => f.key === 'budget');
          if (hasBudgetField && !attrs.budget) {
            const bmin = (draft as any).budgetMin ?? (collected as any).budgetMin;
            const bmax = (draft as any).budgetMax ?? (collected as any).budgetMax;
            if (typeof bmin === 'number' && typeof bmax === 'number') extras.budget = `${bmin}-${bmax}€`;
            else if (typeof bmax === 'number') extras.budget = `0-${bmax}€`;
          }
        }
      } catch {}
      const mergedAttrs = { ...attrs, ...extras };
      return Object.keys(mergedAttrs).length ? { ...draft, attributes: mergedAttrs } : draft;
    })();
  const ready = Object.keys(collected).some(k => ['productName','brand','model'].includes(k)) && (
      (collected.compatibility || collected.technicalSpecs || collected.expectations)
    ) && (collected.budgetMin != null || collected.budgetMax != null || collected.urgencyLevel || collected.location);

    // Return both a nested response object (for new clients) and top-level fields (back-compat)
    const payload = {
      response: {
        message: reply,
        generatedImage: null,
        collectedData: collected,
        productSchema: activeSchema || null,
        requestDraft,
        readyToGenerate: !!ready,
        debug,
      },
      message: reply,
      generatedImage: null,
      collectedData: collected,
      productSchema: activeSchema || null,
      requestDraft,
      readyToGenerate: !!ready,
      debug,
    };
    return res.json(payload);
  } catch (error) {
    console.error('Error in /api/clemente/chat:', error);
    return res.status(500).json({ response: 'Mi dispiace, ho avuto un problema tecnico. Puoi riprovare?', message: 'Mi dispiace, ho avuto un problema tecnico. Puoi riprovare?', debug: { path: 'clemente/chat', ts: Date.now(), error: String((error as any)?.message || error) } });
  }
});

// Generate a structured request from conversation (heuristic)
app.post("/api/clemente/generate-request", async (req: any, res) => {
  try {
    const { conversationHistory } = req.body || {};
    if (!Array.isArray(conversationHistory)) {
      return res.status(400).json({ error: 'Cronologia conversazione richiesta' });
    }

    // Use the last user message as seed
    const lastUser = [...conversationHistory].reverse().find((m: any) => m?.role === 'user');
    const seed = (lastUser?.content || '').trim();

    const categories = ['Elettronica', 'Casa e Giardino', 'Sport e Tempo Libero', 'Auto e Moto', 'Abbigliamento', 'Servizi', 'Altro'];
    const inferCategory = () => {
      const lower = seed.toLowerCase();
      for (const c of categories) {
        if (lower.includes(c.toLowerCase())) return c;
      }
      return 'Altro';
    };

    let budgetMin: number | undefined;
    let budgetMax: number | undefined;
    const range = seed.match(/(\d{1,5})\s*[-–]\s*(\d{1,5})/);
    if (range) {
      budgetMin = parseInt(range[1]);
      budgetMax = parseInt(range[2]);
    } else {
      const single = seed.match(/\b(\d{2,5})\b/);
      if (single) budgetMax = parseInt(single[1]);
    }

    // Use accumulated conversation to extract richer info
    // Try AI generation first
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI: any = new (GoogleGenerativeAI as any)(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const { CLEMENTE_GUIDELINES } = await import('./clemente-guidelines.js');
        const convo = conversationHistory.map((m: any) => `${m?.role === 'assistant' ? 'Clemente' : 'Cliente'}: ${String(m?.content || '').trim()}`).join('\n');
        const reqSchema = `Rispondi SOLO in JSON valido con schema:
{
  "title": string,
  "description": string,
  "category": string,
  "budgetMin": number|null,
  "budgetMax": number|null,
  "location": string,
  "urgencyLevel": "immediate"|"24h"|"48h"|"few_days",
  "deliveryPreference": "pickup"|"delivery"|"both",
  "actionRadius": number,
  "productName": string,
  "brand": string|null,
  "model": string|null,
  "technicalSpecs": string|null
}`;
        const prompt = [
          CLEMENTE_GUIDELINES,
          'Crea una richiesta completa e coerente con la conversazione.',
          reqSchema,
          `Conversazione:\n${convo}`
        ].join('\n\n');
        const result = await model.generateContent(prompt);
        const raw = (result as any)?.response?.text?.() || '';
        const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const json = JSON.parse(clean);
        return res.json({ requestData: json, response: { requestData: json } });
      } catch (e) {
        console.warn('Generate-request AI fallback:', e);
      }
    }

  // Fallback heuristic generation
  const { extractFromText, buildRequestDraft } = await import('./clemente-guidelines.js');
  const { findBestProductSchema, collectAttributesFromSchema } = await import('./product-schemas.js');
    const combined = conversationHistory
      .map((m: any) => (m?.content || '') as string)
      .join('\n');
    const extracted = extractFromText(combined);
    extracted.budgetMin = extracted.budgetMin ?? budgetMin;
    extracted.budgetMax = extracted.budgetMax ?? budgetMax;
    extracted.category = extracted.category || inferCategory();
  const requestBase = buildRequestDraft(extracted);
  const schema = findBestProductSchema(extracted.productName || combined);
  const attrs = collectAttributesFromSchema(schema, extracted as any);
  const requestData = attrs ? { ...requestBase, attributes: attrs } : requestBase;

  return res.json({ requestData, response: { requestData, productSchema: schema || null } });
  } catch (error: any) {
    console.error('Error in /api/clemente/generate-request:', error);
    return res.status(500).json({ error: error.message || 'Errore interno del server' });
  }
});

// Protected routes
app.use("/api", authenticateUser);

// User routes
app.get("/api/user", async (req: any, res) => {
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
  } catch (error) {
    console.error("Error getting user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ===== Leonardo (Merchant) Chat & Copilot Config =====
// Simple Gemini chat for merchants
app.post("/api/leonardo/chat", async (req: any, res) => {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const { message, context } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      res.status(500).json({ message: "Manca la chiave GEMINI_API_KEY" });
      return;
    }
    const genAI: any = new (GoogleGenerativeAI as any)(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const sysPrompt = `Sei Leonardo, assistente professionale per negozianti su Switch Market. Aiuti a:
    - completare il profilo aziendale (dati fiscali, orari, vetrina)
    - gestire prodotti/vetrina
    - rispondere ai clienti con tono professionale e conciso.
    Rispondi in massimo 2 frasi quando possibile.`;
    const parts = [sysPrompt, `Utente: ${String(message || '').trim()}`];
    const result = await model.generateContent(parts.join('\n\n'));
    const text = (result as any)?.response?.text?.() || 'Sono pronto ad aiutarti con il tuo profilo e la vetrina.';
    res.json({ response: text });
    return;
  } catch (error) {
    console.error('Error in /api/leonardo/chat:', error);
    res.status(500).json({ message: 'Errore nel generare la risposta' });
    return;
  }
});

// Copilot config: get or create default
app.get("/api/copilot/config", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const ref = admin.firestore().collection('copilotConfigs').doc(userId);
    const snap = await ref.get();
    if (!snap.exists) {
      const defaultConfig = {
        userId,
        isEnabled: true,
        assistants: [
          { name: 'Leonardo', role: 'assistente', enabled: true },
        ],
        businessHours: {
          monday: { enabled: true, start: '09:00', end: '18:00' },
          tuesday: { enabled: true, start: '09:00', end: '18:00' },
          wednesday: { enabled: true, start: '09:00', end: '18:00' },
          thursday: { enabled: true, start: '09:00', end: '18:00' },
          friday: { enabled: true, start: '09:00', end: '18:00' },
          saturday: { enabled: true, start: '09:00', end: '13:00' },
          sunday: { enabled: false, start: '09:00', end: '18:00' },
        },
        collaborators: [
          // Puoi impostare nomi reali di collaboratori del negozio
        ],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await ref.set(defaultConfig);
      res.json(defaultConfig);
      return;
    }
    res.json({ id: snap.id, ...snap.data() });
    return;
  } catch (error) {
    console.error('Error getting copilot config:', error);
    res.status(500).json({ message: 'Impossibile recuperare configurazione' });
    return;
  }
});

// Update copilot config (including real collaborator names)
app.put("/api/copilot/config", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const ref = admin.firestore().collection('copilotConfigs').doc(userId);
    await ref.set({
      ...req.body,
      userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    const snap = await ref.get();
    res.json({ id: snap.id, ...snap.data() });
  } catch (error) {
    console.error('Error updating copilot config:', error);
    res.status(500).json({ message: 'Impossibile aggiornare configurazione' });
  }
});

app.get("/api/auth/user", async (req: any, res) => {
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
  } catch (error) {
    console.error("Error getting user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Supplier search (merchant-focused)
app.post("/api/suppliers/search", async (req: any, res) => {
  try {
    const {
      category = "",
      subcategory = "",
      quantity = 1,
      budgetPerUnit,
      frequency = "one_off",
      deliveryBy,
      location = {},
      certifications = [],
      paymentTerms,
      notes = "",
    } = req.body || {};

    // Simple mock dataset; in future query Firestore or external marketplaces
    const catalog = [
      { id: 'sup-001', name: 'Forniture Rossi SRL', categories: ['Elettronica','Accessori'], city: 'Milano', province: 'MI', minOrder: 10, leadTimeDays: 3, rating: 4.6, certifications: ['ISO9001'] },
      { id: 'sup-002', name: 'Distribuzione Verdi SPA', categories: ['Alimentari','Casa e Giardino'], city: 'Torino', province: 'TO', minOrder: 50, leadTimeDays: 5, rating: 4.2, certifications: ['BIO','HACCP'] },
      { id: 'sup-003', name: 'Tech4U SRL', categories: ['Elettronica'], city: 'Bologna', province: 'BO', minOrder: 5, leadTimeDays: 2, rating: 4.8, certifications: ['ISO27001'] },
      { id: 'sup-004', name: 'Moda Italia SNC', categories: ['Abbigliamento','Accessori'], city: 'Firenze', province: 'FI', minOrder: 20, leadTimeDays: 7, rating: 4.1, certifications: [] },
      { id: 'sup-005', name: 'Ferramenta Centro', categories: ['Casa e Giardino'], city: 'Roma', province: 'RM', minOrder: 15, leadTimeDays: 4, rating: 4.4, certifications: ['ISO9001'] },
    ];

    const cat = String(category || '').toLowerCase();
    const sub = String(subcategory || '').toLowerCase();
    const prov = String(location?.province || '').toUpperCase();
    const city = String(location?.city || '').toLowerCase();

    const results = catalog
      .filter(s =>
        (!cat || s.categories.some(c => c.toLowerCase().includes(cat))) &&
        (!sub || s.categories.some(c => c.toLowerCase().includes(sub))) &&
        (!prov || s.province === prov) &&
        (!city || s.city.toLowerCase().includes(city))
      )
      .map(s => ({
        ...s,
        matchScore: Math.round((s.rating / 5) * 60 + (quantity >= s.minOrder ? 40 : 20)),
        canMeetMOQ: quantity >= s.minOrder,
        estUnitPrice: budgetPerUnit || undefined,
        frequency,
      }))
      .sort((a,b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return res.json({ results });
  } catch (error) {
    console.error('Supplier search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Save supply request (merchant intent)
app.post("/api/supply-requests", async (req: any, res) => {
  try {
    const payload = {
      ...req.body,
      merchantId: req.user.uid,
      status: 'open',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await admin.firestore().collection('supplyRequests').add(payload);
    const doc = await docRef.get();
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Save supply request error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put("/api/user", async (req: any, res) => {
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
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Request routes
app.post("/api/requests", authenticateUser, requireVerified, async (req: any, res) => {
  try {
    const body = req.body || {};
    // Helper: deep-prune undefined values so Firestore accepts the payload
    const prune = (val: any): any => {
      if (val === undefined) return undefined;
      if (Array.isArray(val)) return val.map(prune).filter(v => v !== undefined);
      if (val && typeof val === 'object') {
        const entries = Object.entries(val)
          .map(([k, v]) => [k, prune(v)] as [string, any])
          .filter(([, v]) => v !== undefined);
        return Object.fromEntries(entries);
      }
      return val;
    };

    // Whitelist dei campi ammessi per la richiesta
    const allowed: Record<string, any> = {
      title: body.title,
      description: body.description,
      category: body.category,
  attributes: typeof body.attributes === 'object' ? body.attributes : undefined,
      budgetMin: typeof body.budgetMin === 'number' ? body.budgetMin : (body.budgetMin ? Number(body.budgetMin) : undefined),
      budgetMax: typeof body.budgetMax === 'number' ? body.budgetMax : (body.budgetMax ? Number(body.budgetMax) : undefined),
      location: typeof body.location === 'string' ? body.location : undefined,
      urgencyLevel: body.urgencyLevel,
      // Default consegna: ritiro in negozio
      deliveryPreference: body.deliveryPreference || 'pickup',
      actionRadius: typeof body.actionRadius === 'number' ? body.actionRadius : (body.actionRadius ? Number(body.actionRadius) : undefined),
      productName: body.productName,
      brand: body.brand,
      model: body.model,
      technicalSpecs: body.technicalSpecs,
    };

    // Validazione semplice città/CAP/provincia se presenti
    const province = typeof body.province === 'string' ? body.province.toUpperCase().trim() : undefined;
    const cap = typeof body.cap === 'string' || typeof body.cap === 'number' ? String(body.cap).trim() : undefined;
    if (!allowed.location || String(allowed.location).trim().length < 2) {
      return res.status(400).json({ error: 'INVALID_LOCATION', message: 'Specificare la città.' });
    }
    if (province && !/^[A-Z]{2}$/.test(province)) {
      return res.status(400).json({ error: 'INVALID_PROVINCE', message: 'Provincia non valida (es. MI, RM).' });
    }
    if (cap && !/^\d{5}$/.test(cap)) {
      return res.status(400).json({ error: 'INVALID_CAP', message: 'CAP non valido (5 cifre).' });
    }
    if (province || cap) {
      const city = String(allowed.location).trim();
      const parts = [province ? province : null, cap ? cap : null].filter(Boolean).join(', ');
      allowed.location = parts ? `${city} (${parts})` : city;
    }
    // Normalizza budget -> price per compatibilità UI
    allowed.priceMin = allowed.priceMin ?? (typeof body.priceMin === 'number' ? body.priceMin : (body.priceMin ? Number(body.priceMin) : undefined));
    allowed.priceMax = allowed.priceMax ?? (typeof body.priceMax === 'number' ? body.priceMax : (body.priceMax ? Number(body.priceMax) : undefined));
    // Geo opzionale
    const geo = (typeof body.lat === 'number' && typeof body.lng === 'number')
      ? { lat: body.lat, lng: body.lng }
      : (typeof body.geo?.lat === 'number' && typeof body.geo?.lng === 'number')
        ? { lat: body.geo.lat, lng: body.geo.lng }
        : undefined;
    if (geo) allowed.geo = geo;

    // Riassunto AI opzionale (stringa breve), scarta l'intero aiContext
    const aiSummary = typeof body?.aiContext?.extractedSpecs === 'string'
      ? String(body.aiContext.extractedSpecs).slice(0, 500)
      : undefined;

    const requestDataRaw = {
      ...allowed,
      aiSummary,
      buyerId: req.user.uid,
      status: 'open',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    };

    // Remove any undefined fields recursively
    const requestData = prune(requestDataRaw);

    const docRef = await admin
      .firestore()
      .collection("requests")
      .add(requestData);

    const doc = await docRef.get();
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    console.error("Error creating request:", error?.stack || error?.message || error);
    return res.status(500).json({ error: "Internal server error", message: String(error?.message || error) });
  }
});

app.get("/api/requests", async (req: any, res) => {
  try {
  const snapshot = await admin.firestore().collection("requests").orderBy("createdAt", "desc").limit(200).get();
  const all = snapshot.docs.map(doc => {
      const data: any = doc.data();
      const toISO = (ts: any) => ts?.toDate?.() ? ts.toDate().toISOString() : (typeof ts === 'string' ? ts : undefined);
      return {
        id: doc.id,
        ...data,
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
        expiresAt: toISO(data.expiresAt),
      };
    });
  const openOnly = all.filter((r: any) => (r.status || 'open') === 'open').slice(0, 50);
  res.json(openOnly);
  } catch (error) {
    console.error("Error getting requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

app.get("/api/requests/nearby", async (req: any, res) => {
  try {
    const { lat, lng, radiusKm, city, province } = req.query || {};
    // Be resilient to mixed field types by falling back if orderBy fails
    let snap: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>;
    try {
      snap = await admin
        .firestore()
        .collection("requests")
        .orderBy("createdAt", "desc")
        .limit(400)
        .get();
    } catch (e) {
      console.warn("/api/requests/nearby fallback without orderBy(createdAt)", e);
      snap = await admin.firestore().collection("requests").limit(400).get();
    }

    const toISO = (ts: any) => ts?.toDate?.() ? ts.toDate().toISOString() : (typeof ts === 'string' ? ts : undefined);
  let items = snap.docs.map(d => {
      const data: any = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
        expiresAt: toISO(data.expiresAt),
      };
  }).filter((it: any) => (it.status || 'open') === 'open');

    const latNum = lat != null ? Number(lat) : undefined;
    const lngNum = lng != null ? Number(lng) : undefined;
    const rKm = radiusKm != null ? Number(radiusKm) : 25;

    if (typeof latNum === 'number' && !isNaN(latNum) && typeof lngNum === 'number' && !isNaN(lngNum)) {
      items = items.map((it: any) => {
        const dKm = (typeof it.geo?.lat === 'number' && typeof it.geo?.lng === 'number')
          ? haversineKm(latNum, lngNum, it.geo.lat, it.geo.lng)
          : Number.POSITIVE_INFINITY;
        return { ...it, distanceKm: dKm };
      }).filter((it: any) => it.distanceKm <= rKm)
        .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
        .slice(0, 50);
    } else if (city || province) {
      const cityStr = String(city || '').trim().toLowerCase();
      const provStr = String(province || '').trim().toLowerCase();
      items = items.filter((it: any) => {
        const loc = String(it.location || '').toLowerCase();
        return (!cityStr || loc.includes(cityStr)) && (!provStr || loc.includes(provStr));
      }).slice(0, 50);
    } else {
      items = items.slice(0, 20);
    }

  return res.json(items);
  } catch (error) {
    console.error('Error getting requests:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a buyer's request
app.put('/api/requests/:requestId', authenticateUser, async (req: any, res) => {
  try {
    const { requestId } = req.params;
    const ref = admin.firestore().collection('requests').doc(requestId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'REQUEST_NOT_FOUND' });
    const data: any = snap.data();
    if (data?.buyerId !== req.user.uid) return res.status(403).json({ error: 'FORBIDDEN' });
    const allowed: any = {};
    const body = req.body || {};
    const copyIf = (k: string, v: any) => { if (v !== undefined) allowed[k] = v; };
    copyIf('title', body.title);
    copyIf('description', body.description);
    copyIf('category', body.category);
    copyIf('attributes', typeof body.attributes === 'object' ? body.attributes : undefined);
    copyIf('priceMin', typeof body.priceMin === 'number' ? body.priceMin : (body.priceMin ? Number(body.priceMin) : undefined));
    copyIf('priceMax', typeof body.priceMax === 'number' ? body.priceMax : (body.priceMax ? Number(body.priceMax) : undefined));
    copyIf('location', typeof body.location === 'string' ? body.location : undefined);
    copyIf('urgencyLevel', body.urgencyLevel);
    await ref.set({ ...allowed, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    const updated = await ref.get();
    const updatedData: any = updated.data();
    const toISO = (ts: any) => ts?.toDate?.() ? ts.toDate().toISOString() : (typeof ts === 'string' ? ts : undefined);
    return res.json({ id: updated.id, ...updatedData, createdAt: toISO(updatedData.createdAt), updatedAt: toISO(updatedData.updatedAt) });
  } catch (error) {
    console.error('Error updating request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a buyer's request
app.delete('/api/requests/:requestId', authenticateUser, async (req: any, res) => {
  try {
    const { requestId } = req.params;
    const ref = admin.firestore().collection('requests').doc(requestId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'REQUEST_NOT_FOUND' });
    const data: any = snap.data();
    if (data?.buyerId !== req.user.uid) return res.status(403).json({ error: 'FORBIDDEN' });
    await ref.delete();
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/api/requests/my", authenticateUser, async (req: any, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("requests")
      .where("buyerId", "==", req.user.uid)
      .limit(200)
      .get();
    const list = snapshot.docs.map(doc => {
      const data: any = doc.data();
      const toISO = (ts: any) => ts?.toDate?.() ? ts.toDate().toISOString() : (typeof ts === 'string' ? ts : undefined);
      return {
        id: doc.id,
        ...data,
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
        expiresAt: toISO(data.expiresAt),
      };
    }).sort((a: any, b: any) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime()));

    res.json(list);
  } catch (error) {
    console.error("Error getting user requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Offer routes
app.post("/api/offers", authenticateUser, requireVerified, async (req: any, res): Promise<void> => {
  try {
    const incoming = { ...req.body };
  const sellerId = req.user.uid;
  const requestId = incoming.requestId;
    if (!requestId) {
  res.status(400).json({ error: 'REQUEST_ID_REQUIRED' });
  return;
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const offersCol = admin.firestore().collection('offers');
  // Upsert: one active offer per (requestId, sellerId)
    const existingSnap = await offersCol
      .where('requestId', '==', requestId)
      .where('sellerId', '==', sellerId)
      .limit(1)
      .get();

    let docRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>;
    let upsertType: 'created' | 'updated' = 'created';
    const offerPayload: any = {
      requestId,
  sellerId,
      title: incoming.title || null,
      description: incoming.description || null,
      price: typeof incoming.price === 'number' ? incoming.price : Number(incoming.price) || 0,
      imageUrl: incoming.imageUrl || null,
      status: incoming.status || 'active',
      updatedAt: now,
    };
    if (existingSnap.empty) {
      docRef = await offersCol.add({ ...offerPayload, createdAt: now });
      upsertType = 'created';
    } else {
      const existing = existingSnap.docs[0];
      const existingData: any = existing.data();
      if ((existingData?.status || '').toLowerCase() === 'accepted') {
        res.status(409).json({ error: 'OFFER_ALREADY_ACCEPTED', message: 'Offerta già accettata: non è più modificabile.' });
        return;
      }
      docRef = existing.ref;
      await docRef.update(offerPayload);
      upsertType = 'updated';
    }

    const doc = await docRef.get();

    // Update related request status and counters
    try {
      const reqRef = admin.firestore().collection('requests').doc(requestId);
      if (upsertType === 'created') {
        await reqRef.set({
          status: 'negotiating',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          offersCount: admin.firestore.FieldValue.increment(1),
          lastOfferAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } else {
        await reqRef.set({
          status: 'negotiating',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastOfferAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Failed to update request on offer upsert:', e);
    }

    // Auto-create conversation for this offer if not existing
  let conversationId: string | null = null;
  let buyerEmail: string | undefined;
    try {
      if (requestId) {
        const reqSnap = await admin.firestore().collection('requests').doc(requestId).get();
    const buyerId = reqSnap.data()?.buyerId;
        if (buyerId) {
          const convQuery = await admin.firestore().collection('conversations')
            .where('requestId', '==', requestId)
            .where('sellerId', '==', sellerId)
            .where('buyerId', '==', buyerId)
            .limit(1)
            .get();
          if (!convQuery.empty) {
            conversationId = convQuery.docs[0].id;
          } else {
            const convRef = await admin.firestore().collection('conversations').add({
              requestId,
              sellerId,
              buyerId,
              requestTitle: reqSnap.data()?.title || 'Richiesta',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            conversationId = convRef.id;
          }
          if (conversationId) {
            const messagesCol = admin.firestore().collection('conversations').doc(conversationId).collection('messages');
            // Try to update the last offer message from this seller to avoid duplicates
            const recentSnap = await messagesCol.orderBy('createdAt', 'desc').limit(50).get();
            const existingOfferMsg = recentSnap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .find((m: any) => m.messageType === 'offer' && m.senderId === sellerId);
            const messageData = {
              senderId: sellerId,
              messageType: 'offer',
              content: offerPayload.description || 'Ho inviato un’offerta per la tua richiesta.',
              title: offerPayload.title || null,
              offerId: docRef.id,
              price: offerPayload.price,
              imageUrl: offerPayload.imageUrl || null,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (existingOfferMsg) {
              await messagesCol.doc(existingOfferMsg.id).update({
                content: messageData.content,
                title: messageData.title,
                price: messageData.price,
                imageUrl: messageData.imageUrl,
              });
            } else {
              await messagesCol.add(messageData);
            }
            await admin.firestore().collection('conversations').doc(conversationId).update({
              lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
          // Grab buyer email for notification
          const buyerDoc = await admin.firestore().collection('users').doc(buyerId).get();
          buyerEmail = (buyerDoc.data() as any)?.email;
        }
      }
      // Optional: send email to buyer informing them of the offer
      try {
        if (buyerEmail && conversationId) {
          const apiKey = process.env.RESEND_API_KEY;
          // Only attempt if key looks valid (Resend keys typically start with 're_')
          if (apiKey && /^re_[A-Za-z0-9_-]{10,}$/.test(apiKey)) {
            const chatUrl = `https://switchmarket-pro.web.app/messages?conv=${conversationId}`;
            const resp = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'SwitchMarket <notifiche@switchmarket.app>',
                to: [buyerEmail],
                subject: 'Nuova offerta ricevuta su SwitchMarket',
                html: `Hai ricevuto una nuova offerta per la tua richiesta.<br/>Apri la chat: <a href="${chatUrl}">${chatUrl}</a>`,
              }),
            });
            if (!resp.ok) {
              const t = await resp.text();
              console.warn('Resend email failed:', resp.status, t);
            }
          }
        }
      } catch (e) {
        console.warn('Email notification skipped/failure:', e);
      }
    } catch (convErr) {
      console.error('Offer conversation auto-create failed:', convErr);
    }

  res.json({ id: doc.id, ...doc.data(), conversationId, upsert: upsertType });
  return;
  } catch (error) {
    console.error("Error creating offer:", error);
    res.status(500).json({ error: "Internal server error" });
  return;
  }
});

// My offers (seller)
app.get('/api/offers/my', async (req: any, res) => {
  try {
    const snap = await admin.firestore().collection('offers')
      .where('sellerId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json(items);
  } catch (error) {
    console.error('Error getting my offers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/api/requests/:requestId/offers", async (req: any, res) => {
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
  } catch (error) {
    console.error("Error getting offers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Offers received by the current buyer, enriched with conversationId
app.get('/api/offers/received', async (req: any, res) => {
  try {
    const buyerId = req.user.uid;
    // Get recent requests of this buyer
    const reqSnap = await admin.firestore().collection('requests')
      .where('buyerId', '==', buyerId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const requests = reqSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    const offersOut: any[] = [];
    for (const r of requests) {
      const offSnap = await admin.firestore().collection('offers')
        .where('requestId', '==', r.id)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
      const offers = offSnap.docs.map(d => ({ id: d.id, ...(d.data() as any), requestId: r.id, requestTitle: r.title || 'Richiesta' }));
      // Join with conversationId (one-to-one per seller)
      for (const o of offers) {
        const convQ = await admin.firestore().collection('conversations')
          .where('requestId', '==', o.requestId)
          .where('sellerId', '==', o.sellerId)
          .where('buyerId', '==', buyerId)
          .limit(1)
          .get();
        const conversationId = convQ.empty ? null : convQ.docs[0].id;
        offersOut.push({ ...o, conversationId });
      }
    }
    // Sort by updatedAt/createdAt desc
    const toMillis = (t: any) => t?.toDate?.() ? t.toDate().getTime() : (t ? new Date(t).getTime() : 0);
    offersOut.sort((a, b) => (toMillis(b.updatedAt) || toMillis(b.createdAt)) - (toMillis(a.updatedAt) || toMillis(a.createdAt)));
    return res.json(offersOut);
  } catch (error) {
    console.error('Error getting received offers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept offer (buyer only)
app.post('/api/offers/:offerId/accept', authenticateUser, async (req: any, res): Promise<void> => {
  try {
    const { offerId } = req.params;
    const offerRef = admin.firestore().collection('offers').doc(offerId);
    const offerSnap = await offerRef.get();
  if (!offerSnap.exists) { res.status(404).json({ error: 'OFFER_NOT_FOUND' }); return; }
    const offer = offerSnap.data() as any;

    // Buyer only can accept
    const reqSnap = await admin.firestore().collection('requests').doc(offer.requestId).get();
    const buyerId = reqSnap.data()?.buyerId;
    if (!buyerId || buyerId !== req.user.uid) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

  await offerRef.update({ status: 'accepted', updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    // Ensure conversation exists
    const convQuery = await admin.firestore().collection('conversations')
      .where('requestId', '==', offer.requestId)
      .where('sellerId', '==', offer.sellerId)
  .where('buyerId', '==', buyerId)
      .limit(1)
      .get();
    let conversationId: string;
    if (!convQuery.empty) {
      conversationId = convQuery.docs[0].id;
    } else {
      const convRef = await admin.firestore().collection('conversations').add({
        requestId: offer.requestId,
        sellerId: offer.sellerId,
  buyerId,
  requestTitle: reqSnap.data()?.title || 'Richiesta',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      conversationId = convRef.id;
    }

    // Update request status and link accepted offer
    try {
      await admin.firestore().collection('requests').doc(offer.requestId).set({
        status: 'accepted',
        acceptedOfferId: offerId,
        acceptedSellerId: offer.sellerId,
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn('Failed to update request status on accept:', e);
    }

    // Add acceptance message
    await admin.firestore().collection('conversations').doc(conversationId).collection('messages').add({
      senderId: req.user.uid,
      messageType: 'offer_accepted',
  content: 'Ho accettato la tua offerta.',
      offerId,
      price: offer.price,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await admin.firestore().collection('conversations').doc(conversationId).update({
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  res.json({ status: 'ok' });
  return;
  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  return;
  }
});

// Reject offer (buyer only)
app.post('/api/offers/:offerId/reject', authenticateUser, async (req: any, res): Promise<void> => {
  try {
    const { offerId } = req.params;
    const offerRef = admin.firestore().collection('offers').doc(offerId);
    const offerSnap = await offerRef.get();
    if (!offerSnap.exists) { res.status(404).json({ error: 'OFFER_NOT_FOUND' }); return; }
    const offer = offerSnap.data() as any;

    // Buyer only can reject
    const reqSnap = await admin.firestore().collection('requests').doc(offer.requestId).get();
    const buyerId = reqSnap.data()?.buyerId;
    if (!buyerId || buyerId !== req.user.uid) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    await offerRef.update({ status: 'rejected', updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    // Find or create conversation
    const convQuery = await admin.firestore().collection('conversations')
      .where('requestId', '==', offer.requestId)
      .where('sellerId', '==', offer.sellerId)
  .where('buyerId', '==', buyerId)
      .limit(1)
      .get();
    let conversationId: string;
    if (!convQuery.empty) {
      conversationId = convQuery.docs[0].id;
    } else {
      const convRef = await admin.firestore().collection('conversations').add({
        requestId: offer.requestId,
        sellerId: offer.sellerId,
  buyerId,
  requestTitle: reqSnap.data()?.title || 'Richiesta',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      conversationId = convRef.id;
    }

    // Post rejection message
    await admin.firestore().collection('conversations').doc(conversationId).collection('messages').add({
      senderId: req.user.uid,
      messageType: 'offer_rejected',
  content: 'Ho rifiutato l’offerta.',
      offerId,
      price: offer.price,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await admin.firestore().collection('conversations').doc(conversationId).update({
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ status: 'ok' });
    return;
  } catch (error) {
    console.error('Error rejecting offer:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// Conversation routes
app.post("/api/conversations", async (req: any, res): Promise<void> => {
  try {
    const { requestId } = req.body || {};
    if (!requestId) {
      res.status(400).json({ error: 'REQUEST_ID_REQUIRED' });
      return;
    }

    // Resolve participants
    const reqDoc = await admin.firestore().collection('requests').doc(requestId).get();
    const reqData: any = reqDoc.exists ? reqDoc.data() : null;
    const buyerIdFromReq = reqData?.buyerId;

    const sellerId = req.user?.uid; // authenticated user is the seller here
    const buyerId = req.body?.buyerId || buyerIdFromReq;

    if (!sellerId || !buyerId) {
      res.status(400).json({ error: 'PARTICIPANTS_UNKNOWN', message: 'Impossibile determinare buyer o seller' });
      return;
    }

    // Prevent duplicates
    const existing = await admin.firestore().collection('conversations')
      .where('requestId', '==', requestId)
      .where('sellerId', '==', sellerId)
      .where('buyerId', '==', buyerId)
      .limit(1)
      .get();
    if (!existing.empty) {
      const doc = existing.docs[0];
      res.json({ id: doc.id, ...doc.data() });
      return;
    }

    const conversationData = {
      requestId,
      sellerId,
      buyerId,
      requestTitle: req.body?.requestTitle || req.body?.title || reqData?.title || 'Conversazione',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await admin.firestore().collection('conversations').add(conversationData);
    const doc = await docRef.get();
  res.json({ id: doc.id, ...doc.data() });
  return;
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Internal server error" });
  return;
  }
});

app.get("/api/conversations", async (req: any, res) => {
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

    let conversations: any[] = [
      ...buyerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)),
      ...sellerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
    ];

    // Deduplicate by (requestId,buyerId,sellerId), keep the newest by lastMessageAt
    const map = new Map<string, any>();
    for (const convRaw of conversations) {
      const conv: any = convRaw as any;
      const key = `${conv.requestId || ''}|${conv.buyerId || ''}|${conv.sellerId || ''}`;
      const current = map.get(key);
      const ts = (conv.lastMessageAt?.toDate?.() ? conv.lastMessageAt.toDate().getTime() : (conv.lastMessageAt ? new Date(conv.lastMessageAt).getTime() : 0)) || 0;
      const currTs = current ? ((current.lastMessageAt?.toDate?.() ? current.lastMessageAt.toDate().getTime() : (current.lastMessageAt ? new Date(current.lastMessageAt).getTime() : 0)) || 0) : -1;
      if (!current || ts >= currTs) map.set(key, conv);
    }
    conversations = Array.from(map.values());

    // Enrich with participant photos
  const userIds = Array.from(new Set(conversations.flatMap((c: any) => [c.buyerId, c.sellerId]).filter(Boolean)));
    const userDocs = await Promise.all(userIds.map(id => admin.firestore().collection('users').doc(id as string).get()));
    const usersById = new Map<string, any>();
    userDocs.forEach(doc => usersById.set(doc.id, doc.data()));

  const enriched = conversations.map((c: any) => ({
      ...c,
      buyerPhotoUrl: usersById.get(c.buyerId || '')?.profileImageUrl || null,
      sellerPhotoUrl: usersById.get(c.sellerId || '')?.profileImageUrl || null,
    }));

    res.json(enriched);
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Seller-only conversations
app.get('/api/conversations/merchant', async (req: any, res) => {
  try {
    const snap = await admin.firestore().collection('conversations')
      .where('sellerId', '==', req.user.uid)
      .orderBy('lastMessageAt', 'desc')
      .get();
  let list: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    // Deduplicate by triple
    const map = new Map<string, any>();
    for (const convRaw of list) {
      const conv: any = convRaw as any;
      const key = `${conv.requestId || ''}|${conv.buyerId || ''}|${conv.sellerId || ''}`;
      if (!map.has(key)) map.set(key, conv as any);
    }
    list = Array.from(map.values());

    // Enrich with participant photos
  const userIds = Array.from(new Set(list.flatMap((c: any) => [c.buyerId, c.sellerId]).filter(Boolean)));
    const userDocs = await Promise.all(userIds.map(id => admin.firestore().collection('users').doc(id as string).get()));
    const usersById = new Map<string, any>();
    userDocs.forEach(doc => usersById.set(doc.id, doc.data()));
  const enriched = list.map((c: any) => ({
      ...c,
      buyerPhotoUrl: usersById.get(c.buyerId || '')?.profileImageUrl || null,
      sellerPhotoUrl: usersById.get(c.sellerId || '')?.profileImageUrl || null,
    }));
    return res.json(enriched);
  } catch (error) {
    console.error('Error getting merchant conversations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// My conversations (buyer or seller)
app.get('/api/conversations/my', async (req: any, res) => {
  try {
    const buyerQuery = admin.firestore().collection('conversations').where('buyerId', '==', req.user.uid);
    const sellerQuery = admin.firestore().collection('conversations').where('sellerId', '==', req.user.uid);
    const [buyerSnapshot, sellerSnapshot] = await Promise.all([buyerQuery.get(), sellerQuery.get()]);
    let conversations: any[] = [
      ...buyerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)),
      ...sellerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)),
    ];
    // Deduplicate by (requestId,buyerId,sellerId)
    const map = new Map<string, any>();
    for (const convRaw of conversations) {
      const conv: any = convRaw as any;
      const key = `${conv.requestId || ''}|${conv.buyerId || ''}|${conv.sellerId || ''}`;
      const current = map.get(key);
      const ts = (conv.lastMessageAt?.toDate?.() ? conv.lastMessageAt.toDate().getTime() : (conv.lastMessageAt ? new Date(conv.lastMessageAt).getTime() : 0)) || 0;
      const currTs = current ? ((current.lastMessageAt?.toDate?.() ? current.lastMessageAt.toDate().getTime() : (current.lastMessageAt ? new Date(current.lastMessageAt).getTime() : 0)) || 0) : -1;
      if (!current || ts >= currTs) map.set(key, conv);
    }
    conversations = Array.from(map.values());

  const userIds = Array.from(new Set(conversations.flatMap((c: any) => [c.buyerId, c.sellerId]).filter(Boolean)));
    const userDocs = await Promise.all(userIds.map(id => admin.firestore().collection('users').doc(id as string).get()));
    const usersById = new Map<string, any>();
    userDocs.forEach(doc => usersById.set(doc.id, doc.data()));
  const enriched = conversations.map((c: any) => ({
      ...c,
      buyerPhotoUrl: usersById.get(c.buyerId || '')?.profileImageUrl || null,
      sellerPhotoUrl: usersById.get(c.sellerId || '')?.profileImageUrl || null,
    }));
    return res.json(enriched);
  } catch (error) {
    console.error('Error getting my conversations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Message routes
app.post("/api/conversations/:conversationId/messages", async (req: any, res) => {
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
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/conversations/:conversationId/messages", async (req: any, res) => {
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
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== Profile & Onboarding =====
app.get('/api/profile', async (req: any, res) => {
  try {
    const ref = admin.firestore().collection('users').doc(req.user.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.json({ id: req.user.uid });
    }
    return res.json({ id: snap.id, ...snap.data() });
  } catch (error) {
    console.error('Error getting profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/profile/verify', async (req: any, res) => {
  try {
    const payload = { ...req.body };
    const userRef = admin.firestore().collection('users').doc(req.user.uid);
    await userRef.set({
      ...payload,
      profileVerified: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      id: req.user.uid,
      email: req.user.email || undefined,
    }, { merge: true });
    const snap = await userRef.get();
    return res.json({ id: snap.id, ...snap.data() });
  } catch (error) {
    console.error('Error verifying profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/complete-profile', async (req: any, res) => {
  try {
    const { userType, ...rest } = req.body || {};
    if (!userType || !['customer','merchant'].includes(userType)) {
      return res.status(400).json({ error: 'userType mancante o non valido' });
    }
    const ref = admin.firestore().collection('users').doc(req.user.uid);
    await ref.set({
      userType,
      ...rest,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      id: req.user.uid,
      email: req.user.email || undefined,
    }, { merge: true });
    const snap = await ref.get();
    return res.json({ id: snap.id, ...snap.data() });
  } catch (error) {
    console.error('Error completing profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== Products (merchant) =====
app.get('/api/products/my', authenticateUser, async (req: any, res) => {
  try {
    const snap = await admin.firestore().collection('products')
      .where('ownerId', '==', req.user.uid)
      .orderBy('createdAt', 'desc').get();
    const items = snap.docs.map(d => {
      const data: any = d.data();
      return { id: d.id, ...data, isActive: data.isActive ?? data.enabled ?? true, enabled: data.enabled ?? data.isActive ?? true };
    });
    return res.json(items);
  } catch (error) {
    console.error('Error getting products:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products', authenticateUser, requireVerified, async (req: any, res) => {
  try {
    const data: any = {
      ...req.body,
      ownerId: req.user.uid,
      enabled: req.body?.isActive != null ? !!req.body.isActive : true,
      isActive: req.body?.isActive != null ? !!req.body.isActive : true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const ref = await admin.firestore().collection('products').add(data);
    const doc = await ref.get();
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/products/:productId', authenticateUser, requireVerified, async (req: any, res) => {
  try {
    const { productId } = req.params;
    const ref = admin.firestore().collection('products').doc(productId);
    const update: any = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (update.isActive != null) {
      update.enabled = !!update.isActive;
    }
    await ref.set(update, { merge: true });
    const doc = await ref.get();
    const data: any = doc.data();
    return res.json({ id: doc.id, ...data, isActive: data.isActive ?? data.enabled ?? true });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/products/:productId', authenticateUser, requireVerified, async (req: any, res) => {
  try {
    const { productId } = req.params;
    await admin.firestore().collection('products').doc(productId).delete();
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.all('/api/products/:productId/toggle', authenticateUser, requireVerified, async (req: any, res) => {
  try {
    const { productId } = req.params;
    const ref = admin.firestore().collection('products').doc(productId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    const body = req.body || {};
    let enabled: boolean;
    if (typeof body.isActive === 'boolean') {
      enabled = body.isActive;
    } else if (typeof body.enabled === 'boolean') {
      enabled = body.enabled;
    } else {
      enabled = !(snap.data()?.enabled ?? true);
    }
    await ref.update({ enabled, isActive: enabled, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    const doc = await ref.get();
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error toggling product:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Single GET product route is defined above
// Single DELETE product route is defined below

// ===== Integrations (merchant) =====
app.get('/api/integrations', async (req: any, res) => {
  try {
    const snap = await admin.firestore().collection('integrations')
      .where('ownerId','==', req.user.uid).get();
    return res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (error) {
    console.error('Error getting integrations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/integrations', async (req: any, res) => {
  try {
    const data = { ...req.body, ownerId: req.user.uid, enabled: true, createdAt: admin.firestore.FieldValue.serverTimestamp() };
    const ref = await admin.firestore().collection('integrations').add(data);
    const doc = await ref.get();
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error creating integration:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/integrations/:id/toggle', async (req: any, res) => {
  try {
    const { id } = req.params;
    const ref = admin.firestore().collection('integrations').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    const enabled = !(snap.data()?.enabled ?? true);
    await ref.update({ enabled, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    const doc = await ref.get();
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error toggling integration:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/integrations/:integrationId/sync', async (req: any, res) => {
  try {
    // Simula una sync con esito positivo
    return res.json({ status: 'ok', syncedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error syncing integration:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/integrations/test', async (req: any, res) => {
  try {
    // Test di connessione simulato
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false });
  }
});

// Copilot toggle
app.post('/api/copilot/toggle', async (req: any, res) => {
  try {
    const { isEnabled } = req.body || {};
    const ref = admin.firestore().collection('copilotConfigs').doc(req.user.uid);
    await ref.set({ isEnabled: !!isEnabled, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    const snap = await ref.get();
    return res.json({ id: snap.id, ...snap.data() });
  } catch (error) {
    console.error('Error toggling copilot:', error);
    return res.status(500).json({ message: 'Impossibile aggiornare copilot' });
  }
});

// Merchant analytics (stub)
app.get('/api/merchant/analytics', async (req: any, res) => {
  try {
    return res.json({
      totalViews: 123,
      conversionRate: 12.5,
      responseTime: 1.8,
      satisfactionRate: 96,
      activeOffers: 3,
    });
  } catch (error) {
    console.error('Error getting merchant analytics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
// Export the Express app as a Firebase Function
// Declare secrets so process.env.GEMINI_API_KEY / GOOGLE_API_KEY are available at runtime
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const GOOGLE_API_KEY = defineSecret("GOOGLE_API_KEY");

// Export API with required secrets (AI only). RESEND_API_KEY is optional and read from env if present.
export const api = functions.https.onRequest({ secrets: [GEMINI_API_KEY, GOOGLE_API_KEY] }, app);