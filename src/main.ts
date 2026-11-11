import '@fontsource/rajdhani/latin-500.css';
import '@fontsource/rajdhani/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import './styles.css';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { App } from './ui/app';

const app = new App(document.getElementById('app')!);
app.start();

if (Capacitor.isNativePlatform()) {
  // tasto "indietro" di Android: torna alla schermata precedente invece di chiudere il gioco
  void CapApp.addListener('backButton', () => {
    if (!app.back()) void CapApp.exitApp();
  });
}
