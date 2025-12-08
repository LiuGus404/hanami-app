import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export interface ParticleConfig {
    particleCount?: number; // Not used directly, determined by sampling stride
    samplingStride?: number; // Higher = fewer particles
    baseSpeed?: number;
    mouseRadius?: number;
    mouseForce?: number;
    returnSpeed?: number;
    noiseScale?: number;
    particleSize?: number;
}

interface ReferenceImageAnalysisProps {
    onComplete?: () => void;
    images: File[];
    config?: ParticleConfig;
}

export const ReferenceImageAnalysis: React.FC<ReferenceImageAnalysisProps> = ({
    onComplete,
    images,
    config
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Config defaults
    const stride = config?.samplingStride ?? 4; // Sample every 4th pixel
    const baseSpeed = config?.baseSpeed ?? 1;
    const mouseRadius = config?.mouseRadius ?? 100;
    const mouseForce = config?.mouseForce ?? 20;
    const returnSpeed = config?.returnSpeed ?? 0.05;
    const particleSize = config?.particleSize ?? 1.5;

    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    useEffect(() => {
        const urls = images.map(img => URL.createObjectURL(img));
        setPreviewUrls(urls);
        return () => {
            urls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [images]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let width = window.innerWidth;
        let height = window.innerHeight;

        // Particle Class
        class Particle {
            x: number;
            y: number;
            originX: number;
            originY: number;
            color: string;
            vx: number;
            vy: number;
            size: number;
            density: number;

            constructor(x: number, y: number, color: string) {
                this.x = Math.random() * width; // Start random
                this.y = Math.random() * height;
                this.originX = x;
                this.originY = y;
                this.color = color;
                this.vx = 0;
                this.vy = 0;
                this.size = Math.random() * particleSize + 0.5;
                this.density = (Math.random() * 30) + 1;
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }

            update(mouseX: number, mouseY: number) {
                // Return to origin force
                let dx = this.originX - this.x;
                let dy = this.originY - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let force = distance * returnSpeed;

                let directionX = forceDirectionX * force * this.density * 0.01;
                let directionY = forceDirectionY * force * this.density * 0.01;

                if (distance < 1) {
                    this.x = this.originX;
                    this.y = this.originY;
                } else {
                    this.vx += directionX;
                    this.vy += directionY;
                }

                // Mouse Repulsion
                let dxMouse = mouseX - this.x;
                let dyMouse = mouseY - this.y;
                let distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

                if (distMouse < mouseRadius) {
                    const force = (mouseRadius - distMouse) / mouseRadius;
                    const repulsionX = (dxMouse / distMouse) * force * mouseForce * -1;
                    const repulsionY = (dyMouse / distMouse) * force * mouseForce * -1;
                    this.vx += repulsionX;
                    this.vy += repulsionY;
                }

                // Damping
                this.vx *= 0.9;
                this.vy *= 0.9;

                // Brownian/Noise motion
                this.x += this.vx + (Math.random() - 0.5) * baseSpeed;
                this.y += this.vy + (Math.random() - 0.5) * baseSpeed;
            }
        }

        const initParticles = (image: HTMLImageElement) => {
            particles = [];

            // Calculate scale to fit image in screen
            const scale = Math.min(
                (window.innerWidth * 0.8) / image.width,
                (window.innerHeight * 0.6) / image.height
            );

            const scaledW = image.width * scale;
            const scaledH = image.height * scale;
            const offsetX = (window.innerWidth - scaledW) / 2;
            const offsetY = (window.innerHeight - scaledH) / 2;

            // Draw to offscreen canvas to sample
            const offCanvas = document.createElement('canvas');
            offCanvas.width = width;
            offCanvas.height = height;
            const offCtx = offCanvas.getContext('2d');
            if (!offCtx) return;

            offCtx.drawImage(image, offsetX, offsetY, scaledW, scaledH);
            const data = offCtx.getImageData(0, 0, width, height).data;

            for (let y = 0; y < height; y += stride) {
                for (let x = 0; x < width; x += stride) {
                    const i = (y * width + x) * 4;
                    if (data[i + 3] > 128) { // Only visible pixels
                        const color = `rgba(${data[i]}, ${data[i + 1]}, ${data[i + 2]}, ${data[i + 3] / 255})`;
                        particles.push(new Particle(x, y, color));
                    }
                }
            }
        };

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resize);
        resize();

        // Load first image
        if (previewUrls.length > 0) {
            const img = new Image();
            img.src = previewUrls[0];
            img.onload = () => {
                initParticles(img);
            };
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            // Optional: trails
            // ctx.fillStyle = 'rgba(0,0,0,0.1)';
            // ctx.fillRect(0,0,width,height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].draw();
                particles[i].update(mousePos.x, mousePos.y);
            }
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [previewUrls, config, mousePos]); // Re-run if config changes or images change

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    return (
        <div
            className="fixed inset-0 z-[110] bg-black cursor-none"
            onMouseMove={handleMouseMove}
        >
            <canvas ref={canvasRef} className="absolute inset-0 block" />

            {/* Overlay Text aligned to bottom like reference */}
            <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none z-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 }}
                >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-white/20 flex items-center justify-center animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
