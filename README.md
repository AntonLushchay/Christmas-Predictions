# Christmas Predictions 🎄

An interactive Christmas magic experience. Shake the snow globe and receive a magical prediction for the new year!

**Status:** 🚧 In Development

## About

This is a personal project created with a focus on "vibe coding" — prioritizing smooth, intuitive interactions and a delightful user experience. The application is actively evolving and may change significantly as development continues.

Users can interact with an animated snow globe that displays personalized predictions in both Russian and English.

## Features

-   ✨ **Interactive Snow Globe** — Click to shake and reveal predictions
-   🌍 **Bilingual Support** — Russian and English languages
-   ❄️ **Animated Snowflakes** — Dynamic snow effects
-   🔊 **Sound Effects** — Magical audio feedback using Web Audio API
-   📱 **Responsive Design** — Works on desktop and mobile
-   ⚡ **Fast & Lightweight** — Built with Vite for optimal performance

## Tech Stack

-   **Build Tool:** [Vite](https://vitejs.dev/)
-   **Styling:** [SCSS](https://sass-lang.com/)
-   **JavaScript:** Vanilla JavaScript (ES6+)
-   **Audio:** Web Audio API for procedural sound generation
-   **Deployment:** GitHub Pages

## Installation

```bash
# Clone the repository
git clone https://github.com/AntonLushchay/Christmas-Predictions.git
cd Christmas-Predictions

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Development

### Available Scripts

-   `npm run dev` — Start development server with hot module reloading
-   `npm run build` — Build optimized production bundle
-   `npm run preview` — Preview production build locally
-   `npm run deploy` — Build and preview together

### Project Structure

```
src/
├── js/
│   ├── main.js          # Main application logic
│   ├── predictions.js   # Prediction data (RU/EN)
│   └── audio.js         # Web Audio API implementation
└── styles/
    ├── main.scss        # Main stylesheet
    ├── _variables.scss  # SCSS variables
    ├── _base.scss       # Base styles
    ├── _globe.scss      # Snow globe component styles
    └── _animations.scss # Animation definitions
```

## How It Works

1. User clicks on the snow globe
2. Shake animation is triggered
3. Random prediction is selected (based on current language)
4. Magical sound effect plays
5. Snowflakes animate around the globe
6. Prediction text appears with smooth fade-in

## Language Toggle

Users can switch between Russian and English using the language toggle button in the top-right corner.

## Future Improvements

This project is in active development. Potential enhancements include:

-   Additional visual effects
-   More prediction variations
-   Mobile gesture support
-   Accessibility improvements
-   Performance optimizations

## License

This project is created for personal use.

---

**Made with ✨ and a love for magic** 🎅
