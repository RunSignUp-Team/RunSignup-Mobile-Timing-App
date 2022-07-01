export const CLIENT_ID = __DEV__ ? 3 : 2;
export const REDIRECT_URI = __DEV__ ? "exp://mobiletest.example.com:19000" : "com.rsu.mobile-timing-app://"; // Should be identical to scheme in app.json
export const RUNSIGNUP_URL = __DEV__ ? "https://runsignup.com/" : "https://runsignup.com/";

// If you are testing in DEV and want to run on a test server,
// CLIENT_ID = 4
// REDIRECT_URI = exp://localhost:19000
// RUNSIGNUP_URL = https://test5.runsignup.com/

// IMPORTANT: To use expo://mobiletest.example.com, follow the example here: https://setapp.com/how-to/edit-mac-hosts-file
// You will need to add this host: 
// 127.0.0.1    mobiletest.example.com