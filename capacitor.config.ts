import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mortgage.sandbox',
  appName: '房贷提前还款分析沙盒',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
