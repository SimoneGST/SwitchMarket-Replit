import { clementeChat } from './gemini';
import { priceCompare } from './priceCompare';
import { z } from 'zod';
import { AUTOFILL_CONFIDENCE_THRESHOLD as DEFAULT_THRESHOLD } from '../shared/assistant-config';
import { storage } from './storage';

const SuggestionSchema = z.object({
  category: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  priceMin: z.number().optional().nullable(),
  priceMax: z.number().optional().nullable(),
  location: z.string().optional().nullable(),
  attributes: z.record(z.any()).optional().nullable(),
  deliveryPreference: z.string().optional().nullable(),
  urgencyLevel: z.string().optional().nullable(),
  actionRadius: z.number().optional().nullable(),
}).passthrough();

// Minimal assistant orchestration handler for Express-like servers.
export async function assistantHandler(req: any, res: any) {
  try {
    const { message, context = {}, userId } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message required' });

    // Call LLM extraction
    const llm = await clementeChat(message, context, req.files || []);

    // Use extracted title or message to get price suggestions
    const productName = (llm.extractedData && (llm.extractedData.title || llm.extractedData.name)) || message;
    const priceInfo = await priceCompare(productName || message);

    // Merge results and add confidence heuristics
  const confidence = (llm.extractedData && llm.extractedData.confidence) || (llm.isComplete ? 0.8 : 0.5);

  // Allow runtime override from env (0..1)
  const envThresh = parseFloat(process.env.ASSISTANT_AUTOFILL_THRESHOLD || '');
  const threshold = !isNaN(envThresh) ? Math.max(0, Math.min(1, envThresh)) : DEFAULT_THRESHOLD;

    // Validate and sanitize extracted data
    let validated: any = {};
    try {
      validated = SuggestionSchema.parse(llm.extractedData || {});
    } catch (vErr) {
      console.warn('Suggestion validation failed, using best-effort data', vErr);
      validated = llm.extractedData || {};
    }

    // Determine per-field confidence heuristics
    const fieldConfidence: Record<string, number> = {};
    const fields = ['title','category','description','priceMin','priceMax','location','attributes','deliveryPreference','urgencyLevel','actionRadius'];
    for (const f of fields) {
      const val = (validated as any)[f];
      // If model provided value, give higher confidence, else low
      fieldConfidence[f] = val !== undefined && val !== null && val !== '' ? Math.min(0.95, confidence) : 0.0;
    }

    // Detect greetings to avoid auto-filling on salutations
    const greetingRegex = /^(ciao|salve|buongiorno|buonasera|hey|hi|salut[oi])\b/i;
    const isGreetingOnly = typeof message === 'string' && greetingRegex.test(message.trim()) && (message.trim().split(/\s+/).length <= 2);

    const suggestion = {
      ...validated,
      priceSuggestion: priceInfo.priceRange,
      priceSources: priceInfo.sources,
      confidence,
      fieldConfidence,
      allowAutofill: !isGreetingOnly,
      autofillThreshold: threshold,
      actions: isGreetingOnly ? [{ type: 'ask', text: 'Ciao! Dimmi cosa stai cercando: marca, modello o descrizione del prodotto.' }] : []
    };

    // Structured log
    console.info('assistant.suggestion', { userId, message: String(message).slice(0,200), suggestionSummary: { title: suggestion.title || suggestion.name, confidence: suggestion.confidence, price: suggestion.priceSuggestion, autofillThreshold: threshold } });

    // Minimal telemetry: increment copilot analytics when we autofill fields
    try {
      if (suggestion.allowAutofill) {
        const now = new Date();
        const today = now.toISOString().slice(0,10);
        const user = req.user && req.user.uid ? req.user.uid : (userId || 'anonymous');
        const existing = await storage.getCopilotAnalytics(user, today).catch(()=>undefined);
        const updated = {
          userId: user,
          date: today,
          totalChats: (existing?.totalChats || 0) + 1,
          completedChats: existing?.completedChats || 0,
          transferredChats: existing?.transferredChats || 0,
        };
        await storage.upsertCopilotAnalytics(updated).catch(()=>{});
      }
    } catch (teleErr) {
      console.warn('telemetry error', teleErr);
    }

    return res.json({ response: llm.response, suggestion, isComplete: llm.isComplete, raw: llm });
  } catch (error) {
    console.error('assistantHandler error:', error);
    return res.status(500).json({ error: 'assistant error' });
  }
}
