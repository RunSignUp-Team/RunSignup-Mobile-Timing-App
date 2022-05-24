# Mobile Timing App
 
## About
This app allows users to record race results on their mobile devices, either recording solo using Finish Line Mode, or as a two person team, using both Finish Line Mode and Chute Mode. The results are stored locally and pushed to Runsignup upon the completion of the race. There is also an offline mode that timers can use when they know they will not have a good internet connection.

## Getting The App Running
1. Clone this project
2. Download nodeJS if you have not already (https://nodejs.org/en/)
3. Run "npm install" in Terminal
4. Run "npm install expo-cli" in Terminal
5. Download the "Expo Go" app on your mobile device, or follow the instructions at these links to run an iOS or Android emulator on your computer.
    - Android emulator (https://docs.expo.dev/workflow/android-studio-emulator/)
    - iOS simulator (https://docs.expo.dev/workflow/ios-simulator/ -- a Mac is required)
6. Run "npm start" in Terminal
    - You can use the "a" and "i" keys to run the Android and iOS emulators respectively, otherwise:
    - Scan the QR code that appears in the terminal with your mobile device to run the app inside Expo Go

## Authentication with OAuth 2.0
- To authenticate the app and allow the user to access their online races, you need to set up OAuth 2.0. There is a file called `oAuth2Constants.ts` in the `constants` folder. By setting the `CLIENT_ID` and `REDIRECT_URI` there, you will be able to authenticate using OAuth 2.0. The `REDIRECT_URI` ***must*** exactly match what you gave to Runsignup when you created your Runsignup client for OAuth 2.0.
- Once the app is ready for production mode, you must make some changes to the `REDIRECT_URI`, both in the code and on Runsignup. It must be `"Scheme"://optional/paths/can/be/empty`, where the "Scheme" is the `scheme` in `app.json` (can be whatever you want). You can use `npx uri-scheme add myredirect` to add a custom uri if you want. Example `REDIRECT_URI`: com.rsu.mobile_timing_app://
_Note: The_ `REDIRECT_URI` _only needs to change for production._ 

## Finish Line Mode
![Finish Line Mode](https://user-images.githubusercontent.com/97470828/170090440-91458325-28be-4651-a8ff-7da023213192.png)

## Chute Mode
![Chute Mode](https://user-images.githubusercontent.com/97470828/170090461-401f7803-c3b7-49a1-8f2a-e55447092e83.png)

## Verification Mode
![Verification Mode](https://user-images.githubusercontent.com/97470828/170090494-fad7d726-4b97-4ebe-810d-eecb3c829da9.png)


## MIT Licenses
- Axios (https://github.com/axios/axios)
- React Navigation (https://github.com/react-navigation/react-navigation)
- Async Storage (https://github.com/react-native-async-storage/async-storage)
