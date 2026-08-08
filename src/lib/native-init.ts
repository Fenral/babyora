/**
 * Native init for Capacitor (iOS + Android).
 *
 * Native-feel polish #3 — wires up status-bar style, splash hide,
 * keyboard resize mode og Android back-knapp. Web-bygg er no-op
 * (alle kall er gated bak Capacitor.isNativePlatform()).
 *
 * Importeres + kalles fra src/main.tsx etter at ChildrenProvider er montert.
 */

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { App } from '@capacitor/app';

/**
 * Initialiserer native plugins. Trygg å kalle på web — skipper alt
 * native-spesifikt hvis vi ikke kjører i en Capacitor-runtime.
 */
export async function initNative(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // Status-bar: launch-flaten finnes i både lys og mørk variant. Les den
  // synkront stemplede temamodusen før splash-faden starter, slik at ikonene
  // aldri blir mørke mot espressoflaten. I auto følger vi operativsystemet.
  // Style.Dark = mørkt innhold (lys bakgrunn), Style.Light = lyst innhold.
  try {
    const stampedTheme = document.documentElement.dataset.theme;
    const usesDarkTheme = stampedTheme === 'dark'
      || (stampedTheme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    await StatusBar.setStyle({ style: usesDarkTheme ? Style.Light : Style.Dark });
  } catch (err) {
    console.warn('[native-init] StatusBar.setStyle feilet', err);
  }

  // Splash: vis til appen er klar, skjul deretter myk-fade.
  try {
    await SplashScreen.hide({ fadeOutDuration: 200 });
  } catch (err) {
    console.warn('[native-init] SplashScreen.hide feilet', err);
  }

  // Keyboard: 'native' resize gir samme oppførsel som native apper —
  // webview-en krymper når tastaturet kommer opp, i stedet for å overlappe.
  if (Capacitor.getPlatform() === 'ios') {
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    } catch (err) {
      console.warn('[native-init] Keyboard.setResizeMode feilet', err);
    }
  }

  // Android back-knapp: gå tilbake i history hvis mulig, ellers
  // minimer appen i stedet for å lukke den brått.
  try {
    await App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        void App.minimizeApp();
      }
    });
  } catch (err) {
    console.warn('[native-init] App.addListener(backButton) feilet', err);
  }
}
