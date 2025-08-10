import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface CharacterIntroProps {
  character: 'clemente' | 'leonardo';
  onComplete: () => void;
  show: boolean;
}

export default function CharacterIntro({ character, onComplete, show }: CharacterIntroProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showDialog, setShowDialog] = useState(false);

  const isClemente = character === 'clemente';
  
  const characterData = {
    clemente: {
      name: "Clemente",
      color: "green",
      bgGradient: "from-green-500 to-green-600",
      avatar: "/attached_assets/clemente_avatar_1754845138372.png",
      role: "Assistente AI per Clienti",
      messages: [
        "Ciao! Sono Clemente, il tuo assistente personale.",
        "Ti aiuto a trovare esattamente quello che cerchi nei negozi della tua zona.",
        "Posso creare richieste precise e intelligenti per te!",
        "Iniziamo a scoprire cosa hai bisogno oggi?"
      ]
    },
    leonardo: {
      name: "Leonardo",
      color: "blue", 
      bgGradient: "from-blue-500 to-blue-600",
      avatar: "/attached_assets/leonardo_avatar_1754845138372.png",
      role: "Assistente AI per Negozianti",
      messages: [
        "Benvenuto! Sono Leonardo, il tuo copilot per le vendite.",
        "Ti aiuto a gestire i clienti e ottimizzare le tue strategie commerciali.",
        "Posso analizzare richieste e suggerire prezzi competitivi!",
        "Pronti a far crescere il tuo business insieme?"
      ]
    }
  };

  const char = characterData[character];

  useEffect(() => {
    if (show) {
      // Start the intro sequence
      const timer = setTimeout(() => {
        setShowDialog(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [show]);

  useEffect(() => {
    if (showDialog && currentStep < char.messages.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showDialog, currentStep, char.messages.length]);

  const handleSkip = () => {
    onComplete();
  };

  const handleContinue = () => {
    if (currentStep >= char.messages.length) {
      onComplete();
    } else {
      setCurrentStep(char.messages.length);
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={`bg-gradient-to-br ${char.bgGradient} rounded-3xl p-8 text-white max-w-md w-full relative overflow-hidden`}
        >
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full"
            />
            <motion.div
              animate={{ 
                scale: [1.2, 1, 1.2],
                rotate: [360, 180, 0]
              }}
              transition={{ 
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -bottom-16 -left-16 w-32 h-32 bg-white/5 rounded-full"
            />
          </div>

          {/* Character Avatar */}
          <div className="text-center mb-6 relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 1.2,
                delay: 0.3,
                type: "spring",
                stiffness: 100
              }}
              className="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center p-3"
            >
              <motion.img
                src={char.avatar}
                alt={char.name}
                className="w-full h-full object-contain"
                animate={{ 
                  y: [0, -10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-2xl font-bold mb-2"
            >
              {char.name}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-white/80 text-sm"
            >
              {char.role}
            </motion.p>
          </div>

          {/* Dialog Messages */}
          <AnimatePresence mode="wait">
            {showDialog && (
              <motion.div
                key="dialog"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 min-h-[100px] flex items-center relative z-10"
              >
                <AnimatePresence mode="wait">
                  {currentStep > 0 && (
                    <motion.p
                      key={currentStep - 1}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5 }}
                      className="text-white text-center w-full"
                    >
                      {char.messages[currentStep - 1]}
                    </motion.p>
                  )}
                </AnimatePresence>
                
                {/* Typing indicator */}
                {currentStep > 0 && currentStep <= char.messages.length && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute bottom-2 right-4"
                  >
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3 relative z-10">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Salta Intro
            </Button>
            <Button
              onClick={handleContinue}
              className={`flex-1 bg-white text-${char.color}-600 hover:bg-white/90`}
            >
              {currentStep >= char.messages.length ? "Iniziamo!" : "Continua"}
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="flex justify-center mt-4 space-x-2 relative z-10">
            {char.messages.map((_, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.5, opacity: 0.3 }}
                animate={{
                  scale: currentStep > index ? 1 : 0.5,
                  opacity: currentStep > index ? 1 : 0.3
                }}
                className="w-2 h-2 bg-white rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}