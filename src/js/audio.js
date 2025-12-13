let audioContext;

export function initAudio() {
    // Lazy init; real work happens in playMagicSound
}

async function getAudioContext() {
    if (audioContext) return audioContext;

    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;

    audioContext = new Ctor();
    return audioContext;
}

export async function playMagicSound() {
    const audio = new Audio(`${import.meta.env.BASE_URL}magic-magic-sound-4.mp3`);
    audio.crossOrigin = 'anonymous';

    const startVolume = 0.5;
    const fadeStartMs = 5000; // когда начать затухание
    const fadeDurationMs = 1200; // сколько длится плавный fade-out
    const hardStopMs = fadeStartMs + fadeDurationMs + 200; // запас, чтобы гарантированно остановить

    let ctx = null;
    let source = null;
    let gain = null;

    try {
        ctx = await getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            await ctx.resume();
        }
    } catch (err) {
        console.warn('AudioContext init/resume failed, fallback to HTMLAudio only:', err);
        ctx = null;
    }

    if (ctx) {
        source = ctx.createMediaElementSource(audio);
        gain = ctx.createGain();
        gain.gain.setValueAtTime(startVolume, ctx.currentTime);
        source.connect(gain).connect(ctx.destination);
    } else {
        // Фолбэк: сразу задаём громкость, но iOS может игнорировать
        audio.volume = startVolume;
    }

    audio.play().catch((error) => {
        console.warn('Audio playback failed:', error);
    });

    if (ctx && gain) {
        setTimeout(() => {
            const now = ctx.currentTime;
            // Снимаем старые планировщики и плавно уводим громкость в ноль
            gain.gain.cancelScheduledValues(now);
            gain.gain.setValueAtTime(gain.gain.value, now);
            gain.gain.linearRampToValueAtTime(0, now + fadeDurationMs / 1000);
        }, fadeStartMs);
    }

    // Хард-стоп для всех платформ (на случай если volume недоступен)
    setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        try {
            if (source) source.disconnect();
            if (gain) gain.disconnect();
        } catch (err) {
            console.warn('Audio cleanup warning:', err);
        }
    }, hardStopMs);
}
