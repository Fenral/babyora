// P9.1 (stub for widget-sesjonen).
//
// Objective-C-shim som registrerer WidgetBridgePlugin med Capacitor-runtime.

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(WidgetBridgePlugin, "WidgetBridge",
    CAP_PLUGIN_METHOD(updateSnapshot, CAPPluginReturnPromise);
)
