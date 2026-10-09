import React, { useEffect, useRef } from 'react';

/**
 * SporesCanvas renders floating particles/spores reminiscent of the Upside Down.
 * Particle count and drift velocity increase when testing is active.
 */
export default function SporesCanvas({ isTesting, isUpsideDown }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle count varies based on status
    const particleCount = isTesting ? 120 : (isUpsideDown ? 85 : 45);
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.6,
        vx: (Math.random() - 0.5) * 0.45,
        vy: - (Math.random() * 0.6 + 0.2), // float upward like ash
        alpha: Math.random() * 0.7 + 0.2,
        decay: (Math.random() - 0.5) * 0.005,
        color: Math.random() > 0.85 ? '#00f0ff' : (Math.random() > 0.4 ? '#ff1744' : '#ff6b8b')
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx * (isTesting ? 1.8 : 1);
        p.y += p.vy * (isTesting ? 2.2 : 1);
        p.alpha += p.decay;

        if (p.alpha <= 0.1 || p.alpha >= 0.9) {
          p.decay = -p.decay;
        }

        // Wrap edges
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (isUpsideDown ? 1 : 0.6);
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isTesting, isUpsideDown]);

  return <canvas ref={canvasRef} className="spores-canvas" />;
}
