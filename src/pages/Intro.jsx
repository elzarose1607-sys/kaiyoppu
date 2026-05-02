import React from 'react';
import MagicRings from '../components/MagicRings';
import TextCycle from '../components/TextCycle';
import '../index.css';
import { useNavigate } from 'react-router-dom';

function Intro() {
  const navigate = useNavigate();

  // We can automatically navigate to Login after the animation finishes
  // 24 languages * 150ms = 3600ms, let's navigate after 6 seconds to give time to see "KAIYOPPU"
  React.useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 6000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{ width: '100%', height: '100%', position: 'absolute', cursor: 'pointer' }} onClick={() => navigate('/login')}>
        <MagicRings
          color="#e141ec"
          colorTwo="#8c36d3"
          ringCount={6}
          speed={1}
          attenuation={10}
          lineThickness={2}
          baseRadius={0.35}
          radiusStep={0.1}
          scaleRate={0.1}
          opacity={1}
          blur={0}
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
      </div>
      <TextCycle />
    </div>
  );
}

export default Intro;
