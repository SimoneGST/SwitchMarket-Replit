import * as React from 'react';

export default function AssistantProposal({ proposal, onAccept, onModify, onClarify }: any) {
  if (!proposal) return null;
  const p = proposal;
  return (
    <div className="bg-white border rounded p-4 shadow-sm">
      <h3 className="font-semibold mb-2">Proposta di Clemente</h3>
      <div className="text-sm text-slate-700 mb-3">
        <div><strong>Nome:</strong> {p.title || p.name || '-'}</div>
        <div><strong>Categoria:</strong> {p.category || '-'}</div>
        <div><strong>Descrizione:</strong> {p.description || '-'}</div>
        <div><strong>Prezzo suggerito:</strong> €{p.priceSuggestion?.min} - €{p.priceSuggestion?.max} (median €{p.priceSuggestion?.median})</div>
        <div><strong>Confidence:</strong> {(p.confidence||0).toFixed(2)}</div>
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={()=>onAccept(p)}>Accetta</button>
        <button className="px-3 py-2 border rounded" onClick={()=>onModify(p)}>Modifica</button>
        <button className="px-3 py-2 border rounded" onClick={()=>onClarify(p)}>Chiedi chiarimenti</button>
      </div>
    </div>
  );
}
