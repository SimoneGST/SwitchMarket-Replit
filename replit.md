# Switch Market - AI-First Local Marketplace

## Overview

Switch Market is an AI-powered local marketplace platform that connects buyers and sellers through intelligent assistants. The system features two main AI assistants: Clemente (for buyers) and Leonardo (for sellers). Built as a full-stack web application, it leverages React for the frontend, Express.js for the backend, and PostgreSQL with Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates

### Migrazione Completa a Firebase (10/08/2025)
- **Migrazione Backend**: Convertita tutta l'architettura da PostgreSQL + Replit Auth a Firebase
- **Firebase Authentication**: Sostituita Replit Auth con Firebase Auth + Google OAuth
- **Cloud Firestore**: Migrato da PostgreSQL a Firestore per scalabilità e real-time
- **Firebase Functions**: Backend serverless al posto di Express.js tradizionale
- **Firebase Storage**: Gestione file e media con regole di sicurezza avanzate
- **Firestore Security Rules**: Implementate regole granulari per protezione dati
- **Real-time Updates**: Chat e notifiche ora supportano aggiornamenti in tempo reale
- **Pagina "Come Funziona"**: Creata pagina informativa completa accessibile dalla landing
- **Deploy Automatico**: Configurato deployment su Firebase Hosting con CDN globale
- **Documentazione**: Aggiunta guida completa setup Firebase (FIREBASE_SETUP.md)
- **Login Page Aggiornata**: Implementata con colori distintivi verde (clienti) e blu (negozianti)
- **Google OAuth Configurato**: Autenticazione Google pronta per deploy su dominio pubblico
- **Build Completato**: App pronta per deployment con Firebase hosting integrato

### Funzionalità Precedenti (09/08/2025)
- Aggiunto campo `actionRadius` alle richieste per specificare il raggio massimo di spostamento (in km)
- Aggiunto campo `deliveryPreference` con opzioni: pickup (ritiro), delivery (spedizione), both (entrambe)
- **Nuovo**: Aggiunto campo `urgencyLevel` per gradi di urgenza nelle spedizioni: 24h, 48h, few_days
- **Logica migliorata**: Raggio di azione si applica SOLO al ritiro, non alla spedizione a casa
- Interfaccia utente aggiornata per gestire logica condizionale tra ritiro e spedizione
- Sistema di onboarding completato per distinguere clienti e negozianti
- **Integrazione AI avanzata**: Clemente ora usa Google Gemini per conversazioni naturali e specifiche tecniche
- **Leonardo AI**: Nuovo assistente per negozianti con consigli su prezzi e strategie di vendita
- API Gemini configurata per analisi intelligente delle richieste e estrazione dati strutturati
- **Upload File**: Pulsante allega per inoltrare foto e documenti agli assistenti AI
- **Comandi Vocali**: Microfono integrato per dettare messaggi usando riconoscimento vocale italiano
- **Sistema Integrazioni Gestionali**: Connessione con i maggiori software gestionali italiani
- **Supporto Fatture in Cloud**: API completa per sincronizzazione prodotti e giacenze
- **Supporto Danea EasyFatt**: Integrazione con gestionale desktop via API REST  
- **Supporto TeamSystem**: Connessione con suite gestionale enterprise
- **Sincronizzazione Automatica**: Aggiornamento prodotti in tempo reale o programmato
- **Pulsante "Collega Gestionale"**: Accesso diretto dalla dashboard negoziante
- **Copilot Leonardo Completo**: Servizio AI per assistere i negozianti nella gestione clienti
- **Dashboard Copilot Avanzata**: Configurazione personalità AI, orari operativi, statistiche conversazioni
- **Chat Leonardo Integrata**: Interfaccia completa con riconoscimento vocale e supporto allegati
- **API Copilot Complete**: Gestione sessioni, messaggi automatici e analisi conversazioni
- **Collegamento Dashboard**: Accesso rapido al copilot dalla dashboard negoziante

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