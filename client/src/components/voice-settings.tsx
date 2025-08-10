import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Play, Square } from "lucide-react";

interface VoiceSettings {
  clementeVoice: string;
  leonardoVoice: string;
  voiceSpeed: number;
  voicePitch: number;
  voiceEnabled: boolean;
}

interface VoiceSettingsProps {
  settings: VoiceSettings;
  onSettingsChange: (settings: VoiceSettings) => void;
}

export default function VoiceSettings({ settings, onSettingsChange }: VoiceSettingsProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const [testingVoice, setTestingVoice] = useState<'clemente' | 'leonardo' | null>(null);

  useEffect(() => {
    // Carica le voci disponibili
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    // Le voci potrebbero non essere disponibili immediatamente
    if (speechSynthesis.getVoices().length !== 0) {
      loadVoices();
    } else {
      speechSynthesis.addEventListener('voiceschanged', loadVoices);
    }

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const italianVoices = voices.filter(voice => 
    voice.lang.includes('it') || voice.name.toLowerCase().includes('italian')
  );

  const maleVoices = italianVoices.filter(voice => 
    voice.name.toLowerCase().includes('male') || 
    voice.name.toLowerCase().includes('uomo') ||
    voice.name.toLowerCase().includes('marco') ||
    voice.name.toLowerCase().includes('luca')
  );

  const femaleVoices = italianVoices.filter(voice => 
    voice.name.toLowerCase().includes('female') || 
    voice.name.toLowerCase().includes('donna') ||
    voice.name.toLowerCase().includes('alice') ||
    voice.name.toLowerCase().includes('federica')
  );

  const updateSettings = (key: keyof VoiceSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsChange(newSettings);
  };

  const testVoice = (assistant: 'clemente' | 'leonardo') => {
    if (!('speechSynthesis' in window) || isTestPlaying) return;
    
    setIsTestPlaying(true);
    setTestingVoice(assistant);
    
    speechSynthesis.cancel();
    
    const text = assistant === 'clemente' 
      ? "Ciao! Sono Clemente, il tuo assistente per lo shopping. Ti aiuto a trovare quello che cerchi."
      : "Salve! Sono Leonardo, il tuo assistente per le vendite. Ti aiuto a gestire i tuoi clienti.";
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = settings.voiceSpeed / 100;
    utterance.pitch = settings.voicePitch / 100;
    
    // Usa la voce selezionata
    const selectedVoiceName = assistant === 'clemente' ? settings.clementeVoice : settings.leonardoVoice;
    const selectedVoice = voices.find(voice => voice.name === selectedVoiceName);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.onend = () => {
      setIsTestPlaying(false);
      setTestingVoice(null);
    };
    
    utterance.onerror = () => {
      setIsTestPlaying(false);
      setTestingVoice(null);
    };
    
    speechSynthesis.speak(utterance);
  };

  const stopTest = () => {
    speechSynthesis.cancel();
    setIsTestPlaying(false);
    setTestingVoice(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <i className="fas fa-volume-up text-primary"></i>
          Impostazioni Vocali
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Attiva/Disattiva Voce */}
        <div className="flex items-center justify-between">
          <Label htmlFor="voice-enabled">Abilita assistenti vocali</Label>
          <Switch
            id="voice-enabled"
            checked={settings.voiceEnabled}
            onCheckedChange={(checked) => updateSettings('voiceEnabled', checked)}
          />
        </div>

        {settings.voiceEnabled && (
          <>
            {/* Voce di Clemente */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Voce di Clemente (Cliente)</Label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testVoice('clemente')}
                    disabled={isTestPlaying}
                  >
                    {testingVoice === 'clemente' ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {testingVoice === 'clemente' ? 'Stop' : 'Test'}
                  </Button>
                </div>
              </div>
              <Select
                value={settings.clementeVoice}
                onValueChange={(value) => updateSettings('clementeVoice', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona voce per Clemente" />
                </SelectTrigger>
                <SelectContent>
                  {maleVoices.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Voci Maschili</div>
                      {maleVoices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {italianVoices.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Altre Voci Italiane</div>
                      {italianVoices.filter(voice => 
                        !maleVoices.includes(voice) && !femaleVoices.includes(voice)
                      ).map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Voce di Leonardo */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Voce di Leonardo (Negoziante)</Label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testVoice('leonardo')}
                    disabled={isTestPlaying}
                  >
                    {testingVoice === 'leonardo' ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {testingVoice === 'leonardo' ? 'Stop' : 'Test'}
                  </Button>
                </div>
              </div>
              <Select
                value={settings.leonardoVoice}
                onValueChange={(value) => updateSettings('leonardoVoice', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona voce per Leonardo" />
                </SelectTrigger>
                <SelectContent>
                  {maleVoices.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Voci Maschili</div>
                      {maleVoices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {femaleVoices.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Voci Femminili</div>
                      {femaleVoices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {italianVoices.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Altre Voci Italiane</div>
                      {italianVoices.filter(voice => 
                        !maleVoices.includes(voice) && !femaleVoices.includes(voice)
                      ).map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Velocità Voce */}
            <div className="space-y-3">
              <Label>Velocità ({settings.voiceSpeed}%)</Label>
              <Slider
                value={[settings.voiceSpeed]}
                onValueChange={([value]) => updateSettings('voiceSpeed', value)}
                min={50}
                max={200}
                step={10}
                className="w-full"
              />
            </div>

            {/* Tono Voce */}
            <div className="space-y-3">
              <Label>Tono ({settings.voicePitch}%)</Label>
              <Slider
                value={[settings.voicePitch]}
                onValueChange={([value]) => updateSettings('voicePitch', value)}
                min={50}
                max={150}
                step={10}
                className="w-full"
              />
            </div>

            {/* Info disponibilità voci */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <i className="fas fa-info-circle mr-2"></i>
                Trovate {italianVoices.length} voci italiane disponibili sul tuo dispositivo.
                {italianVoices.length === 0 && " Potrebbero essere necessarie impostazioni di sistema aggiuntive per voci italiane."}
              </p>
            </div>

            {/* Pulsante Stop Globale */}
            {isTestPlaying && (
              <Button onClick={stopTest} variant="destructive" className="w-full">
                <Square className="w-4 h-4 mr-2" />
                Ferma Test Vocale
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}