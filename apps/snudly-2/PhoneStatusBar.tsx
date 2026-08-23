import { Capacitor } from '@capacitor/core';

export function PhoneStatusBar() {
  // iOS/Android draw their real system status bar. The replica is only for
  // browser review, where the approved mock includes the device chrome.
  if (Capacitor.isNativePlatform()) return null;
  return (
    <div className="statusbar" aria-hidden="true">
      <strong>9:41</strong>
      <span className="island" />
      <svg className="status-icons" viewBox="0 0 70 16">
        <path className="signal" d="M2 14h3V10H2v4Zm6 0h3V7H8v7Zm6 0h3V4h-3v10Zm6 0h3V1h-3v13Z" />
        <path className="wifi" d="M32 6.5c5-4 11-4 16 0M35 10c3-2.4 7-2.4 10 0M39 13.2c1-.8 2-.8 3 0" />
        <rect className="battery" x="52" y="3" width="15" height="10" rx="3" />
        <rect className="battery-level" x="54" y="5" width="10" height="6" rx="1.5" />
        <path className="battery-cap" d="M69 6v4" />
      </svg>
    </div>
  );
}
