package no.klemeg.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import no.klemeg.app.plugins.WidgetBridgePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Native spike (2026-08-06): app-lokale Capacitor-plugins må
        // registreres eksplisitt FØR super.onCreate — uten dette finnes
        // ikke WidgetBridge i JS-laget og widget-snapshots når aldri ut.
        registerPlugin(WidgetBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
