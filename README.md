# NIVI & RAGA Crackers Shop – Order Estimate 2026

Virudhunagar, Tamil Nadu · Mobile 9566612707

| Folder | What | Deploy |
|---|---|---|
| `web/` | Static website (HTML/CSS/JS). Price list of 293 products, customer details, search, "Selected only", live Order Summary (75% OFF + Net Rate), Final Order with Save as Image, Print and Send on WhatsApp. | Vercel (root directory `web`) |
| `mobile/` | Expo (React Native, SDK 57) app with the same features: steppers for qty, sticky grand-total bar, final order sheet with WhatsApp, Save/Share image and Print/PDF. | Expo Go via EAS Update |
| `data/` | Source price list (`products.csv`) and gift box contents. | – |

## Pricing rules
- CSV price is final and shown exactly. Line total = price × qty.
- `75%` items: summed as *Discount Items Total*, then *Less 75%* → *After Discount*.
- `NET` items: *Net Rate Total*, no discount.
- GRAND TOTAL = After Discount + Net Rate Total.

## Run locally
```bash
# website
npx serve web

# mobile
cd mobile && npm install && npx expo start
```

## Update the price list
Edit `web/products-data.js`, then regenerate the app data:
```bash
cd mobile && node -e "const fs=require('fs');global.window={};eval(fs.readFileSync('../web/products-data.js','utf8'));fs.writeFileSync('src/products.ts','// Generated from web/products-data.js. Do not edit by hand.\nexport type ProductRow = [number, string, string, string, number, 0 | 1, string];\nexport const PRODUCTS: ProductRow[] = '+JSON.stringify(window.PRODUCTS)+';\n')"
```
