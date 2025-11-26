import React, { useRef, useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';
import styles from './MoleculeBindingVisualizer.module.css';

export type BindingType = 'inhibitor' | 'agonist' | 'antagonist' | 'allosteric' | 'covalent' | 'competitive';
export type Modality = 'small-molecule' | 'antibody' | 'peptide' | 'oligonucleotide' | 'gene-therapy' | 'cell-therapy';

export interface BindingSite {
  id: string;
  name: string;
  x: number; // 0-100 percentage position on target
  y: number;
  type: BindingType;
  affinity?: string; // e.g., "IC50: 2.3 nM"
  isActive?: boolean;
}

export interface TargetProtein {
  id: string;
  name: string;
  fullName?: string;
  family?: string;
  bindingSites: BindingSite[];
}

export interface DrugMolecule {
  id: string;
  name: string;
  modality: Modality;
  mechanism: string;
  bindingType: BindingType;
  targetSiteId: string;
  color?: string;
}

export interface MoleculeBindingVisualizerProps {
  /** Target protein data */
  target: TargetProtein;
  /** Drug molecule binding to target */
  drug: DrugMolecule;
  /** Width of the visualizer */
  width?: number;
  /** Height of the visualizer */
  height?: number;
  /** Enable binding animation */
  animate?: boolean;
  /** Show mechanism of action description */
  showMechanism?: boolean;
  /** Show binding affinity data */
  showAffinity?: boolean;
  /** Called when binding site is clicked */
  onBindingSiteClick?: (site: BindingSite) => void;
  /** Additional class name */
  className?: string;
}

const BINDING_COLORS: Record<BindingType, string> = {
  inhibitor: '#EF4444',    // Red
  agonist: '#10B981',      // Green
  antagonist: '#F59E0B',   // Amber
  allosteric: '#8B5CF6',   // Purple
  covalent: '#EC4899',     // Pink
  competitive: '#3B82F6',  // Blue
};

const MODALITY_ICONS: Record<Modality, string> = {
  'small-molecule': '⬡',
  'antibody': '🔬',
  'peptide': '🧬',
  'oligonucleotide': '🧪',
  'gene-therapy': '🧫',
  'cell-therapy': '🔴',
};

export const MoleculeBindingVisualizer: React.FC<MoleculeBindingVisualizerProps> = ({
  target,
  drug,
  width = 600,
  height = 400,
  animate = true,
  showMechanism = true,
  showAffinity = true,
  onBindingSiteClick,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const [hoveredSite, setHoveredSite] = useState<BindingSite | null>(null);
  const [bindingProgress, setBindingProgress] = useState(0);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear with gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, 'rgba(15, 23, 42, 0.98)');
    bgGradient.addColorStop(1, 'rgba(30, 41, 59, 0.98)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle grid pattern
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 30) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Calculate positions
    const proteinCenterX = width * 0.6;
    const proteinCenterY = height * 0.5;
    const proteinWidth = width * 0.4;
    const proteinHeight = height * 0.6;

    const drugStartX = width * 0.1;
    const drugStartY = height * 0.5;
    
    // Find target binding site
    const targetSite = target.bindingSites.find(s => s.id === drug.targetSiteId);
    const targetX = targetSite ? proteinCenterX - proteinWidth/2 + (targetSite.x / 100) * proteinWidth : proteinCenterX;
    const targetY = targetSite ? proteinCenterY - proteinHeight/2 + (targetSite.y / 100) * proteinHeight : proteinCenterY;

    // Calculate drug position based on binding progress
    const progress = animate ? bindingProgress : 1;
    const drugX = drugStartX + (targetX - drugStartX - 40) * progress;
    const drugY = drugStartY + (targetY - drugStartY) * progress;

    // Draw protein structure (stylized blob)
    const drawProtein = () => {
      ctx.save();
      
      // Protein body with gradient
      const proteinGradient = ctx.createRadialGradient(
        proteinCenterX, proteinCenterY, 0,
        proteinCenterX, proteinCenterY, proteinWidth * 0.6
      );
      proteinGradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
      proteinGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.3)');
      proteinGradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');

      // Draw protein as organic blob shape
      ctx.beginPath();
      const points = 12;
      const angleStep = (Math.PI * 2) / points;
      for (let i = 0; i <= points; i++) {
        const angle = angleStep * i;
        const wobble = Math.sin(timeRef.current * 0.002 + i * 0.5) * 10;
        const radiusX = proteinWidth / 2 + wobble;
        const radiusY = proteinHeight / 2 + wobble * 0.7;
        const x = proteinCenterX + Math.cos(angle) * radiusX;
        const y = proteinCenterY + Math.sin(angle) * radiusY;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevAngle = angleStep * (i - 1);
          const cpX = proteinCenterX + Math.cos((angle + prevAngle) / 2) * (radiusX * 1.1);
          const cpY = proteinCenterY + Math.sin((angle + prevAngle) / 2) * (radiusY * 1.1);
          ctx.quadraticCurveTo(cpX, cpY, x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = proteinGradient;
      ctx.fill();
      
      // Protein border
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw helix patterns inside protein
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const startX = proteinCenterX - proteinWidth * 0.3 + i * 40;
        for (let t = 0; t < 20; t++) {
          const x = startX + t * 6;
          const y = proteinCenterY + Math.sin(t * 0.5 + timeRef.current * 0.003) * 25;
          if (t === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.restore();
    };

    // Draw binding sites
    const drawBindingSites = () => {
      target.bindingSites.forEach(site => {
        const siteX = proteinCenterX - proteinWidth/2 + (site.x / 100) * proteinWidth;
        const siteY = proteinCenterY - proteinHeight/2 + (site.y / 100) * proteinHeight;
        const isTarget = site.id === drug.targetSiteId;
        const isHovered = hoveredSite?.id === site.id;
        const radius = isTarget ? 18 : 12;

        // Glow effect
        if (isTarget || isHovered) {
          const glowGradient = ctx.createRadialGradient(siteX, siteY, 0, siteX, siteY, radius * 3);
          glowGradient.addColorStop(0, `${BINDING_COLORS[site.type]}88`);
          glowGradient.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(siteX, siteY, radius * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Binding site circle
        const siteGradient = ctx.createRadialGradient(siteX - 3, siteY - 3, 0, siteX, siteY, radius);
        siteGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        siteGradient.addColorStop(0.5, BINDING_COLORS[site.type]);
        siteGradient.addColorStop(1, `${BINDING_COLORS[site.type]}88`);

        ctx.beginPath();
        ctx.arc(siteX, siteY, radius, 0, Math.PI * 2);
        ctx.fillStyle = siteGradient;
        ctx.fill();

        // Pulsing ring for active binding site
        if (isTarget && animate) {
          const pulseRadius = radius + Math.sin(timeRef.current * 0.005) * 8 + 8;
          ctx.beginPath();
          ctx.arc(siteX, siteY, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `${BINDING_COLORS[site.type]}44`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Site label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 10px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(site.name.substring(0, 3), siteX, siteY);
      });
    };

    // Draw drug molecule
    const drawDrug = () => {
      const drugColor = drug.color || BINDING_COLORS[drug.bindingType];
      const drugRadius = 25;

      // Trail effect during binding
      if (animate && bindingProgress < 1) {
        ctx.beginPath();
        ctx.moveTo(drugStartX, drugStartY);
        ctx.lineTo(drugX, drugY);
        ctx.strokeStyle = `${drugColor}44`;
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Drug glow
      const glowGradient = ctx.createRadialGradient(drugX, drugY, 0, drugX, drugY, drugRadius * 2.5);
      glowGradient.addColorStop(0, `${drugColor}66`);
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(drugX, drugY, drugRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Drug body
      const drugGradient = ctx.createRadialGradient(drugX - 5, drugY - 5, 0, drugX, drugY, drugRadius);
      drugGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      drugGradient.addColorStop(0.4, drugColor);
      drugGradient.addColorStop(1, `${drugColor}88`);

      // Draw hexagonal shape for small molecules, or circle for others
      if (drug.modality === 'small-molecule') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const x = drugX + Math.cos(angle) * drugRadius;
          const y = drugY + Math.sin(angle) * drugRadius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else {
        ctx.beginPath();
        ctx.arc(drugX, drugY, drugRadius, 0, Math.PI * 2);
      }
      ctx.fillStyle = drugGradient;
      ctx.fill();
      ctx.strokeStyle = drugColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Drug modality icon
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(MODALITY_ICONS[drug.modality], drugX, drugY);
    };

    // Draw binding interaction
    const drawInteraction = () => {
      if (bindingProgress > 0.8) {
        const interactionOpacity = (bindingProgress - 0.8) / 0.2;
        
        // Draw interaction lines/particles
        ctx.save();
        ctx.globalAlpha = interactionOpacity;
        
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 / particleCount) * i + timeRef.current * 0.003;
          const distance = 35 + Math.sin(timeRef.current * 0.005 + i) * 5;
          const px = targetX + Math.cos(angle) * distance;
          const py = targetY + Math.sin(angle) * distance;
          
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = BINDING_COLORS[drug.bindingType];
          ctx.fill();
        }
        
        ctx.restore();
      }
    };

    // Animate (respect reduced motion)
    if (!prefersReducedMotion) {
      timeRef.current += 16;
    }
    
    drawProtein();
    drawBindingSites();
    drawInteraction();
    drawDrug();

    // Update binding animation (respect reduced motion)
    if (animate && bindingProgress < 1 && !prefersReducedMotion) {
      setBindingProgress(prev => Math.min(1, prev + 0.008));
    } else if (prefersReducedMotion && bindingProgress < 1) {
      // If reduced motion, show end state immediately
      setBindingProgress(1);
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [width, height, target, drug, animate, bindingProgress, hoveredSite, prefersReducedMotion]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const proteinCenterX = width * 0.6;
    const proteinCenterY = height * 0.5;
    const proteinWidth = width * 0.4;
    const proteinHeight = height * 0.6;

    let found: BindingSite | null = null;
    target.bindingSites.forEach(site => {
      const siteX = proteinCenterX - proteinWidth/2 + (site.x / 100) * proteinWidth;
      const siteY = proteinCenterY - proteinHeight/2 + (site.y / 100) * proteinHeight;
      const dx = x - siteX;
      const dy = y - siteY;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        found = site;
      }
    });
    setHoveredSite(found);
  }, [width, height, target]);

  const handleClick = useCallback(() => {
    if (hoveredSite) {
      onBindingSiteClick?.(hoveredSite);
    }
  }, [hoveredSite, onBindingSiteClick]);

  const handleReplay = useCallback(() => {
    setBindingProgress(0);
  }, []);

  useEffect(() => {
    draw();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  const targetSite = target.bindingSites.find(s => s.id === drug.targetSiteId);

  return (
    <div className={clsx(styles.bindingVisualizer, className)} style={{ width, height: height + 100 }}>
      <div className={styles.header}>
        <div className={styles.targetInfo}>
          <span className={styles.targetLabel}>TARGET</span>
          <span className={styles.targetName}>{target.name}</span>
          {target.fullName && <span className={styles.targetFullName}>{target.fullName}</span>}
        </div>
        <div className={styles.drugInfo}>
          <span className={styles.drugLabel}>DRUG</span>
          <span className={styles.drugName}>{drug.name}</span>
          <span className={styles.drugModality}>{drug.modality.replace('-', ' ')}</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ width, height, cursor: hoveredSite ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        role="img"
        aria-label={`Visualization of ${drug.name} binding to ${target.name} (${target.fullName || target.name}). Binding type: ${drug.bindingType}.`}
      />

      {showMechanism && (
        <div className={styles.mechanismPanel}>
          <div className={styles.mechanismLabel}>MECHANISM OF ACTION</div>
          <div className={styles.mechanismText}>{drug.mechanism}</div>
          <div className={styles.bindingType}>
            <span 
              className={styles.bindingTypeBadge}
              style={{ backgroundColor: `${BINDING_COLORS[drug.bindingType]}33`, color: BINDING_COLORS[drug.bindingType] }}
            >
              {drug.bindingType.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {showAffinity && targetSite?.affinity && (
        <div className={styles.affinityPanel}>
          <div className={styles.affinityLabel}>BINDING AFFINITY</div>
          <div className={styles.affinityValue}>{targetSite.affinity}</div>
        </div>
      )}

      {animate && (
        <button className={styles.replayButton} onClick={handleReplay}>
          ↻ Replay Binding
        </button>
      )}

      {hoveredSite && (
        <div className={styles.siteTooltip}>
          <div className={styles.siteName}>{hoveredSite.name}</div>
          <div className={styles.siteType}>{hoveredSite.type}</div>
          {hoveredSite.affinity && <div className={styles.siteAffinity}>{hoveredSite.affinity}</div>}
        </div>
      )}
    </div>
  );
};

MoleculeBindingVisualizer.displayName = 'MoleculeBindingVisualizer';
