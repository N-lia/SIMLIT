# SIMLIT llama.cpp Integration

### Offline Simulation-Based Learning Powered by Local Gemma for Underserved Communities

## Track

Education / Local AI / llama.cpp / Capacitor Android

## Introduction

Across many parts of Africa and other underserved regions, students studying fields such as engineering, computer science, law, and healthcare often learn under difficult conditions. Internet access is unreliable, classrooms are overcrowded, practical learning tools are limited, and education becomes heavily dependent on memorization rather than understanding.

As a result, many students repeatedly encounter formulas, procedures, and theories without ever developing intuition for how systems behave in real-world scenarios.

SIMLIT was created to address this gap.

SIMLIT is an offline-first, simulation-based learning platform designed to make education more accessible, interactive, and intuitive. The app combines lightweight interactive simulations with an optional locally running Gemma tutor through llama.cpp, so learners can experiment with concepts instead of passively consuming static educational content.

An engineering student can manipulate force vectors and immediately observe equilibrium break down. A computer science student can visualize CPU scheduling and process execution. A law student can participate in a simulated courtroom proceeding and understand procedural consequences in real time. A healthcare student can work through triage and diagnostic reasoning interactively.

The core idea behind SIMLIT is simple:

Students understand concepts faster when they can interact with systems directly.

This story is not separate from the technical architecture. It is the requirement that shapes the stack: the app must keep working when the network is absent, must remain useful before AI is installed, and must run on the kinds of devices students already have.

## Current Technical Stack

SIMLIT is implemented as a Vite web app packaged for Android with Capacitor.

- UI/runtime: Vite, browser JavaScript, HTML, CSS
- Mobile shell: Capacitor Android
- Simulations: React-style JSX components plus lightweight DOM, Canvas, SVG, and standalone HTML labs
- Physics/math helpers: `cannon-es`, KaTeX, and simulation-specific logic
- AI integration surface: `src/ai/llamaClient.js`
- AI providers: `src/ai/providers/httpLlamaProvider.js` and `src/ai/providers/mobileLlamaProvider.js`
- Model pack metadata: `src/config/modelManifest.js` and `public/model-manifest.json`
- Android model-pack planning: `android/modelpacks/`

The app remains simulation-first. Notes, labs, cases, clinical flows, and visual simulations are usable without a model. Local AI is an enhancement that appears when the learner asks for help, not the foundation the whole product depends on.

## System Architecture

SIMLIT follows an offline-first architecture optimized for constrained environments and low-resource devices. The architecture has four primary layers.

## 1. Simulation Layer

The simulation layer renders interactive educational systems using the existing Vite app surface.

Current simulation areas include:

- Engineering and physics labs such as vectors, projectile motion, beams, Bernoulli flow, motors, hydrostatics, stress-strain, collisions, pendulums, trusses, and free-body diagrams
- Computer science labs such as CPU scheduling and NAND flash behavior
- Law simulations such as case practice and courtroom argument
- Health simulations such as clinical room and case reasoning flows
- Notes and learning materials that can be queried by the local tutor

The intended contract is for each simulation to expose a compact state summary instead of sending raw UI text to the model. For example, the CPU scheduler can provide the active process, waiting time, time quantum, queue state, and the learner's latest action.

```json
{
  "domain": "computer_science",
  "simulation": "cpu_scheduler",
  "algorithm": "round_robin",
  "active_process": "P2",
  "waiting_time": 8,
  "time_quantum": 4
}
```

This structured representation lets the AI tutor reason about the current learning moment instead of giving generic textbook answers.

The shared state collector is still a next implementation target. Today, the first AI-connected surfaces are My Notes and the Law Courtroom simulation.

## 2. AI Client and Provider Layer

SIMLIT keeps one app-facing AI API in `src/ai/llamaClient.js`.

That file exposes the tutor use cases:

- `askSimlitTutor()` for notes, learning questions, and optional image/audio attachments
- `askOpposingCounsel()` for the Nigerian law courtroom role-play
- `getLlamaRuntimeStatus()` so the UI can show whether the local engine is available
- `readAttachment()` for browser-side media preparation

Under that API, SIMLIT can use two providers.

### HTTP llama.cpp Provider

`src/ai/providers/httpLlamaProvider.js` talks to a local OpenAI-compatible llama.cpp endpoint:

```txt
http://127.0.0.1:8080/v1/chat/completions
```

This is the desktop and development path. It allows the Vite app to use `llama-server` without needing the Android native bridge.

### Mobile llama.cpp Provider

`src/ai/providers/mobileLlamaProvider.js` targets a Capacitor bridge:

```txt
window.SimlitAi
window.Capacitor.Plugins.SimlitAi
```

This is the production Android direction. The browser UI keeps the same `llamaClient.js` API, while the mobile provider delegates model loading, generation, status checks, and later token streaming to native Android code.

The provider is selected with:

```bash
VITE_SIMLIT_LLM_PROVIDER=http
```

or:

```bash
VITE_SIMLIT_LLM_PROVIDER=mobile
```

This lets SIMLIT keep the web app portable while still preparing for a native llama.cpp runtime on Android.

## 3. Gemma Model and llama.cpp Runtime Layer

SIMLIT uses Gemma-family local instruct models through llama.cpp-compatible GGUF files. The app refers to stable aliases instead of exact filenames:

- `gemma-4-e2b-it-text-lite`
- `gemma-4-e2b-it-text-plus`
- `gemma-4-e2b-it-multimodal`

The default runtime configuration lives in `src/config/modelManifest.js`.

Current model-pack strategy:

- SIMLIT AI Lite: text-only `Q4_0`, 2048 context, 160-220 token answers, 4 GB minimum RAM target
- SIMLIT AI Plus: text-only `Q4_K_M`, 4096 context on capable devices, stronger answers for better phones and laptops
- SIMLIT Multimodal Pack: gated vision/audio model, loaded only when the learner explicitly attaches image or audio

The tutor prompt is intentionally short and educational:

- keep answers concise,
- tie explanations to the active simulation or note,
- ask one useful follow-up question when it helps,
- avoid pretending to be a licensed professional in law or health contexts.

The AI is not treated as a generic chatbot. It acts as a simulation-aware tutor that helps the learner reason about what is happening on screen.

## 4. Optimization Layer

One of SIMLIT's biggest technical constraints is deployment on low-resource devices.

Many target learners use budget Android phones with limited RAM, weaker CPUs, expensive mobile data, and unreliable connectivity. A cloud-only design would exclude many of the people SIMLIT is meant to serve.

The local inference plan is therefore tuned around small, practical model packs.

### Quantization Strategy

SIMLIT's model manifest currently defines:

- Mobile default: `Q4_0` text-lite pack
- Better-device option: `Q4_K_M` text-plus pack
- Multimodal option: `Q4_0`, request-gated and not preloaded

The app does not bundle GGUF files into the Vite web build. Model packs are planned as Android-side assets or app storage files, with stable aliases hiding the filename from the UI.

### llama.cpp Runtime Settings

Recommended llama.cpp settings for constrained Android-class devices:

- context around 2048 for most tutoring turns
- max output around 160-220 tokens
- one active generation request at a time
- small batch and micro-batch values
- prompt cache and cache reuse enabled
- Flash Attention enabled when the target backend supports it
- KV cache quantization such as `q8_0` when quality remains acceptable
- no automatic vision/audio preload
- image/audio inputs downscaled, clipped, or chunked before inference

For desktop or development laptop testing, SIMLIT can use `llama-server`:

```bash
llama-server \
  -m ./models/gemma-4-e2b-it-q4_k_m.gguf \
  --alias gemma-4-e2b-it-text-plus \
  --host 127.0.0.1 \
  --port 8080 \
  -c 4096 \
  -fa on \
  --cache-prompt \
  --cache-reuse 256 \
  -b 1024 \
  -ub 256
```

For low-constraint Android-class testing:

```bash
llama-server \
  -m ./models/gemma-4-e2b-it-q4_0.gguf \
  --alias gemma-4-e2b-it-text-lite \
  --host 127.0.0.1 \
  --port 8080 \
  -c 2048 \
  -fa on \
  --cache-prompt \
  --cache-reuse 128 \
  -b 256 \
  -ub 64 \
  -t 4 \
  --no-webui
```

The goal is not simply to prove that Gemma can run locally. The goal is to make local AI realistically usable beside an interactive simulation on affordable hardware.

## 5. Offline Deployment Philosophy

SIMLIT is intentionally offline-first.

The app should continue functioning:

- without constant internet access,
- in bandwidth-constrained environments,
- on inexpensive Android phones,
- and on laptops used in classrooms with unreliable connectivity.

The mobile package strategy is split into tiers:

- SIMLIT Core: simulations, notes, cases, and clinical flows with no bundled model
- SIMLIT AI Lite: Core plus a small text model pack for low-constraint devices
- SIMLIT AI Plus: Core plus stronger text inference and optional multimodal support

This matters because the no-model state is still a useful educational product. A student should be able to open SIMLIT, run a simulation, take notes, and learn even before installing an AI pack.

There is also a long-term goal of deploying SIMLIT on low-power hardware such as Raspberry Pi devices for classrooms and community learning spaces where modern computing infrastructure is limited.

## Environment Configuration

Default web/development configuration:

```bash
VITE_SIMLIT_LLM_PROVIDER=http
VITE_SIMLIT_LLM_BASE_URL=http://127.0.0.1:8080/v1
VITE_SIMLIT_LLM_MODEL=gemma-4-e2b-it-text-lite
VITE_SIMLIT_LLM_MULTIMODAL_MODEL=gemma-4-e2b-it-multimodal
VITE_SIMLIT_LLM_API_KEY=
```

Android/native direction:

```bash
VITE_SIMLIT_LLM_PROVIDER=mobile
VITE_SIMLIT_LLM_MODEL=gemma-4-e2b-it-text-lite
VITE_SIMLIT_LLM_MULTIMODAL_MODEL=gemma-4-e2b-it-multimodal
```

## Current Integration Points

The first implemented AI surfaces are:

- My Notes: local tutor over note title/content with optional image/audio attachment
- Law Courtroom: opposing counsel tries local llama.cpp first and falls back to deterministic local replies
- Law Cases: selected case files can ask a local case tutor for issue, rule, evidence weakness, and next-practice guidance
- Diagnostic Room: simulated patient role-play uses local llama.cpp first, with browser voice input and speech playback around the text response
- Diagnostic Room: diagnosis and prescription plans can be reviewed by a local clinical-instructor prompt with a safety-focused fallback
- Clinical Room: each clinical choice can receive local instructor feedback that explains the safety reasoning behind the selected move
- Runtime status: UI can detect whether the selected local provider is available

The next important implementation target is a shared simulation-state contract, likely a `collectSimulationState()` pattern per simulation, so the tutor receives compact live values instead of raw screen text. The medical and law flows now pass structured case data directly into their local prompts, but the engineering and computer science simulations still need the shared state collector.

## Challenges Encountered

One major challenge is balancing interactivity, AI reasoning quality, and hardware constraints.

Interactive simulations already consume rendering resources, especially on mobile devices. Running local AI inference at the same time introduces memory pressure and latency. SIMLIT addresses this by keeping AI optional, limiting output length, using one request at a time on low-end devices, and loading multimodal models only when the learner explicitly needs them.

Another challenge is preserving educational usefulness after aggressive quantization. Lower-bit GGUF models improve deployability but can reduce reasoning quality. SIMLIT's model-pack tiers make that tradeoff explicit: start with the deployable text-lite pack, then move to text-plus only when the device has enough headroom.

Development speed is also a real constraint.

Building simulations, AI integration, optimization paths, Android packaging, and responsive interfaces in parallel can quickly become overwhelming for a solo developer workflow. Gemini through Google AI Studio was valuable during prototyping because it helped validate interaction patterns, simulation ideas, tutoring workflows, and architecture decisions quickly. As development progressed, Antiravity helped refine implementation workflows, interaction systems, and project organization.

These tools accelerated the work, but the product direction stayed anchored in the same requirement: SIMLIT must serve learners who cannot depend on constant connectivity or expensive hardware.

## Why Local Gemma Through llama.cpp Fits SIMLIT

SIMLIT needs:

- local inference,
- practical deployment,
- strong enough reasoning for tutoring,
- privacy for learners,
- and adaptability to constrained environments.

Most educational AI systems assume a reliable cloud API. That assumption fails in many underserved regions where internet access is inconsistent, expensive, or shared across many students.

Gemma through llama.cpp enables a different approach:

- private,
- local,
- lightweight,
- offline-capable,
- and compatible with a Vite/Capacitor app architecture.

More importantly, it lets SIMLIT move beyond static educational content into contextual tutoring based on live learning state.

The AI is not simply answering questions.

It is helping students reason through systems interactively.

## Conclusion

SIMLIT is an attempt to rethink how professional education can work in low-resource environments.

Rather than treating students as passive consumers of information, the platform encourages interaction, experimentation, and guided reasoning through simulations supported by local AI.

The current stack reflects that mission: a lightweight Vite simulation app, a Capacitor Android path, an AI adapter that can talk to either local HTTP llama.cpp or a native mobile bridge, and model-pack tiers designed for real hardware constraints.

The long-term vision is to create a lightweight educational infrastructure capable of running across phones, laptops, and eventually low-power systems like Raspberry Pi devices to reach even more remote communities.

Students should not be denied quality understanding because of where they live, the speed of their internet connection, or the limitations of their institutions.

It is inspiring how meaningful problems can begin to feel solvable when people are given the right local tools.

## Related Docs

- [mobile-architecture.md](mobile-architecture.md)
- [bundling/mobile-core.md](bundling/mobile-core.md)
