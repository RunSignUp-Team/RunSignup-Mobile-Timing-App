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
3. Run `npm install` in Terminal
4. Run `npm install expo-cli` in Terminal
5. Download the Expo Go app on your mobile device, or follow the instructions at these links to run an iOS or Android emulator on your computer.
    - Android emulator (https://docs.expo.dev/workflow/android-studio-emulator/)
    - iOS simulator (https://docs.expo.dev/workflow/ios-simulator/ -- a Mac is required)
6. Run `npm start` in Terminal
    - You can use the `a` and `i` keys to run the Android and iOS emulators respectively, otherwise:
    - Scan the QR code that appears in the terminal with your mobile device to run the app inside Expo Go
    
## Using `REDIRECT_URI` in DEV
For oAuth to work with RunSignup in DEV, we have a `REDIRECT_URI` set up that works with `localhost` / `127.0.0.1`. For security purposes, however, we use `mobiletest.example.com`instead of `127.0.0.1`. Because of this, you have to edit your hosts file on macOS, Windows, and Android to be able to use oAuth succesfully. Again, this is only an issue in DEV.

### Changing macOS Hosts File
1. Run `sudo emacs /etc/hosts`
2. Enter admin password
3. Scroll to the very bottom of the file
4. Add `127.0.0.1 mobiletest.example.com` in the same format as the other hosts
5. Hit these keys to save the file: `ctrl+x`, then `ctrl+c`, then `y`

### Changing Windows Hosts File
**---TO DO---**

### Changing Android Simulator Hosts File
To change a physical Android device hosts file, you would need to root the device. What we can more easily and safely do is root the Android simulator:
1. Run `emulator -list-avds` to get the name of your Emulator
2. Run `emulator -avd <avdname> -writable-system`, where `<avdname>` is the name of your Emulator
3. In another terminal window, run `adb root`
4. Run `adb shell avbctl disable-verification`
5. Run `adb reboot` (wait for the simulator to reboot)
6. Run `adb remount` (you may need to run `adb root` again beforehand)
7. Run `adb shell`
8. In `adb shell`, run `cd system/etc`
9. In `adb shell`, run `echo "127.0.0.1 mobiletest.example.com" >> hosts`
10. In `adb shell`, run `cat hosts` to confirm that your change has been saved to the file

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
