import React, { Suspense, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, useTexture } from '@react-three/drei';
import Globe from './Globe';
import * as THREE from 'three';

function CameraRig() {
    const { gl } = useThree();
    const touchPos = React.useRef({ x: 0, y: 0 });
    const isTouching = React.useRef(false);

    React.useEffect(() => {
        const canvas = gl.domElement;

        const handleTouchMove = (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();

                // Convert touch position to normalized coordinates (-1 to 1)
                touchPos.current.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
                touchPos.current.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
                isTouching.current = true;
            }
        };

        const handleTouchEnd = () => {
            isTouching.current = false;
        };

        canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
        canvas.addEventListener('touchend', handleTouchEnd);
        canvas.addEventListener('touchcancel', handleTouchEnd);

        return () => {
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
            canvas.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [gl]);

    useFrame((state) => {
        // Use touch position if touching, otherwise use mouse position
        const x = (isTouching.current ? touchPos.current.x : state.mouse.x) * 0.3;
        const y = (isTouching.current ? touchPos.current.y : state.mouse.y) * 0.3;

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
    // Scale up background by 20% to prevent edges showing when camera moves
    const bgScale = 1.2;
    return (
        <mesh position={[0, 0, -5]} scale={[planeWidth * bgScale, planeHeight * bgScale, 1]}>
            <planeGeometry />
            <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
    );
}

export default function Scene({ isShaking, prediction, isLowEnd = false }) {
    const isMobile = useMemo(() => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
        );
    }, []);

    const isDesktop = useMemo(() => !isMobile, [isMobile]);

    return (
        <Canvas
            dpr={isLowEnd ? 1 : [1, 2]}
            style={{ background: 'transparent', width: '100vw', height: '100vh' }}
            gl={{
                alpha: true,
                antialias: !isLowEnd,
                preserveDrawingBuffer: false,
                powerPreference: 'high-performance',
            }}
        >
            <PerspectiveCamera makeDefault position={[0, 0, 3.5]} />
            <CameraRig />

            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={2} />
            <pointLight position={[-3, 0, 2]} intensity={3} color="#ffffee" />

            <Suspense fallback={null}>
                <Background />
                <Globe isShaking={isShaking} prediction={prediction} isLowEnd={isLowEnd} />
                <Environment preset="city" />
            </Suspense>
        </Canvas>
    );
}
