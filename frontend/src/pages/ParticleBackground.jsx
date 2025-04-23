import React, { useEffect, useRef } from 'react';

const ParticleBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = 100;

        class Particle {
            constructor(x, y, size, color, velocity) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.color = color;
                this.velocity = velocity;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }

            update() {
                this.x += this.velocity.x;
                this.y += this.velocity.y;

                if (
                    this.x < 0 ||
                    this.x > canvas.width ||
                    this.y < 0 ||
                    this.y > canvas.height
                ) {
                    this.x = Math.random() * canvas.width;
                    this.y = Math.random() * canvas.height;
                }

                this.draw();
            }
        }

        const init = () => {
            for (let i = 0; i < particleCount; i++) {
                const size = Math.random() * 3 + 1;
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const color = `rgba(106, 25, 252, ${Math.random()})`;
                const velocity = {
                    x: (Math.random() - 0.5) * 1.2,
                    y: (Math.random() - 0.5) * 1.2,
                };
                particles.push(new Particle(x, y, size, color, velocity));
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => p.update());
            requestAnimationFrame(animate);
        };

        init();
        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                zIndex: 0,
            }}
        >
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />

            {/* Text Overlay */}
            <div
                style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    zIndex: 2,
                    color: '#fff',
                    fontFamily: 'Segoe UI, sans-serif',
                    pointerEvents: 'none',
                    userSelect: 'none',
                }}
            >
                <h1
                    style={{
                        fontSize: '3rem',
                        fontWeight: '700',
                        transition: 'all 0.3s ease',
                        cursor: 'default',
                    }}
                    className="hover-text"
                >
                    <span style={{ color: '#fff', transition: 'color 0.3s' }}>
                        SK JEELAN
                    </span>{' '}
                    <span style={{ color: '#A78BFA' }}>PVT (LTD)</span>
                </h1>
                <p
                    style={{
                        marginTop: '10px',
                        fontSize: '1.2rem',
                        color: '#E0E0E0',
                        letterSpacing: '1px',
                        transition: 'color 0.3s',
                        cursor: 'default',
                    }}
                    className="hover-subtext"
                >
                    System by IMSS PVT (LTD)
                </p>
            </div>

            {/* Add hover effects */}
            <style>
                {`
                    .hover-text:hover span:first-child {
                        color: #A78BFA;
                    }
                    .hover-text:hover span:last-child {
                        color: #fff;
                    }
                    .hover-subtext:hover {
                        color: #fff;
                    }
                `}
            </style>
        </div>
    );
};

export default ParticleBackground;
