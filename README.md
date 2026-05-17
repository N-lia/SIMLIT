# SIMLIT

SIMLIT is a lightweight, interactive simulation platform built to provide hands-on, visual learning tools across multiple engineering, scientific, and legal disciplines. The application is designed to be highly performant, fully client-side, and aesthetically cohesive, utilizing a custom rendering framework to minimize overhead and maximize responsiveness.

## Technical Architecture

The SIMLIT architecture is fundamentally designed around a minimalist, dependency-light approach that avoids heavy framework bloat while retaining a modern developer experience.

### Core Components
- **Bundler:** Vite
  Used for fast HMR (Hot Module Replacement) and optimized production builds.
- **Rendering Engine:** Custom \`react-lite.js\`
  A lightweight, custom implementation of the React API (\`h\`, \`Fragment\`, \`render\`, \`useState\`, \`useEffect\`, \`useRef\`). The project configures Vite's \`esbuild\` to use the \`react-lite\` JSX factory, converting standard JSX into high-performance DOM nodes without requiring the full React library.
- **Physics and Mathematics:**
  - `cannon-es`: Utilized for rigid-body physics calculations in advanced simulations.
  - Custom RK4/Euler Integrators: Used for complex dynamics systems (e.g., Double Pendulum, Orbit Mechanics).
  - \`KaTeX\`: Used for rendering high-fidelity mathematical notation in the UI.
- **Styling:** 
  Vanilla CSS heavily leveraging CSS Custom Properties (Variables) to establish a distinct, warm, "vintage casebook" aesthetic.
- **Module Loading:** 
  Simulations are loaded on demand via dynamic \`import()\` statements, keeping the initial application bundle size minimal.

### Simulation Lifecycle
Each simulation is an independent module exporting a mount function. When a user selects a topic:
1. The router resolves the appropriate module chunk.
2. The custom \`react-lite\` engine renders the module's JSX into a DOM node.
3. The component binds canvas loops (\`requestAnimationFrame\`) and event listeners via \`useEffect\`.
4. Upon navigation away, the component's cleanup function is triggered to halt physics loops and dispose of event listeners, preventing memory leaks.

## Available Simulations

The platform currently supports the following interactive simulations:

### Statics
* Free Body Diagram
* Equilibrium of Forces
* Truss Analysis

### Dynamics
* Newton's 2nd Law
* Projectile Motion
* Simple Pendulum
* Collision Sandbox
* Double Pendulum
* Wave Lab

### Fluid Mechanics
* Bernoulli's Principle
* Pipe Flow and Losses
* Hydrostatic Pressure

### Thermodynamics
* Ideal Gas Law
* Heat Engine

### Strength of Material
* Beam Bending
* Stress and Strain
* Mohr's Circle

### Circuit Theory
* Ohm's Law
* Kirchhoff's Laws
* DC Motor Studio

### Mathematics
* Vector Addition

### Computer Science
* NAND Flash Memory
* CPU Scheduler

### Law
* Case Study Simulator
* Virtual Courtroom

## Offline AI Integration (Llama.cpp)

SIMLIT's architecture allows for offline, context-aware AI tutoring using a local LLM via \`llama.cpp\`. By capturing the active simulation state (e.g., active forces, waiting processes, or current legal facts) and forwarding it to the local inference server, the system can provide Socratic-style hints to users without requiring an internet connection or external API keys.

## Running Locally

1. Install dependencies: \`npm install\`
2. Start the development server: \`npm run dev\`
3. Open the provided localhost URL in your browser.
