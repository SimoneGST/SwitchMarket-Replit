import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=it&limit=5&accept-language=it`
      );
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Errore ricerca indirizzo:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestisce il cambio dell'input con debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

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

  // Seleziona un suggerimento
  const selectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.display_name, {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <i className="fas fa-spinner fa-spin text-gray-400"></i>
          </div>
        )}
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
              className="w-full justify-start text-left h-auto p-3 rounded-none border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
              onClick={() => selectSuggestion(suggestion)}
            >
              <div className="flex items-start gap-2">
                <i className="fas fa-map-marker-alt text-gray-400 mt-1 text-xs"></i>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-500 text-center">
            Nessun indirizzo trovato per "{value}"
          </p>
        </div>
      )}
    </div>
  );
}