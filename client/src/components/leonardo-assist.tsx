import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';

type LeonardoAssistProps = {
  title?: string;
  allowedFields: string[];
  onApply: (updates: Record<string, string>) => void;
  context?: Record<string, unknown>;
};

export default function LeonardoAssist({ title = 'Assistente Leonardo', allowedFields, onApply, context }: LeonardoAssistProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [updates, setUpdates] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async () => {
    setLoading(true);
    setError(null);
    setUpdates({});
    try {
      const res = await apiRequest('/api/assist/parse', {
        method: 'POST',
        body: JSON.stringify({ prompt, allowedFields, context }),
      });
      const data = await res.json();
      setUpdates(data.updates || {});
    } catch (e: any) {
      setError(e?.message || 'Errore durante l\'analisi del prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (updates && Object.keys(updates).length > 0) {
      onApply(updates);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Es: Sono una SRL, ragione sociale Ferramenta Verdi, P.IVA 01234567890, sede in Via Roma 12 a Torino, CAP 10100, provincia TO"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />
        <div className="flex gap-2">
          <Button onClick={handleAsk} disabled={loading || !prompt.trim()} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Analizzo…</>) : (<><i className="fas fa-magic mr-2"></i>Chiedi a Leonardo</>)}
          </Button>
          <Button variant="outline" onClick={() => setPrompt('')} disabled={loading}>Pulisci</Button>
        </div>
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        {updates && Object.keys(updates).length > 0 && (
          <div className="border rounded-md p-3 bg-slate-50">
            <div className="text-sm font-medium mb-2">Suggerimenti trovati</div>
            <ul className="text-sm space-y-1">
              {Object.entries(updates).map(([k, v]) => (
                <li key={k}><span className="font-medium">{k}</span>: {String(v)}</li>
              ))}
            </ul>
            <Button onClick={handleApply} className="mt-3 w-full"><i className="fas fa-check mr-2"></i>Applica ai campi</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
