# 🚀 DEPLOY SWITCH MARKET SU FIREBASE

## ✅ STATO ATTUALE
- **Build completato**: 1.34MB ottimizzato
- **Functions compilate**: Firebase Functions pronte
- **CORS configurato**: Domini .replit.app supportati
- **API testate**: Merchant verification, chat Clemente funzionanti

## 🔥 SETUP FIREBASE (5 minuti)

### 1. Crea Progetto Firebase
**Vai su**: https://console.firebase.google.com/

**Clicca "Aggiungi progetto":**
- Nome: `switch-market-prod`
- Google Analytics: Sì
- Account: Default

### 2. Configura Authentication
**Authentication → Inizia → Sign-in method:**
- Abilita **Google**
- Email supporto: tua email

**Settings → Authorized domains → Aggiungi:**
```
switch-market-guastellasimone.replit.app
```

### 3. Crea Database
**Firestore Database → Crea database:**
- Modalità: **Produzione**
- Location: **europe-west3**

### 4. Configura Storage
**Storage → Inizia:**
- Modalità: **Produzione**
- Location: **europe-west3**

### 5. Ottieni Config Web
**Project Settings → Your apps → Web:</>`**
- Nome: `switch-market-web`
- Hosting: ✅

**Copia questi 3 valori:**
- `apiKey`: per VITE_FIREBASE_API_KEY
- `projectId`: per VITE_FIREBASE_PROJECT_ID  
- `appId`: per VITE_FIREBASE_APP_ID

## 🔑 AGGIUNGI SECRETS REPLIT

**Tab Secrets in Replit →** Aggiungi questi 3:
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_PROJECT_ID=switch-market-prod
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 📱 COMANDI DEPLOY

**Nel terminale Replit:**
```bash
# 1. Login Firebase
firebase login

# 2. Seleziona progetto  
firebase use --add switch-market-prod

# 3. Deploy tutto
firebase deploy
```

## 🎯 RISULTATO FINALE

**URL App**: https://switch-market-prod.web.app
**Funzionalità attive:**
- Google Authentication
- Merchant verification P.IVA/C.F.
- Chat Clemente AI
- Dashboard Leonardo
- Real-time Firestore

**Tempo totale**: ~10 minuti per deploy completo!