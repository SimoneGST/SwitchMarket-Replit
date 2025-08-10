# Firebase Setup Guide per Switch Market

## 📋 Prerequisiti

1. Account Google/Firebase
2. Node.js 20+ installato
3. Firebase CLI: `npm install -g firebase-tools`

## 🚀 Setup Iniziale Firebase

### 1. Crea il Progetto Firebase

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Clicca "Crea un progetto"
3. Nome progetto: `switch-market` (o il nome che preferisci)
4. Abilita Google Analytics (opzionale)

### 2. Configura Authentication

1. Nel Firebase Console, vai su **Authentication**
2. Clicca **Inizia**
3. Tab **Sign-in method**:
   - Abilita **Google**
   - Aggiungi domini autorizzati:
     - `localhost` (per sviluppo)
     - `switch-market-guestellasimone.replit.app` (dominio Replit corrente)
     - `3c74d7c6-3cc3-4419-9af7-a666a3e55242-00-2m5vbwa31cjap.kirk.replit.dev` (dominio preview Replit)
     - Il tuo dominio di produzione
     - `your-project-id.firebaseapp.com`
     - `your-project-id.web.app`

**IMPORTANTE**: Dopo il deploy su Replit, devi aggiungere il dominio Replit ai domini autorizzati:
1. Vai su Firebase Console > Authentication > Settings > Authorized domains
2. Clicca "Add domain" 
3. Inserisci: `switch-market-guestellasimone.replit.app`
4. Salva le modifiche

### 3. Configura Firestore Database

1. Vai su **Firestore Database**
2. Clicca **Crea database**
3. Modalità **Produzione** (le regole di sicurezza sono già configurate)
4. Scegli la location (europe-west per EU)

### 4. Configura Storage

1. Vai su **Storage**
2. Clicca **Inizia**
3. Modalità **Produzione**
4. Stessa location di Firestore

### 5. Ottieni le Chiavi di Configurazione

1. Vai su **Impostazioni progetto** (icona ingranaggio)
2. Scorri fino a "Le tue app"
3. Clicca icona Web `</>`
4. Nome app: `switch-market-web`
5. Abilita **Firebase Hosting**
6. Copia i valori di configurazione:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",           // VITE_FIREBASE_API_KEY
  authDomain: "project-id.firebaseapp.com",
  projectId: "your-project-id",     // VITE_FIREBASE_PROJECT_ID  
  storageBucket: "project-id.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefg"  // VITE_FIREBASE_APP_ID
};
```

## 🔑 Configurazione Segreti

Inserisci questi valori nel sistema di secrets:

- `VITE_FIREBASE_API_KEY`: Il tuo Firebase API Key
- `VITE_FIREBASE_PROJECT_ID`: Il tuo Firebase Project ID  
- `VITE_FIREBASE_APP_ID`: Il tuo Firebase App ID

## 📱 Sviluppo Locale

### Emulatori Firebase (Opzionale)

Per testare localmente senza toccare i dati di produzione:

```bash
# Installa Firebase CLI
npm install -g firebase-tools

# Login a Firebase
firebase login

# Inizializza il progetto
firebase init

# Avvia emulatori
firebase emulators:start
```

Gli emulatori sono già configurati per connettersi automaticamente in modalità development.

## 🚀 Deployment

### Opzione 1: Firebase Hosting (Raccomandato)

```bash
# Build del progetto
npm run build

# Deploy su Firebase
firebase deploy
```

### Opzione 2: Replit Deployments (Alternativo)

Il progetto funziona anche su Replit Deployments mantenendo Firebase come backend.

## 🗂️ Struttura Database Firestore

Il database è organizzato in queste collezioni:

- `users` - Profili utenti
- `requests` - Richieste di acquisto
- `offers` - Offerte dei venditori  
- `conversations` - Chat tra utenti
- `conversations/{id}/messages` - Messaggi delle chat
- `products` - Catalogo prodotti negozianti
- `integrations` - Integrazioni gestionali
- `copilotConfigs` - Configurazioni AI
- `copilotSessions` - Sessioni chat AI

## 🔒 Sicurezza

- ✅ Autenticazione Google obbligatoria
- ✅ Regole Firestore configurate per privacy
- ✅ Storage regole per upload sicuri
- ✅ Validazione lato server nelle Functions

## 🛠️ API Endpoints

Le Firebase Functions espongono questi endpoint:

- `GET /api/user` - Profilo utente
- `PUT /api/user` - Aggiorna profilo
- `POST /api/requests` - Crea richiesta
- `GET /api/requests` - Lista richieste
- `GET /api/requests/my` - Mie richieste
- `POST /api/offers` - Crea offerta
- `GET /api/requests/:id/offers` - Offerte per richiesta
- `POST /api/conversations` - Crea conversazione
- `GET /api/conversations` - Mie conversazioni
- `POST /api/conversations/:id/messages` - Invia messaggio
- `GET /api/conversations/:id/messages` - Messaggi conversazione

## 🔧 Troubleshooting

### Errore "auth/invalid-api-key"
- Verifica che `VITE_FIREBASE_API_KEY` sia configurato correttamente
- Controlla che la chiave non abbia spazi o caratteri extra

### Errore permessi Firestore
- Verifica che l'utente sia autenticato
- Controlla le regole Firestore in Firebase Console

### Errore deploy
- Verifica che Firebase CLI sia aggiornato: `npm update -g firebase-tools`
- Controlla le quote del progetto Firebase

## 🎯 Vantaggi Firebase

✅ **Scalabilità automatica** - Da 0 a milioni di utenti  
✅ **Real-time** - Chat e notifiche in tempo reale  
✅ **Sicurezza** - Autenticazione e autorizzazione integrate  
✅ **Hosting globale** - CDN mondiale incluso  
✅ **Backup automatici** - Dati sempre protetti  
✅ **Analytics** - Statistiche utenti integrate  
✅ **Costi variabili** - Pay-as-you-go  

## 📊 Monitoraggio

Firebase Console fornisce:
- Analytics utenti in tempo reale
- Performance monitoring
- Error reporting  
- Usage statistics
- Crash reporting