export const CLIENT_ID = __DEV__ ? 3 : 2;
export const REDIRECT_URI = __DEV__ ? "exp://mobiletest.example.com:19000" : "com.rsu.mobile-timing-app://"; // Should be identical to scheme in app.json
export const RUNSIGNUP_URL = __DEV__ ? "https://runsignup.com/" : "https://runsignup.com/";

// See README.md for more information on changing hosts file enable mobiletest.example.com

// If you are testing in DEV and want to run on the production server,
// CLIENT_ID = 3
// REDIRECT_URI = exp://mobiletest.example.com:19000
// RUNSIGNUP_URL = https://runsignup.com/

// If you are testing in DEV and want to run on a test server,
// CLIENT_ID = 4
// REDIRECT_URI = exp://localhost:19000
// RUNSIGNUP_URL = https://test5.runsignup.com/