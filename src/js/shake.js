export class ShakeDetector {
    constructor(options = {}) {
        this.threshold = options.threshold || 15;
        this.timeout = options.timeout || 1000;
        this.onShake = options.onShake || (() => {});

        this.lastTime = new Date();
        this.lastX = null;
        this.lastY = null;
        this.lastZ = null;

        this.isEnabled = false;

        this.handleMotion = this.handleMotion.bind(this);
    }

    // Request permission for iOS 13+ devices
    async requestPermission() {
        if (
            typeof DeviceMotionEvent !== 'undefined' &&
            typeof DeviceMotionEvent.requestPermission === 'function'
        ) {
            try {
                const response = await DeviceMotionEvent.requestPermission();
                if (response === 'granted') {
                    this.start();
                    return true;
                }
            } catch (e) {
                console.error('Error requesting device motion permission:', e);
            }
            return false;
        }
        // Non-iOS 13+ devices don't need permission
        this.start();
        return true;
    }

    start() {
        if (this.isEnabled) return;

        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', this.handleMotion, false);
            this.isEnabled = true;
        } else {
            console.log('DeviceMotion not supported');
        }
    }

    stop() {
        if (!this.isEnabled) return;
        window.removeEventListener('devicemotion', this.handleMotion, false);
        this.isEnabled = false;
    }

    handleMotion(e) {
        const current = e.accelerationIncludingGravity;
        if (!current) return;

        const currentTime = new Date();
        const diffTime = currentTime.getTime() - this.lastTime.getTime();

        if (diffTime > 100) {
            const { x, y, z } = current;

            if (this.lastX === null) {
                this.lastX = x;
                this.lastY = y;
                this.lastZ = z;
                return;
            }

            const speed =
                (Math.abs(x + y + z - this.lastX - this.lastY - this.lastZ) / diffTime) * 10000;

            if (speed > this.threshold) {
                this.onShake();
            }

            this.lastTime = currentTime;
            this.lastX = x;
            this.lastY = y;
            this.lastZ = z;
        }
    }
}
