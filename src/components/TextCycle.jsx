import React, { useState, useEffect } from 'react';

const baseLanguages = [
  { text: 'கையொப்பு' },
  { text: 'हस्ताक्षर' },
  { text: 'సంతకం' },
  { text: 'കയ്യൊപ്പ്' },
  { text: 'ಹಸ್ತಾಕ್ಷರ' },
  { text: 'স্বাক্ষর' },
];

// Repeat the languages multiple times to extend the roulette length
const languages = [
  ...baseLanguages,
  ...baseLanguages,
  ...baseLanguages,
  ...baseLanguages,
  { text: 'KAIYOPPU' },
];

const TextCycle = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Stop cycling once we reach English
    if (currentIndex === languages.length - 1) return;

    // Fast 150ms interval back in place for that snappy roulette effect
    const intervalId = setInterval(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, languages.length - 1));
    }, 150);

    return () => clearInterval(intervalId);
  }, [currentIndex]);

  const currentLang = languages[currentIndex];
  const isFinal = currentIndex === languages.length - 1;

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      zIndex: 10,
      color: 'white',
      pointerEvents: 'none'
    }}>
      <h1 style={{
        fontSize: 'clamp(3rem, 8vw, 6rem)',
        margin: 0,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 'normal' // ensure the text style stays consistent across languages
      }}>
        {currentLang.text}
      </h1>
      
      <p style={{
        fontSize: '1.2rem',
        marginTop: '0.8rem',
        color: '#ffffff',
        opacity: isFinal ? 1 : 0, // Appears only when KAIYOPPU shows
        transition: 'opacity 1s ease-in',
        fontWeight: 'bold',
        letterSpacing: '0.2em',
        textShadow: '0 0 15px rgba(210, 168, 255, 0.7)' // soft violet glow to match theme
      }}>
        TRUST EVERY HIRE
      </p>
    </div>
  );
};

export default TextCycle;
