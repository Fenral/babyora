//
//  BabyoraViewController.swift
//
//  Registrerer app-lokale Capacitor-plugins på iOS.
//
//  FUNN 2026-08-07 (enhetsprotokollens steg 3, build 83): testpanelet meldte
//  «Bygget, men native bro utilgjengelig (web?)» på en ekte iPhone via
//  TestFlight. Binæren inneholdt både `WidgetBridgePlugin`, `updateSnapshot`
//  og `group.no.klemeg.app` — koden var altså kompilert inn. Den ble bare
//  aldri registrert.
//
//  Capacitor 8 laster IKKE plugins ved å skanne Objective-C-runtime. Se
//  `CapacitorBridge.registerPlugins()`: den leser `packageClassList` fra
//  `capacitor.config.json` og registrerer kun klassene der. Den lista
//  genereres av `npx cap sync` fra installerte npm-pakker, så et app-lokalt
//  plugin havner aldri i den. CAP_PLUGIN-makroen i WidgetBridgePlugin.m
//  kompilerer fint, men gir ingen registrering av seg selv.
//
//  Dette er nøyaktig samme feil som allerede var funnet og rettet på Android
//  (`MainActivity.java: registerPlugin(WidgetBridgePlugin.class)`) — iOS-
//  motstykket manglet, og fraværet var usynlig helt til appen kjørte på en
//  enhet. `registerPluginInstance` er den dokumenterte veien for app-lokale
//  plugins i Capacitor 6+.
//
//  Storyboardet peker på denne klassen i stedet for CAPBridgeViewController.
//  Endres klassenavnet her, må Main.storyboard endres i samme slengen.
//

import UIKit
import Capacitor

class BabyoraViewController: CAPBridgeViewController {
    // Kalles etter at `bridge` er satt, men før webviewet lastes — altså før
    // JS-en kan rekke å kalle broen.
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetBridgePlugin())
    }
}
