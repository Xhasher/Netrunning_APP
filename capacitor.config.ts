import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // L'identificativo è cambiato nella 1.1.1: da qui in poi gli APK si aggiornano uno sopra l'altro.
  appId: 'it.nightcity.netrunningapp',
  appName: 'Night City Netrunning',
  webDir: 'dist',
  backgroundColor: '#07070c',
  android: {
    backgroundColor: '#07070c',
  },
};

export default config;
