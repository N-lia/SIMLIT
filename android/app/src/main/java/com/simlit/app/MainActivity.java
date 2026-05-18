package com.simlit.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.simlit.app.ai.SimlitAiPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SimlitAiPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
