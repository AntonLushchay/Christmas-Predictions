import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Helper to create a soft glow texture
function createSnowTexture(size = 32) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    const center = size / 2;
    const gradient = context.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

export default function Snow({
    isShaking,
    radius = 0.85,
    count = 1500,
    size = 0.05,
    impulseStrength = 1.0,
    textureSize = 32,
}) {
    const pointsRef = useRef();
    const prevCountRef = useRef(count);

    const texture = useMemo(() => createSnowTexture(textureSize), [textureSize]);

    // Initial positions
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            // Random position inside sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const r = radius * 0.95 * Math.cbrt(Math.random()); // Keep inside sphere

            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.cos(phi); // Random Y
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }

        return pos;
    }, [count, radius]);

    const prevShaking = useRef(false);
    // Store velocities for physics
    const velocities = useMemo(() => new Float32Array(count * 3), [count]);

    // Random stopping point for each particle to create a pile
    const stopRadii = useMemo(() => {
        const radii = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            // Uniform distribution on a disc: sqrt(random)
            // Keep pile within globe radius
            radii[i] = Math.sqrt(Math.random()) * radius * 0.8;
        }
        return radii;
    }, [count, radius]);

    // Random gravity factor for each particle
    const gravityFactors = useMemo(() => {
        const factors = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            factors[i] = 0.5 + Math.random() * 1.0; // 0.5 to 1.5
        }
        return factors;
    }, [count]);

    // Cleanup and reinit geometry when count changes
    React.useEffect(() => {
        if (pointsRef.current && prevCountRef.current !== count) {
            // Dispose old geometry
            if (pointsRef.current.geometry) {
                pointsRef.current.geometry.dispose();
            }
            prevCountRef.current = count;
        }

        return () => {
            // Cleanup on unmount
            if (pointsRef.current?.geometry) {
                pointsRef.current.geometry.dispose();
            }
        };
    }, [count]);

    useFrame((state, delta) => {
        if (!pointsRef.current || !pointsRef.current.geometry) return;

        const positionsAttr = pointsRef.current.geometry.attributes.position;
        if (!positionsAttr || positionsAttr.array.length !== count * 3) {
            // Geometry was disposed or doesn't match count, skip frame
            return;
        }

        const currentPositions = positionsAttr.array;
        const radiusSq = radius * radius;

        // Normalize delta to 60 FPS baseline (delta at 60fps ≈ 0.0167)
        const deltaMultiplier = delta * 60;

        // Detect trigger
        const isTriggered = isShaking && !prevShaking.current;
        prevShaking.current = isShaking;

        for (let i = 0; i < count; i++) {
            const idx = i * 3;

            // 1. IMPULSE: If triggered, launch particles up!
            if (isTriggered) {
                // Случайная сила для каждой частицы (от 0.5 до 1.5)
                const randomStrength = 0.5 + Math.random() * 1.0;
                const effectiveStrength = impulseStrength * randomStrength;

                velocities[idx] += (Math.random() - 0.5) * 0.04 * effectiveStrength; // Spread X
                velocities[idx + 1] += (0.03 + Math.random() * 0.06) * effectiveStrength; // Launch UP
                velocities[idx + 2] += (Math.random() - 0.5) * 0.04 * effectiveStrength; // Spread Z
            }

            // 2. PHYSICS (normalized by delta)
            // Gravity (increased for faster fall)
            velocities[idx + 1] -= 0.00015 * gravityFactors[i] * deltaMultiplier;
            // Drag (frame-rate independent)
            const dragFactor = Math.pow(0.95, deltaMultiplier);
            velocities[idx] *= dragFactor;
            velocities[idx + 1] *= dragFactor;
            velocities[idx + 2] *= dragFactor;

            // Apply velocity (scaled by delta)
            currentPositions[idx] += velocities[idx] * deltaMultiplier;
            currentPositions[idx + 1] += velocities[idx + 1] * deltaMultiplier;
            currentPositions[idx + 2] += velocities[idx + 2] * deltaMultiplier;

            // 3. COLLISION (Floor/Sphere)
            const x = currentPositions[idx];
            const z = currentPositions[idx + 2];
            const xzSq = x * x + z * z;

            if (xzSq > radiusSq) {
                // Keep inside cylinder approximation for simplicity or push back
                currentPositions[idx] *= 0.9;
                currentPositions[idx + 2] *= 0.9;
            }

            // Calculate sphere bounds at this X/Z
            const sphereY = Math.sqrt(Math.max(0, radiusSq - xzSq));

            // Ceiling check (Top Hemisphere)
            if (currentPositions[idx + 1] > sphereY) {
                currentPositions[idx + 1] = sphereY;
                velocities[idx + 1] = 0; // Stop upward movement, let gravity take over
            }

            // Floor check (Bottom Hemisphere)
            if (currentPositions[idx + 1] < -sphereY) {
                // Slide towards bottom until reaching assigned radius
                const stopRadiusSq = stopRadii[i] * stopRadii[i];

                if (xzSq > stopRadiusSq) {
                    currentPositions[idx] *= 0.999;
                    currentPositions[idx + 2] *= 0.999;
                }

                // Re-calculate surface height for new position
                const newX = currentPositions[idx];
                const newZ = currentPositions[idx + 2];
                const newSphereY = Math.sqrt(Math.max(0, radiusSq - (newX * newX + newZ * newZ)));

                currentPositions[idx + 1] = -newSphereY;

                velocities[idx] = 0;
                velocities[idx + 1] = 0;
                velocities[idx + 2] = 0;
            }
        }

        positionsAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                map={texture}
                size={size}
                color="white"
                transparent
                opacity={0.8}
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}
