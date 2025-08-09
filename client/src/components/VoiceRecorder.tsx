import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function VoiceRecorder({ onTranscription, onError, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if Speech Recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'it-IT';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscription(transcript);
        setIsRecording(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        onError?.(`Errore nel riconoscimento vocale: ${event.error}`);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [onTranscription, onError]);

  const startRecording = () => {
    if (!isSupported || !recognitionRef.current) {
      onError?.("Riconoscimento vocale non supportato dal browser");
      return;
    }

    try {
      setIsRecording(true);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      onError?.("Impossibile avviare il riconoscimento vocale");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      className={`${className} ${isRecording ? 'bg-red-100 border-red-300 text-red-700 animate-pulse' : ''}`}
      disabled={!isSupported}
    >
      <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} ${isRecording ? 'text-red-500' : 'text-slate-600'}`}></i>
    </Button>
  );
}