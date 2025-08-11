# 🧪 Test Completo Firebase Deploy - Switch Market

## 📋 Checklist Test Pre-Deploy

### ✅ Completato:
- [x] Firebase Functions compilano senza errori TypeScript
- [x] CORS configurato per domini .replit.app
- [x] Build frontend completato con successo (1.34MB)
- [x] Firebase CLI installato
- [x] Middleware authentication per API protette
- [x] Routes principali implementate (verification, chat, stats)

### 🔄 In Corso:
- [ ] Firebase login
- [ ] Deploy Functions con fix CORS
- [ ] Deploy Hosting frontend
- [ ] Test API dal dominio deployato
- [ ] Verifica autenticazione Google
- [ ] Test merchant verification
- [ ] Test chat Clemente

## 🚀 Sequenza Deploy

### 1. Firebase Login
```bash
firebase login --no-localhost
```

### 2. Deploy Functions (Prima per fix CORS)
```bash
cd functions
npm run build
firebase deploy --only functions
```

### 3. Deploy Hosting
```bash
firebase deploy --only hosting
```

### 4. Deploy Completo
```bash
firebase deploy
```

## 🧪 Test Funzionalità

### API Endpoints da Testare:
- `GET /` - Health check API
- `POST /api/merchant/verify` - Verifica business P.IVA/C.F.
- `GET /api/merchant/stats` - Statistiche merchant
- `POST /api/chat/clemente` - Chat AI Clemente
- `GET /api/auth/user` - Dati utente autenticato

### Frontend Pages da Testare:
- `/` - Landing page
- `/auth` - Google Authentication
- `/merchant-verification` - Verifica business
- `/leonardo-copilot` - Dashboard Leonardo
- `/merchant-integrations` - Integrazioni

### Scenari di Test:
1. **Auth Flow**: Login Google → Redirect corretto
2. **Merchant Verification**: P.IVA/C.F. → Leonardo attivato
3. **API Communication**: Frontend → Firebase Functions
4. **CORS**: No errori cross-origin
5. **Real-time**: Firestore updates in tempo reale

## 🔍 Debug e Monitoring

### Firebase Console:
- Functions logs per errori
- Firestore collections per dati
- Authentication per utenti
- Hosting per deploy status

### Browser DevTools:
- Network tab per API calls
- Console per errori JavaScript
- Application tab per Firebase Auth token

Il test completo verificherà che Switch Market funzioni al 100% su Firebase!