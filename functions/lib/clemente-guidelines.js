"use strict";
// Clemente AI - Linee guida conversazione e raccolta dati
// Questo file documenta le regole che Clemente deve seguire quando parla con l'utente.
// È usato come riferimento per mantenere coerenza e può essere iniettato in modelli LLM in futuro.
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLEMENTE_GUIDELINES = void 0;
exports.classifyCategory = classifyCategory;
exports.extractFromText = extractFromText;
exports.buildRequestDraft = buildRequestDraft;
exports.CLEMENTE_GUIDELINES = `
Sei Clemente, l'assistente AI per acquirenti di Switch Market (commercio locale).

OBIETTIVO
- Aiutare il cliente a definire bene cosa sta cercando e verificare se il prodotto è adatto al suo caso d'uso.
- Raccogliere i dati necessari per precompilare la richiesta mentre si conversa.

TONO E STILE
- Amichevole e conciso. Evita ripetizioni: non riformulare la stessa informazione.
- Domande singole e mirate, una alla volta, SOLO sui campi mancanti.
- Se hai abbastanza dati, proponi la generazione della richiesta (una sola volta) e poi passa al riepilogo.
- Usa esempi solo se necessario. Non promettere cose non garantite.

DATI DA RACCOGLIERE (ordine suggerito)
1) Prodotto/Esigenza: cosa cerca, uso previsto, contesto.
2) Compatibilità: con cosa deve essere compatibile (dispositivi, misure, standard, modelli)?
3) Aspettative/Preferenze: qualità, caratteristiche chiave, marca/modello desiderati.
4) Dettagli tecnici: taglie, colore, materiale, potenza, capacità, formati supportati, ecc. Per indumenti e scarpe CHIEDI SEMPRE anche il GENERE (uomo/donna/unisex/bambino) se manca.
5) Budget: range o tetto massimo.
6) Tempistiche: urgenza (subito/24h/48h/pochi giorni).
7) Area: chiedi prima la città (o zona). POI chiedi: "Vuoi allargare la richiesta anche ai negozianti fuori dalla tua città?" Se SÌ, chiedi di quanto è disposto a muoversi per ritirare (raggio in km). Se NO, non chiedere il raggio.
8) Consegna: imposta come STANDARD il ritiro in negozio. Comunica che l'opzione di consegna a domicilio, se disponibile, verrà proposta in fase di trattativa col negoziante.

CRITERI DI PRONTEZZA (quando dire che si può generare la richiesta)
- Prima raccogli eventuali preferenze opzionali utili (marca, stile, caratteristiche) con UNA sola domanda di riepilogo: "Vuoi indicare marca/stile/preferenze o lasciamo libero per non restringere troppo?".
- Sei pronto quando: prodotto/uso previsto + almeno 2 tra compatibilità, dettagli tecnici, marca/modello, aspettative; e almeno uno tra budget/urgenza/area.
- Poi proponi la generazione ma non insistere; l'utente confermerà dal pulsante.

REGOLE OPERATIVE
- Domanda SOLO ciò che manca: non ripetere domande già evase.
- NON chiedere la categoria: deducila tu e compilala direttamente.
- Evita domande doppie. Se l'utente risponde a più aspetti, registra tutto.
- Mantieni un riepilogo COMPATTO (max 1-2 frasi) e aggiorna solo se ci sono novità.
- Se il cliente è indeciso, proponi 1-2 alternative ragionevoli.
- Focus locale: prima la città. Chiedi il raggio SOLO se l'utente vuole allargare ai negozianti fuori città. Default consegna = ritiro in negozio.
- Regola taglia/numero/genere: per categorie che lo richiedono (scarpe/abbigliamento/accessori con taglie), chiedi SEMPRE numero/taglia e il GENERE (uomo/donna/unisex/bambino) se mancanti (es: "Che numero di scarpa?", "Che taglia preferisci?", "È per uomo, donna o unisex?").
`;
// Classificazione semplice della categoria in base a parole chiave
function classifyCategory(text) {
    if (!text)
        return undefined;
    const t = text.toLowerCase();
    // Sport e Tempo Libero
    if (/\b(spinning|ciclismo|bici|palestra|running|calcio|sport|mtb|trekking|sci)\b/.test(t))
        return 'Sport e Tempo Libero';
    // Elettronica
    if (/(laptop|notebook|pc|computer|gaming|stampante|smartphone|tablet|tv|televisore|monitor|router|cuffie|auricolari|fotocamera|reflex|drone)/.test(t))
        return 'Elettronica';
    // Elettrodomestici
    if (/(frigorifero|lavatrice|lavastoviglie|forno|microonde|aspirapolvere|robot\s*aspirapolvere)/.test(t))
        return 'Elettrodomestici';
    // Casa e Giardino
    if (/(divano|sedia|tavolo|lampada|illuminazione|giardino|barbecue|bbq|utensili|fai\s*da\s*te|sdraio|lettino|spiaggia|ombrellone|arredo\s*esterno)/.test(t))
        return 'Casa e Giardino';
    // Auto e Moto
    if (/(auto|moto|pneumatici|gomme|casco|ricambi|accessori\s*auto|catene\s*da\s*neve)/.test(t))
        return 'Auto e Moto';
    // Abbigliamento e Accessori
    if (/(scarpe|maglietta|pantaloni|giacca|felpa|zaino|borsa|cintura|cappello|guanti)/.test(t)) {
        // se compaiono termini sportivi forti, privilegia Sport
        if (/(spinning|ciclismo|palestra|running|sport)/.test(t))
            return 'Sport e Tempo Libero';
        return 'Abbigliamento e Accessori';
    }
    // Strumenti Musicali
    if (/(chitarra|piano|pianoforte|batteria|sintetizzatore|violino|microfono|mixer|scheda\s*audio)/.test(t))
        return 'Strumenti Musicali';
    // Informatica (sottocategoria, ma mappata su Elettronica)
    if (/(ssd|hard\s*disk|scheda\s*video|ram|processore|mouse|tastiera)/.test(t))
        return 'Elettronica';
    return undefined;
}
// Estrazione euristica leggera da testo naturale (italiano)
function extractFromText(text) {
    const t = (text || '').toLowerCase();
    const out = {};
    // Prodotto / categoria (semplici pattern)
    const prodMatch = text.match(/(?:cerco|sto cercando|mi serve|vorrei)\s+([^\.,\n]{3,60})/i);
    if (prodMatch)
        out.productName = prodMatch[1].trim();
    // Fallback: se non trovato, usa il testo breve come nome prodotto
    if (!out.productName) {
        const cleaned = (text || '').replace(/\s+/g, ' ').trim();
        const isShort = cleaned.length >= 3 && cleaned.length <= 100;
        const looksLikeStatement = !/[?]/.test(cleaned);
        if (isShort && looksLikeStatement) {
            // rimuovi articoli iniziali comuni
            const noArticle = cleaned.replace(/^\b(una|uno|un|la|il|lo|le|i|gli)\b\s+/i, '').trim();
            if (noArticle.length >= 3)
                out.productName = noArticle;
        }
    }
    // Marca / Modello
    const brand = text.match(/(?:marca|brand)\s*[:\-]?\s*([A-Za-z0-9\-\s]{2,})/i);
    if (brand)
        out.brand = brand[1].trim();
    const model = text.match(/(?:modello|model)\s*[:\-]?\s*([A-Za-z0-9\-\s]{1,})/i);
    if (model)
        out.model = model[1].trim();
    // Compatibilità
    const compat = text.match(/compatibil(?:e|ità)\s*(?:con)?\s*([^.\n]{3,100})/i);
    if (compat)
        out.compatibility = compat[1].trim();
    // Aspettative / preferenze
    const exp = text.match(/(?:preferisco|mi aspetto|vorrei che|mi piacerebbe)\s+([^.\n]{3,160})/i);
    if (exp)
        out.expectations = exp[1].trim();
    // Specifiche tecniche libere
    const specs = text.match(/(?:specifiche|caratteristiche|dettagli tecnici)\s*[:\-]?\s*([^.\n]{3,200})/i);
    if (specs)
        out.technicalSpecs = specs[1].trim();
    // Colore / taglia / materiale
    const color = text.match(/(?:colore)\s*[:\-]?\s*([A-Za-zàèéìòù\-\s]{3,})/i);
    if (color)
        out.color = color[1].trim();
    const size = text.match(/(?:taglia|misur[ae])\s*[:\-]?\s*([A-Za-z0-9\-\s]{1,})/i);
    if (size)
        out.size = size[1].trim();
    // Numero di scarpa (EU/US/UK), priorità EU numerico, cattura "numero di scarpa 43" o "scarpa 43"
    if (!out.size && /(scarpa|scarpe)/i.test(text)) {
        const shoe = text.match(/(?:numero|misur[ae]|taglia)?\s*(?:di\s*)?(?:scarpa|scarpe)?\s*[:\-]?\s*(\d{2}(?:[\.,]5)?)(?:\s*(?:eu|eur))?/i);
        if (shoe?.[1]) {
            out.size = shoe[1].replace(',', '.').trim();
        }
    }
    const material = text.match(/(?:materiale)\s*[:\-]?\s*([A-Za-zàèéìòù\-\s]{3,})/i);
    if (material)
        out.material = material[1].trim();
    // Quantità
    const qtyNum = t.match(/\b(\d{1,2})\s*(?:pz|pezzi|unità|unita|quantità|quantita)\b/);
    if (qtyNum)
        out.quantity = parseInt(qtyNum[1]);
    // Budget range o massimo
    const range = t.match(/\b(\d{1,5})\s*[–-]\s*(\d{1,5})\s*(?:€|euro)?\b/);
    if (range) {
        out.budgetMin = parseInt(range[1]);
        out.budgetMax = parseInt(range[2]);
    }
    else {
        const max1 = t.match(/(?:massimo|max)\s*(\d{2,5})\s*(?:€|euro)?/);
        const bud = t.match(/(?:budget)\s*[:\-]?\s*(\d{2,5})\s*(?:€|euro)?/);
        const single = max1 || bud;
        if (single)
            out.budgetMax = parseInt(single[1]);
    }
    // Urgenza
    if (/(subito|oggi|immediato)/.test(t))
        out.urgencyLevel = 'immediate';
    else if (/(24\s*h|domani)/.test(t))
        out.urgencyLevel = '24h';
    else if (/(48\s*h|dopodomani)/.test(t))
        out.urgencyLevel = '48h';
    else if (/(pochi giorni|entro la settimana|qualche giorno)/.test(t))
        out.urgencyLevel = 'few_days';
    // Consegna
    if (/(ritiro|passo io|vengo io)/.test(t))
        out.deliveryPreference = out.deliveryPreference === 'delivery' ? 'both' : 'pickup';
    if (/(consegna|a domicilio|spedizione)/.test(t))
        out.deliveryPreference = out.deliveryPreference === 'pickup' ? 'both' : 'delivery';
    // Area / raggio
    const city = text.match(/(?:zona|città|citta|area|in)\s*[:\-]?\s*([A-Za-zàèéìòù'\-\s]{2,})/i);
    if (city)
        out.location = city[1].trim();
    const radius = t.match(/(?:ragg?io|entro)\s*(\d{1,3})\s*km/);
    if (radius)
        out.actionRadius = Math.max(1, Math.min(100, parseInt(radius[1])));
    return out;
}
function buildRequestDraft(collected) {
    const rawTitle = (collected.productName || '').trim();
    const baseTitle = (() => {
        if (!rawTitle)
            return '';
        // Normalize long phrases to base product name
        let t = rawTitle.replace(/\s+(con|in|per|da|di)\s+.*$/i, '').trim();
        if (/occhiali\s*da\s*sole/i.test(t))
            return 'Occhiali da sole';
        return t;
    })();
    const titleParts = [baseTitle || undefined].filter(Boolean);
    const title = titleParts.join(' ').trim() || 'Richiesta Prodotto';
    const bullets = [];
    if (collected.compatibility)
        bullets.push(`Compatibilità: ${collected.compatibility}`);
    if (collected.expectations)
        bullets.push(`Aspettative: ${collected.expectations}`);
    if (collected.technicalSpecs)
        bullets.push(`Specifiche: ${collected.technicalSpecs}`);
    if (collected.color)
        bullets.push(`Colore: ${collected.color}`);
    if (collected.size)
        bullets.push(`Taglia/Misure: ${collected.size}`);
    if (collected.material)
        bullets.push(`Materiale: ${collected.material}`);
    if (collected.quantity)
        bullets.push(`Quantità: ${collected.quantity}`);
    const desc = bullets.length ? bullets.join('\n') : 'Richiesta generata dalla conversazione con Clemente.';
    // Se manca la categoria, prova a dedurla dal titolo/testo
    const guessedCategory = collected.category || classifyCategory([
        collected.productName,
        collected.technicalSpecs,
        collected.expectations,
        title,
    ].filter(Boolean).join(' ')) || 'Altro';
    return {
        title,
        description: desc,
        // non forzare 'Altro' se non deducibile: lascia vuoto per evitare 100%
        category: collected.category || classifyCategory([
            collected.productName,
            collected.technicalSpecs,
            collected.expectations,
            title,
        ].filter(Boolean).join(' ')),
        budgetMin: collected.budgetMin,
        budgetMax: collected.budgetMax,
        // non impostare default fittizi
        location: collected.location,
        urgencyLevel: collected.urgencyLevel || 'few_days',
        // Default: ritiro in negozio. La consegna a domicilio verrà proposta solo se il negoziante offre il servizio.
        deliveryPreference: collected.deliveryPreference || 'pickup',
        // Non impostare un raggio di default: chiedi solo se l'utente vuole allargare fuori città
        actionRadius: collected.actionRadius,
        productName: collected.productName || title,
        brand: collected.brand,
        model: collected.model,
        technicalSpecs: collected.technicalSpecs,
    };
}
//# sourceMappingURL=clemente-guidelines.js.map