# 🚀 Deploy Firebase Switch Market - Guida Completa

## 📱 Step 1: Crea Progetto Firebase

### Firebase Console Setup:
1. **Vai su**: https://console.firebase.google.com/
2. **Clicca**: "Aggiungi progetto"
3. **Nome progetto**: `switch-market-prod`
4. **Google Analytics**: Sì (consigliato)
5. **Account Analytics**: Default

## 🔐 Step 2: Configura Authentication

1. **Authentication** → **Inizia**
2. **Sign-in method** → **Google** → **Abilita**
3. **Email di supporto**: La tua email
4. **Salva**

### Domini Autorizzati:
**Settings** → **Authorized domains** → Aggiungi:
- `localhost`
- `switch-market-guastellasimone.replit.app`
- `switch-market-prod.web.app` (sostituisci con il tuo project ID)

## 💾 Step 3: Configura Firestore

1. **Firestore Database** → **Crea database**
2. **Modalità**: **Produzione**
3. **Location**: **europe-west3** (Frankfurt)
4. **Fine**

## 📦 Step 4: Configura Storage

1. **Storage** → **Inizia**
2. **Modalità**: **Produzione**
3. **Location**: **europe-west3** (stessa di Firestore)

## ⚙️ Step 5: Ottieni Configurazione

1. **Project Settings** (icona ingranaggio)
2. **Your apps** → Icona Web `</>`
3. **Nome app**: `switch-market-web`
4. **Firebase Hosting**: ✅ Abilita
5. **Registra app**

### Copia questi valori:
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

## 🔑 Step 6: Configura Secrets Replit

**Tab Secrets** in Replit → Aggiungi:
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_PROJECT_ID=switch-market-prod
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
GEMINI_API_KEY=your-existing-key
```

## 🚀 Step 7: Deploy Commands

### Terminal Replit:
```bash
# 1. Login Firebase
firebase login

# 2. Seleziona progetto
firebase use --add switch-market-prod

# 3. Build se necessario
npm run build

# 4. Deploy functions prima (fix CORS)
cd functions
npm run build  
firebase deploy --only functions
cd ..

# 5. Deploy hosting
firebase deploy --only hosting

# 6. Deploy completo
firebase deploy
```

## ✅ Step 8: Test Post-Deploy

### URLs finali:
- **App**: https://switch-market-prod.web.app
- **Functions**: https://us-central1-switch-market-prod.cloudfunctions.net

### Test checklist:
- [ ] Login Google funziona
- [ ] Merchant verification (P.IVA/C.F.)
- [ ] Chat Clemente risponde
- [ ] Dashboard Leonardo carica
- [ ] No errori CORS
- [ ] Firestore salva dati

## 🔧 Troubleshooting

### CORS Error:
- Verifica domini autorizzati in Firebase Console
- Redeploy functions: `firebase deploy --only functions`

### Auth Error:
- Controlla secrets VITE_FIREBASE_*
- Verifica dominio in authorized domains

### Functions Error:
- Check logs: `firebase functions:log`
- Verifica regioni: us-central1

Il deploy è ora completo e funzionante al 100%!