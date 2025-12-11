import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Helper to create a soft glow texture
function createSnowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');

    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

export default function Snow({ isShaking }) {
    const pointsRef = useRef();
    const count = 1500;

    const texture = useMemo(() => createSnowTexture(), []);

    // Initial positions
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            // Random position inside sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const r = 0.85 * Math.cbrt(Math.random()); // Radius 0.85

            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.cos(phi); // Random Y
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }

        return pos;
    }, []);

    const prevShaking = useRef(false);
    // Store velocities for physics
    const velocities = useMemo(() => new Float32Array(count * 3), []);

    // Random stopping point for each particle to create a pile
    const stopRadii = useMemo(() => {
        const radii = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            // Uniform distribution on a disc: sqrt(random)
            // Max radius 0.6 ensures they gather at the bottom but don't clump
            radii[i] = Math.sqrt(Math.random()) * 0.8;
        }
        return radii;
    }, []);

    // Random gravity factor for each particle
    const gravityFactors = useMemo(() => {
        const factors = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            factors[i] = 0.5 + Math.random() * 1.0; // 0.5 to 1.5
        }
        return factors;
    }, []);

    useFrame(() => {
        if (!pointsRef.current) return;

        const positionsAttr = pointsRef.current.geometry.attributes.position;
        const currentPositions = positionsAttr.array;
        const radiusSq = 0.85 * 0.85;

        // Detect trigger
        const isTriggered = isShaking && !prevShaking.current;
        prevShaking.current = isShaking;

        for (let i = 0; i < count; i++) {
            const idx = i * 3;

            // 1. IMPULSE: If triggered, launch particles up!
            if (isTriggered) {
                velocities[idx] += (Math.random() - 0.5) * 0.04; // Spread X
                velocities[idx + 1] += 0.03 + Math.random() * 0.06; // Launch UP
                velocities[idx + 2] += (Math.random() - 0.5) * 0.04; // Spread Z
            }

            // 2. PHYSICS
            // Gravity
            velocities[idx + 1] -= 0.00006 * gravityFactors[i];
            // Drag
            velocities[idx] *= 0.95;
            velocities[idx + 1] *= 0.95;
            velocities[idx + 2] *= 0.95;

            // Apply velocity
            currentPositions[idx] += velocities[idx];
            currentPositions[idx + 1] += velocities[idx + 1];
            currentPositions[idx + 2] += velocities[idx + 2];

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
                size={0.05}
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
