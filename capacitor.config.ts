import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.lexicore',
  appName: 'LexiCore',
  webDir: 'dist',
  server: {
    // COOP/COEP 响应头改在 MainActivity.java 中注入，
    // 否则 Capacitor Android 本地资源不会带上这些头，crossOriginIsolated 为 false。
  }
};

export default config;
