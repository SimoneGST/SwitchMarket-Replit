import { useState, useEffect } from 'react';

export function useCharacterIntro(character: 'clemente' | 'leonardo') {
  const [showIntro, setShowIntro] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [forceReset, setForceReset] = useState(0);

  useEffect(() => {
    // Check if user has permanently disabled this character's intro
    const neverShowKey = `neverShowIntro_${character}`;
    const neverShow = localStorage.getItem(neverShowKey) === 'true';
    
    // Check how many times user has seen the intro
    const introCountKey = `introCount_${character}`;
    const introCount = parseInt(localStorage.getItem(introCountKey) || '0');
    setHasSeenIntro(introCount > 0);
    
    // Show intro for first 3 visits unless permanently disabled
    const shouldShow = !neverShow && introCount < 3;
    
    if (shouldShow) {
      const timer = setTimeout(() => {
        setShowIntro(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [character, forceReset]);

  const completeIntro = () => {
    // Incrementa il contatore delle visualizzazioni
    const introCountKey = `introCount_${character}`;
    const currentCount = parseInt(localStorage.getItem(introCountKey) || '0');
    localStorage.setItem(introCountKey, (currentCount + 1).toString());
    
    setShowIntro(false);
    setHasSeenIntro(true);
  };

  const resetIntro = () => {
    const introCountKey = `introCount_${character}`;
    const neverShowKey = `neverShowIntro_${character}`;
    localStorage.removeItem(introCountKey);
    localStorage.removeItem(neverShowKey);
    setHasSeenIntro(false);
    setShowIntro(false);
    setForceReset(prev => prev + 1);
  };

  const neverShowAgain = () => {
    // Imposta permanentemente per non mostrare più
    const neverShowKey = `neverShowIntro_${character}`;
    localStorage.setItem(neverShowKey, 'true');
    setShowIntro(false);
  };

  const startIntro = () => {
    setShowIntro(true);
  };

  return {
    showIntro,
    hasSeenIntro,
    completeIntro,
    resetIntro,
    startIntro,
    neverShowAgain
  };
}