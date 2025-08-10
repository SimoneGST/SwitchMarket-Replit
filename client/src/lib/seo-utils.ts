// SEO Utilities per Switch Market
// Funzioni per ottimizzazione motori di ricerca

export function generateMetaDescription(type: 'product_request' | 'merchant_offer' | 'general', data?: any): string {
  switch (type) {
    case 'product_request':
      return `Cerca ${data?.title || 'prodotti'} nella tua zona con Switch Market. Assistente AI Clemente ti aiuta a trovare il miglior prezzo da negozianti locali.`;
    
    case 'merchant_offer':
      return `${data?.businessName || 'Negoziante'} offre ${data?.product || 'prodotti'} su Switch Market. Vendita locale con assistente AI Leonardo per ottimizzare le vendite.`;
    
    default:
      return 'Switch Market - Marketplace locale italiano con assistenti AI. Connette clienti e negozianti per vendite e acquisti nella tua zona.';
  }
}

export function generateStructuredData(type: string, data: any) {
  const baseUrl = 'https://switchmarket.replit.app';
  
  switch (type) {
    case 'product':
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': data.title,
        'description': data.description,
        'category': data.category,
        'offers': {
          '@type': 'AggregateOffer',
          'priceCurrency': 'EUR',
          'lowPrice': data.minPrice || 0,
          'highPrice': data.maxPrice || 999999,
          'offerCount': data.offerCount || 1
        },
        'aggregateRating': data.rating ? {
          '@type': 'AggregateRating',
          'ratingValue': data.rating,
          'reviewCount': data.reviewCount || 1
        } : undefined
      };
    
    case 'local_business':
      return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        'name': data.businessName,
        'description': data.description,
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': data.address,
          'addressLocality': data.city,
          'addressCountry': 'IT'
        },
        'geo': data.coordinates ? {
          '@type': 'GeoCoordinates',
          'latitude': data.coordinates.lat,
          'longitude': data.coordinates.lng
        } : undefined,
        'telephone': data.phone,
        'url': `${baseUrl}/merchant/${data.id}`,
        'priceRange': data.priceRange || '€€'
      };
    
    case 'service':
      return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': 'Marketplace Locale con Assistenti AI',
        'description': 'Servizio di connessione tra clienti e negozianti locali tramite assistenti AI intelligenti',
        'provider': {
          '@type': 'Organization',
          'name': 'Switch Market',
          'url': baseUrl
        },
        'areaServed': {
          '@type': 'Country',
          'name': 'Italia'
        },
        'serviceType': 'Marketplace Locale AI'
      };
    
    default:
      return null;
  }
}

export function generateBreadcrumb(path: string): any {
  const baseUrl = 'https://switchmarket.replit.app';
  const pathSegments = path.split('/').filter(Boolean);
  
  const breadcrumbList = [
    {
      '@type': 'ListItem',
      'position': 1,
      'name': 'Home',
      'item': baseUrl
    }
  ];
  
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    let name = segment;
    
    // Mappatura nomi pagine
    const pageNames: Record<string, string> = {
      'create': 'Crea Richiesta',
      'browse': 'Esplora Prodotti',
      'customer-dashboard': 'Dashboard Cliente',
      'merchant-dashboard': 'Dashboard Negoziante',
      'come-funziona': 'Come Funziona',
      'login': 'Accedi',
      'profile': 'Profilo'
    };
    
    name = pageNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    breadcrumbList.push({
      '@type': 'ListItem',
      'position': index + 2,
      'name': name,
      'item': `${baseUrl}${currentPath}`
    });
  });
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbList
  };
}

// Keywords dinamiche basate su contenuto
export function generateDynamicKeywords(data: any): string {
  const baseKeywords = [
    'marketplace locale',
    'e-commerce Italia',
    'negozi locali',
    'assistente AI shopping',
    'Switch Market'
  ];
  
  const dynamicKeywords: string[] = [];
  
  if (data.category) {
    dynamicKeywords.push(
      `${data.category} locale`,
      `negozi ${data.category}`,
      `acquista ${data.category}`
    );
  }
  
  if (data.city) {
    dynamicKeywords.push(
      `marketplace ${data.city}`,
      `negozi ${data.city}`,
      `shopping ${data.city}`
    );
  }
  
  if (data.businessType) {
    dynamicKeywords.push(
      `${data.businessType} locale`,
      `${data.businessType} zona`,
      `${data.businessType} vicino`
    );
  }
  
  return [...baseKeywords, ...dynamicKeywords].join(', ');
}

// Open Graph ottimizzato per condivisioni social
export function generateOpenGraphData(type: string, data: any) {
  const baseUrl = 'https://switchmarket.replit.app';
  
  return {
    'og:type': type === 'product' ? 'product' : 'website',
    'og:title': data.title || 'Switch Market - Marketplace Locale AI',
    'og:description': data.description || generateMetaDescription('general'),
    'og:url': data.url || baseUrl,
    'og:site_name': 'Switch Market',
    'og:locale': 'it_IT',
    'og:image': data.image || `${baseUrl}/attached_assets/SWITCHMARKET_logo_1754845138370.png`,
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': data.imageAlt || 'Switch Market - Marketplace Locale con AI'
  };
}