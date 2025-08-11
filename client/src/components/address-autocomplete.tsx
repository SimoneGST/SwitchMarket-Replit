import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Search, Loader2 } from 'lucide-react';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Inserisci indirizzo",
  className = "",
  disabled = false
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Chiudi i suggerimenti quando clicchi fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        suggestionsRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerca indirizzi con debounce
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Usa Nominatim per l'autocompletamento (gratuito) 
      // Prioritizza risultati italiani con dettagli più specifici
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=it&limit=8&accept-language=it&addressdetails=1&extratags=1&namedetails=1`
      );
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Filtra e ordina i risultati per rilevanza
        const filteredData = data
          .filter(item => item.display_name && item.lat && item.lon)
          .slice(0, 5); // Mantieni solo i primi 5 risultati più rilevanti
        
        setSuggestions(filteredData);
        setShowSuggestions(filteredData.length > 0);
      }
    } catch (error) {
      console.error('Errore ricerca indirizzo:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestisce il cambio dell'input con debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);

    // Cancella il timer precedente
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Imposta un nuovo timer per la ricerca
    const timer = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);

    setDebounceTimer(timer);
  };

  // Gestisce la navigazione con tastiera
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Seleziona un suggerimento
  const selectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.display_name, {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    });
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <MapPin className="w-4 h-4 text-gray-400" />
        </div>
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`pl-10 pr-10 ${className}`}
          disabled={disabled}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            } else if (value.length >= 3) {
              searchAddresses(value);
            }
          }}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <Search className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Suggerimenti */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <Button
              key={suggestion.place_id || index}
              variant="ghost"
              className={`w-full justify-start text-left h-auto p-4 rounded-none border-b border-gray-100 last:border-b-0 transition-colors ${
                selectedIndex === index 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'hover:bg-blue-50 hover:border-blue-200'
              }`}
              onClick={() => selectSuggestion(suggestion)}
            >
              <div className="flex items-start gap-3 w-full">
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm text-gray-900 leading-relaxed">
                    {suggestion.display_name}
                  </p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}
      
      {/* Messaggio se non ci sono risultati */}
      {showSuggestions && !isLoading && suggestions.length === 0 && value.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-center">
            <MapPin className="w-5 h-5 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Nessun indirizzo trovato per "{value}"
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Prova con un indirizzo più specifico
            </p>
          </div>
        </div>
      )}

      {/* Suggerimento per l'utilizzo */}
      {showSuggestions && suggestions.length > 0 && selectedIndex >= 0 && (
        <div className="absolute z-40 -bottom-8 left-0 right-0">
          <p className="text-xs text-gray-500 text-center bg-white/90 px-2 py-1 rounded">
            ↑↓ per navigare, Invio per selezionare
          </p>
        </div>
      )}
    </div>
  );
}