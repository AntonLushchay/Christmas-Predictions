import React, { useState, useEffect, useCallback, useRef } from 'react';
import Scene from './components/Scene';
import Loader from './components/Loader';
import { predictions } from './js/predictions';
import { playMagicSound } from './js/audio';
import { ShakeDetector } from './js/shake';

export default function App() {
    const [lang, setLang] = useState('ru');
    const [prediction, setPrediction] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const [shakeDetector, setShakeDetector] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLowEnd, setIsLowEnd] = useState(false);
    const [isMobile] = useState(() =>
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    );

    const handleShake = useCallback(() => {
        if (isShaking) return;

        setIsShaking(true);
        setPrediction(''); // Clear previous prediction
        playMagicSound();

        // Show prediction earlier
        setTimeout(() => {
            const currentPredictions = predictions[lang];
            const randomPrediction =
                currentPredictions[Math.floor(Math.random() * currentPredictions.length)];
            setPrediction(randomPrediction);
        }, 1000);

        // Stop shaking after animation duration
        setTimeout(() => {
            setIsShaking(false);
        }, 6000);
    }, [isShaking, lang]);

    // Loader timing and FPS handler
    const loadStartRef = useRef(performance.now());

    const handleFPSSample = useCallback((fps) => {
        const threshold = 40;
        const isLow = fps < threshold;

        console.log(`[Режим графики] FPS: ${fps.toFixed(1)}, Порог: ${threshold}`);
        console.log(
            `[Режим графики] Выбран режим: ${
                isLow ? '🔻 LOW-END (пониженное качество)' : '✨ HIGH-END (максимальное качество)'
            }`,
        );

        setIsLowEnd(isLow);

        const minLoadTime = 1500;
        const elapsed = performance.now() - loadStartRef.current;
        const remaining = Math.max(0, minLoadTime - elapsed);
        setTimeout(() => setIsLoading(false), remaining);
    }, []);

    // Initialize Shake Detector (desktop only)
    useEffect(() => {
        if (isMobile) return; // disable motion-trigger on mobile

        const detector = new ShakeDetector({
            onShake: handleShake,
            threshold: 15,
        });
        detector.start();
        setShakeDetector(detector);

        return () => {
            detector.stop();
        };
    }, [handleShake, isMobile]);

    // Click handler for desktop testing
    const handleGlobeClick = () => {
        handleShake();
    };

    const toggleLang = () => {
        setLang((prev) => (prev === 'ru' ? 'en' : 'ru'));
    };

    return (
        <>
            <Loader isLoading={isLoading} />
            <div className="app-container">
                <div className="scene" onClick={handleGlobeClick}>
                    <Scene
                        isShaking={isShaking}
                        prediction={prediction}
                        isLowEnd={isLowEnd}
                        onFPSSample={handleFPSSample}
                    />
                </div>

                <button
                    className="lang-toggle"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleLang();
                    }}
                >
                    {lang.toUpperCase()}
                </button>
            </div>
        </>
    );
}
