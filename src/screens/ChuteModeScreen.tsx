import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { KeyboardAvoidingView, View, TouchableOpacity, Text, Alert, FlatList, TextInput, TouchableWithoutFeedback, Keyboard, ActivityIndicator, Platform, BackHandler } from "react-native";
import { BLACK_COLOR, DARK_GREEN_COLOR, globalstyles, GRAY_COLOR, TABLE_ITEM_HEIGHT, UNIVERSAL_PADDING, WHITE_COLOR } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { getBibs, postBibs } from "../helpers/APICalls";
import { MemoChuteItem } from "../components/ChuteModeRenderItem";
import { HeaderBackButton } from "@react-navigation/elements";
import GetLocalRaceEvent from "../helpers/GetLocalRaceEvent";
import GetLocalOfflineEvent from "../helpers/GetLocalOfflineEvent";
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

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const ChuteModeScreen = ({ navigation }: Props): React.ReactElement => {
	const context = useContext(AppContext);

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

	// Other
	const isUnmounted = useRef(false);
	const flatListRef = useRef<FlatList>(null);
	const [loading, setLoading] = useState(true);


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
		if (context.online) {
			// Online Functionality
			GetLocalRaceEvent(context.raceID, context.eventID).then(async ([raceList, raceIndex, eventIndex]) => {
				if (raceIndex !== -1 && eventIndex !== -1) {
					raceList[raceIndex].events[eventIndex].bib_nums = bibNumsParam;
					await AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));

					if (final) {
						try {
							const bibs = await getBibs(context.raceID, context.eventID);

							if (bibs !== null && bibs.length > 0) {
								// If there are already bibs saved from Finish Line Mode, navigate to Verification Mode
								setLoading(false);
								navigation.navigate("ModeScreen");
								navigation.navigate("VerificationMode");
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
					Logger("Local Storage Error (Chute)", [raceList, raceIndex, eventIndex], true);
					setLoading(false);
				}
			});
		} else {
			// Offline Functionality
			GetLocalOfflineEvent(context.time).then(async ([eventList, eventIndex]) => {
				if (eventIndex !== -1) {
					eventList[eventIndex].bib_nums = bibNumsParam;

					if (final) {
						// Navigate away
						AsyncStorage.setItem(`chuteDone:${context.time}`, "true");
						setLoading(false);
						navigation.navigate("ModeScreen");
						await AsyncStorage.getItem(`finishLineDone:${context.time}`, (_err, result) => {
							if (result === "true") {
								navigation.navigate("VerificationMode");
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
					Logger("Local Storage Error (Chute)", [eventList, eventIndex], true);
					setLoading(false);
				}
			});
		}
	}, [context.eventID, context.online, context.raceID, context.time, navigation]);

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

	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<HeaderBackButton onPress={backTapped} labelVisible={false} tintColor={WHITE_COLOR}></HeaderBackButton>
			)
		});

		// Get local storage if any
		if (context.online) {
			// Online Functionality
			GetLocalRaceEvent(context.raceID, context.eventID).then(([raceList, raceIndex, eventIndex]) => {
				updateBibNums(raceList[raceIndex].events[eventIndex].bib_nums);
				if (raceList[raceIndex].events[eventIndex].bib_nums.length > 0) {
					// Alert user of data recovery
					Alert.alert("Data Recovered", "You left Chute Mode without saving. Your data has been restored. Tap \"Save\" when you are done recording data.");
				}
			});
		} else {
			// Offline Functionality
			GetLocalOfflineEvent(context.time).then(([eventList, eventIndex]) => {
				updateBibNums(eventList[eventIndex].bib_nums);
				if (eventList[eventIndex].bib_nums.length > 0) {
					// Alert user of data recovery
					Alert.alert("Data Recovered", "You left Chute Mode without saving. Your data has been restored. Tap \"Save\" when you are done recording data.");
				}
			});
		}

		setLoading(false);

		return () => {
			isUnmounted.current = true;
		};
	}, [backTapped, context.eventID, context.online, context.raceID, context.time, navigation, updateBibNums]);

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
				`Are you sure you want to save ${context.online ? "to the cloud" : "results"} and quit?`,
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
	}, [addToStorage, context.online]);

	// Record button
	const recordBib = (): void => {
		if (!isNaN(parseInt(bibText))) {
			bibNumsRef.current.push(parseFloat(bibText));
			updateBibNums([...bibNumsRef.current]);
			setBibText("");

			const flatListRefCurrent = flatListRef.current;
			if (flatListRefCurrent !== null) {
				setTimeout(() => { flatListRefCurrent.scrollToOffset({ animated: false, offset: TABLE_ITEM_HEIGHT * bibNumsRef.current.length }); }, 100);
			}
		} else {
			Alert.alert("No Bib Number", "You have not entered a bib number. Please try again.");
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

	// Display save button in header
	useEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity
					onPress={checkEntries}
				>
					<Text style={globalstyles.headerButtonText}>Save</Text>
				</TouchableOpacity>
			),
		});
	}, [checkEntries, navigation]);

	return (
		// Dismiss keyboard if user touches container
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<KeyboardAvoidingView 
				style={globalstyles.tableContainer}
				behavior={Platform.OS == "ios" ? "padding" : undefined}
				keyboardVerticalOffset={70}>

				<View style={{ backgroundColor: DARK_GREEN_COLOR, flexDirection: "row", width: "100%" }}>
					<TextInput
						ref={bibInputRef}
						style={globalstyles.input}
						onChangeText={setBibText}
						value={bibText}
						maxLength={6}
						placeholder="Record Bib #"
						placeholderTextColor={GRAY_COLOR}
						keyboardType="number-pad"
						onSubmitEditing={bibText !== "" ? recordBib : (): void => { return; }}
						autoFocus={true}
					/>
				</View>

				{/* Header */}
				<View style={globalstyles.tableHead}>
					<Text style={[globalstyles.placeTableHeadText, { flex: 0.3 }]}>#</Text>
					<Text style={globalstyles.bibTableHeadText}>Bib</Text>
					<View style={globalstyles.tableDeleteButton}>
						<Icon name="minus2" color={BLACK_COLOR} size={10} />
					</View>
				</View>

				{loading && <ActivityIndicator size="large" color={Platform.OS === "android" ? BLACK_COLOR : GRAY_COLOR} style={{ marginTop: 20 }} />}
				{!loading &&
					<>
						<FlatList
							showsVerticalScrollIndicator={false}
							style={globalstyles.flatList}
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

						<View style={{ paddingHorizontal: UNIVERSAL_PADDING }}>
							<MainButton onPress={recordBib} text={"Record"} />
						</View>
					</>
				}

				{alertIndex !== undefined && 
					<TextInputAlert
						title={`Edit Bib for Row ${alertIndex !== undefined ? alertIndex + 1 : ""}`}
						message={`Edit the bib number for Row ${alertIndex !== undefined ? alertIndex + 1 : ""}.`}
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