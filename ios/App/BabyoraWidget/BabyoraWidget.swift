// P9.2 (stub for widget-sesjonen).
//
// Skjelett. Widget-sesjonen erstatter VStack-innholdet med ferdig
// designet UI per docs/widget-contract.md + Fable 5 mock.

import WidgetKit
import SwiftUI

struct BabyoraEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot?
    let isStale: Bool
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> BabyoraEntry {
        BabyoraEntry(date: Date(), snapshot: nil, isStale: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (BabyoraEntry) -> Void) {
        completion(currentEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BabyoraEntry>) -> Void) {
        let entry = currentEntry()
        let nextRefresh = Date().addingTimeInterval(60 * 60) // +60 min
        completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
    }

    private func currentEntry() -> BabyoraEntry {
        switch WidgetSnapshotLoader.load() {
        case .fresh(let snap):
            return BabyoraEntry(date: Date(), snapshot: snap, isStale: false)
        case .stale(let snap):
            return BabyoraEntry(date: Date(), snapshot: snap, isStale: true)
        case .missing:
            return BabyoraEntry(date: Date(), snapshot: nil, isStale: false)
        }
    }
}

struct BabyoraWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        if let snap = entry.snapshot {
            VStack(alignment: .leading, spacing: 6) {
                Text(snap.childName).font(.caption2).foregroundStyle(.secondary)
                HStack(alignment: .firstTextBaseline) {
                    Text("\(snap.feelsLikeC)°").font(.system(size: 28, weight: .bold))
                    Text("\(snap.layerCount) lag").font(.caption)
                }
                if !snap.topGarments.isEmpty {
                    Text(snap.topGarments.joined(separator: ", "))
                        .font(.caption2).lineLimit(2)
                }
                if entry.isStale {
                    Text("Sjekk Babyora").font(.caption2).foregroundStyle(.orange)
                }
            }
            .containerBackground(.regularMaterial, for: .widget)
        } else {
            Text("Åpne Babyora for dagens antrekk")
                .font(.caption)
                .containerBackground(.regularMaterial, for: .widget)
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
