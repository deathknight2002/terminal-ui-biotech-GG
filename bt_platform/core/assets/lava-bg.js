// Lava Background Animation using Vanta.js
// Initializes animated WebGL background with aurora/lava effect

document.addEventListener("DOMContentLoaded", () => {
    // Check for reduced motion preference
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (reduceMotion) {
        console.log("Lava background disabled due to prefers-reduced-motion");
        return;
    }
    
    // Check if VANTA is available
    if (typeof VANTA === 'undefined') {
        console.warn("VANTA.js not loaded, using fallback background");
        // Apply static gradient fallback
        document.body.style.background = "linear-gradient(135deg, #070b1a 0%, #0a0e27 50%, #0b1024 100%)";
        return;
    }
    
    // Create canvas element for WebGL
    const canvas = document.createElement('canvas');
    canvas.id = 'lava-background';
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        opacity: 0.08;
        pointer-events: none;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);
    
    // Initialize Vanta NET effect (aurora-like network visualization)
    try {
        const vantaEffect = VANTA.NET({
            el: canvas,
            mouseControls: false,
            touchControls: false,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x00ff9f,           // Accent cyan-green
            backgroundColor: 0x070b1a,  // Dark background
            points: 12.0,
            maxDistance: 20.0,
            spacing: 18.0,
            showDots: true,
            // Performance optimizations
            forceAnimate: false,
        });
        
        // Pause animation when window is not visible
        let animationPaused = false;
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !animationPaused) {
                // Pause animation when tab is hidden
                if (vantaEffect && vantaEffect.pause) {
                    vantaEffect.pause();
                }
                animationPaused = true;
            } else if (!document.hidden && animationPaused) {
                // Resume animation when tab becomes visible
                if (vantaEffect && vantaEffect.play) {
                    vantaEffect.play();
                }
                animationPaused = false;
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (vantaEffect && vantaEffect.resize) {
                vantaEffect.resize();
            }
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (vantaEffect && vantaEffect.destroy) {
                vantaEffect.destroy();
            }
        });
        
        console.log("Lava background initialized successfully");
        
    } catch (error) {
        console.error("Failed to initialize Vanta effect:", error);
        // Apply static gradient fallback
        document.body.style.background = "linear-gradient(135deg, #070b1a 0%, #0a0e27 50%, #0b1024 100%)";
    }
});

// Alternative: Custom shader implementation (if VANTA not available)
// This provides a simpler fallback using CSS animations
function initSimpleLavaBackground() {
    const canvas = document.createElement('canvas');
    canvas.id = 'lava-background';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        opacity: 0.08;
        pointer-events: none;
    `;
    
    document.body.insertBefore(canvas, document.body.firstChild);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Simple particle system
    const particles = [];
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1,
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            // Wrap around edges
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#00ff9f';
            ctx.fill();
        });
        
        // Draw connections
        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(0, 255, 159, ${1 - distance / 150})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            });
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}
