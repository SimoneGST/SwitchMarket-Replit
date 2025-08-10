import { useState, useEffect } from 'react';

export function useCharacterIntro(character: 'clemente' | 'leonardo') {
  const [showIntro, setShowIntro] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [forceReset, setForceReset] = useState(0);

  useEffect(() => {
    // Check if user has permanently disabled this character's intro
    const neverShowKey = `neverShowIntro_${character}`;
    const neverShow = localStorage.getItem(neverShowKey) === 'true';
    
    // Check if user has seen this character's intro before (for current session)
    const introKey = `hasSeenIntro_${character}`;
    const seen = localStorage.getItem(introKey) === 'true';
    setHasSeenIntro(seen);
    
    console.log('🎬 CharacterIntro Debug:', {
      character,
      neverShow,
      seen,
      shouldShow: !neverShow && !seen
    });
    
    // Only show intro if not permanently disabled and not seen in current session
    if (!neverShow && !seen) {
      console.log('⏰ Avvio timer per mostrare intro di', character);
      const timer = setTimeout(() => {
        console.log('🎭 Attivando showIntro per', character);
        setShowIntro(true);
      }, 1000); // Aumentato il delay per dare tempo al componente di caricarsi
      return () => clearTimeout(timer);
    }
  }, [character, forceReset]);

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
    setShowIntro(false);
    console.log('🔄 Reset intro per', character);
    // Triggera il re-check
    setForceReset(prev => prev + 1);
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