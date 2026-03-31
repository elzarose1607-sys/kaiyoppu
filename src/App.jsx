import React from 'react';
import MagicRings from './components/MagicRings';
import TextCycle from './components/TextCycle';
import './index.css';

function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', // More vibrant navy-violet gradient
      position: 'relative',
      overflow: 'hidden'
    }}>
      <MagicRings
        color="#d2a8ff"       // Light violet / Lilac
        colorTwo="#5e28a5"    // Deep dark violet
        ringCount={6}
        speed={1}
        attenuation={10}
        lineThickness={2.5}
        baseRadius={0.35}
        radiusStep={0.1}
        scaleRate={0.1}
        opacity={1}
        blur={25}             // Increased blur for a strong glow effect
        noiseAmount={0.1}
        rotation={0}
        ringGap={1.5}
        fadeIn={0.7}
        fadeOut={0.5}
        followMouse={false}
        mouseInfluence={0.2}
        hoverScale={1.2}
        parallax={0.05}
        clickBurst={false}
      />
      <TextCycle />
    </div>
  );
}

export default App;