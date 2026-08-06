// P9.1 + native spike (2026-08-06).
//
// Capacitor-plugin: skriver WidgetSnapshot JSON til SharedPreferences
// («babyora_widget» / «snapshot_json» — kontrakt delt med
// no.klemeg.app.widget.BabyoraBriefWidget) og trigger re-render +
// re-skedulering av utløpsalarmen.
//
// Endret fra stub: androidx.preference-avhengigheten er fjernet (ikke
// deklarert i build.gradle) og oppdateringen går direkte via
// BabyoraBriefWidget.oppdaterAlle i stedet for
// notifyAppWidgetViewDataChanged (som kun gjelder collection-views).

package no.klemeg.app.plugins

import android.content.Context
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import no.klemeg.app.widget.BabyoraBriefWidget

@CapacitorPlugin(name = "WidgetBridge")
class WidgetBridgePlugin : Plugin() {

    @PluginMethod
    fun updateSnapshot(call: PluginCall) {
        val json = call.getString("json")
        if (json == null) {
            call.reject("Manglende 'json'-parameter")
            return
        }
        try {
            val ctx: Context = context
            ctx.getSharedPreferences(BabyoraBriefWidget.PREFS_NAVN, Context.MODE_PRIVATE)
                .edit()
                .putString(BabyoraBriefWidget.NOKKEL_SNAPSHOT, json)
                .apply()

            // Re-render alle widget-instanser + skeduler degradering ved expiresAt.
            BabyoraBriefWidget.oppdaterAlle(ctx)

            call.resolve()
        } catch (e: Exception) {
            call.reject("Kunne ikke skrive snapshot: ${e.message}")
        }
    }
}
