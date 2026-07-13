// P9.1 (stub for widget-sesjonen).
//
// Capacitor-plugin: skriver WidgetSnapshot JSON til DataStore og sender
// AppWidgetManager-broadcast for å trigge widget-oppdatering.

package no.klemeg.app.plugins

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import androidx.preference.PreferenceManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "WidgetBridge")
class WidgetBridgePlugin : Plugin() {

    private val snapshotKey = "babyora_widget_snapshot_json"

    @PluginMethod
    fun updateSnapshot(call: PluginCall) {
        val json = call.getString("json")
        if (json == null) {
            call.reject("Manglende 'json'-parameter")
            return
        }
        try {
            val ctx: Context = context
            val prefs = PreferenceManager.getDefaultSharedPreferences(ctx)
            prefs.edit().putString(snapshotKey, json).apply()

            // Trigger AppWidget-oppdatering
            val widgetManager = AppWidgetManager.getInstance(ctx)
            // BabyoraGlanceWidget-klassen registreres av widget-sesjonen
            // i android/app/src/main/java/no/klemeg/app/widget/.
            val componentName = ComponentName(ctx, "no.klemeg.app.widget.BabyoraGlanceWidgetReceiver")
            val ids = widgetManager.getAppWidgetIds(componentName)
            if (ids != null && ids.isNotEmpty()) {
                widgetManager.notifyAppWidgetViewDataChanged(ids, 0)
            }

            call.resolve()
        } catch (e: Exception) {
            call.reject("Kunne ikke skrive snapshot: ${e.message}")
        }
    }
}
