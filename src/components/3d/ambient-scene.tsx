"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

/**
 * Deterministic PRNG (mulberry32) — keeps particle layout stable across
 * renders (render purity) and identical between SSR/CSR.
 */
function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

interface Particle {
    position: [number, number, number];
    speed: number;
    offset: number;
}

/**
 * Ambient particle field — subtle animated background for premium sections.
 * Instanced rendering, low segment counts, capped at 120 instances.
 */
function ParticleField({ count = 120 }: { count?: number }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    // Hoisted temp object — reused every frame instead of re-allocating.
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Memoized, seeded particle layout — computed once.
    const particles = useMemo<Particle[]>(() => {
        const random = mulberry32(1337);
        return Array.from({ length: count }, () => ({
            position: [
                (random() - 0.5) * 20,
                (random() - 0.5) * 20,
                (random() - 0.5) * 10,
            ] as [number, number, number],
            speed: 0.001 + random() * 0.003,
            offset: random() * Math.PI * 2,
        }));
    }, [count]);

    useFrame(({ clock }) => {
        // Skip work entirely while the tab is hidden.
        if (!meshRef.current || document.hidden) return;
        const time = clock.getElapsedTime();

        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            dummy.position.set(
                particle.position[0] +
                    Math.sin(time * particle.speed + particle.offset) * 0.5,
                particle.position[1] +
                    Math.cos(time * particle.speed + particle.offset) * 0.5,
                particle.position[2],
            );
            dummy.scale.setScalar(
                0.02 + Math.sin(time + particle.offset) * 0.01,
            );
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[1, 6, 6]} />
            {/* THREE.Color cannot parse OKLCH — hex approximation of the
                brand blue oklch(0.55 0.14 250). */}
            <meshBasicMaterial color="#4a7cd6" transparent opacity={0.3} />
        </instancedMesh>
    );
}

/**
 * Ambient 3D scene — subtle animated background layer.
 * Mount behind hero content only, via next/dynamic with ssr: false,
 * and gate behind useReducedMotion() at the call site.
 */
interface AmbientSceneProps {
    className?: string;
    showStars?: boolean;
    showParticles?: boolean;
    children?: React.ReactNode;
}

export function AmbientScene({
    className = "",
    showStars = true,
    showParticles = true,
}: AmbientSceneProps) {
    // pointer-events-none: the canvas is decorative — it must never
    // intercept scroll or clicks. Stack it via parent order, not negative z
    // (negative z would drop it behind the page background).
    return (
        <div className={`absolute inset-0 pointer-events-none ${className}`}>
            <Canvas
                camera={{ position: [0, 0, 5], fov: 60 }}
                dpr={[1, 1.5]}
                gl={{ antialias: false, alpha: true }}
                style={{ background: "transparent" }}
            >
                <Suspense fallback={null}>
                    {showStars && (
                        <Stars
                            radius={50}
                            depth={50}
                            count={800}
                            factor={2}
                            saturation={0.1}
                            fade
                            speed={0.5}
                        />
                    )}
                    {showParticles && <ParticleField />}

                    {/* Ambient light for subtle reflection */}
                    <ambientLight intensity={0.2} />
                </Suspense>
            </Canvas>
        </div>
    );
}

/**
 * Lazy wrapper for dynamic import of 3D components.
 * Use this to prevent SSR issues and enable code splitting.
 */
export function Scene3DWrapper({
    children,
    className = "",
    fallback = null,
}: {
    children: React.ReactNode;
    className?: string;
    fallback?: React.ReactNode;
}) {
    return (
        <div className={`relative ${className}`}>
            <Suspense fallback={fallback}>
                <Canvas dpr={[1, 1.5]} gl={{ antialias: false, alpha: true }}>
                    {children}
                </Canvas>
            </Suspense>
        </div>
    );
}
