export function initAudio() {
    // Placeholder if needed for future WebAudio API usage
}

export function playMagicSound() {
    // Use the file from the public folder
    const audio = new Audio(`${import.meta.env.BASE_URL}magic-magic-sound-4.mp3`);

    const startVolume = 0.5;
    audio.volume = startVolume;

    audio.play().catch((error) => {
        console.warn('Audio playback failed:', error);
    });

    // Start fading out at 3 seconds to finish by 4 seconds
    setTimeout(() => {
        const fadeAudio = setInterval(() => {
            // Decrease volume smoothly
            if (audio.volume > 0.05) {
                audio.volume -= 0.05;
            } else {
                // Cleanup when silent
                audio.volume = 0;
                audio.pause();
                audio.currentTime = 0;
                clearInterval(fadeAudio);
            }
        }, 100); // 10 steps of 100ms = 1 second fade
    }, 6000);
}
