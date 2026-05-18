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

SIMLIT's architecture supports offline, context-aware AI tutoring through a local \`llama.cpp\` server. The app calls the OpenAI-compatible \`/v1/chat/completions\` endpoint from a small client boundary in \`src/ai/llamaClient.js\`, keeping inference optional and local.

The initial integration keeps the project vision intact: simulations remain the primary learning surface, while the model acts as a requested companion. Text tutoring is available from My Notes, image/audio requests are dormant until the learner attaches media, and the courtroom simulator can ask local opposing counsel to challenge a student's argument before falling back to deterministic replies.

The recommended local model profile is a small MatFormer/E2B instruct GGUF with flash attention enabled when supported, compact context windows for low-end devices, prompt caching, and sliding-window-aware model metadata preserved during conversion.

See [docs/llama-cpp-integration.md](docs/llama-cpp-integration.md) for runtime flags, environment variables, multimodal behavior, and token-per-second tuning for budget Android-class devices such as the itel City 100. See [docs/mobile-architecture.md](docs/mobile-architecture.md) for the Android bundle, native bridge, model-pack, and low-end-device architecture.

## Running Locally

1. Install dependencies: \`npm install\`
2. Start the development server: \`npm run dev\`
3. Open the provided localhost URL in your browser.
