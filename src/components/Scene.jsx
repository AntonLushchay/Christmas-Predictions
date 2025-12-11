import React, { Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, useTexture } from '@react-three/drei';
import Globe from './Globe';
import * as THREE from 'three';

function CameraRig() {
    useFrame((state) => {
        // Mouse position: x and y are between -1 and 1
        // Multiply by a small factor to limit the range of movement
        const x = state.mouse.x * 0.5;
        const y = state.mouse.y * 0.5;

        // Smoothly interpolate camera position
        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, x, 0.05);
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, y, 0.05);

        // Ensure camera always looks at the center
        state.camera.lookAt(0, 0, 0);
    });
    return null;
}

function Background() {
    const texture = useTexture(`${import.meta.env.BASE_URL}background_festive.png`);
    const { viewport } = useThree();

    // Calculate viewport size at z = -5
    // Camera is at z = 3.5 (default from PerspectiveCamera below)
    // We can just use a large scale or calculate it precisely if needed.
    // But useThree viewport is at z=0 by default.
    // Let's use a simpler approach: scale to cover viewport at depth.

    // Actually, useThree provides viewport which has width/height at z=0.
    // To get it at z=-5, we can scale it.
    // Or simpler: use a ScreenQuad-like approach or just a big plane if perspective is not critical.
    // But for a background image to look "flat" or "cover", we want it to fill the frustum.

    // Let's use the viewport.getCurrentViewport method if available or just estimate.
    // Since we are inside Canvas, we can access camera.
    const { camera } = useThree();

    // Calculate visible height at z=-5
    // distance = camera.position.z - (-5) = 3.5 + 5 = 8.5
    // vFOV = camera.fov
    // height = 2 * tan(fov/2) * distance

    const distance = 8.5;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const height = 2 * Math.tan(vFov / 2) * distance;
    const width = height * viewport.aspect;

    // Calculate aspect ratios
    const imageAspect = texture.image.width / texture.image.height;
    const screenAspect = width / height;

    let planeWidth, planeHeight;

    // "Cover" logic: ensure the plane is always large enough to cover the screen
    if (screenAspect > imageAspect) {
        // Screen is wider than image: match width, scale height
        planeWidth = width;
        planeHeight = width / imageAspect;
    } else {
        // Screen is taller than image: match height, scale width
        planeHeight = height;
        planeWidth = height * imageAspect;
    }

    texture.colorSpace = THREE.SRGBColorSpace;
    return (
        <mesh position={[0, 0, -5]} scale={[planeWidth, planeHeight, 1]}>
            <planeGeometry />
            <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
    );
}

export default function Scene({ isShaking, prediction }) {
    return (
        <Canvas
            dpr={[1, 2]} // Support high-DPI screens (retina, mobile)
            style={{ background: 'transparent', width: '100%', height: '100%' }}
            gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        >
            <PerspectiveCamera makeDefault position={[0, 0, 3.5]} />
            <CameraRig />

            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={2} />
            <pointLight position={[-3, 0, 2]} intensity={3} color="#ffffee" />

            <Suspense fallback={null}>
                <Background />
                <Globe isShaking={isShaking} prediction={prediction} />
                <Environment preset="city" />
            </Suspense>
        </Canvas>
    );
}
