# Mobile Core Bundle Start

This is the first bundling milestone for SIMLIT Mobile. It packages the simulation app first and keeps local AI as an optional runtime layer.

## Current Status

Ready:

- Vite production build
- WebView-safe iframe simulation paths through `import.meta.env.BASE_URL`
- AI provider boundary:
  - `src/ai/providers/httpLlamaProvider.js`
  - `src/ai/providers/mobileLlamaProvider.js`
- model manifest:
  - `src/config/modelManifest.js`
  - `public/model-manifest.json`
- Capacitor Android shell:
  - `capacitor.config.json`
  - `android/`
- Native AI bridge stub:
  - `android/app/src/main/java/com/simlit/app/ai/SimlitAiPlugin.java`
  - registered from `MainActivity`
  - exposes `getStatus`, `loadModel`, `unloadModel`, and `generate`
- model-pack placeholder folders:
  - `android/modelpacks/text-lite`
  - `android/modelpacks/text-plus`
  - `android/modelpacks/multimodal-plus`

Not installed yet:

- native llama.cpp bridge
- model pack delivery

## Core Commands

Build web assets for Android WebView:

```bash
npm run build:mobile-core
```

Sync the Android project:

```bash
npm run mobile:sync
```

Open Android Studio:

```bash
npm run mobile:open
```

Build a debug APK:

```bash
npm run mobile:debug
```

This requires a full JDK with `javac`, not only a Java runtime.

The Android app id is:

```txt
com.simlit.app
```
## Mobile Provider Switch

Development with local HTTP llama.cpp:

```bash
VITE_SIMLIT_LLM_PROVIDER=http
VITE_SIMLIT_LLM_BASE_URL=http://127.0.0.1:8080/v1
```

Android native bridge later:

```bash
VITE_SIMLIT_LLM_PROVIDER=mobile
```

The app-facing API stays in `src/ai/llamaClient.js` either way.

## Model Pack Contract

The native layer should read the same pack names as the web layer:

```txt
text-lite          gemma-4-e2b-it-q4_0.gguf
text-plus          gemma-4-e2b-it-q4_k_m.gguf
multimodal-plus    gemma-4-e2b-it-mm-q4_0.gguf
```

Model files should live outside the web bundle:

```txt
/data/data/com.simlit.app/files/models/
```

The mobile bridge should expose:

```txt
getStatus()
loadModel({ packId })
unloadModel({ packId })
generate({ model, messages, maxTokens, temperature })
```

Current bridge behavior:

- `getStatus()` reports installed model files under app private storage.
- `loadModel({ packId })` succeeds only when the expected GGUF exists in app private storage.
- `unloadModel()` clears the tracked loaded pack.
- `generate(...)` returns a clear placeholder response until llama.cpp JNI is wired.

## First Acceptance Test

Before native AI work starts, the Android shell should prove:

- app opens offline
- route flow works
- iframe simulations load
- notes persist
- AI tutor fails gracefully when no bridge/model exists
- `public/model-manifest.json` is reachable from the packaged app

## Current Build Note

`npx cap doctor android` passes. A Gradle debug build was started, but this environment only has a Java runtime:

```txt
javac: command not found
```

Install a full JDK or point Gradle at Android Studio's bundled JDK before running `npm run mobile:debug`.

On Ubuntu, the matching package for the current Java 21 runtime is:

```bash
sudo apt-get update
sudo apt-get install -y openjdk-21-jdk
```

Verify before rebuilding:

```bash
javac -version
npm run mobile:debug
```
