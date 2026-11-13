// Configura il progetto Android generato da Capacitor:
// - numero di versione preso da package.json (versionCode cresce a ogni versione)
// - firma con la chiave fissa del repository, così ogni APK si installa come aggiornamento
// Uso: node scripts/android-config.mjs   (dopo "npx cap add android")
import { readFileSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);
const versionCode = major * 10000 + minor * 100 + patch;
const file = 'android/app/build.gradle';
let g = readFileSync(file, 'utf8');

g = g.replace(/versionCode \d+/, `versionCode ${versionCode}`).replace(/versionName "[^"]*"/, `versionName "${pkg.version}"`);

if (!g.includes('signingConfigs')) {
  g = g.replace(
    /\n    buildTypes \{/,
    `
    signingConfigs {
        debug {
            storeFile file('../../signing/netrunning.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }`,
  );
}
writeFileSync(file, g);
console.log(`Android: versione ${pkg.version} (versionCode ${versionCode}), firma con signing/netrunning.keystore`);
