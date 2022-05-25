export const CLIENT_ID = __DEV__ ? 4 : 2;
export const REDIRECT_URI = __DEV__ ? "exp://localhost:19000" : "com.rsu.mobile-timing-app://"; // Should be identical to scheme in app.json
export const RUNSIGNUP_URL = __DEV__ ? "https://test5.runsignup.com/" : "https://runsignup.com/";