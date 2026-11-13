#!/bin/bash
# Compila l'APK in locale con la stessa configurazione di GitHub Actions.
set -e
npm run build
rm -rf android
npx cap add android >/dev/null
npx cap sync android >/dev/null
cp -r resources/android/res/. android/app/src/main/res/
node scripts/android-config.mjs
(cd android && ./gradlew assembleDebug --no-daemon -q)
cp android/app/build/outputs/apk/debug/app-debug.apk NightCity-Netrunning.apk
echo "APK pronto: NightCity-Netrunning.apk"
