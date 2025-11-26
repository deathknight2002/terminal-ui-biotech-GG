import React, { useRef, useEffect, useCallback, useState } from 'react';
import clsx from 'clsx';
import styles from './Molecule3DViewer.module.css';

export interface Atom {
  id: string;
  element: string;
  x: number;
  y: number;
  z: number;
  color?: string;
  radius?: number;
  label?: string;
}

export interface Bond {
  from: string;
  to: string;
  order?: number; // 1 = single, 2 = double, 3 = triple
  color?: string;
}

export interface MoleculeData {
  id: string;
  name: string;
  formula?: string;
  modality?: string;
  mechanism?: string;
  atoms: Atom[];
  bonds: Bond[];
}

export interface Molecule3DViewerProps {
  /** Molecule data to visualize */
  molecule: MoleculeData;
  /** Width of the viewer */
  width?: number;
  /** Height of the viewer */
  height?: number;
  /** Enable auto-rotation */
  autoRotate?: boolean;
  /** Rotation speed (degrees per frame) */
  rotationSpeed?: number;
  /** Enable zoom functionality */
  enableZoom?: boolean;
  /** Enable drag rotation */
  enableDrag?: boolean;
  /** Show atom labels */
  showLabels?: boolean;
  /** Show molecule info panel */
  showInfo?: boolean;
  /** Highlight specific atoms by ID */
  highlightAtoms?: string[];
  /** Called when an atom is clicked */
  onAtomClick?: (atom: Atom) => void;
  /** Additional class name */
  className?: string;
}

// Element color mapping (CPK coloring convention)
const ELEMENT_COLORS: Record<string, string> = {
  H: '#FFFFFF',  // White
  C: '#909090',  // Gray
  N: '#3050F8',  // Blue
  O: '#FF0D0D',  // Red
  F: '#90E050',  // Green
  Cl: '#1FF01F', // Green
  Br: '#A62929', // Brown
  I: '#940094',  // Purple
  S: '#FFFF30',  // Yellow
  P: '#FF8000',  // Orange
  Fe: '#E06633', // Orange-brown
  Mg: '#8AFF00', // Light green
  Ca: '#3DFF00', // Green
  Zn: '#7D80B0', // Blue-gray
  default: '#FF1493', // Pink for unknown
};

// Element radius mapping (van der Waals radii, scaled)
const ELEMENT_RADII: Record<string, number> = {
  H: 0.25,
  C: 0.4,
  N: 0.38,
  O: 0.35,
  F: 0.32,
  Cl: 0.45,
  Br: 0.48,
  I: 0.53,
  S: 0.5,
  P: 0.47,
  Fe: 0.55,
  Mg: 0.52,
  Ca: 0.58,
  Zn: 0.5,
  default: 0.4,
};

interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Matrix multiplication for 3D rotation
function rotatePoint(point: Point3D, rotationX: number, rotationY: number): Point3D {
  // Rotate around Y axis
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);
  const x1 = point.x * cosY - point.z * sinY;
  const z1 = point.x * sinY + point.z * cosY;

  // Rotate around X axis
  const cosX = Math.cos(rotationX);
  const sinX = Math.sin(rotationX);
  const y1 = point.y * cosX - z1 * sinX;
  const z2 = point.y * sinX + z1 * cosX;

  return { x: x1, y: y1, z: z2 };
}

// Project 3D point to 2D screen coordinates
function projectPoint(
  point: Point3D,
  width: number,
  height: number,
  scale: number,
  distance: number = 5
): { x: number; y: number; scale: number } {
  const perspective = distance / (distance - point.z);
  return {
    x: width / 2 + point.x * scale * perspective,
    y: height / 2 - point.y * scale * perspective,
    scale: perspective,
  };
}

export const Molecule3DViewer: React.FC<Molecule3DViewerProps> = ({
  molecule,
  width = 400,
  height = 400,
  autoRotate = true,
  rotationSpeed = 0.01,
  enableZoom = true,
  enableDrag = true,
  showLabels = true,
  showInfo = true,
  highlightAtoms = [],
  onAtomClick,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const rotationRef = useRef({ x: 0.3, y: 0 });
  const dragRef = useRef({ isDragging: false, lastX: 0, lastY: 0 });
  const scaleRef = useRef(1);
  const [hoveredAtom, setHoveredAtom] = useState<Atom | null>(null);
  const [selectedAtom, setSelectedAtom] = useState<Atom | null>(null);

  // Calculate molecule bounds for proper scaling
  const getBounds = useCallback(() => {
    const { atoms } = molecule;
    if (atoms.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    atoms.forEach(atom => {
      minX = Math.min(minX, atom.x);
      maxX = Math.max(maxX, atom.x);
      minY = Math.min(minY, atom.y);
      maxY = Math.max(maxY, atom.y);
      minZ = Math.min(minZ, atom.z);
      maxZ = Math.max(maxZ, atom.z);
    });
    
    return { minX, maxX, minY, maxY, minZ, maxZ };
  }, [molecule]);

  // Center molecule at origin
  const getCenteredAtoms = useCallback(() => {
    const bounds = getBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    
    return molecule.atoms.map(atom => ({
      ...atom,
      x: atom.x - centerX,
      y: atom.y - centerY,
      z: atom.z - centerZ,
    }));
  }, [molecule, getBounds]);

  // Mouse/touch handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enableDrag) return;
    dragRef.current = { isDragging: true, lastX: e.clientX, lastY: e.clientY };
  }, [enableDrag]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check for atom hover
    const atoms = getCenteredAtoms();
    const bounds = getBounds();
    const maxDimension = Math.max(
      bounds.maxX - bounds.minX,
      bounds.maxY - bounds.minY,
      bounds.maxZ - bounds.minZ
    ) || 1;
    const baseScale = (Math.min(width, height) / 3) / maxDimension;
    const scale = baseScale * scaleRef.current;

    let foundAtom: Atom | null = null;
    atoms.forEach(atom => {
      const rotated = rotatePoint(
        { x: atom.x, y: atom.y, z: atom.z },
        rotationRef.current.x,
        rotationRef.current.y
      );
      const projected = projectPoint(rotated, width, height, scale);
      const baseRadius = atom.radius || ELEMENT_RADII[atom.element] || ELEMENT_RADII.default;
      const radius = baseRadius * scale * 0.8 * projected.scale;
      
      const dx = x - projected.x;
      const dy = y - projected.y;
      if (Math.sqrt(dx * dx + dy * dy) < radius) {
        foundAtom = atom;
      }
    });
    setHoveredAtom(foundAtom);

    // Handle drag rotation
    if (dragRef.current.isDragging) {
      const deltaX = e.clientX - dragRef.current.lastX;
      const deltaY = e.clientY - dragRef.current.lastY;
      rotationRef.current.y += deltaX * 0.01;
      rotationRef.current.x += deltaY * 0.01;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
    }
  }, [width, height, getCenteredAtoms, getBounds]);

  const handleMouseUp = useCallback(() => {
    dragRef.current.isDragging = false;
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredAtom) {
      setSelectedAtom(selectedAtom?.id === hoveredAtom.id ? null : hoveredAtom);
      onAtomClick?.(hoveredAtom);
    }
  }, [hoveredAtom, selectedAtom, onAtomClick]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!enableZoom) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scaleRef.current = Math.max(0.5, Math.min(3, scaleRef.current * delta));
  }, [enableZoom]);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // Create atom lookup map for O(1) access
    const atomMap = new Map<string, typeof molecule.atoms[0]>();
    molecule.atoms.forEach(atom => atomMap.set(atom.id, atom));
    
    const drawFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Clear canvas with gradient background
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      gradient.addColorStop(1, 'rgba(15, 23, 42, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const atoms = getCenteredAtoms();
      const bounds = getBounds();
      const maxDimension = Math.max(
        bounds.maxX - bounds.minX,
        bounds.maxY - bounds.minY,
        bounds.maxZ - bounds.minZ
      ) || 1;
      const baseScale = (Math.min(width, height) / 3) / maxDimension;
      const scale = baseScale * scaleRef.current;

      // Transform atoms to screen coordinates
      const transformedAtoms = atoms.map(atom => {
        const rotated = rotatePoint(
          { x: atom.x, y: atom.y, z: atom.z },
          rotationRef.current.x,
          rotationRef.current.y
        );
        const projected = projectPoint(rotated, width, height, scale);
        return { ...atom, screenX: projected.x, screenY: projected.y, screenScale: projected.scale, z: rotated.z };
      });

      // Sort by Z for proper depth rendering
      const sortedAtoms = [...transformedAtoms].sort((a, b) => a.z - b.z);
      
      // Create transformed atom lookup map for O(1) bond access
      const transformedAtomMap = new Map<string, typeof transformedAtoms[0]>();
      transformedAtoms.forEach(atom => transformedAtomMap.set(atom.id, atom));

      // Draw bonds first (behind atoms)
      ctx.lineCap = 'round';
      molecule.bonds.forEach(bond => {
        const fromAtom = transformedAtomMap.get(bond.from);
        const toAtom = transformedAtomMap.get(bond.to);
        if (!fromAtom || !toAtom) return;

        const midZ = (fromAtom.z + toAtom.z) / 2;
        const opacity = 0.4 + (1 - Math.abs(midZ) / 5) * 0.4;
        const bondWidth = (2 + (fromAtom.screenScale + toAtom.screenScale) / 2) * (bond.order || 1);

        // Draw bond with gradient
        const bondGradient = ctx.createLinearGradient(
          fromAtom.screenX, fromAtom.screenY,
          toAtom.screenX, toAtom.screenY
        );
        
        const fromColor = fromAtom.color || ELEMENT_COLORS[fromAtom.element] || ELEMENT_COLORS.default;
        const toColor = toAtom.color || ELEMENT_COLORS[toAtom.element] || ELEMENT_COLORS.default;
        
        bondGradient.addColorStop(0, fromColor);
        bondGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.8)');
        bondGradient.addColorStop(1, toColor);

        ctx.strokeStyle = bondGradient;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = bondWidth;
        ctx.beginPath();
        ctx.moveTo(fromAtom.screenX, fromAtom.screenY);
        ctx.lineTo(toAtom.screenX, toAtom.screenY);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Draw atoms
      sortedAtoms.forEach(atom => {
        const color = atom.color || ELEMENT_COLORS[atom.element] || ELEMENT_COLORS.default;
        const baseRadius = atom.radius || ELEMENT_RADII[atom.element] || ELEMENT_RADII.default;
        const radius = baseRadius * scale * 0.8 * atom.screenScale;
        const isHighlighted = highlightAtoms.includes(atom.id);
        const isHovered = hoveredAtom?.id === atom.id;
        const isSelected = selectedAtom?.id === atom.id;

        // Glow effect for highlighted/hovered atoms
        if (isHighlighted || isHovered || isSelected) {
          const glowRadius = radius * 2.5;
          const glowGradient = ctx.createRadialGradient(
            atom.screenX, atom.screenY, radius,
            atom.screenX, atom.screenY, glowRadius
          );
          glowGradient.addColorStop(0, isSelected ? 'rgba(16, 185, 129, 0.6)' : 'rgba(139, 92, 246, 0.6)');
          glowGradient.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(atom.screenX, atom.screenY, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Atom sphere with 3D shading
        const atomGradient = ctx.createRadialGradient(
          atom.screenX - radius * 0.3, atom.screenY - radius * 0.3, 0,
          atom.screenX, atom.screenY, radius
        );
        atomGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        atomGradient.addColorStop(0.3, color);
        atomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');

        ctx.fillStyle = atomGradient;
        ctx.beginPath();
        ctx.arc(atom.screenX, atom.screenY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Atom outline
        ctx.strokeStyle = isSelected ? 'rgba(16, 185, 129, 0.8)' : 
                          isHighlighted ? 'rgba(139, 92, 246, 0.8)' : 
                          'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = isSelected || isHighlighted ? 2 : 1;
        ctx.stroke();

        // Atom label
        if (showLabels && radius > 10) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${Math.max(10, radius * 0.8)}px var(--font-mono, monospace)`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(atom.element, atom.screenX, atom.screenY);
        }
      });

      // Update rotation for auto-rotate (respect reduced motion)
      if (autoRotate && !dragRef.current.isDragging && !prefersReducedMotion) {
        rotationRef.current.y += rotationSpeed;
      }

      animationRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [molecule, width, height, autoRotate, rotationSpeed, showLabels, highlightAtoms, hoveredAtom, selectedAtom, getCenteredAtoms, getBounds]);

  return (
    <div
      ref={containerRef}
      className={clsx(styles.molecule3dViewer, className)}
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ width, height, cursor: hoveredAtom ? 'pointer' : (enableDrag ? 'grab' : 'default') }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        role="img"
        aria-label={`Interactive 3D visualization of ${molecule.name}${molecule.formula ? ` (${molecule.formula})` : ''}. Drag to rotate, scroll to zoom.`}
      />
      
      {showInfo && (
        <div className={styles.infoPanel}>
          <div className={styles.moleculeName}>{molecule.name}</div>
          {molecule.formula && (
            <div className={styles.moleculeFormula}>{molecule.formula}</div>
          )}
          {molecule.modality && (
            <div className={styles.moleculeModality}>
              <span className={styles.label}>MODALITY:</span> {molecule.modality}
            </div>
          )}
          {molecule.mechanism && (
            <div className={styles.moleculeMechanism}>
              <span className={styles.label}>MOA:</span> {molecule.mechanism}
            </div>
          )}
        </div>
      )}

      {(hoveredAtom || selectedAtom) && (
        <div className={styles.atomTooltip}>
          <div className={styles.atomElement}>{(selectedAtom || hoveredAtom)!.element}</div>
          {(selectedAtom || hoveredAtom)!.label && (
            <div className={styles.atomLabel}>{(selectedAtom || hoveredAtom)!.label}</div>
          )}
          <div className={styles.atomCoords}>
            ({(selectedAtom || hoveredAtom)!.x.toFixed(2)}, {(selectedAtom || hoveredAtom)!.y.toFixed(2)}, {(selectedAtom || hoveredAtom)!.z.toFixed(2)})
          </div>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.controlHint}>🖱️ Drag to rotate • Scroll to zoom</div>
      </div>
    </div>
  );
};

Molecule3DViewer.displayName = 'Molecule3DViewer';
