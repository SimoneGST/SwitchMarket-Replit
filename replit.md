# Switch Market - AI-First Local Marketplace

## Overview

Switch Market is an AI-powered local marketplace platform that connects buyers and sellers through intelligent assistants. The system features two main AI assistants: Clemente (for buyers) and Leonardo (for sellers). Built as a full-stack web application, it leverages React for the frontend, Express.js for the backend, and PostgreSQL with Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates

### Deploy Firebase Ready (11/08/2025)
- **Firebase Functions**: Backend completo migrato da PostgreSQL a Firestore
- **API Routes**: Merchant verification, chat Clemente, user management, requests system
- **Build System**: Script automatizzato build-firebase.js per deploy ottimizzato
- **Notifiche Toast**: Sistema centralizzato con categorie predefinite e gestione errori automatica
- **Documentation**: Guida completa deploy Firebase con checklist e troubleshooting
- **Production Ready**: Configurazione hosting, functions, auth, storage pronta per deploy

### Test End-to-End Completati con Successo (11/08/2025)
- **Geolocalizzazione**: Sistema di filtro geografico con formula Haversine perfettamente funzionante
- **Intelligenza Clemente**: Riconoscimento automatico prodotti e generazione schemi dinamici (chitarre, laptop gaming, auto, pasta maker)
- **Conversazioni Realistiche**: Sistema messaggi acquirente-negoziante con trattative su scarpe Shimano e iPhone 15
- **Database Completo**: 5 utenti test, 3 richieste, 3 offerte, 8 messaggi di conversazione autentica
- **Bug Risolti**: Errore validazione schema ProductSchema, sistema ora stabile e affidabile

### Sistema Schede Prodotto Intelligenti v2.0 (11/08/2025)
- **Schema Completo**: Tutti i campi essenziali: nome prodotto, descrizione, categoria, taglia/misura, materiale, colore, budget min/max, localizzazione
- **Geolocalizzazione Integrata**: Pulsante "rileva posizione" con coordinate GPS, opzione "usa profilo utente"
- **Campi Dinamici**: Si adattano automaticamente per categoria (colore/taglia solo per abbigliamento, dimensioni per mobili, specifiche per elettronica)
- **Sistema Completo**: Urgenza (immediato, 24h, 48h, qualche giorno), consegna (ritiro/delivery/entrambi), raggio azione km
- **Condizioni Prodotto**: Nuovo, usato, ricondizionato sempre specificati
- **Progresso Visivo**: Calcolo dinamico completamento con soglia 70% per pubblicazione
- **No Campi Opzionali**: Tutti i dati necessari sempre raccolti, mai specifiche generiche

### Risoluzione Definitiva Chat Clemente (11/08/2025)
- **CORS Express**: Middleware CORS configurato correttamente sul server Express
- **Comunicazione Diretta**: Chat Clemente usa fetch diretto al server locale (no Firebase Functions)
- **Sistema Robusto**: Eliminati problemi di autenticazione per API pubblica di chat
- **Error Handling**: Gestione errori completa senza pagine bianche
- **Preparazione Deploy**: Firebase CLI installato per deployment production

### Branding e SEO Professionale (10/08/2025)
- **Visual Identity**: Logo e assistenti AI integrati in tutte le pagine, mobile nav ottimizzato
- **SEO Completo**: Meta tags italiani, Schema.org, Open Graph, robots.txt, sitemap
- **Analytics Avanzato**: Google Analytics con Enhanced E-commerce, conversion tracking
- **Marketing Ready**: Keywords strategy, ROI tracking, Google Search Console setup
- **Performance**: Core Web Vitals monitoring, local SEO per negozianti

### Clemente AI con Supporto Vocale e Animazioni (10/08/2025)
- **Interfaccia Vocale**: Text-to-Speech italiano, chat hands-free, controlli vocali
- **Navigazione Vocale**: Comandi globali per controllo app, preparazione smart speakers
- **Conversazione Naturale**: Risposte concise, una domanda alla volta, tono amichevole
- **Generazione Richieste**: Specifiche dettagliate per negozianti, approccio educativo bilanciato
- **UX Ottimizzata**: Auto-scroll chat, pulsanti visibili, allegati con analisi Gemini
- **Animazioni Introduttive**: Al primo accesso, controllo utente "Non mostrare più"
- **Gestione Preferenze**: Sistema localStorage persistente per scelte utente

### Landing e Auth Rinnovate (10/08/2025)
- **Design Moderno**: Gradienti, animazioni, cards interattive con effetti hover
- **UX Migliorata**: Selezione utente intuitiva, form eleganti, feedback visivi
- **Integrazione API**: VITE_GEMINI_API_KEY configurato, design system green/blue

### Migrazione Firebase (10/08/2025)
- **Architettura**: Da PostgreSQL/Replit Auth a Firebase completo (Auth, Firestore, Functions, Storage)
- **Real-time**: Chat e notifiche con aggiornamenti istantanei
- **Security**: Firestore Security Rules granulari, Google OAuth configurato
- **Deploy Ready**: Firebase Hosting con CDN, documentazione setup completa
- **Google Auth Fix**: Risolto problema pagina bianca con configurazione domini autorizzati Firebase Console

### Funzionalità Avanzate (09/08/2025)
- **Geolocalizzazione**: actionRadius, deliveryPreference (pickup/delivery/both), urgencyLevel
- **AI Assistenti**: Clemente (clienti) e Leonardo (negozianti) con Google Gemini
- **Integrazione Vocale**: Riconoscimento vocale italiano, upload file e documenti
- **Gestionali Italiani**: Fatture in Cloud, Danea EasyFatt, TeamSystem con sync automatica
- **Copilot Leonardo**: Dashboard avanzata, configurazione personalità, chat integrata, analytics

### Ottimizzazioni Recenti (10/08/2025)
- **Asset Management**: Foto profilo per elementi piccoli, busto intero solo per animazioni introduttive
- **Consistenza Visiva**: Standardizzazione immagini assistenti AI in tutta l'applicazione
- **Performance**: Ridotte ripetizioni documentazione, codice più pulito e manutenibile

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled using Vite for fast development
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: Firebase SDK for real-time data and authentication state
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling via class-variance-authority

### Backend Architecture
- **Runtime**: Firebase Functions (Node.js 20) for serverless backend
- **Language**: TypeScript with Firebase Admin SDK
- **Database**: Cloud Firestore for NoSQL document database
- **Authentication**: Firebase Authentication with Google OAuth
- **Storage**: Firebase Storage for file uploads and media

### Database Design
- **Primary Database**: Cloud Firestore NoSQL database
- **Security**: Firestore Security Rules for granular access control
- **Key Collections**:
  - users (user profiles with userType, business verification fields)
  - requests (buyer purchase requests with actionRadius and deliveryPreference)
  - offers (seller responses to requests)
  - conversations (communication threads between parties)
  - conversations/{id}/messages (individual messages)
  - products (merchant catalogs)
  - integrations (gestionale connections)
  - copilotConfigs (AI assistant settings)

### API Architecture
- **Pattern**: RESTful API with Express routes
- **Data Validation**: Zod schemas for request/response validation
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Request Logging**: Custom middleware for API call tracking

### Authentication & Authorization
- **Provider**: Firebase Authentication with Google OAuth 2.0
- **Session Management**: Firebase Auth tokens with automatic refresh
- **Security**: Firestore Security Rules, Firebase Admin SDK validation
- **User Management**: Automatic user document creation/update via Firebase Auth triggers

### File Structure & Organization
- **Monorepo Structure**: Shared schema between client and server
- **Client Directory**: React application with component-based architecture
- **Server Directory**: Express API with modular route handling
- **Shared Directory**: Common TypeScript types and database schema
- **Asset Management**: Vite-based asset handling with path aliases

## External Dependencies

### Core Infrastructure
- **Database**: Cloud Firestore NoSQL database
- **Authentication**: Firebase Authentication service
- **Hosting**: Firebase Hosting with global CDN
- **Functions**: Firebase Functions for serverless backend
- **Storage**: Firebase Storage for file management
- **Build Tools**: Vite for frontend bundling, Firebase CLI for deployment

### Frontend Libraries
- **UI Framework**: React with shadcn/ui component system
- **Styling**: Tailwind CSS with PostCSS processing
- **Icons**: Font Awesome for iconography
- **Data Fetching**: TanStack Query for API state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Dependencies
- **Database**: Firebase Admin SDK for Firestore operations
- **Authentication**: Firebase Admin SDK for token verification
- **Validation**: Firebase Security Rules and server-side validation
- **Utilities**: Firebase Functions runtime and Google Cloud services

### Development Tools
- **Type Checking**: TypeScript compiler with strict configuration
- **Linting & Formatting**: Built-in Vite dev server with hot reload
- **Environment**: Replit-specific plugins for development experience