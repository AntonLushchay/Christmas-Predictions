let audioContext = null;

export function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

export function playMagicSound() {
  initAudio();
  
  const now = audioContext.currentTime;
  
  // Primary Tone (Bell)
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now); // A5
  osc.frequency.exponentialRampToValueAtTime(440, now + 1.5); // Drop pitch slightly
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.05); // Attack
  gain.gain.exponentialRampToValueAtTime(0.001, now + 2); // Decay
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start(now);
  osc.stop(now + 2);
  
  // Sparkles (High pitch randoms)
  for (let i = 0; i < 5; i++) {
    const sOsc = audioContext.createOscillator();
    const sGain = audioContext.createGain();
    
    sOsc.type = 'triangle';
    sOsc.frequency.setValueAtTime(1200 + Math.random() * 1000, now + i * 0.1);
    
    sGain.gain.setValueAtTime(0, now + i * 0.1);
    sGain.gain.linearRampToValueAtTime(0.05, now + i * 0.1 + 0.05);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
    
    sOsc.connect(sGain);
    sGain.connect(audioContext.destination);
    
    sOsc.start(now + i * 0.1);
    sOsc.stop(now + i * 0.1 + 0.5);
  }
}
