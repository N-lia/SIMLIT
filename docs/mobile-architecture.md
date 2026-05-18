# SIMLIT Mobile Architecture

SIMLIT Mobile should feel like the same product as desktop: interactive simulations first, local AI only when the learner asks. The mobile build should not become a heavy chatbot app with simulations attached.

## Product Bundles

Use three mobile bundle tiers.

### SIMLIT Core

Purpose: install everywhere, including low-storage phones.

Includes:

- Vite production build
- all lightweight simulations
- notes
- case/clinical/card flows
- no bundled model
- AI UI visible but marked local-engine unavailable until a model pack is installed

Target install size: small enough to install confidently on budget Android devices.

### SIMLIT AI Lite

Purpose: default offline AI pack for low-constraint devices such as the itel City 100 class.

Includes:

- SIMLIT Core
- `arm64-v8a` llama.cpp native runtime
- text-only GGUF model, preferably `Q4_0`
- default context: 2048
- max output: 160-220 tokens
- vision/audio model path disabled until an optional pack is present

Target behavior:

- one inference request at a time
- warm session kept alive while the tutor modal or courtroom is active
- model unloaded after idle timeout or low-memory signal

### SIMLIT AI Plus

Purpose: better devices and richer offline tutoring.

Includes:

- SIMLIT Core
- llama.cpp native runtime
- text GGUF model, preferably `Q4_K_M`
- optional multimodal pack for Gemma vision/audio
- default context: 4096 only on devices that pass a memory check

Target behavior:

- text model starts first
- multimodal model remains unloaded until image/audio is attached
- image input is downscaled before inference
- audio input is clipped or chunked before inference

## Runtime Layers

```txt
SIMLIT UI, Vite build
  ↓
AI adapter, src/ai/llamaClient.js
  ↓
Mobile bridge adapter
  ↓
Android native service
  ↓
llama.cpp native runtime
  ↓
GGUF model pack in app storage
```

The browser build already talks to an OpenAI-compatible HTTP endpoint. Mobile should preserve that shape, but the production Android path should use a native bridge instead of relying on a loose localhost process.

Recommended bridge contract:

```ts
type SimlitGenerationRequest = {
  model: 'text' | 'multimodal'
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string | Array<unknown>
  }>
  maxTokens: number
  temperature: number
  attachments?: Array<{
    kind: 'image' | 'audio'
    uri: string
    mimeType: string
  }>
}

type SimlitGenerationResponse = {
  text: string
  tokensPerSecond?: number
  promptTokens?: number
  outputTokens?: number
  modelLoaded: boolean
}
```

Keep `src/ai/llamaClient.js` as the public app-facing API. Add a mobile provider later:

```txt
src/ai/
  llamaClient.js
  config.js
  providers/
    httpLlamaProvider.js
    mobileLlamaProvider.js
src/config/
  modelManifest.js
public/
  model-manifest.json
```

On desktop/web development, use `httpLlamaProvider`. In Android production, use `mobileLlamaProvider`.

## Android Shell

Recommended shell: Capacitor.

Why:

- SIMLIT is already a fast web app.
- Capacitor keeps the Vite build as the UI surface.
- Native plugins can expose model install status, generation, file access, memory signals, and battery state.
- The project avoids the weight of a full React Native rewrite.

Initial Android modules:

```txt
android/
  app/
    src/main/java/.../MainActivity.kt
    src/main/java/.../ai/SimlitAiPlugin.kt
    src/main/cpp/
      CMakeLists.txt
      simlit_llama_bridge.cpp
  modelpacks/
    text-lite/
    text-plus/
    multimodal-plus/
```

The Android shell has been started with Capacitor under `android/`. A `SimlitAi` plugin stub now exposes the bridge methods, while the native llama.cpp implementation remains the next implementation layer.

Native plugin responsibilities:

- check whether a model pack exists
- copy or resolve model path
- load text model
- unload text model
- load multimodal model only when requested
- run generation on a background thread
- stream partial tokens later, after the blocking path is stable
- return runtime stats for telemetry and tuning

## Model Storage

Do not put GGUF files inside the Vite bundle.

Preferred storage strategy:

```txt
App install:
  SIMLIT Core only

First launch:
  show AI pack availability

User chooses:
  AI Lite text pack
  AI Plus text pack
  Multimodal pack

Storage:
  /data/data/<package>/files/models/
```

Distribution options:

- Google Play: Android App Bundle with Play Asset Delivery for large model packs.
- Direct APK: post-install download from your own release storage.
- Dev/testing: manually push model to app files or use Termux/localhost.

Model files:

```txt
models/
  gemma-4-e2b-it-q4_0.gguf
  gemma-4-e2b-it-q4_k_m.gguf
  gemma-4-e2b-it-mm-q4_0.gguf
```

Keep model aliases stable:

```txt
gemma-4-e2b-it-text-lite
gemma-4-e2b-it-text-plus
gemma-4-e2b-it-multimodal
```

The UI should never care about the exact filename.

## Low-End Device Policy

For devices in the itel City 100 class:

- default to text-lite
- context: 2048
- output cap: 160-220 tokens
- one active slot
- no background generation
- no automatic multimodal preload
- unload model when the app is backgrounded for more than a short grace period
- summarize simulation state before sending it to the model
- avoid sending full notes; send title plus recent excerpt
- disable long legal/medical case-file prompts unless the user selects "deep review"

Runtime profile:

```txt
model: Q4_0
ctx: 2048
threads: 4, then auto-tune down if thermal throttling appears
batch: 256
ubatch: 64
flash attention: on when supported
prompt cache: on
cache reuse: 128
parallel slots: 1
```

## Multimodal Policy

Vision/audio must be request-gated.

Allowed triggers:

- user taps attach image
- user taps attach audio
- user opens a simulation tool that explicitly says it will inspect a diagram or recording

Not allowed:

- load multimodal model on app startup
- inspect images in notes automatically
- keep multimodal model resident after the request completes on low-end devices

Preprocessing:

- images: resize longest side to 768 px for Lite, 1024 px for Plus
- screenshots: prefer PNG or WebP after resizing
- camera photos: compress before sending
- audio: cap duration for Lite and chunk long clips later

## State-Aware Tutoring

Every simulation should eventually expose a compact state collector:

```ts
type SimulationTutorState = {
  topicId: string
  label: string
  values: Record<string, number | string | boolean>
  learnerAction?: string
  misconceptionHint?: string
}
```

Example:

```json
{
  "topicId": "projectile",
  "label": "Projectile Motion",
  "values": {
    "speed": "24 m/s",
    "angle": "35 degrees",
    "range": "48.2 m"
  },
  "learnerAction": "Asked why range reduced after lowering angle",
  "misconceptionHint": "May be separating vertical and horizontal components incorrectly"
}
```

Send this compact object to the model instead of scraping UI text.

## Implementation Phases

### Phase 1: Mobile Web Parity

- keep current Vite build
- test in Android Chrome and WebView-sized screens
- use localhost llama.cpp during development
- keep `src/ai/llamaClient.js` HTTP-only

### Phase 2: Capacitor Shell

- add Capacitor Android project
- package SIMLIT Core as static web assets
- add model install/status plugin methods
- keep inference pointed at localhost or a mock bridge

### Phase 3: Native llama.cpp Bridge

- add Android NDK/CMake build for llama.cpp
- expose `generate()`, `loadModel()`, `unloadModel()`, and `getStats()`
- run inference off the UI thread
- return non-streaming text first

### Phase 4: Model Packs

- add text-lite model pack
- add text-plus model pack
- add optional multimodal pack
- add first-run model picker and storage guardrails

### Phase 5: Optimization

- add token streaming
- add automatic runtime profile selection
- add memory/thermal fallback
- add simulation state collectors
- add prompt cache persistence where stable

## Acceptance Criteria

SIMLIT Mobile is ready for field testing when:

- the app opens and all simulations run without a model installed
- installing AI Lite enables text tutor without changing the UI build
- the model is not loaded until the first AI request
- a low-end profile can answer a note question in short form without crashing
- attaching image/audio is impossible unless the multimodal pack exists
- the app recovers gracefully from missing model, failed load, and low-memory unload
- the same tutor UI works with desktop HTTP llama.cpp and Android native inference
