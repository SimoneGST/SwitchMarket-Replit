# ⚡ Firebase Setup - switchmarket-pro

## ✅ Progetto già creato: switchmarket-pro

### 📱 Configurazione Firebase Console:

**1. Authentication Setup:**
- Vai su **Authentication** → **Inizia**
- **Sign-in method** → **Google** → **Abilita**
- Email supporto: inserisci la tua email

**2. Firestore Database:**
- **Firestore Database** → **Crea database**
- Modalità: **Produzione**
- Location: **europe-west3** (Frankfurt)

**3. Storage:**
- **Storage** → **Inizia**  
- Modalità: **Produzione**
- Location: **europe-west3**

**4. Web App Config:**
- **Project Settings** (icona ingranaggio)
- **Your apps** → **Web** `</>`
- Nome app: `switch-market-web`
- **Firebase Hosting**: ✅ Abilita
- **Registra app**

**5. Copia Config per Secrets:**
```javascript
// Dalla sezione "SDK setup and configuration"
apiKey: "AIza..."           → VITE_FIREBASE_API_KEY
projectId: "switchmarket-pro" → VITE_FIREBASE_PROJECT_ID
appId: "1:123456789:web:abc123" → VITE_FIREBASE_APP_ID
```

## 🔑 Secrets da aggiungere in Replit:
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_PROJECT_ID=switchmarket-pro
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 🚀 Deploy Commands (terminale Replit):
```bash
firebase login
firebase use --add switchmarket-pro
firebase deploy
```

URL finale: **https://switchmarket-pro.web.app**