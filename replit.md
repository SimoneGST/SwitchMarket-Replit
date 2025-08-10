# Switch Market - AI-First Local Marketplace

## Overview

Switch Market is an AI-powered local marketplace platform that connects buyers and sellers through intelligent assistants. The system features two main AI assistants: Clemente (for buyers) and Leonardo (for sellers). Built as a full-stack web application, it leverages React for the frontend, Express.js for the backend, and PostgreSQL with Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates

### Raggio di Azione e Modalità di Consegna (09/08/2025)
- Aggiunto campo `actionRadius` alle richieste per specificare il raggio massimo di spostamento (in km)
- Aggiunto campo `deliveryPreference` con opzioni: pickup (ritiro), delivery (spedizione), both (entrambe)
- **Nuovo**: Aggiunto campo `urgencyLevel` per gradi di urgenza nelle spedizioni: 24h, 48h, few_days
- **Logica migliorata**: Raggio di azione si applica SOLO al ritiro, non alla spedizione a casa
- Interfaccia utente aggiornata per gestire logica condizionale tra ritiro e spedizione
- Sistema di onboarding completato per distinguere clienti e negozianti
- Preparazione per integrazione servizi di consegna terzi (tipo Deliveroo) mantenendo missione locale
- **Integrazione AI avanzata**: Clemente ora usa Google Gemini per conversazioni naturali e specifiche tecniche
- **Leonardo AI**: Nuovo assistente per negozianti con consigli su prezzi e strategie di vendita
- API Gemini configurata per analisi intelligente delle richieste e estrazione dati strutturati
- **Upload File**: Pulsante allega per inoltrare foto e documenti agli assistenti AI
- **Comandi Vocali**: Microfono integrato per dettare messaggi usando riconoscimento vocale italiano
- Object Storage configurato per gestione sicura degli allegati
- **Sistema Integrazioni Gestionali**: Connessione con i maggiori software gestionali italiani
- **Supporto Fatture in Cloud**: API completa per sincronizzazione prodotti e giacenze
- **Supporto Danea EasyFatt**: Integrazione con gestionale desktop via API REST  
- **Supporto TeamSystem**: Connessione con suite gestionale enterprise
- **Sincronizzazione Automatica**: Aggiornamento prodotti in tempo reale o programmato
- **Pulsante "Collega Gestionale"**: Accesso diretto dalla dashboard negoziante
- **Copilot Leonardo Completo (10/08/2025)**: Servizio AI per assistere i negozianti nella gestione clienti
- **Dashboard Copilot Avanzata**: Configurazione personalità AI, orari operativi, statistiche conversazioni
- **Chat Leonardo Integrata**: Interfaccia completa con riconoscimento vocale e supporto allegati
- **API Copilot Complete**: Gestione sessioni, messaggi automatici e analisi conversazioni
- **Collegamento Dashboard**: Accesso rapido al copilot dalla dashboard negoziante

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled using Vite for fast development
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling via class-variance-authority

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database interactions
- **Authentication**: Replit Auth integration with session-based authentication
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple

### Database Design
- **Primary Database**: PostgreSQL via Neon serverless
- **Schema Management**: Drizzle migrations with schema defined in shared directory
- **Key Entities**:
  - Users (mandatory for Replit Auth with userType, business verification fields)
  - Requests (buyer purchase requests with actionRadius and deliveryPreference)
  - Offers (seller responses to requests)
  - Conversations and Messages (communication between parties)
  - Sessions (authentication state)

### API Architecture
- **Pattern**: RESTful API with Express routes
- **Data Validation**: Zod schemas for request/response validation
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Request Logging**: Custom middleware for API call tracking

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL backing store
- **Security**: HTTP-only cookies, CSRF protection, secure session configuration
- **User Management**: Automatic user creation/update via auth middleware

### File Structure & Organization
- **Monorepo Structure**: Shared schema between client and server
- **Client Directory**: React application with component-based architecture
- **Server Directory**: Express API with modular route handling
- **Shared Directory**: Common TypeScript types and database schema
- **Asset Management**: Vite-based asset handling with path aliases

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit Auth service for user management
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation

### Frontend Libraries
- **UI Framework**: React with shadcn/ui component system
- **Styling**: Tailwind CSS with PostCSS processing
- **Icons**: Font Awesome for iconography
- **Data Fetching**: TanStack Query for API state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Dependencies
- **Database**: Drizzle ORM with Neon serverless driver
- **Session Storage**: connect-pg-simple for PostgreSQL session store
- **Validation**: Zod for runtime type checking
- **Utilities**: date-fns for date manipulation, memoizee for caching

### Development Tools
- **Type Checking**: TypeScript compiler with strict configuration
- **Linting & Formatting**: Built-in Vite dev server with hot reload
- **Environment**: Replit-specific plugins for development experience