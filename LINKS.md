# NIVI & RAGA Crackers – Links

| What | Link |
|---|---|
| Website | https://niviraga.vercel.app |
| Android app (APK download) | https://expo.dev/artifacts/eas/l04X5HFBX4WC4I_ZXWmLhjyfptTLCQwjBbrH0biGwqM.apk |
| APK QR code | `android-apk-qr.png` (in this folder) |
| GitHub code | https://github.com/mnivi2021-commits/NIVIRAGA |
| Expo project | https://expo.dev/accounts/niviraga/projects/niviraga |
| Vercel project | niviraga (team: eswaistore) |

## Accounts
- GitHub: mnivi2021-commits
- Vercel: mnivi2021-9620 (team eswaistore)
- Expo: niviraga

## Features
- 293 products: 75% OFF items and Net Rate items
- Customer name / mobile / place, search, "Selected only"
- Order Summary → GRAND TOTAL
- Final order: Send on WhatsApp (9566612707), Save as Image, Print
- Page up / down buttons (tap = one screen, hold = top / bottom)

## How to update
- Website: `vercel deploy --prod --yes --project niviraga` (run inside `web/`)
- Mobile app: `npx eas-cli update --branch production --environment production --message "..."` (inside `mobile/`) – the installed APK picks it up on next open
- New APK (only for native changes): `npx eas-cli build -p android --profile preview`
- Preview mobile app on PC: `npx expo export --platform web --output-dir dist-web` then `npx serve dist-web -l 8090 -s`, open http://localhost:8090 (VS Code: Ctrl+Shift+P → Simple Browser: Show)
