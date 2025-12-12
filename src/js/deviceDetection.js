/**
 * Device performance detection utility
 * Tries GPU info first, then falls back to CPU/RAM + FPS test
 */

export class DeviceDetector {
    constructor() {
        this.performanceLevel = null; // 'high', 'low', or null
        this.fpsTestResult = null;
    }

    /**
     * Try to get GPU renderer info
     * @returns {string|null} GPU renderer string or null
     */
    getGPUInfo() {
        try {
            const canvas = document.createElement('canvas');
            const gl =
                canvas.getContext('webgl2') ||
                canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl');

            if (!gl) return null;

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                return renderer;
            }
        } catch (e) {
            console.warn('GPU info detection failed:', e);
        }
        return null;
    }

    /**
     * Analyze GPU string to determine if it's low-end
     * @param {string} renderer GPU renderer string
     * @returns {boolean} true if low-end
     */
    isLowEndGPU(renderer) {
        if (!renderer) return false;

        const lowEndKeywords = [
            'intel hd',
            'intel(r) hd',
            'intel uhd',
            'intel(r) uhd',
            'integrated',
            'apple m1', // интегрированная, но достаточно мощная - можно убрать
            'mali',
            'adreno 3', // старые адрено
            'adreno 4',
            'adreno 5',
            'videocore',
            'swiftshader', // софтверный рендеринг
        ];

        const rendererLower = renderer.toLowerCase();

        // Проверка на слабые GPU
        for (const keyword of lowEndKeywords) {
            if (rendererLower.includes(keyword)) {
                // Исключение для новых Intel Arc (не слабые)
                if (rendererLower.includes('arc')) {
                    return false;
                }
                return true;
            }
        }

        return false;
    }

    /**
     * Check CPU cores and RAM
     * @returns {boolean} true if low-end
     */
    isLowEndCPURAM() {
        const cores = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4;

        // Считаем слабым: <= 4 ядра И <= 4GB RAM (оба условия)
        return cores <= 4 && memory <= 4;
    }

    /**
     * Run a quick FPS test
     * @returns {Promise<number>} Average FPS over test period
     */
    async runFPSTest() {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 300;
            canvas.style.position = 'fixed';
            canvas.style.top = '-9999px';
            document.body.appendChild(canvas);

            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (!gl) {
                document.body.removeChild(canvas);
                resolve(30); // Предполагаем средний FPS если WebGL недоступен
                return;
            }

            // Простая тестовая сцена
            gl.clearColor(0.1, 0.1, 0.1, 1.0);

            let frameCount = 0;
            const startTime = performance.now();
            const testDuration = 500; // 0.5 секунды

            const testRender = () => {
                const elapsed = performance.now() - startTime;

                if (elapsed < testDuration) {
                    // Простой рендер с некоторой нагрузкой
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    for (let i = 0; i < 100; i++) {
                        gl.drawArrays(gl.TRIANGLES, 0, 3);
                    }

                    frameCount++;
                    requestAnimationFrame(testRender);
                } else {
                    const fps = (frameCount / elapsed) * 1000;
                    document.body.removeChild(canvas);
                    this.fpsTestResult = fps;
                    resolve(fps);
                }
            };

            requestAnimationFrame(testRender);
        });
    }

    /**
     * Detect device performance level
     * @returns {Promise<'high'|'low'>} Performance level
     */
    async detect() {
        // 1. Try GPU detection first
        const gpuInfo = this.getGPUInfo();
        if (gpuInfo) {
            console.log('GPU detected:', gpuInfo);

            // Если явно ОЧЕНЬ слабая видеокарта - не тратим время на FPS тест
            const veryLowEndKeywords = [
                'swiftshader',
                'videocore', // Raspberry Pi
            ];

            const rendererLower = gpuInfo.toLowerCase();
            const isVeryLowEnd = veryLowEndKeywords.some((kw) => rendererLower.includes(kw));

            if (isVeryLowEnd) {
                console.log('Very low-end GPU detected, skipping FPS test');
                this.performanceLevel = 'low';
                return 'low';
            }

            // Если явно слабая (Intel HD, Mali и т.д.) - низкий приоритет, но всё равно тестируем
            const isLikeLowEnd = this.isLowEndGPU(gpuInfo);
            if (isLikeLowEnd) {
                console.log('Likely low-end GPU, but running FPS test for confirmation');
            }
        }

        // 2. Запускаем FPS тест в любом случае для финальной проверки
        console.log('Running FPS test for final performance check...');
        const fps = await this.runFPSTest();
        console.log('FPS test result:', fps.toFixed(1), 'FPS');

        // Если FPS < 40, считаем устройство слабым
        if (fps < 40) {
            console.log('Low FPS detected, setting low-end mode');
            this.performanceLevel = 'low';
            return 'low';
        }

        console.log('High performance detected');
        this.performanceLevel = 'high';
        return 'high';
    }
}
