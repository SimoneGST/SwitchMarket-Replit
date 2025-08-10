import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

// SEO Configuration per ogni pagina
const SEO_CONFIG = {
  '/': {
    title: 'Switch Market - Marketplace Locale AI con Assistenti Clemente e Leonardo',
    description: 'Switch Market è il marketplace locale italiano con assistenti AI. Trova prodotti nella tua zona con Clemente o vendi con Leonardo. Connessione intelligente tra clienti e negozianti.',
    keywords: 'marketplace locale, e-commerce Italia, negozi locali, assistente AI shopping, Clemente AI, Leonardo AI, vendita locale, acquisti zona, marketplace italiano, commercio locale'
  },
  '/login': {
    title: 'Accedi a Switch Market - Login Clienti e Negozianti',
    description: 'Accedi al tuo account Switch Market. Area riservata per clienti e negozianti. Login sicuro con Google OAuth.',
    keywords: 'login Switch Market, accesso account, area clienti, area negozianti, login sicuro'
  },
  '/come-funziona': {
    title: 'Come Funziona Switch Market - Guida Completa al Marketplace AI',
    description: 'Scopri come funziona Switch Market: il marketplace locale con assistenti AI. Guida per clienti e negozianti. Clemente e Leonardo ti assistono negli acquisti e vendite.',
    keywords: 'come funziona marketplace, guida Switch Market, assistenti AI spiegazione, Clemente Leonardo funzioni, tutorial marketplace locale'
  },
  '/create': {
    title: 'Crea Richiesta Prodotto - Assistente AI Clemente | Switch Market',
    description: 'Crea una richiesta di prodotto con l\'assistente AI Clemente. Trova esattamente quello che cerchi nei negozi della tua zona. AI-powered product search.',
    keywords: 'crea richiesta prodotto, Clemente AI assistente, cerca prodotti locali, richiesta negozi zona, assistente acquisti AI'
  },
  '/browse': {
    title: 'Esplora Prodotti Locali - Trova Negozi nella Tua Zona | Switch Market',
    description: 'Esplora prodotti e servizi nei negozi della tua zona. Marketplace locale geolocalizzato con ricerca intelligente AI.',
    keywords: 'esplora prodotti locali, negozi zona, ricerca geolocalizzata, prodotti vicini, marketplace geografico'
  },
  '/customer-dashboard': {
    title: 'Dashboard Cliente - Le Tue Richieste e Acquisti | Switch Market',
    description: 'Dashboard personale per clienti Switch Market. Gestisci le tue richieste, visualizza offerte ricevute e cronologia acquisti.',
    keywords: 'dashboard cliente, area personale, richieste prodotti, offerte ricevute, cronologia acquisti'
  },
  '/merchant-dashboard': {
    title: 'Dashboard Negoziante - Gestisci Vendite con Leonardo AI | Switch Market',
    description: 'Dashboard per negozianti Switch Market. Gestisci richieste clienti, crea offerte e ottimizza vendite con l\'assistente AI Leonardo.',
    keywords: 'dashboard negoziante, Leonardo AI assistente, gestione vendite, richieste clienti, offerte prodotti, vendite locali'
  }
};

export default function SEOHead({ 
  title, 
  description, 
  keywords, 
  ogImage = '/attached_assets/SWITCHMARKET_logo_1754845138370.png',
  canonicalUrl,
  noIndex = false 
}: SEOHeadProps) {
  const [location] = useLocation();
  
  useEffect(() => {
    // Ottieni configurazione SEO per la pagina corrente
    const pageConfig = SEO_CONFIG[location as keyof typeof SEO_CONFIG] || SEO_CONFIG['/'];
    
    // Usa i props se forniti, altrimenti la configurazione della pagina
    const finalTitle = title || pageConfig.title;
    const finalDescription = description || pageConfig.description;
    const finalKeywords = keywords || pageConfig.keywords;
    const finalCanonicalUrl = canonicalUrl || `https://switchmarket.replit.app${location}`;
    
    // Aggiorna title
    document.title = finalTitle;
    
    // Aggiorna meta tags
    updateMetaTag('description', finalDescription);
    updateMetaTag('keywords', finalKeywords);
    updateMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:160, max-image-preview:large');
    
    // Open Graph
    updateMetaProperty('og:title', finalTitle);
    updateMetaProperty('og:description', finalDescription);
    updateMetaProperty('og:url', finalCanonicalUrl);
    updateMetaProperty('og:image', `https://switchmarket.replit.app${ogImage}`);
    
    // Twitter Card
    updateMetaTag('twitter:title', finalTitle);
    updateMetaTag('twitter:description', finalDescription);
    updateMetaTag('twitter:image', `https://switchmarket.replit.app${ogImage}`);
    
    // Canonical URL
    updateCanonicalLink(finalCanonicalUrl);
    
  }, [location, title, description, keywords, ogImage, canonicalUrl, noIndex]);

  return null; // Questo componente non renderizza nulla
}

// Utility functions
function updateMetaTag(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

function updateMetaProperty(property: string, content: string) {
  let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.content = content;
}

function updateCanonicalLink(href: string) {
  let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = href;
}