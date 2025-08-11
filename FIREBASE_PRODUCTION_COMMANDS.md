# 🔥 Firebase Deploy - Switch Market Production

## 📋 Pre-requisiti completati:
- ✅ Build frontend: 1.34MB ottimizzato
- ✅ Functions compilate: TypeScript → JavaScript
- ✅ Firebase CLI installato: v13.10.0
- ✅ CORS configurato per domini produzione

## 🚀 Comandi Deploy Production

### 1. Setup Progetto Firebase
**Firebase Console**: https://console.firebase.google.com/
- Crea progetto: `switch-market-prod`
- Authentication → Google Sign-in
- Firestore → Modalità produzione → europe-west3
- Storage → Modalità produzione → europe-west3

### 2. Secrets Replit
Aggiungi in **Secrets tab**:
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_PROJECT_ID=switch-market-prod
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Deploy Commands
```bash
# Login Firebase (manual su browser)
firebase login

# Link progetto
firebase use --add switch-market-prod

# Deploy backend prima (CORS fix)
firebase deploy --only functions

# Deploy frontend
firebase deploy --only hosting  

# Deploy database rules
firebase deploy --only firestore

# Deploy completo (se tutto ok)
firebase deploy
```

## 🎯 URL Finale
**Produzione**: https://switch-market-prod.web.app

## 📊 Funzionalità attive post-deploy:
- Google Authentication
- Merchant P.IVA/C.F. verification  
- Leonardo AI copilot dashboard
- Clemente AI chat system
- Real-time Firestore updates
- Geolocation services
- Toast notifications
- Merchant statistics

Deploy time stimato: 5-10 minuti