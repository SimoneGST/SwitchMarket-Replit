# Risoluzione Problema Google Authentication

## Il Problema
La pagina diventa bianca dopo la selezione dell'account Google perché il dominio del Replit non è autorizzato in Firebase Console.

## Soluzione - Configurazione Firebase Console

### 1. Aggiungi Domini Autorizzati
1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Seleziona il progetto `switchmarket-pro`
3. Vai su **Authentication** > **Settings** > **Authorized domains**
4. Aggiungi questi domini:
   - `3c74d7c6-3cc3-4419-9af7-a666a3e55242-00-2m5vbwa31cjap.kirk.replit.dev`
   - `switchmarket-pro.replit.app` (se hai fatto il deploy)
   - `localhost` (per sviluppo locale)

### 2. Verifica Configurazione OAuth
1. In Firebase Console, vai su **Authentication** > **Sign-in method**
2. Assicurati che **Google** sia abilitato
3. Verifica che l'email di supporto sia configurata

### 3. Domini da Autorizzare
Per questo Replit, aggiungi ESATTAMENTE questi domini:
```
3c74d7c6-3cc3-4419-9af7-a666a3e55242-00-2m5vbwa31cjap.kirk.replit.dev
*.replit.dev
*.replit.app
localhost
```

## Risultato Atteso
Dopo aver aggiunto i domini, l'autenticazione Google funzionerà senza pagina bianca.

## Note Tecniche
- Firebase blocca domini non autorizzati per sicurezza
- Il redirect OAuth deve tornare a un dominio autorizzato
- La configurazione è necessaria per ogni nuovo dominio Replit