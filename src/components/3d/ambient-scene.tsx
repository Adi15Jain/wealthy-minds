"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import * as THREE from "three";

/**
 * Ambient particle field — subtle animated background for premium sections.
 * Uses instanced rendering for performance.
 */
function ParticleField({ count = 200 }: { count?: number }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = new THREE.Object3D();

    // Initialize random positions
    const particles = Array.from({ length: count }, () => ({
        position: [
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10,
        ] as [number, number, number],
        speed: 0.001 + Math.random() * 0.003,
        offset: Math.random() * Math.PI * 2,
    }));

    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        const time = clock.getElapsedTime();

        particles.forEach((particle, i) => {
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
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial
                color="oklch(0.55 0.14 250)"
                transparent
                opacity={0.3}
            />
        </instancedMesh>
    );
}

/**
 * Ambient 3D scene — wraps any content with a subtle animated background.
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
    return (
        <div className={`absolute inset-0 -z-10 ${className}`}>
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
                            count={1000}
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
