# RaceDay Mobile Timing
 
## About
This app allows users to record race results on their mobile devices. Finish Line Mode allows users to record finish times (and bib numbers, optionally). Chute Mode allows users to record bib numbers. The data is stored locally on the device, and pushed to RunSignup when recording is finished (if the user has chosen the `Score & Publish Results` App Flow). One user can record times in Finish Line Mode, and multiple users can record bib numbers in Chute Mode.

## App Flows
1. `Score & Publish Results` - Results are stored locally. Participant data is pulled from RunSignup, allowing Grid View in Finish Line Mode (see below). When the user has finished recording Finish Times & Bib Numbers, results are synced to RunSignup. Results can also be exported by the user.
2. `Score as Backup Timer` - Results are stored locally. Participant data is pulled from RunSignup, allowing Grid View in Finish Line Mode (see below). Results are never pushed up to RunSignup, but can be exported by the user.
3. `Score Offline` - Results are stored locally. This App Flow can be used without an Internet Connection. Results are never pushed up to RunSignup, but can be exported by the user. Results can also be assigned to an Online Event (in the `Score & Publish Results` App Flow) when an Internet Connection is established.

## Running The Project
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

## Images
**App Flows**

<img src="https://user-images.githubusercontent.com/97470828/184407883-2cd1bc40-e58c-4671-94de-1bfe28357e0c.png" width="300">

**Finish Line Mode - List View**

<img src="https://user-images.githubusercontent.com/97470828/184407957-729cbf58-03e6-4a50-bdb5-2685db0c70f4.png" width="300">

**Finish Line Mode - Grid View**

<img src="https://user-images.githubusercontent.com/97470828/184407982-622ee65d-e824-48bd-bc2b-af0f20867518.png" width="300">

**Chute Mode - List View**

<img src="https://user-images.githubusercontent.com/97470828/184408066-d4bb4d80-700d-454e-8288-d6e6a6a1a694.png" width="300">

**Chute Mode - Scan View**

<img src="https://user-images.githubusercontent.com/97470828/184408124-c73c5bde-eaa5-4518-beeb-3be7f1402422.png" width="300">

**Results Mode**

<img src="https://user-images.githubusercontent.com/97470828/184408273-f6444fa3-8a31-4ca0-877e-79e530ffaf74.png" width="300">

### MIT Licenses
- React Navigation (https://github.com/react-navigation/react-navigation)
- Async Storage (https://github.com/react-native-async-storage/async-storage)
