// Native spike (2026-08-06) — UPOLERT med vilje.
//
// Beviser tre ting (Sols sperreliste, fase 10):
//  (a) WidgetKit-timeline kan vise en brief OG degradere den VED
//      utløpstidspunktet uten app-åpning: to entries — gjeldende nå +
//      degradert entry datert nøyaktig expiresAt — med .atEnd-policy.
//  (b) widgetURL deep link (babyora://brief/<briefId>) lander i appen.
//  (c) Cache/kontrakt: leser samme WidgetSnapshot v2-JSON som appen
//      skriver via WidgetBridge til App Group-containeren.
//
// Utløpssemantikk: halvåpent intervall (nå >= expiresAt ⇒ utløpt),
// speiler src/lib/widget/snapshot.ts og brief-maskinen (Sols avvik e).

import WidgetKit
import SwiftUI

struct BabyoraEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot?
    let isStale: Bool
    /// Denne entry-en representerer brief ETTER utløp (degradert visning).
    let erUtlopt: Bool
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> BabyoraEntry {
        BabyoraEntry(date: Date(), snapshot: nil, isStale: false, erUtlopt: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (BabyoraEntry) -> Void) {
        completion(entriesNow().entries[0])
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BabyoraEntry>) -> Void) {
        let result = entriesNow()
        completion(Timeline(entries: result.entries, policy: result.policy))
    }

    private func entriesNow() -> (entries: [BabyoraEntry], policy: TimelineReloadPolicy) {
        let now = Date()
        let fallbackRefresh = now.addingTimeInterval(60 * 60) // +60 min

        let snap: WidgetSnapshot?
        let isStale: Bool
        switch WidgetSnapshotLoader.load() {
        case .fresh(let s):
            snap = s
            isStale = false
        case .stale(let s):
            snap = s
            isStale = true
        case .missing:
            snap = nil
            isStale = false
        }

        guard let snapshot = snap else {
            return (
                [BabyoraEntry(date: now, snapshot: nil, isStale: false, erUtlopt: false)],
                .after(fallbackRefresh)
            )
        }

        // v1-snapshot uten utløp: én entry, som før spiken.
        guard let expiresAt = snapshot.expiresAtDate else {
            return (
                [BabyoraEntry(date: now, snapshot: snapshot, isStale: isStale, erUtlopt: false)],
                .after(fallbackRefresh)
            )
        }

        // Allerede utløpt (halvåpent: nå >= expiresAt): kun degradert entry.
        if snapshot.erUtlopt(naa: now) {
            return (
                [BabyoraEntry(date: now, snapshot: snapshot, isStale: isStale, erUtlopt: true)],
                .after(fallbackRefresh)
            )
        }

        // SPIKENS KJERNE: to entries — gjeldende brief nå, degradert entry
        // datert NØYAKTIG expiresAt. WidgetKit bytter til den degraderte
        // visningen ved utløpstidspunktet uten at appen åpnes eller
        // prosessen vekkes. .atEnd ber om re-planlegging etter siste entry.
        return (
            [
                BabyoraEntry(date: now, snapshot: snapshot, isStale: isStale, erUtlopt: false),
                BabyoraEntry(date: expiresAt, snapshot: snapshot, isStale: isStale, erUtlopt: true),
            ],
            .atEnd
        )
    }
}

// containerBackground er iOS 17-API; kompat-shim for eldre deployment.
extension View {
    @ViewBuilder
    func spikeWidgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(.regularMaterial, for: .widget)
        } else {
            self
        }
    }
}

private func klokkeslett(_ date: Date?) -> String {
    guard let date = date else { return "–" }
    let f = DateFormatter()
    f.locale = Locale(identifier: "nb_NO")
    f.dateFormat = "HH:mm"
    return f.string(from: date)
}

struct BabyoraWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        Group {
            if let snap = entry.snapshot {
                if entry.erUtlopt {
                    utloptVisning(snap)
                } else {
                    aktivVisning(snap)
                }
            } else {
                Text("Åpne Babyora for dagens antrekk")
                    .font(.caption)
            }
        }
        .spikeWidgetBackground()
        // (b) Deep link: hele widget-flaten åpner briefens rute.
        .widgetURL(deepLinkURL(entry.snapshot))
    }

    private func deepLinkURL(_ snap: WidgetSnapshot?) -> URL? {
        guard let snap = snap else { return URL(string: "babyora://hjem") }
        return URL(string: snap.deepLink) ?? URL(string: "babyora://hjem")
    }

    /// Aktiv brief: delta-tekst + antrekk + gyldighet.
    @ViewBuilder
    private func aktivVisning(_ snap: WidgetSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(snap.childName).font(.caption2).foregroundStyle(.secondary)
            HStack(alignment: .firstTextBaseline) {
                Text("\(snap.feelsLikeC)°").font(.system(size: 28, weight: .bold))
                Text("\(snap.layerCount) lag").font(.caption)
            }
            if let delta = snap.deltaTekst, !delta.isEmpty {
                Text(delta).font(.caption2).lineLimit(2)
            } else if !snap.topGarments.isEmpty {
                Text(snap.topGarments.joined(separator: ", "))
                    .font(.caption2).lineLimit(2)
            }
            if snap.expiresAtDate != nil {
                Text("Gjelder til \(klokkeslett(snap.expiresAtDate))")
                    .font(.caption2).foregroundStyle(.secondary)
            }
            if entry.isStale {
                Text("Sjekk Babyora").font(.caption2).foregroundStyle(.orange)
            }
        }
    }

    /// Degradert visning VED/ETTER utløp: briefen er ikke lenger
    /// autoritativ. «Må beregnes på nytt» + fallback-linje (sist kjente
    /// antrekk, tydelig merket som historikk — aldri som gjeldende råd).
    @ViewBuilder
    private func utloptVisning(_ snap: WidgetSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(snap.childName).font(.caption2).foregroundStyle(.secondary)
            Text("Må beregnes på nytt")
                .font(.system(size: 15, weight: .semibold))
            Text("Rådet gjaldt til \(klokkeslett(snap.expiresAtDate))")
                .font(.caption2).foregroundStyle(.secondary)
            if !snap.topGarments.isEmpty {
                Text("Sist: \(snap.topGarments.joined(separator: ", "))")
                    .font(.caption2).foregroundStyle(.secondary).lineLimit(1)
            }
            Text("Trykk for å oppdatere")
                .font(.caption2).foregroundStyle(.orange)
        }
    }
}

struct BabyoraWidget: Widget {
    let kind: String = "BabyoraWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            BabyoraWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Babyora")
        .description("Dagens antrekk for barnet.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
