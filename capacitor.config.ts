import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.Nexora.app',
  appName: 'Nexora',
  webDir: 'public',
  server: {
    // ✨✨ حط الرابط بتاعك على الـ Vercel هنا مكاني ✨✨
    url: "https://eyadti-system.vercel.app", 
    cleartext: true
  }
};

export default config;