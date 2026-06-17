import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clinicare.app',
  appName: 'CliniCare',
  webDir: 'public',
  server: {
    // ✨✨ حط الرابط بتاعك على الـ Vercel هنا مكاني ✨✨
    url: "https://eyadti-system.vercel.app", 
    cleartext: true
  }
};

export default config;