import { useState, useEffect } from 'react';

interface VoiceSettings {
  clementeVoice: string;
  leonardoVoice: string;
  voiceSpeed: number;
  voicePitch: number;
  voiceEnabled: boolean;
}

const defaultSettings: VoiceSettings = {
  clementeVoice: '',
  leonardoVoice: '',
  voiceSpeed: 90,
  voicePitch: 110,
  voiceEnabled: true,
};

const STORAGE_KEY = 'switch-market-voice-settings';

export function useVoiceSettings() {
  const [settings, setSettings] = useState<VoiceSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Carica impostazioni dal localStorage
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Errore caricamento impostazioni vocali:', error);
      }
    } else {
      // Prima volta: seleziona automaticamente voci predefinite se disponibili
      setTimeout(autoSelectDefaultVoices, 100);
    }
    setIsLoaded(true);
  }, []);

  const autoSelectDefaultVoices = () => {
    if (!('speechSynthesis' in window)) return;
    
    const voices = speechSynthesis.getVoices();
    const italianVoices = voices.filter(voice => 
      voice.lang.includes('it') || voice.name.toLowerCase().includes('italian')
    );

    if (italianVoices.length > 0) {
      // Cerca voci maschili per entrambi gli assistenti
      const maleVoices = italianVoices.filter(voice => 
        voice.name.toLowerCase().includes('male') || 
        voice.name.toLowerCase().includes('uomo') ||
        voice.name.toLowerCase().includes('marco') ||
        voice.name.toLowerCase().includes('luca')
      );

      const clementeVoice = maleVoices[0] || italianVoices[0];
      const leonardoVoice = maleVoices[1] || maleVoices[0] || italianVoices[1] || italianVoices[0];

      const newSettings = {
        ...defaultSettings,
        clementeVoice: clementeVoice?.name || '',
        leonardoVoice: leonardoVoice?.name || '',
      };

      setSettings(newSettings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    }
  };

  const updateSettings = (newSettings: VoiceSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  const speakWithSettings = (text: string, assistant: 'clemente' | 'leonardo') => {
    if (!settings.voiceEnabled || !('speechSynthesis' in window)) return;

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = settings.voiceSpeed / 100;
    utterance.pitch = settings.voicePitch / 100;

    // Usa la voce selezionata per l'assistente
    const selectedVoiceName = assistant === 'clemente' ? settings.clementeVoice : settings.leonardoVoice;
    if (selectedVoiceName) {
      const voices = speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.name === selectedVoiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    return new Promise<void>((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);
      speechSynthesis.speak(utterance);
    });
  };

  return {
    settings,
    updateSettings,
    speakWithSettings,
    isLoaded,
  };
}