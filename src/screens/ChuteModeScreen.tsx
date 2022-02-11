import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { KeyboardAvoidingView, View, TouchableOpacity, Text, Alert, FlatList, TextInput, TouchableWithoutFeedback, Keyboard, ActivityIndicator, Platform, BackHandler } from "react-native";
import { globalstyles, GREEN_COLOR, TABLE_ITEM_HEIGHT } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { getBibs, postBibs } from "../helpers/AxiosCalls";
import { MemoChuteItem } from "../components/ChuteModeRenderItem";
import { HeaderBackButton } from "@react-navigation/elements";
import GetLocalRaceEvent from "../helpers/GetLocalRaceEvent";
import GetLocalOfflineEvent from "../helpers/GetLocalOfflineEvent";
import { useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const ChuteModeScreen = ({ navigation }: Props) => {
	const context = useContext(AppContext);

	const [bibText, setBibText] = useState("");
	const [loading, setLoading] = useState(true);

	const [bibNums, setBibNums] = useState<Array<number>>([]);
	const bibNumsRef = useRef<Array<number>>(bibNums);

	const isUnmounted = useRef(false);
	const flatListRef = useRef<FlatList>(null);

	// Log out with alert
	const BackTapped = useCallback(() => {
		Alert.alert("Go to Mode Screen", "Are you sure you want to go back to the Mode Screen? Changes will be saved, but you should not edit results in Verification Mode until you complete recording data here.", [
			{
				text: "Leave",
				onPress: () => {
					navigation.navigate("ModeScreen");
				},
				style: "destructive",
			},
			{ text: "Cancel", onPress: () => {return;} },
		]);
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
								AsyncStorage.setItem(`chuteDone:${context.raceID}:${context.eventID}`, "true");
								AsyncStorage.setItem(`finishLineDone:${context.raceID}:${context.eventID}`, "true");
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
								AsyncStorage.setItem(`chuteDone:${context.raceID}:${context.eventID}`, "true");
								setLoading(false);
								navigation.navigate("ModeScreen");
							}
						} catch (error) {
							if (error instanceof Error) {
								if (error.message === undefined || error.message === "Network Error") {
									Alert.alert("Connection Error", "No response received from the server. Please check your internet connection and try again.");
								} else {
									// Something else
									Alert.alert("Unknown Error", `${JSON.stringify(error.message)}`);

								}
							}
							setLoading(false);
						}
					}
				} else {
					Alert.alert("Local Storage Error", "Something went wrong with local storage. Please try again.");
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
							}
						});

					} else {
						// Set data
						await AsyncStorage.setItem("offlineEvents", JSON.stringify(eventList));
						setLoading(false);
					}
				} else {
					Alert.alert("Local Storage Error", "Something went wrong with local storage. Please try again.");
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
			const onBackPress = () => {
				BackTapped();
				return true;
			};

			BackHandler.addEventListener("hardwareBackPress", onBackPress);

			return () =>
				BackHandler.removeEventListener("hardwareBackPress", onBackPress);
		}, [BackTapped]),
	);

	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<HeaderBackButton onPress={BackTapped} labelVisible={false} tintColor="white"></HeaderBackButton>
			)
		});

		// Get local storage if any
		if (context.online) {
			// Online Functionality
			GetLocalRaceEvent(context.raceID, context.eventID).then(([raceList, raceIndex, eventIndex]) => {
				updateBibNums(raceList[raceIndex].events[eventIndex].bib_nums);
				if (raceList[raceIndex].events[eventIndex].bib_nums.length > 0) {
					// Alert user of data recovery
					Alert.alert("Data Recovered", "The app closed unexpectedly while you were recording Chute Mode data for this event. Your data has been restored. Tap \"Save\" when you are done recording data.");
				} else {
					Alert.alert("Warning", "If you enter Chute Mode data after another user has already entered it for this event, your data will not be saved. Please check with other users before recording data.");
				}
			});
		} else {
			// Offline Functionality
			GetLocalOfflineEvent(context.time).then(([eventList, eventIndex]) => {
				updateBibNums(eventList[eventIndex].bib_nums);
				if (eventList[eventIndex].bib_nums.length > 0) {
					// Alert user of data recovery
					Alert.alert("Data Recovered", "The app closed unexpectedly while you were recording Chute Mode data for this event. Your data has been restored. Tap \"Save\" when you are done recording data.");
				}
			});
		}

		setLoading(false);

		return () => {
			isUnmounted.current = true;
		};
	}, [BackTapped, context.eventID, context.online, context.raceID, context.time, navigation, updateBibNums]);

	// Check entries for errors
	const checkEntries = useCallback(async () => {
		// If no results posted
		if (bibNumsRef.current.length === 0) {
			// Alert if no finishing times have been recorded
			Alert.alert("No Results", "You have not recorded any results. Please try again.");
		} else if (bibNumsRef.current.includes(NaN)) {
			// Alert if blank bib entry
			Alert.alert("Incorrect Bib Entry", "There is a blank bib entry in the list. Please fill in the correct value.");
		} else if (bibNumsRef.current.filter(entry => !(/^\d+$/gm.test(entry.toString()))).length > 0) {
			// Filter Android keyboard non-numbers
			Alert.alert("Incorrect Bib Entry", "You have entered a non-numeric character in the bib entries list. Please correct that entry before submitting.");
		} else if (bibNumsRef.current.filter((entry) => (entry.toString().substring(0,1) === "0" && entry.toString().length > 1)).length > 0) {
			// Filter bib numbers that start with 0
			Alert.alert("Incorrect Bib Entry", "There is a bib entry that starts with 0 in the list. Please fill in the correct value.");
		} else {
			Alert.alert(
				"Save Results",
				"Are you sure you want to save to the cloud and quit?",
				[
					{
						text: "Save & Quit",
						onPress: () => {
							setLoading(true);
							addToStorage(true, bibNumsRef.current);
						},
						style: "destructive",
					},
					{ text: "Cancel", onPress: () => {return;} },
				]
			);
		}
	}, [addToStorage]);

	// Record button
	const recordBib = () => {
		if (!isNaN(parseInt(bibText))) {
			bibNumsRef.current.push(parseFloat(bibText));
			updateBibNums([...bibNumsRef.current]);
			setBibText("");

			const flatListRefCurrent = flatListRef.current;
			if (flatListRefCurrent !== null) {
				setTimeout(() => { flatListRefCurrent.scrollToOffset({ animated: false, offset: TABLE_ITEM_HEIGHT * bibNumsRef.current.length }); }, 100);
			}
		} else {
			Alert.alert("No Bib Number", "You have not entered a Bib Number. Please try again.");
		}
	};

	// Renders item on screen
	const renderItem = ({ item, index }: { item: number, index: number }) => (
		<MemoChuteItem
			item={isNaN(item) ? "" : item}
			index={index}
			bibNumsRef={bibNumsRef}
			updateBibNums={updateBibNums}
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
			<KeyboardAvoidingView style={globalstyles.container}
				behavior={Platform.OS == "ios" ? "padding" : "height"}
				keyboardVerticalOffset={30}>

				{loading ? <ActivityIndicator size="large" color={Platform.OS !== "ios" ? GREEN_COLOR : "808080"} /> : <><FlatList
					style={globalstyles.flatList}
					ref={flatListRef}
					data={bibNumsRef.current}
					renderItem={renderItem}
					keyExtractor={(_item, index) => (index + 1).toString()}
					initialNumToRender={10}
					windowSize={11}
					getItemLayout={(_, index) => (
						{ length: TABLE_ITEM_HEIGHT, offset: TABLE_ITEM_HEIGHT * index, index }
					)}
					keyboardShouldPersistTaps="handled"
					ListHeaderComponent={<View style={globalstyles.tableHead}>
						<Text style={globalstyles.tableTextThree}>Place</Text>
						<Text style={globalstyles.tableTextThree}>Bib #</Text>
						<Text style={globalstyles.tableHeadButtonText}>-</Text>
					</View>}
					stickyHeaderIndices={[0]}
				/>

				<TextInput
					style={globalstyles.input}
					onChangeText={setBibText}
					value={bibText}
					maxLength={6}
					placeholder="Enter a bib number"
					keyboardType="number-pad"
					onSubmitEditing={bibText !== "" ? recordBib : () => {return;}}
				/>

				<TouchableOpacity
					style={globalstyles.recordButton}
					onPress={() => recordBib()}
				>
					<Text style={{ fontSize: 35 }}>Record</Text>
				</TouchableOpacity></>}
			</KeyboardAvoidingView>
		</TouchableWithoutFeedback>
	);
};

export default ChuteModeScreen;