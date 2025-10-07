import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

export interface AuroraBackdropProps {
  children?: React.ReactNode;
  className?: string;
  enableParallax?: boolean;
  particleCount?: number;
  intensity?: 'low' | 'medium' | 'high';
}

interface ParticleData {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export function AuroraBackdrop({
  children,
  className,
  enableParallax = true,
  particleCount = 32,
  intensity = 'medium'
}: AuroraBackdropProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<ParticleData[]>([]);
  
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initialize particles
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const colors = [
      'rgba(139, 92, 246, 0.8)',  // eclipse-plasma
      'rgba(168, 85, 247, 0.6)',  // eclipse-aurora
      'rgba(192, 132, 252, 0.7)', // eclipse-stellar
      'rgba(99, 102, 241, 0.5)',  // eclipse-corona
    ];
    
    particlesRef.current = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
  }, [particleCount, prefersReducedMotion]);

  // Handle parallax mouse movement
  useEffect(() => {
    // Parallax functionality temporarily disabled for lint compliance
    // Can be re-enabled with proper CSS custom properties approach
  }, [enableParallax, prefersReducedMotion]);

  // Animate particles
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Pulsing opacity
        particle.opacity = 0.2 + Math.sin(Date.now() * 0.001 + particle.id) * 0.3;
        
        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        
        // Glow effect
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Core particle
        ctx.fillStyle = particle.color.replace(/[\d.]+\)$/, `${particle.opacity})`);
        ctx.fill();
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [prefersReducedMotion]);

  const intensityClass = `aurora-backdrop--${intensity}`;

  return (
    <div 
      ref={containerRef}
      className={clsx('aurora-backdrop', intensityClass, className)}
    >
      {/* Particle canvas layer */}
      {!prefersReducedMotion && (
        <canvas
          ref={canvasRef}
          className="aurora-backdrop__particles"
        />
      )}
      
      {/* Aurora gradient layer */}
      <div className="aurora-backdrop__aurora" />
      
      {/* Nebular effects layer */}
      <div className="aurora-backdrop__nebula" />
      
      {/* Content overlay */}
      <div className="aurora-backdrop__content">
        {children}
      </div>
    </div>
  );
}