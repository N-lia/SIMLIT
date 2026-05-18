package com.simlit.app.ai;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "SimlitAi")
public class SimlitAiPlugin extends Plugin {
    private static final class ModelPack {
        final String id;
        final String alias;
        final String filename;
        final int contextTokens;
        final int maxTokens;
        final boolean requestGated;

        ModelPack(String id, String alias, String filename, int contextTokens, int maxTokens, boolean requestGated) {
            this.id = id;
            this.alias = alias;
            this.filename = filename;
            this.contextTokens = contextTokens;
            this.maxTokens = maxTokens;
            this.requestGated = requestGated;
        }
    }

    private final Map<String, ModelPack> packs = new HashMap<>();
    private ModelPack loadedPack = null;

    public SimlitAiPlugin() {
        packs.put("text-lite", new ModelPack(
            "text-lite",
            "gemma-4-e2b-it-text-lite",
            "gemma-4-e2b-it-q4_0.gguf",
            2048,
            220,
            false
        ));
        packs.put("text-plus", new ModelPack(
            "text-plus",
            "gemma-4-e2b-it-text-plus",
            "gemma-4-e2b-it-q4_k_m.gguf",
            4096,
            260,
            false
        ));
        packs.put("multimodal-plus", new ModelPack(
            "multimodal-plus",
            "gemma-4-e2b-it-multimodal",
            "gemma-4-e2b-it-mm-q4_0.gguf",
            2048,
            220,
            true
        ));
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("provider", "mobile");
        result.put("available", true);
        result.put("modelLoaded", loadedPack != null);
        result.put("loadedPackId", loadedPack != null ? loadedPack.id : null);
        result.put("loadedModel", loadedPack != null ? loadedPack.alias : null);
        result.put("modelsDir", getModelsDir().getAbsolutePath());
        result.put("textLiteInstalled", isPackInstalled("text-lite"));
        result.put("textPlusInstalled", isPackInstalled("text-plus"));
        result.put("multimodalInstalled", isPackInstalled("multimodal-plus"));
        result.put("nativeInferenceReady", false);
        result.put("detail", "SIMLIT mobile AI bridge is installed. Native llama.cpp inference is not wired yet.");
        call.resolve(result);
    }

    @PluginMethod
    public void loadModel(PluginCall call) {
        String packId = call.getString("packId", "text-lite");
        ModelPack pack = packs.get(packId);
        if (pack == null) {
            call.reject("Unknown SIMLIT model pack: " + packId);
            return;
        }

        if (!isPackInstalled(pack.id)) {
            call.reject("Model pack is not installed: " + pack.filename);
            return;
        }

        loadedPack = pack;
        JSObject result = packToJson(pack);
        result.put("modelLoaded", true);
        result.put("nativeInferenceReady", false);
        call.resolve(result);
    }

    @PluginMethod
    public void unloadModel(PluginCall call) {
        String previousPackId = loadedPack != null ? loadedPack.id : null;
        loadedPack = null;

        JSObject result = new JSObject();
        result.put("modelLoaded", false);
        result.put("previousPackId", previousPackId);
        call.resolve(result);
    }

    @PluginMethod
    public void generate(PluginCall call) {
        JSObject result = new JSObject();
        result.put("text", "SIMLIT mobile AI bridge is installed, but native llama.cpp inference is not wired yet.");
        result.put("modelLoaded", loadedPack != null);
        result.put("nativeInferenceReady", false);
        result.put("tokensPerSecond", 0);
        result.put("promptTokens", 0);
        result.put("outputTokens", 0);
        call.resolve(result);
    }

    private File getModelsDir() {
        File modelsDir = new File(getContext().getFilesDir(), "models");
        if (!modelsDir.exists()) {
            modelsDir.mkdirs();
        }
        return modelsDir;
    }

    private boolean isPackInstalled(String packId) {
        ModelPack pack = packs.get(packId);
        if (pack == null) return false;
        return new File(getModelsDir(), pack.filename).exists();
    }

    private JSObject packToJson(ModelPack pack) {
        JSObject result = new JSObject();
        result.put("packId", pack.id);
        result.put("alias", pack.alias);
        result.put("filename", pack.filename);
        result.put("contextTokens", pack.contextTokens);
        result.put("maxTokens", pack.maxTokens);
        result.put("requestGated", pack.requestGated);
        result.put("modelPath", new File(getModelsDir(), pack.filename).getAbsolutePath());
        return result;
    }
}
