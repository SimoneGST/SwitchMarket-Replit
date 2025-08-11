# 🚀 Deploy Completo Firebase - Switch Market

## 📋 Setup Immediato Firebase

### 1. Crea il Progetto Firebase
1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Clicca "Crea un progetto"
3. Nome progetto: `switch-market-prod` (o nome preferito)
4. Abilita Google Analytics

### 2. Configura Authentication
1. **Authentication** > **Inizia**
2. **Sign-in method** > Abilita **Google**
3. **Settings** > **Authorized domains** > Aggiungi:
   - `localhost`
   - `your-project-id.web.app`
   - `your-project-id.firebaseapp.com`

### 3. Configura Firestore Database
1. **Firestore Database** > **Crea database**
2. Modalità **Produzione**
3. Location: **europe-west** (EU)

### 4. Configura Storage
1. **Storage** > **Inizia**
2. Modalità **Produzione**
3. Stessa location di Firestore

### 5. Ottieni Configurazione
1. **Project Settings** (icona ingranaggio)
2. **Your apps** > Web app icon `</>`
3. Nome app: `switch-market-web`
4. Abilita **Firebase Hosting**
5. Copia i valori:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",                    // VITE_FIREBASE_API_KEY
  authDomain: "project.firebaseapp.com",
  projectId: "switch-market-prod",      // VITE_FIREBASE_PROJECT_ID  
  storageBucket: "project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"       // VITE_FIREBASE_APP_ID
};
```

## 🔑 Configurazione Secrets Replit

Vai alla tab **Secrets** di Replit e aggiungi:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_PROJECT_ID=switch-market-prod
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
GEMINI_API_KEY=your-gemini-api-key
```

## 🛠 Build e Deploy

### 1. Installa Firebase CLI (se non installato)
```bash
npm install -g firebase-tools
```

### 2. Login Firebase
```bash
firebase login
```

### 3. Inizializza Firebase (se non fatto)
```bash
firebase init
```
Seleziona:
- **Hosting**: Configure files for Firebase Hosting
- **Functions**: Configure a Cloud Functions directory  
- **Firestore**: Configure security rules and indexes files
- **Storage**: Configure a security rules file for Cloud Storage

### 4. Build Progetto
```bash
npm run build:firebase
```

### 5. Deploy Firebase Functions
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### 6. Deploy Hosting
```bash
firebase deploy --only hosting
```

### 7. Deploy Completo
```bash
firebase deploy
```

## 📁 Struttura File Deploy

```
switch-market/
├── dist/                    # Build frontend (auto-generato)
├── functions/               # Firebase Functions
│   ├── src/index.ts        # API routes principali
│   ├── package.json        # Dependencies functions
│   └── tsconfig.json       # Config TypeScript
├── firebase.json           # Config Firebase
├── firestore.rules         # Security rules Firestore
├── firestore.indexes.json  # Indexes Firestore
└── storage.rules           # Security rules Storage
```

## 🔥 Firebase Functions API

Le API sono deployate automaticamente:
- **Base URL**: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api`
- **Routes disponibili**:
  - `POST /api/merchant/verify` - Verifica business
  - `GET /api/merchant/stats` - Statistiche merchant
  - `POST /api/chat/clemente` - Chat Clemente AI
  - `GET /api/auth/user` - Dati utente
  - `POST /api/requests` - Crea richieste
  - `GET /api/requests/nearby` - Richieste nelle vicinanze

## 🌐 URL Finali

Dopo il deploy avrai:
- **Hosting**: `https://YOUR_PROJECT_ID.web.app`
- **Functions**: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net`
- **Custom domain**: Configurabile in Firebase Hosting

## 🚨 Domini Autorizzati Firebase

**IMPORTANTE**: Dopo deploy, aggiungi il dominio finale:
1. Firebase Console > Authentication > Settings > Authorized domains
2. Aggiungi: `YOUR_PROJECT_ID.web.app`
3. Se usi custom domain, aggiungilo anche

## 🔧 Risoluzione Problemi

### Build Error
```bash
# Pulisci cache e rebuilda
rm -rf dist/
rm -rf functions/lib/
npm run build:firebase
```

### Functions Error
```bash
# Verifica logs
firebase functions:log

# Redeploy solo functions (IMPORTANTE per fix CORS)
cd functions
npm run build
firebase deploy --only functions
```

### CORS Error (RISOLTO)
- Firebase Functions ora supportano tutti i domini (.replit.app, .web.app)
- Headers CORS configurati automaticamente
- Redeploy functions necessario per applicare fix

### Auth Error
- Verifica domini autorizzati in Firebase Console
- Controlla secrets VITE_FIREBASE_* in Replit

## ✅ Checklist Deploy

- [ ] Progetto Firebase creato
- [ ] Authentication configurato con Google
- [ ] Firestore Database attivo
- [ ] Storage configurato
- [ ] Secrets aggiunti in Replit
- [ ] Firebase CLI installato e login fatto
- [ ] Build eseguito con successo
- [ ] Functions deployate
- [ ] Hosting deployato
- [ ] Domini autorizzati aggiornati
- [ ] Test funzionalità principali

## 🎯 Test Post-Deploy

1. **Auth**: Login con Google
2. **Verifica Business**: Test P.IVA/C.F.
3. **Chat Clemente**: Test risposte AI  
4. **Dashboard**: Statistiche merchant
5. **Real-time**: Notifiche e aggiornamenti

Il progetto è ora completamente deployato su Firebase con tutte le funzionalità attive!