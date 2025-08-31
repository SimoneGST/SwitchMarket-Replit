// priceCompare: attempt to use SerpAPI (Google Shopping engine) when a key is
// available, otherwise fall back to a lightweight keyword-based stub.
export async function priceCompare(query: string) {
  const q = (query || '').trim();
  const key = process.env.SERPAPI_KEY || process.env.SERPAPI || '';

  // Helper fallback stub
  const fallback = () => {
    const text = (q || '').toLowerCase();
    let min = 50;
    let max = 150;
    if (text.includes('iphone')) { min = 700; max = 1300; }
    if (text.includes('televis') || text.includes('tv') || text.includes('smart tv')) { min = 200; max = 800; }
    if (text.includes('cuffie') || text.includes('auricol')) { min = 30; max = 350; }
    return {
      query: q,
      priceRange: { min, max, median: Math.round((min + max) / 2) },
      sources: [ { name: 'demo', url: 'https://example.com' } ],
      timestamp: Date.now()
    };
  };

  if (!q) return fallback();

  if (!key) {
    // No API key configured — return fallback quickly
    return fallback();
  }

  try {
    const params = new URLSearchParams({ engine: 'google_shopping', q: q, api_key: key, hl: 'it', gl: 'it' });
    const url = `https://serpapi.com/search.json?${params.toString()}`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) return fallback();
    const data = await resp.json();

    // SerpAPI may return shopping_results or product_results
    const items = (data.shopping_results || data.product_results || data.results || data.organic_results || []);
    if (!Array.isArray(items) || items.length === 0) return fallback();

    // Extract numeric prices from results
    const prices: number[] = [];
    const sources: any[] = [];
    for (const it of items.slice(0, 20)) {
      // try several fields where price may appear
      const priceStr = it.extracted_price || it.price || it.price_string || it.formatted_price || it.snippet || '';
      let found: number | null = null;
      if (typeof priceStr === 'number') found = priceStr as number;
      else if (typeof priceStr === 'string') {
        const m = priceStr.replace(/\s/g, '').match(/([0-9]+[\.,]?[0-9]*)/);
        if (m && m[1]) {
          // Normalize comma decimal
          const normalized = m[1].replace(/\./g, '').replace(/,/, '.');
          const n = Number(normalized);
          if (!isNaN(n)) found = n;
        }
      }

      // Some results include a price object
      if (found == null && it.metadata && it.metadata.price) {
        const n = Number(String(it.metadata.price).replace(/[^0-9\.,]/g, '').replace(/\./g, '').replace(/,/, '.'));
        if (!isNaN(n)) found = n;
      }

      if (found != null) prices.push(found);

      // build source info
      sources.push({
        name: it.title || it.name || it.product_title || 'result',
        url: it.link || it.product_id || it.source || undefined,
      });
    }

    if (prices.length === 0) return fallback();

    const min = Math.round(Math.min(...prices));
    const max = Math.round(Math.max(...prices));
    const median = Math.round(prices.sort((a,b)=>a-b)[Math.floor(prices.length/2)] || (min+max)/2);

    return {
      query: q,
      priceRange: { min, max, median },
      sources,
      timestamp: Date.now(),
      raw: { serpapi: !!data }
    };
  } catch (err) {
    console.warn('priceCompare serapi error:', err);
    return fallback();
  }
}
