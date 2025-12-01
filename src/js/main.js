import '../styles/main.scss';
import { predictions } from './predictions.js';
import { playMagicSound } from './audio.js';

console.log('Christmas Predictions App Initialized');

const state = {
  lang: 'ru',
  isAnimating: false
};

// DOM Elements
const globe = document.getElementById('globe');
const predictionEl = document.getElementById('prediction');
const langToggle = document.getElementById('lang-toggle');
const snowContainer = document.querySelector('.snow-container');

// Init
function init() {
  createSnowflakes();
  setupEventListeners();
  updateLangButton();
  
  // Hide loading screen
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.opacity = '0';
    setTimeout(() => loading.remove(), 500);
  }
}

function setupEventListeners() {
  globe.addEventListener('click', handleGlobeClick);
  langToggle.addEventListener('click', toggleLanguage);
}

function handleGlobeClick() {
  if (state.isAnimating) return;
  
  state.isAnimating = true;
  predictionEl.style.opacity = '0'; // Hide old prediction
  
  // Add animation classes
  globe.classList.add('shaking');
  
  // Wait for animation
  setTimeout(() => {
    showPrediction();
    globe.classList.remove('shaking');
    state.isAnimating = false;
  }, 2000); // 2 seconds animation
}

function showPrediction() {
  const currentPredictions = predictions[state.lang];
  const randomIndex = Math.floor(Math.random() * currentPredictions.length);
  const text = currentPredictions[randomIndex];
  
  predictionEl.textContent = text;
  predictionEl.style.opacity = '1';
  
  playMagicSound();
}

function toggleLanguage() {
  state.lang = state.lang === 'ru' ? 'en' : 'ru';
  updateLangButton();
  // Clear current prediction on lang switch
  predictionEl.style.opacity = '0';
}

function updateLangButton() {
  langToggle.textContent = state.lang.toUpperCase();
}

function createSnowflakes() {
  const snowflakeCount = 50;
  for (let i = 0; i < snowflakeCount; i++) {
    const flake = document.createElement('div');
    flake.classList.add('snowflake');
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.animationDuration = `${Math.random() * 3 + 2}s`; // 2-5s
    flake.style.animationDelay = `${Math.random() * 5}s`;
    flake.style.opacity = Math.random();
    flake.style.width = `${Math.random() * 4 + 2}px`;
    flake.style.height = flake.style.width;
    snowContainer.appendChild(flake);
  }
}

init();
