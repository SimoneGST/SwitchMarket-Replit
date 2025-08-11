# ⚠️ IMPORTANTE: Switch Market usa FIREBASE, non Replit Deploy

## 🔄 Dove ti trovi ora:
Se vedi opzioni come "Reserved VM, Autoscale, Static, Scheduled" stai guardando **Replit Deploy** che NON è quello giusto per Switch Market.

## ✅ Quello che devi fare:

### 1. IGNORA Replit Deploy
- Non cliccare su Reserved VM/Autoscale
- Switch Market è configurato per Firebase

### 2. VAI SU FIREBASE CONSOLE
**URL**: https://console.firebase.google.com/

### 3. CREA PROGETTO FIREBASE
- Clicca "Aggiungi progetto"
- Nome: `switch-market-prod`
- Abilita Google Analytics: Sì

### 4. CONFIGURA SERVIZI
**Authentication:**
- Vai su Authentication → Inizia
- Sign-in method → Google → Abilita

**Firestore Database:**
- Vai su Firestore Database → Crea database
- Modalità: Produzione
- Location: europe-west3

**Storage:**
- Vai su Storage → Inizia
- Modalità: Produzione

### 5. OTTIENI CONFIG WEB
- Project Settings (icona ingranaggio)
- Your apps → Web icon `</>`
- Nome app: `switch-market-web`
- Firebase Hosting: ✅ Abilita

**Copia questi valori per Replit Secrets:**
- apiKey → VITE_FIREBASE_API_KEY
- projectId → VITE_FIREBASE_PROJECT_ID
- appId → VITE_FIREBASE_APP_ID

### 6. DEPLOY DA TERMINALE REPLIT
```bash
firebase login
firebase use --add switch-market-prod
firebase deploy
```

## ❌ NON USARE:
- Replit Deploy button
- Reserved VM
- Autoscale
- Static pages

## ✅ USA SOLO:
- Firebase Console
- Firebase CLI commands
- Terminal Replit

Switch Market diventerà disponibile su: `https://switch-market-prod.web.app`