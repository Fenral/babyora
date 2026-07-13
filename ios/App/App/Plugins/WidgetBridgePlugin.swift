// P9.1 (stub for widget-sesjonen).
//
// Capacitor-plugin: skriver WidgetSnapshot JSON til App Group container
// og kaller WidgetCenter.reloadAllTimelines().

import Foundation
import Capacitor
import WidgetKit

@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "updateSnapshot", returnType: CAPPluginReturnPromise)
    ]

    private static let appGroupID = "group.no.klemeg.app"
    private static let snapshotFilename = "widget-snapshot.json"

    @objc func updateSnapshot(_ call: CAPPluginCall) {
        guard let json = call.getString("json") else {
            call.reject("Manglende 'json'-parameter")
            return
        }
        guard let data = json.data(using: .utf8) else {
            call.reject("Ugyldig UTF-8")
            return
        }
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: Self.appGroupID
        ) else {
            call.reject("App Group container ikke tilgjengelig")
            return
        }
        let fileURL = containerURL.appendingPathComponent(Self.snapshotFilename)
        do {
            try data.write(to: fileURL, options: .atomic)
            WidgetCenter.shared.reloadAllTimelines()
            call.resolve()
        } catch {
            call.reject("Kunne ikke skrive snapshot: \(error.localizedDescription)")
        }
    }
}
