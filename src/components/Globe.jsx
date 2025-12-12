import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Snow from './Snow';

// Preload font to prevent first-render glitch
function FontPreloader() {
    return (
        <Text
            visible={false}
            font={`${import.meta.env.BASE_URL}fonts/GreatVibes-Regular.ttf`}
            fontSize={0.1}
        >
            preload
        </Text>
    );
}

function AnimatedPrediction({ children, isMobile, globeScale }) {
    const textRef = useRef();

    useFrame((state, delta) => {
        if (!textRef.current) return;

        const speed = 0.5 * delta;
        const opacitySpeed = 0.2 * delta;

        // Lerp position from deep/low to center
        textRef.current.position.lerp(new THREE.Vector3(0, 0, 0), speed);

        // Lerp rotation from tilted back to upright
        textRef.current.rotation.x = THREE.MathUtils.lerp(textRef.current.rotation.x, 0, speed);

        // Lerp scale from small to full
        textRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), speed);

        // Lerp opacity
        if (textRef.current.fillOpacity < 1) {
            const newOpacity = THREE.MathUtils.lerp(textRef.current.fillOpacity, 1, opacitySpeed);
            textRef.current.fillOpacity = newOpacity;
            textRef.current.outlineOpacity = newOpacity;
        }
    });

    // Adaptive text sizing for mobile
    const fontSize = isMobile ? 0.11 : 0.22;
    const maxWidth = isMobile ? globeScale * 0.85 : 1.4;
    const outlineWidth = isMobile ? 0.008 : 0.018; // Улучшен контур

    return (
        <Text
            ref={textRef}
            position={[0, -0.5, -0.8]} // Start: Low and deep
            rotation={[-Math.PI / 2, 0, 0]} // Start: Lying flat
            scale={[0.5, 0.5, 0.5]} // Start: Small
            fillOpacity={0} // Start: Transparent
            outlineOpacity={0}
            fontSize={fontSize}
            color="#FFE93D" // Яркое, чистое золото
            outlineWidth={outlineWidth}
            outlineColor="#0D0D0D" // Чёрный контур
            font={`${import.meta.env.BASE_URL}fonts/GreatVibes-Regular.ttf`}
            anchorX="center"
            anchorY="middle"
            textAlign="center"
            maxWidth={maxWidth}
            letterSpacing={0.08} // Больше расстояния между буквами
            lineHeight={1.2}
            materialType="standard"
        >
            {children}
        </Text>
    );
}

export default function Globe({ isShaking, prediction, isLowEnd = false }) {
    const meshRef = useRef();
    const groupRef = useRef();

    // Detect mobile device
    const [isMobile] = React.useState(() => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
        );
    });

    // Animation state tracking
    const shakeStartTime = useRef(0);
    const startRotationY = useRef(0);
    const prevShaking = useRef(false);

    // Adaptive scale based on device
    const globeScale = isMobile ? 0.6 : 1;
    const snowCount = isMobile ? 250 : isLowEnd ? 1250 : 2200;
    const snowSize = isMobile ? 0.03 : isLowEnd ? 0.025 : 0.035;
    const snowImpulse = isMobile ? 0.5 : 1.0;

    useFrame((state) => {
        // Detect start of shake
        if (isShaking && !prevShaking.current) {
            shakeStartTime.current = state.clock.getElapsedTime();
            startRotationY.current = meshRef.current.rotation.y;
        }
        prevShaking.current = isShaking;

        if (isShaking) {
            const elapsed = state.clock.getElapsedTime() - shakeStartTime.current;
            const duration = 7;
            const t = Math.min(1, elapsed / duration);

            // Ease In Out Cubic for smooth start/end
            const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

            // Rotate exactly 360 degrees (2PI) over the duration
            meshRef.current.rotation.y = startRotationY.current + Math.PI * 2 * ease;

            // Stabilize other axes
            meshRef.current.rotation.x *= 0.9;
            meshRef.current.rotation.z *= 0.9;
        } else {
            // Gentle rotation when idle
            meshRef.current.rotation.y += 0.002;

            // Smooth return to upright
            meshRef.current.rotation.x *= 0.95;
            meshRef.current.rotation.z *= 0.95;
        }
    });

    const config = {
        thickness: 0.2,
        roughness: 0,
        transmission: 1,
        ior: 1.2,
        chromaticAberration: 0,
        backside: true,
    };

    // Adaptive resolution based on device
    const resolution = isMobile ? 512 : isLowEnd ? 1024 : 2048;
    const sphereSegments = isMobile ? 32 : isLowEnd ? 32 : 64;

    return (
        <group ref={groupRef}>
            <FontPreloader />
            <mesh ref={meshRef} castShadow receiveShadow>
                <sphereGeometry args={[globeScale, sphereSegments, sphereSegments]} />
                <MeshTransmissionMaterial
                    {...config}
                    resolution={resolution}
                    distortion={0}
                    distortionScale={0}
                    temporalDistortion={0}
                />

                <Snow
                    isShaking={isShaking}
                    radius={globeScale * 0.9}
                    count={snowCount}
                    size={snowSize}
                    impulseStrength={snowImpulse}
                    textureSize={isMobile ? 16 : isLowEnd ? 16 : 64}
                />
            </mesh>

            {prediction && (
                <AnimatedPrediction isMobile={isMobile} globeScale={globeScale}>
                    {prediction}
                </AnimatedPrediction>
            )}
        </group>
    );
}
