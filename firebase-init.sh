#!/bin/bash

# Script per inizializzazione completa Firebase
echo "🔥 Configurazione Firebase Switch Market"

# Check se firebase è installato
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI non trovato"
    exit 1
fi

echo "📋 Prossimi passi manuali:"
echo "1. Vai su https://console.firebase.google.com/"
echo "2. Crea nuovo progetto: 'switch-market-prod'"
echo "3. Abilita Authentication > Google Sign-in"
echo "4. Crea Firestore Database (modalità produzione)"
echo "5. Configura Storage"
echo ""
echo "6. Poi esegui i comandi:"
echo "   firebase login"
echo "   firebase use --add switch-market-prod"
echo "   firebase deploy"
echo ""
echo "7. Aggiungi secrets in Replit:"
echo "   VITE_FIREBASE_API_KEY=..."
echo "   VITE_FIREBASE_PROJECT_ID=switch-market-prod"
echo "   VITE_FIREBASE_APP_ID=..."

# Check status build
if [ -d "dist" ]; then
    echo "✅ Build frontend completato"
else
    echo "⚠️  Build necessario: npm run build"
fi

# Check status functions
if [ -d "functions/lib" ]; then
    echo "✅ Functions compilate"
else
    echo "⚠️  Compile functions: cd functions && npm run build"
fi

echo ""
echo "🚀 Ready per deploy quando Firebase è configurato!"