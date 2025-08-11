# Deploy e Autenticazione Google - Switch Market

## PROBLEMA IDENTIFICATO ✅
Hai ragione! L'autenticazione Google può funzionare in sviluppo ma fallire dopo il deploy per questi motivi:

### 1. Domini Autorizzati Mancanti
Firebase blocca l'autenticazione da domini non autorizzati. Quando fai il deploy su Replit:
- **Dev URL**: `3c74d7c6-3cc3-4419-9af7-a666a3e55242-00-2m5vbwa31cjap.kirk.replit.dev`
- **Deploy URL**: `*.replit.app` (il tuo dominio di produzione)

### 2. Configurazione OAuth Incompleta
Google OAuth richiede pubblicazione dell'app per domini di produzione.

## SOLUZIONE - Prima del Deploy

### Passo 1: Configurazione Firebase Console
1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Seleziona il progetto `switchmarket-pro`
3. **Authentication** > **Settings** > **Authorized domains**
4. Aggiungi questi domini:
   ```
   3c74d7c6-3cc3-4419-9af7-a666a3e55242-00-2m5vbwa31cjap.kirk.replit.dev
   *.replit.dev
   *.replit.app
   localhost
   ```

### Passo 2: Google Cloud Console OAuth
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Seleziona il progetto Firebase
3. **APIs & Services** > **Credentials**
4. Modifica il client OAuth 2.0
5. **Authorized redirect URIs** - aggiungi:
   ```
   https://switchmarket-pro.firebaseapp.com/__/auth/handler
   https://[TUO-REPLIT-DEPLOY-URL].replit.app/__/auth/handler
   ```

### Passo 3: Pubblicazione App OAuth
1. **APIs & Services** > **OAuth consent screen**
2. Cambia da "Testing" a "In production"
3. Clicca "Publish App"

## RISULTATO ATTESO
✅ Autenticazione Google funzionante sia in dev che in produzione
✅ Nessuna pagina bianca
✅ Redirect OAuth corretti

## DEPLOY REPLIT
Dopo la configurazione Firebase:
1. Clicca il pulsante **Deploy** in Replit
2. Configura il dominio personalizzato se necessario
3. Aggiungi il nuovo URL ai domini autorizzati Firebase

## NOTE IMPORTANTI
- ⚠️ **I domini devono essere configurati PRIMA del deploy**
- ⚠️ **Ogni nuovo deploy URL deve essere autorizzato**
- ⚠️ **La pubblicazione OAuth è obbligatoria per produzione**

## TEST POST-DEPLOY
1. Verifica autenticazione Google su dominio di produzione
2. Controlla che il redirect funzioni correttamente
3. Testa sia login che registrazione