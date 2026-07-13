// P9.2 (stub for widget-sesjonen).
//
// WidgetSnapshot Swift-modell — speil av docs/widget-contract.md v=1.
// Leses fra App Group `group.no.klemeg.app` / `widget-snapshot.json`.

import Foundation

enum ConditionKey: String, Decodable {
    case clearsky = "clearsky"
    case partlyCloudy = "partly-cloudy"
    case cloudy = "cloudy"
    case rain = "rain"
    case snow = "snow"
    case sleet = "sleet"
    case fog = "fog"
    case thunder = "thunder"
}

enum LayerBadgeBand: String, Decodable {
    case lett
    case medium
    case mye
}

enum WidgetActivity: String, Decodable {
    case vogn
    case baeresele
    case utelek
    case soevn
}

struct WidgetSnapshot: Decodable {
    let v: Int
    let childName: String
    let updatedAtISO: String
    let tempC: Int
    let feelsLikeC: Int
    let conditionKey: ConditionKey
    let layerCount: Int
    let layerBadgeBand: LayerBadgeBand
    let topGarments: [String]
    let toppTilTaa: [String]
    let activity: WidgetActivity
    let deepLink: String
}

enum WidgetSnapshotLoader {
    static let appGroupID = "group.no.klemeg.app"
    static let snapshotFilename = "widget-snapshot.json"
    static let staleAfterSeconds: TimeInterval = 12 * 60 * 60

    enum LoadResult {
        case fresh(WidgetSnapshot)
        case stale(WidgetSnapshot)
        case missing
    }

    static func load() -> LoadResult {
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupID
        ) else { return .missing }
        let fileURL = containerURL.appendingPathComponent(snapshotFilename)
        guard let data = try? Data(contentsOf: fileURL) else { return .missing }
        guard let snap = try? JSONDecoder().decode(WidgetSnapshot.self, from: data) else {
            return .missing
        }
        guard snap.v == 1 else { return .missing }
        // ISO-8601 → Date for utdatert-sjekk
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let updated = formatter.date(from: snap.updatedAtISO),
           Date().timeIntervalSince(updated) > staleAfterSeconds {
            return .stale(snap)
        }
        return .fresh(snap)
    }
}
