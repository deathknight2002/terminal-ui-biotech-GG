import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bioterminal.app',
  appName: 'Biotech Terminal',
  webDir: 'dist',
  server: {
    // For local development, uncomment these lines:
    // url: 'http://localhost:3002',
    // cleartext: true
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0a0a0f',
    // Allow inline playback of media
    allowsInlineMediaPlayback: true,
    // Scroll bounce effect
    scrollEnabled: true,
    // Keyboard behavior
    keyboardResize: 'native'
  },
  plugins: {
    // SplashScreen configuration
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#0a0a0f',
      showSpinner: false
    }
  }
};

export default config;
