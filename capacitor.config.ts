import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.codito.app',
  appName: 'Codito',
  webDir: 'out',
  server: {
    url: 'https://codito-rho.vercel.app',
    cleartext: false,
  },
};

export default config;
