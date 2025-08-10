import { useState, useEffect } from 'react';

export function useCharacterIntro(character: 'clemente' | 'leonardo') {
  const [showIntro, setShowIntro] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);

  useEffect(() => {
    // Check if user has seen this character's intro before
    const introKey = `hasSeenIntro_${character}`;
    const seen = localStorage.getItem(introKey) === 'true';
    setHasSeenIntro(seen);
    
    // Always show intro when character component loads for a better experience
    const timer = setTimeout(() => {
      setShowIntro(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [character]);

  const completeIntro = () => {
    const introKey = `hasSeenIntro_${character}`;
    localStorage.setItem(introKey, 'true');
    setShowIntro(false);
    setHasSeenIntro(true);
  };

  const resetIntro = () => {
    const introKey = `hasSeenIntro_${character}`;
    localStorage.removeItem(introKey);
    setHasSeenIntro(false);
    setShowIntro(true);
  };

  const startIntro = () => {
    setShowIntro(true);
  };

  return {
    showIntro,
    hasSeenIntro,
    completeIntro,
    resetIntro,
    startIntro
  };
}