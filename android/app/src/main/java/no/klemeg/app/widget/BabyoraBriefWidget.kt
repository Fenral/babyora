// Native spike (2026-08-06) — UPOLERT med vilje.
//
// Android-ekvivalenten til iOS-widgetens timeline-bevis:
//  (a) AppWidgetProvider viser brief + gyldighet fra samme WidgetSnapshot
//      v2-JSON som appen skriver via WidgetBridge (SharedPreferences),
//      og DEGRADERER visningen VED utløpstidspunktet uten app-åpning —
//      via AlarmManager-alarm satt til nøyaktig expiresAt.
//  (b) PendingIntent deep link: trykk åpner babyora://brief/<briefId>.
//  (c) Cache/kontrakt: JSON-en er identisk med iOS-App-Group-filen.
//
// Utløpssemantikk: halvåpent intervall (nå >= expiresAt ⇒ utløpt),
// speiler src/lib/widget/snapshot.ts erSnapshotUtlopt (Sols avvik e).

package no.klemeg.app.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.view.View
import android.widget.RemoteViews
import no.klemeg.app.R
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class BabyoraBriefWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        for (id in appWidgetIds) {
            appWidgetManager.updateAppWidget(id, byggViews(context))
        }
        skedulerDegradering(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        // Egne triggere: alarm ved utløp + push fra WidgetBridge.
        if (intent.action == ACTION_BRIEF_UTLOPT || intent.action == ACTION_SNAPSHOT_OPPDATERT) {
            oppdaterAlle(context)
        }
    }

    override fun onDisabled(context: Context) {
        avbrytDegraderingsAlarm(context)
    }

    companion object {
        /** Sendes av AlarmManager NØYAKTIG ved expiresAt → re-render degradert. */
        const val ACTION_BRIEF_UTLOPT = "no.klemeg.app.widget.BRIEF_UTLOPT"

        /** Sendes av WidgetBridgePlugin etter at nytt snapshot er skrevet. */
        const val ACTION_SNAPSHOT_OPPDATERT = "no.klemeg.app.widget.SNAPSHOT_OPPDATERT"

        /** Kontrakt med WidgetBridgePlugin: samme prefs-navn + nøkkel. */
        const val PREFS_NAVN = "babyora_widget"
        const val NOKKEL_SNAPSHOT = "snapshot_json"

        /** Re-render alle widget-instanser + re-skeduler utløpsalarmen. */
        fun oppdaterAlle(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(
                ComponentName(context, BabyoraBriefWidget::class.java),
            )
            if (ids == null || ids.isEmpty()) return
            val views = byggViews(context)
            for (id in ids) manager.updateAppWidget(id, views)
            skedulerDegradering(context)
        }

        // ---------- snapshot ----------

        private fun lesSnapshot(context: Context): JSONObject? {
            val raw = context
                .getSharedPreferences(PREFS_NAVN, Context.MODE_PRIVATE)
                .getString(NOKKEL_SNAPSHOT, null) ?: return null
            return try {
                val json = JSONObject(raw)
                val v = json.optInt("v", -1)
                if (v == 1 || v == 2) json else null
            } catch (_: Exception) {
                null
            }
        }

        /** ISO-8601 (JS toISOString, med eller uten .SSS) → epoch millis, eller null. */
        private fun parseIsoMillis(iso: String?): Long? {
            if (iso.isNullOrEmpty()) return null
            for (monster in arrayOf(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                "yyyy-MM-dd'T'HH:mm:ss'Z'",
            )) {
                try {
                    val f = SimpleDateFormat(monster, Locale.US)
                    f.timeZone = TimeZone.getTimeZone("UTC")
                    val d = f.parse(iso)
                    if (d != null) return d.time
                } catch (_: Exception) {
                    // prøv neste mønster
                }
            }
            return null
        }

        private fun klokkeslett(millis: Long): String {
            val f = SimpleDateFormat("HH:mm", Locale.US)
            return f.format(Date(millis)) // lokal tidssone med vilje
        }

        private fun garments(json: JSONObject): String {
            val arr = json.optJSONArray("topGarments") ?: return ""
            val deler = mutableListOf<String>()
            for (i in 0 until arr.length()) deler.add(arr.optString(i))
            return deler.filter { it.isNotEmpty() }.joinToString(", ")
        }

        // ---------- rendering ----------

        internal fun byggViews(context: Context): RemoteViews {
            val views = RemoteViews(context.packageName, R.layout.widget_babyora_brief)
            val snap = lesSnapshot(context)

            if (snap == null) {
                views.setTextViewText(R.id.widget_tittel, "Babyora")
                views.setTextViewText(R.id.widget_hoved, "Åpne Babyora for dagens antrekk")
                views.setViewVisibility(R.id.widget_brief, View.GONE)
                views.setViewVisibility(R.id.widget_gyldighet, View.GONE)
                views.setViewVisibility(R.id.widget_fallback, View.GONE)
                views.setOnClickPendingIntent(R.id.widget_rot, deepLinkIntent(context, "babyora://hjem"))
                return views
            }

            val childName = snap.optString("childName", "")
            val expiresAtMillis = parseIsoMillis(snap.optString("expiresAtISO", null))
            val naa = System.currentTimeMillis()
            // Halvåpent intervall: utløpt når nå >= expiresAt.
            val utlopt = expiresAtMillis != null && naa >= expiresAtMillis

            views.setTextViewText(R.id.widget_tittel, childName)

            if (utlopt) {
                // DEGRADERT: briefen er ikke lenger autoritativ.
                views.setTextViewText(R.id.widget_hoved, "Må beregnes på nytt")
                views.setViewVisibility(R.id.widget_brief, View.GONE)
                views.setViewVisibility(R.id.widget_gyldighet, View.VISIBLE)
                views.setTextViewText(
                    R.id.widget_gyldighet,
                    "Rådet gjaldt til ${klokkeslett(expiresAtMillis!!)}",
                )
                val fallback = garments(snap)
                if (fallback.isNotEmpty()) {
                    views.setViewVisibility(R.id.widget_fallback, View.VISIBLE)
                    views.setTextViewText(R.id.widget_fallback, "Sist: $fallback · trykk for å oppdatere")
                } else {
                    views.setViewVisibility(R.id.widget_fallback, View.VISIBLE)
                    views.setTextViewText(R.id.widget_fallback, "Trykk for å oppdatere")
                }
            } else {
                // AKTIV brief.
                val feelsLike = snap.optInt("feelsLikeC", 0)
                val lag = snap.optInt("layerCount", 0)
                views.setTextViewText(R.id.widget_hoved, "$feelsLike° · $lag lag")
                val delta = snap.optString("deltaTekst", "")
                val brief = if (delta.isNotEmpty()) delta else garments(snap)
                if (brief.isNotEmpty()) {
                    views.setViewVisibility(R.id.widget_brief, View.VISIBLE)
                    views.setTextViewText(R.id.widget_brief, brief)
                } else {
                    views.setViewVisibility(R.id.widget_brief, View.GONE)
                }
                if (expiresAtMillis != null) {
                    views.setViewVisibility(R.id.widget_gyldighet, View.VISIBLE)
                    views.setTextViewText(
                        R.id.widget_gyldighet,
                        "Gjelder til ${klokkeslett(expiresAtMillis)}",
                    )
                } else {
                    views.setViewVisibility(R.id.widget_gyldighet, View.GONE)
                }
                views.setViewVisibility(R.id.widget_fallback, View.GONE)
            }

            // (b) Deep link: hele flaten åpner briefens rute i appen.
            val deepLink = snap.optString("deepLink", "babyora://hjem")
            views.setOnClickPendingIntent(R.id.widget_rot, deepLinkIntent(context, deepLink))
            return views
        }

        private fun deepLinkIntent(context: Context, uri: String): PendingIntent {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri)).apply {
                setPackage(context.packageName)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            return PendingIntent.getActivity(
                context,
                uri.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        }

        // ---------- degradering ved utløp ----------

        private fun degraderingsPendingIntent(context: Context): PendingIntent {
            val intent = Intent(context, BabyoraBriefWidget::class.java).apply {
                action = ACTION_BRIEF_UTLOPT
            }
            return PendingIntent.getBroadcast(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        }

        /**
         * (a) Skeduler re-render NØYAKTIG ved expiresAt. Eksakt alarm der
         * OS-et tillater det; ellers setWindow med 60 s slark (dokumentert
         * i eier-protokollen som PASS med inntil 1 min forsinkelse).
         */
        internal fun skedulerDegradering(context: Context) {
            val snap = lesSnapshot(context) ?: return avbrytDegraderingsAlarm(context)
            val expiresAtMillis = parseIsoMillis(snap.optString("expiresAtISO", null))
                ?: return avbrytDegraderingsAlarm(context)
            val naa = System.currentTimeMillis()
            if (naa >= expiresAtMillis) return // allerede utløpt — render viser degradert

            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val pi = degraderingsPendingIntent(context)
            alarmManager.cancel(pi)

            val kanEksakt = Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
                alarmManager.canScheduleExactAlarms()
            if (kanEksakt) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    expiresAtMillis,
                    pi,
                )
            } else {
                alarmManager.setWindow(
                    AlarmManager.RTC_WAKEUP,
                    expiresAtMillis,
                    60_000L,
                    pi,
                )
            }
        }

        private fun avbrytDegraderingsAlarm(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            alarmManager.cancel(degraderingsPendingIntent(context))
        }
    }
}
