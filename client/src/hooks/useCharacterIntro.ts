import { useState, useEffect } from 'react';

export function useCharacterIntro(character: 'clemente' | 'leonardo') {
  const [showIntro, setShowIntro] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);

  useEffect(() => {
    // Check if user has permanently disabled this character's intro
    const neverShowKey = `neverShowIntro_${character}`;
    const neverShow = localStorage.getItem(neverShowKey) === 'true';
    
    // Check if user has seen this character's intro before (for current session)
    const introKey = `hasSeenIntro_${character}`;
    const seen = localStorage.getItem(introKey) === 'true';
    setHasSeenIntro(seen);
    
    // Only show intro if not permanently disabled and not seen in current session
    if (!neverShow && !seen) {
      const timer = setTimeout(() => {
        setShowIntro(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [character]);

  const completeIntro = () => {
    const introKey = `hasSeenIntro_${character}`;
    localStorage.setItem(introKey, 'true');
    setShowIntro(false);
    setHasSeenIntro(true);
  };

  const resetIntro = () => {
    const introKey = `hasSeenIntro_${character}`;
    const neverShowKey = `neverShowIntro_${character}`;
    localStorage.removeItem(introKey);
    localStorage.removeItem(neverShowKey);
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