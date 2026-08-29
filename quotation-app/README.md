# VyaparQuotes — GST Quotation Maker for Indian Businesses

A universal quotation maker built for small entrepreneurs in India. Add your brand logo and
company details, save your product catalogue with GST rates, build quotations in seconds,
and share them as professional PDFs.

Built with **React Native + Expo (SDK 57) + TypeScript** and **Expo Router**.

## Features

- 🏢 **Business profile** — logo, name, address, phone, email, GSTIN, bank details, UPI ID
- 📦 **Product catalogue** — name, description, HSN/SAC, unit, selling rate, GST slab
- 🧾 **Quotation builder** — pick products from your catalogue, add custom line items,
  quantities, rates, discounts, and per-line GST
- 🧮 **Correct GST math** — 0 / 5 / 12 / 18 / 28% slabs, CGST + SGST split,
  inclusive (GST in price) or exclusive (GST extra) modes, round-off
- 📄 **Multiple export formats** — download the quotation as **PDF**, **Word (.doc)**, **HTML**, or **plain text**; export straight to the device or share via WhatsApp/email
- 📤 **Share** — export and share via WhatsApp, email, or any app
- 📊 **Tracking** — statuses (draft / sent / accepted / rejected), totals dashboard
- 💾 **Offline-first** — everything (profile, products, quotes) is stored on the device

## Run it

```bash
npm install
npm start          # then scan the QR code with Expo Go on your phone
npm run android    # with an emulator / device connected
npm run web        # browser preview
```

## Build an APK / store build

The quickest way to get an installable APK is [EAS Build](https://docs.expo.dev/build/setup/):

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview   # APK for testing
eas build --platform android                     # AAB for Play Store
```

Or open the project in Android Studio:

```bash
npx expo prebuild --platform android
# then open the generated android/ folder in Android Studio and run
```

## Project structure

```
src/
  app/                  # expo-router screens
    index.tsx           # dashboard + quotation list
    new-quote.tsx       # new quotation
    quote/[id].tsx      # edit quotation
    preview.tsx         # on-screen preview + PDF share + status
    products.tsx        # product catalogue
    settings.tsx        # business profile
  components/
    ui.tsx              # buttons, cards, fields, badges
    quote-form.tsx      # quotation editor (shared by new/edit)
  lib/
    gst.ts              # GST calculation engine
    pdf.ts              # HTML → PDF rendering + sharing
    export-content.ts   # DOC / HTML / TXT document builders
    exporters.ts        # download & share logic (Android SAF, share sheet, web)
    storage.ts          # AsyncStorage persistence
    format.ts           # ₹ formatting, dates, amount-in-words
    types.ts            # data model
  context/
    app-context.tsx     # app state
```

## Notes

- Quotation numbers auto-increment (`QTN-0001`, configurable prefix in Settings).
- "Price includes GST" can be set per product line when you want the quoted price to be
  GST-inclusive (common for retail) — the PDF always shows the GST split.
- Data stays on your device and never leaves it; PDFs are only created when you share.

## Legal note

This app helps you generate GST-compliant-looking quotations, but it is not tax software.
Verify GSTIN thresholds, rate applicability, and invoicing requirements with a CA before use.
