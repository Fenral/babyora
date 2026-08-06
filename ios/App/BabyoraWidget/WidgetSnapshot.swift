// P9.2 + native spike (2026-08-06).
//
// WidgetSnapshot Swift-modell — speil av docs/widget-contract.md.
// v1-felter uendret; v2 legger til brief-feltene (expiresAtISO, versjon,
// briefId, deltaTekst) som OPTIONALS slik at v1-JSON fortsatt dekoder.
// Leses fra App Group `group.no.klemeg.app` / `widget-snapshot.json`.
//
// Utløpssemantikk (speiler src/lib/widget/snapshot.ts erSnapshotUtlopt
// og brief-maskinens halvåpne intervall, Sols avvik e):
// briefen er utløpt når nå >= expiresAt.

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

    // v2 (native spike) — optionals: mangler i v1-JSON, dekoder fortsatt.
    let expiresAtISO: String?
    let versjon: Int?
    let briefId: String?
    let deltaTekst: String?

    /// Parset utløpstidspunkt, eller nil for v1-snapshots.
    var expiresAtDate: Date? {
        guard let iso = expiresAtISO else { return nil }
        return WidgetSnapshot.parseISO(iso)
    }

    /// Halvåpent intervall: utløpt når nå >= expiresAt.
    /// v1 (uten expiresAt) har ingen utløpstilstand.
    func erUtlopt(naa: Date) -> Bool {
        guard let expiry = expiresAtDate else { return false }
        return naa >= expiry
    }

    /// ISO-8601 fra JS `Date.toISOString()` har brøkdelssekunder;
    /// tåler også varianten uten.
    static func parseISO(_ iso: String) -> Date? {
        let medBrok = ISO8601DateFormatter()
        medBrok.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = medBrok.date(from: iso) { return d }
        let utenBrok = ISO8601DateFormatter()
        utenBrok.formatOptions = [.withInternetDateTime]
        return utenBrok.date(from: iso)
    }
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
        // v1 og v2 aksepteres — ukjente fremtidige versjoner avvises.
        guard snap.v == 1 || snap.v == 2 else { return .missing }
        if let updated = WidgetSnapshot.parseISO(snap.updatedAtISO),
           Date().timeIntervalSince(updated) > staleAfterSeconds {
            return .stale(snap)
        }
        return .fresh(snap)
    }
}
