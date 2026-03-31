import React, { useEffect, useRef } from 'react';

// Pseudo 3D simplex noise equivalent for organic wobble
const organicNoise = (x, y, z) => {
  return Math.sin(x * 2.5 + z) * 0.5 + Math.sin(y * 2.5 - z * 0.5) * 0.5;
};

const MagicRings = ({
  color = "#fc42ff",
  colorTwo = "#42fcff",
  ringCount = 6,
  speed = 1,
  attenuation = 10,
  lineThickness = 2,
  baseRadius = 0.35,
  radiusStep = 0.1,
  scaleRate = 0.1,
  opacity = 1, // Max opacity
  blur = 0,
  noiseAmount = 0.1,
  rotation = 0,
  ringGap = 1.5,
  fadeIn = 0.7, // Used for mouse move appearance
  fadeOut = 0.5,
  followMouse = false,
  mouseInfluence = 0.2,
  hoverScale = 1.2,
  parallax = 0.05,
  clickBurst = false 
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    updateSize();

    let width = canvas.width;
    let height = canvas.height;
    
    let time = 0;
    
    // Base tracking variables
    let mouse = { x: width / 2, y: height / 2 };
    let currentOpacity = 0; // Starts invisible
    let isMoving = false;
    let timeoutId;

    // Physics chain state
    const ringsState = Array.from({ length: ringCount }, () => ({
      x: width / 2,
      y: height / 2
    }));

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      isMoving = true;
      
      // Keep it visible as long as mouse moves
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        isMoving = false; // Mouse stopped
      }, 100);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', updateSize);

    let animationFrameId;

    const render = () => {
      width = canvas.width;
      height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      time += 0.005 * speed;
      // We scale down the user's base radius slightly so it looks good as a cursor
      const sizeRef = Math.min(width, height) * 0.3; 

      // Fade logic: "appears when the cursor moves"
      if (isMoving) {
        currentOpacity = Math.min(currentOpacity + (0.05 * fadeIn), opacity);
      } else {
        currentOpacity = Math.max(currentOpacity - (0.01 * fadeOut), 0);
      }

      for (let i = 0; i < ringCount; i++) {
        // Physics logic: follow target
        const targetX = i === 0 ? mouse.x : ringsState[i - 1].x;
        const targetY = i === 0 ? mouse.y : ringsState[i - 1].y;
        
        // Fluid spring delay
        const ease = 0.15 - (i * 0.015);
        ringsState[i].x += (targetX - ringsState[i].x) * ease;
        ringsState[i].y += (targetY - ringsState[i].y) * ease;

        ctx.beginPath();
        
        const isColorTwo = i % 2 !== 0;
        ctx.strokeStyle = isColorTwo ? colorTwo : color;
        ctx.lineWidth = lineThickness;
        ctx.globalAlpha = currentOpacity; // Uses dynamic opacity!
        
        if (blur > 0) {
            ctx.shadowBlur = blur;
            ctx.shadowColor = isColorTwo ? colorTwo : color;
        } else {
            ctx.shadowBlur = 0;
        }

        // Calculate size offsets based on the exact props they provided
        const rInitial = sizeRef * (baseRadius + (i * radiusStep * ringGap));

        const segments = 100;
        for (let j = 0; j <= segments; j++) {
            const angle = (j / segments) * Math.PI * 2;
            
            // Add geometric wobble
            const n = organicNoise(
                Math.cos(angle) * (attenuation / 10), 
                Math.sin(angle) * (attenuation / 10), 
                time + i * parallax * 10
            );
            
            // Scaled based on noise
            const breath = Math.sin(time * 2 + i) * scaleRate * rInitial;
            const rCurrent = Math.max(0.1, rInitial + breath + (n * noiseAmount * rInitial));

            // Position according to the ring's trailed cursor spot
            const px = ringsState[i].x + Math.cos(angle + (time * rotation)) * rCurrent;
            const py = ringsState[i].y + Math.sin(angle + (time * rotation)) * rCurrent;

            if (j === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        
        ctx.closePath();
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [
      color, colorTwo, ringCount, speed, attenuation,
      lineThickness, baseRadius, radiusStep, scaleRate,
      opacity, blur, noiseAmount, rotation, ringGap,
      fadeIn, fadeOut, parallax
  ]);

  return <canvas ref={canvasRef} style={{ pointerEvents: 'none', display: 'block', position: 'fixed', top: 0, left: 0, zIndex: 0 }} />;
};

export default MagicRings;
