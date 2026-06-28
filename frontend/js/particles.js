/* Smart Study Planner - Dynamic Particle Background Animation */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Create and inject canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'particles-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    const maxParticles = 60; // Optimal performance count

    // 2. Adjust canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 3. Define Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.4; // Slow drifting speed
            this.vy = (Math.random() - 0.5) * 0.4;
            this.size = Math.random() * 2.5 + 1.5;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
            if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;
        }

        draw(color) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = color;
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow for line performance
        }
    }

    // 4. Initialize Particle Array
    function init() {
        particlesArray = [];
        for (let i = 0; i < maxParticles; i++) {
            particlesArray.push(new Particle());
        }
    }
    init();

    // 5. Draw lines connecting close particles
    function connectParticles(colorLine) {
        for (let i = 0; i < particlesArray.length; i++) {
            for (let j = i + 1; j < particlesArray.length; j++) {
                const dist = Math.hypot(
                    particlesArray[i].x - particlesArray[j].x,
                    particlesArray[i].y - particlesArray[j].y
                );
                if (dist < 120) {
                    const alpha = (1 - dist / 120) * 0.15; // Fade lines as they move apart
                    ctx.strokeStyle = colorLine.replace('ALPHA', alpha);
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                    ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    // 6. Animation Loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dynamic styling based on theme
        const isLightTheme = document.body.classList.contains('light-theme');
        
        // Dark theme: glowing blue/purple particles. Light theme: slate/indigo particles
        const particleColor = isLightTheme ? 'rgba(99, 102, 241, 0.45)' : 'rgba(139, 92, 246, 0.6)';
        const lineTemplate = isLightTheme ? 'rgba(99, 102, 241, ALPHA)' : 'rgba(99, 102, 241, ALPHA)';

        particlesArray.forEach(particle => {
            particle.update();
            particle.draw(particleColor);
        });

        connectParticles(lineTemplate);
        requestAnimationFrame(animate);
    }
    animate();
});
