import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { KeyboardAvoidingView, View, TouchableOpacity, Text, Alert, FlatList, TextInput, TouchableWithoutFeedback, Keyboard, ActivityIndicator, Platform, BackHandler, Dimensions } from "react-native";
import { BLACK_COLOR, DARK_GREEN_COLOR, globalstyles, GRAY_COLOR, TABLE_ITEM_HEIGHT, UNIVERSAL_PADDING, WHITE_COLOR } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { deleteBibs, deleteFinishTimes, getBibs, getFinishTimes, postBibs, postFinishTimes } from "../helpers/APICalls";
import { MemoChuteItem } from "../components/ChuteModeRenderItem";
import { HeaderBackButton } from "@react-navigation/elements";
import GetLocalRaceEvent, { DefaultEventData } from "../helpers/GetLocalRaceEvent";
import GetOfflineEvent from "../helpers/GetOfflineEvent";
import { useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import MainButton from "../components/MainButton";
import { ItemLayout } from "../models/ItemLayout";
import Logger from "../helpers/Logger";
import TextInputAlert from "../components/TextInputAlert";
import GetBibDisplay from "../helpers/GetBibDisplay";
import CreateAPIError from "../helpers/CreateAPIError";
import Icon from "../components/IcoMoon";
import { BarCodeScanner } from "expo-barcode-scanner";
import { useHeaderHeight } from "@react-navigation/elements";
import { Audio } from "expo-av";
import { Sound } from "expo-av/build/Audio";
import GetBackupEvent from "../helpers/GetBackupEvent";
import ConflictBoolean from "../helpers/ConflictBoolean";
import GetTimeInMils from "../helpers/GetTimeInMils";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const ChuteModeScreen = ({ navigation }: Props): React.ReactElement => {
	const context = useContext(AppContext);
	const headerHeight = useHeaderHeight();

	// Bib Input
	const [bibText, setBibText] = useState("");
	const [inputWasFocused, setInputWasFocused] = useState(true);
	const bibInputRef = useRef<TextInput>(null);

	// Bib Nums
	const [bibNums, setBibNums] = useState<Array<number>>([]);
	const bibNumsRef = useRef<Array<number>>(bibNums);

	// Alert
	const [alertVisible, setAlertVisible] = useState(false);
	const [alertIndex, setAlertIndex] = useState<number>();

	// Barcode Scanner
	const [hasPermission, setHasPermission] = useState<boolean | null>(null);
	const [showScanner, setShowScanner] = useState(false);
	const [paused, setPaused] = useState(false);
	const scannedBibs = useRef<Record<string, number>>({});
	const camWidth = Dimensions.get("screen").width;
	const camHeight = Dimensions.get("window").height - (TABLE_ITEM_HEIGHT * 3) - headerHeight;
	const successSound = useRef<Sound>();
	const errorSound = useRef<Sound>();
	const alertShown = useRef(false);

	// Other
	const isUnmounted = useRef(false);
	const flatListRef = useRef<FlatList>(null);
	const [loading, setLoading] = useState(true);

	/** Play success beep */
	const playSuccessSound = async (): Promise<void> => {
		try {
			await successSound.current?.unloadAsync();
			successSound.current = (await Audio.Sound.createAsync(await require("../assets/success_beep.mp3"), { shouldPlay: true })).sound;
			await successSound.current.playAsync();
		} catch (error) {
			Logger("No Success Sound", error, false);
		}
	};

	/** Play error beep */
	const playErrorSound = async (): Promise<void> => {
		try {
			await errorSound.current?.unloadAsync();
			errorSound.current = (await Audio.Sound.createAsync(await require("../assets/error_beep.mp3"), { shouldPlay: true })).sound;
			await errorSound.current.playAsync();
		} catch (error) {
			Logger("No Success Sound", error, false);
		}
	};

	// Leave with alert
	const backTapped = useCallback(() => {
		if (bibNumsRef.current.length > 0) {
			Alert.alert("Go to Mode Screen", "Are you sure you want to go back to the Mode Screen? Changes will be saved, but you should not edit Results until you complete recording data here.", [
				{ text: "Cancel" },
				{
					text: "Leave",
					onPress: (): void => {
						navigation.navigate("ModeScreen");
					},
					style: "destructive",
				},
			]);
		} else {
			navigation.navigate("ModeScreen");
		}
	}, [navigation]);

	const addToStorage = useCallback(async (final, bibNumsParam) => {
		if (context.appMode === "Online") {
			// Online Functionality
			const [raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);

			if (raceIndex >= 0 && eventIndex >= 0) {
				raceList[raceIndex].events[eventIndex].bib_nums = bibNumsParam;
				AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));

				if (final) {
					try {
						const bibs = await getBibs(context.raceID, context.eventID);
							
						// If there is data at RunSignup
						if (bibs !== null && bibs.length > 0) {
							// If there are no conflicts between the two sets of data,
							// We will just resolve them here
							// So that the correct results are reflected at RSU immediately
							let anyConflicts = false;

							const biggerArray = Math.max(raceList[raceIndex].events[eventIndex].bib_nums.length, bibs.length);
							const combinedBibs: Array<number> = [];

							for (let i = 0; i < biggerArray; i++) {
								const localBib = raceList[raceIndex].events[eventIndex].bib_nums[i] ?? 0;
								const apiBib = isNaN(parseInt(bibs[i]?.bib_num)) ? 0 : parseInt(bibs[i]?.bib_num);

								// If there are any conflicts, don't push
								// We will handle this in Results Mode
								if (ConflictBoolean(localBib, apiBib)) {
									anyConflicts = true;
									break;
								} else {
									if (!localBib && apiBib) {
										combinedBibs.push(apiBib);
									} else {
										combinedBibs.push(localBib);
									}
								}
							}

							if (!anyConflicts) {
								// Delete RSU bibs and push combined data
								const formData = new FormData();
								formData.append(
									"request",
									JSON.stringify({
										last_finishing_place: 0,
										bib_nums: combinedBibs
									})
								);

								await deleteBibs(context.raceID, context.eventID);
								await postBibs(context.raceID, context.eventID, formData);

								// THIS IS NECESSARY BECAUSE THE RESULT SET
								// CURRENTLY DOES NOT REFRESH WHEN ONLY BIBS ARE POSTED
								// SO WE GET, DELETE, AND THEN RE-POST FINISH TIMES TO FORCE A REFRESH
								// THIS NEEDS TO BE FIXED ON RSU'S SIDE
								const apiTimes = await getFinishTimes(context.raceID, context.eventID);
								const uploadTimes = apiTimes.map(time => GetTimeInMils(time.time));

								await deleteFinishTimes(context.raceID, context.eventID);
								await postFinishTimes(context.raceID, context.eventID, uploadTimes);

								// Clear local data upon successful upload
								raceList[raceIndex].events[eventIndex].bib_nums = [];
								AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));
							}

							setLoading(false);
							navigation.navigate("ModeScreen");
							navigation.navigate("ResultsMode");
						} else {
							// Otherwise push bibs
							const formData = new FormData();
							formData.append(
								"request",
								JSON.stringify({
									last_finishing_place: 0,
									bib_nums: bibNumsParam
								})
							);

							await postBibs(context.raceID, context.eventID, formData);

							// Clear local data upon successful upload
							raceList[raceIndex].events[eventIndex].bib_nums = [];
							AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));

							// Don't allow further changes
							setLoading(false);
							navigation.navigate("ModeScreen");
						}

						// No use case currently for a user to use Chute Mode followed by Finish Line Mode on one device
						AsyncStorage.setItem(`finishLineDone:${context.raceID}:${context.eventID}`, "true");
						AsyncStorage.setItem(`chuteDone:${context.raceID}:${context.eventID}`, "true");
					} catch (error) {
						CreateAPIError("Chute", error);
						setLoading(false);
					}
				}
			} else {
				Logger("Local Storage Error (Chute)", [raceList, raceIndex, eventIndex, context.appMode], true);
				setLoading(false);
			}
		} else if (context.appMode === "Backup") {
			// Backup Functionality
			const [raceList, raceIndex, eventIndex] = await GetBackupEvent(context.raceID, context.eventID);

			if (raceIndex >= 0 && eventIndex >= 0) {
				raceList[raceIndex].events[eventIndex].bib_nums = bibNumsParam;
				AsyncStorage.setItem("backupRaces", JSON.stringify(raceList));

				if (final) {
					// Navigate away
					AsyncStorage.setItem(`chuteDone:backup:${context.raceID}:${context.eventID}`, "true");
					setLoading(false);
					navigation.navigate("ModeScreen");
					await AsyncStorage.getItem(`finishLineDone:backup:${context.raceID}:${context.eventID}`, (_err, result) => {
						if (result === "true") {
							navigation.navigate("ResultsMode");
						} else {
							AsyncStorage.setItem(`finishLineDone:backup:${context.raceID}:${context.eventID}`, "true");
						}
					});
				}
			} else {
				Logger("Local Storage Error (Chute)", [raceList, raceIndex, eventIndex, context.appMode], true);
				setLoading(false);
			}
		} else {
			// Offline Functionality
			const [eventList, eventIndex] = await GetOfflineEvent(context.time);

			if (eventIndex >= 0) {
				eventList[eventIndex].bib_nums = bibNumsParam;

				if (final) {
					// Navigate away
					AsyncStorage.setItem(`chuteDone:${context.time}`, "true");
					setLoading(false);
					navigation.navigate("ModeScreen");
					await AsyncStorage.getItem(`finishLineDone:${context.time}`, (_err, result) => {
						if (result === "true") {
							navigation.navigate("ResultsMode");
						} else {
							AsyncStorage.setItem(`finishLineDone:${context.time}`, "true");
						}
					});

				} else {
					// Set data
					await AsyncStorage.setItem("offlineEvents", JSON.stringify(eventList));
					setLoading(false);
				}
			} else {
				Logger("Local Storage Error (Chute)", [eventList, eventIndex, context.appMode], true);
				setLoading(false);
			}
		}
	}, [context.eventID, context.appMode, context.raceID, context.time, navigation]);

	/** Updates Bib Numbers without re-rendering entire list */
	const updateBibNums = useCallback((newBibNums: Array<number>) => {
		bibNumsRef.current = newBibNums;
		setBibNums([...newBibNums]);
		addToStorage(false, bibNumsRef.current);
	}, [addToStorage]);

	useFocusEffect(
		useCallback(() => {
			const onBackPress = (): boolean => {
				backTapped();
				return true;
			};

			BackHandler.addEventListener("hardwareBackPress", onBackPress);

			return () =>
				BackHandler.removeEventListener("hardwareBackPress", onBackPress);
		}, [backTapped]),
	);

	/** Get old data in case screen closed before saving */
	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<HeaderBackButton onPress={backTapped} labelVisible={false} tintColor={WHITE_COLOR}></HeaderBackButton>
			)
		});

		const getOldData = async (): Promise<void> => {
			// Get local storage if any
			if (context.appMode === "Online" || context.appMode === "Backup") {
				// Online Functionality
				let [raceList, raceIndex, eventIndex] = DefaultEventData;
				if (context.appMode === "Online") {
					[raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);
				} else {
					[raceList, raceIndex, eventIndex] = await GetBackupEvent(context.raceID, context.eventID);
				}

				if (raceIndex >= 0 && eventIndex >= 0) {
					updateBibNums(raceList[raceIndex].events[eventIndex].bib_nums);
					if (raceList[raceIndex].events[eventIndex].bib_nums.length > 0) {
						// Alert user of data recovery
						Alert.alert("Data Recovered", "You left Chute Mode without saving. Your data has been restored. Tap the save icon when you are done recording data.");
					}
				}
			} else {
				// Offline Functionality
				const [eventList, eventIndex] = await GetOfflineEvent(context.time);
				
				if (eventIndex >= 0) {
					updateBibNums(eventList[eventIndex].bib_nums);
					if (eventList[eventIndex].bib_nums.length > 0) {
						// Alert user of data recovery
						Alert.alert("Data Recovered", "You left Chute Mode without saving. Your data has been restored. Tap the save icon when you are done recording data.");
					}
				}
			}
		};

		getOldData();

		setLoading(false);

		return () => {
			isUnmounted.current = true;
		};
	}, [backTapped, context.eventID, context.appMode, context.raceID, context.time, navigation, updateBibNums]);

	// Check entries for errors
	const checkEntries = useCallback(async () => {
		// If no results posted
		if (bibNumsRef.current.length < 1) {
			// Alert if no finishing times have been recorded
			Alert.alert("No Results", "You have not recorded any results. Please try again.");
		} else if (bibNumsRef.current.includes(NaN)) {
			// Alert if blank bib entry
			Alert.alert("Incorrect Bib Entry", "There is a blank bib entry in the list. Please fill in the correct value.");
		} else if (bibNumsRef.current.filter(entry => !(/^\d+$/gm.test(entry.toString()))).length > 0) {
			// Filter Android keyboard non-numbers
			Alert.alert("Incorrect Bib Entry", "You have entered a non-numeric character in the bib entries list. Please correct that entry before submitting.");
		} else if (bibNumsRef.current.filter((entry) => (entry.toString().substring(0, 1) === "0" && entry.toString().length > 1)).length > 0) {
			// Filter bib numbers that start with 0
			Alert.alert("Incorrect Bib Entry", "There is a bib entry that starts with 0 in the list. Please fill in the correct value.");
		} else {
			Alert.alert(
				"Save Results",
				`Are you sure you want to save ${context.appMode === "Online" ? "to the cloud" : "results"} and quit?`,
				[
					{ text: "Cancel" },
					{
						text: "Save & Quit",
						onPress: (): void => {
							setLoading(true);
							addToStorage(true, bibNumsRef.current);
						},
						style: "destructive",
					},
				]
			);
		}
	}, [addToStorage, context.appMode]);

	// Record button
	const recordBib = (enterKey: boolean): void => {
		if (isNaN(parseInt(bibText))) {
			Alert.alert("Invalid Bib Number", "You have not entered a valid bib number. Please try again.");
		} else {
			bibNumsRef.current.push(parseFloat(bibText));
			updateBibNums([...bibNumsRef.current]);
			setBibText("");

			const flatListRefCurrent = flatListRef.current;
			if (flatListRefCurrent !== null) {
				setTimeout(() => { flatListRefCurrent.scrollToOffset({ animated: false, offset: TABLE_ITEM_HEIGHT * bibNumsRef.current.length }); }, 100);
			}
		}

		// Refocus Bib Input if enter key pressed on physical keyboard
		if (enterKey) {
			setTimeout(() => { bibInputRef.current?.focus(); }, 100);
		}
	};

	// Record scanned bib
	const recordScannedBib = async (bib: string): Promise<void> => {
		// Only record if no alert shown
		if (!alertShown.current) {
			if (!isNaN(parseInt(bib)) && parseInt(bib).toString().length <= 6) {
				await playSuccessSound();
	
				bibNumsRef.current.push(parseInt(bib));
				updateBibNums([...bibNumsRef.current]);
				setBibText("");
	
				const flatListRefCurrent = flatListRef.current;
				if (flatListRefCurrent !== null) {
					setTimeout(() => { flatListRefCurrent.scrollToOffset({ animated: false, offset: TABLE_ITEM_HEIGHT * bibNumsRef.current.length }); }, 100);
				}
			} else {
				await playErrorSound();
				if (!alertShown.current) {
					alertShown.current = true;
					Alert.alert(
						"Invalid Bib Number", 
						"You have scanned an invalid bib number. Please try again.",
						[{ text: "OK", onPress: (): void => { alertShown.current = false; }}]
					);
				}
			}
		}
	};

	// Show Edit Alert
	const showAlert = (index: number): void => {
		setAlertIndex(index);
		setAlertVisible(true);
		setInputWasFocused(!!bibInputRef.current?.isFocused());
	};

	// Renders item on screen
	const renderItem = ({ item, index }: { item: number, index: number }): React.ReactElement => (
		<MemoChuteItem
			item={isNaN(item) ? "" : item}
			index={index}
			bibNumsRef={bibNumsRef}
			updateBibNums={updateBibNums}
			showAlert={showAlert}
		/>
	);

	/** Show Barcode Scanner */
	const showBarcodeScanner = useCallback(async (): Promise<void> => {
		if (showScanner === false) {
			const { status } = await BarCodeScanner.requestPermissionsAsync();
			setHasPermission(status === "granted");
			if (status === "granted") {
				setPaused(false);
				setShowScanner(true);
				alertShown.current = true;
				Alert.alert(
					"Barcode Scanner", 
					"Use the camera to scan bib number barcodes. They will appear in the list at the top of the screen.\nYou can pause the camera to avoid accidental scans by tapping the pause button, and edit any bib number by tapping the bib number in the list.",
					[{ text: "OK", onPress: (): void => { alertShown.current = false; }}]
				);
			} else {
				Alert.alert("Permission Denied", "Camera permissions have been denied on this device. Please enable them in your device's privacy settings.");
			}
		} else {
			setShowScanner(false);
		}

		const flatListRefCurrent = flatListRef.current;
		if (flatListRefCurrent !== null) {
			setTimeout(() => { flatListRefCurrent.scrollToOffset({ animated: false, offset: TABLE_ITEM_HEIGHT * bibNumsRef.current.length }); }, 500);
		}
	}, [showScanner]);

	/** Check if barcode was scanned recently */
	const wasScannedRecently = (barcode: string): boolean => {
		if (!scannedBibs.current[barcode])
			return false;
		const now = new Date().getTime();
		return (now - scannedBibs.current[barcode] < 4000);
	};

	/** Scan bar code */
	const barCodeScanned = ({ type, data }: { type: string, data: string }): void => {
		if (!wasScannedRecently(data)) {
			scannedBibs.current[data] = new Date().getTime();
			recordScannedBib(data);
		}
	};

	// Display save button in header
	useEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					<TouchableOpacity style={{ marginRight: 15 }} onPress={showBarcodeScanner}>
						<Icon
							name={showScanner ? "list" : "camera"}
							size={showScanner ? 22 : 24}
							color={WHITE_COLOR}
						/>
					</TouchableOpacity>
					<TouchableOpacity style={{ marginRight: 15 }}
						onPress={checkEntries}
					>
						<Icon name={"floppy-disk"} size={22} color={WHITE_COLOR} />
					</TouchableOpacity>
				</View>
			),
		});
	}, [checkEntries, navigation, showBarcodeScanner, showScanner]);

	return (
		// Dismiss keyboard if user touches container
		<TouchableWithoutFeedback
			onPress={(event): void => {
				// Keyboard Enter Press
				if ("_dispatchListeners" in event && (event as any)._dispatchListeners?.toString().includes("onClick")) {
					bibInputRef.current?.focus();
				// Finger Touch
				} else {
					Keyboard.dismiss();
				}
			}}
			accessible={false}>
			<KeyboardAvoidingView
				style={globalstyles.tableContainer}
				behavior={Platform.OS == "ios" ? "padding" : undefined}
				keyboardVerticalOffset={70}>

				{showScanner && hasPermission ?
					null :
					<View style={{ backgroundColor: DARK_GREEN_COLOR, flexDirection: "row", width: "100%" }}>
						<TextInput
							ref={bibInputRef}
							style={[globalstyles.input, { fontFamily: "RobotoBold" }]}
							onChangeText={setBibText}
							value={bibText}
							maxLength={6}
							placeholder="Record Bib #"
							placeholderTextColor={GRAY_COLOR}
							keyboardType="number-pad"
							onSubmitEditing={bibText !== "" ? (): void => { recordBib(true); } : undefined}
							autoFocus={true}
						/>
					</View>
				}

				{/* Header */}
				<View style={globalstyles.tableHead}>
					<Text style={[globalstyles.placeTableHeadText, { flex: 0.3 }]}>#</Text>
					<Text style={globalstyles.bibTableHeadText}>Bib</Text>
					<View style={globalstyles.tableDeleteButton}>
						<Icon name="minus" color={BLACK_COLOR} size={12} />
					</View>
				</View>

				{loading && <ActivityIndicator size="large" color={Platform.OS === "android" ? BLACK_COLOR : GRAY_COLOR} style={{ marginTop: 20 }} />}
				{!loading &&
					<>
						<FlatList
							showsVerticalScrollIndicator={true}
							scrollIndicatorInsets={{ right: -2 }}
							indicatorStyle={"black"}
							style={showScanner && hasPermission ? globalstyles.shortFlatList : globalstyles.flatList}
							ref={flatListRef}
							data={bibNumsRef.current}
							renderItem={renderItem}
							keyExtractor={(_item, index): string => (index + 1).toString()}
							initialNumToRender={10}
							windowSize={11}
							getItemLayout={(_, index): ItemLayout => (
								{ length: TABLE_ITEM_HEIGHT, offset: TABLE_ITEM_HEIGHT * index, index }
							)}
							keyboardShouldPersistTaps="handled"
						/>

						{showScanner && hasPermission ?
							<View style={{ flex: 1, backgroundColor: BLACK_COLOR }}>
								<TouchableOpacity style={{ zIndex: 2, position: "absolute", marginLeft: (camWidth - 150) / 2, marginTop: (camHeight - 150) / 2 }} onPress={(): void => { setPaused(!paused); }}>
									<Icon
										name={paused ? "play22" : "pause"}
										color={"rgba(255,255,255,0.7)"}
										size={150}
									/>
								</TouchableOpacity>
								{paused ? null : <BarCodeScanner type={"back"} onBarCodeScanned={barCodeScanned} style={{ flex: 1 }} />}
							</View>
							:
							<View style={{ paddingHorizontal: UNIVERSAL_PADDING }}>
								<MainButton onPress={(): void => { recordBib(false); }} text={"Record"} />
							</View>
						}
					</>
				}

				{alertIndex !== undefined &&
					<TextInputAlert
						title={`Edit Bib for Place ${alertIndex !== undefined ? alertIndex + 1 : ""}`}
						message={`Edit the bib number for Place ${alertIndex !== undefined ? alertIndex + 1 : ""}.`}
						placeholder={"Enter Bib #"}
						type={"text"}
						initialValue={GetBibDisplay(bibNumsRef.current[alertIndex] !== undefined ? bibNumsRef.current[alertIndex] : -1)}
						keyboardType={"number-pad"}
						maxLength={6}
						visible={alertVisible}
						actionOnPress={(valArray): void => {
							if (alertIndex !== undefined) {
								if (!isNaN(parseInt(valArray[0]))) {
									// Valid Bib
									bibNumsRef.current[alertIndex] = parseInt(valArray[0]);
									updateBibNums([...bibNumsRef.current]);
									setAlertVisible(false);
									if (inputWasFocused) {
										bibInputRef.current?.focus();
									}
								} else {
									Alert.alert(
										"Incorrect Bib Entry",
										"The bib number you have entered is invalid. Please correct the value. Bibs must be numeric.",
									);
								}
							} else {
								setAlertVisible(false);
							}
						}} cancelOnPress={(): void => {
							setAlertVisible(false);
						}}
					/>
				}
			</KeyboardAvoidingView>
		</TouchableWithoutFeedback>
	);
};

export default ChuteModeScreen;