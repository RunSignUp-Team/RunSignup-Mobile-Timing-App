import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { KeyboardAvoidingView, View, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Text, TextInput, Alert, FlatList, ActivityIndicator, Platform, BackHandler } from "react-native";
import { globalstyles, GREEN_COLOR, TABLE_ITEM_HEIGHT, GRAY_COLOR, DARK_GREEN_COLOR, LIGHT_GRAY_COLOR, LIGHT_GREEN_COLOR, UNIVERSAL_PADDING, BLACK_COLOR, MEDIUM_FONT_SIZE, SMALL_FONT_SIZE } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { MemoFinishLineItem } from "../components/FinishLineModeRenderItem";
import { postFinishTimes, postStartTime, postBibs, getBibs } from "../helpers/AxiosCalls";
import addLeadingZeros from "../helpers/AddLeadingZeros";
import GetClockTime from "../helpers/GetClockTime";
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

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

export default function FinishLineModeScreen({ navigation }: Props): React.ReactElement {
	const context = useContext(AppContext);

	// Bib Input
	const [bibText, setBibText] = useState("");
	const [inputWasFocused, setInputWasFocused] = useState(true);
	const bibInputRef = useRef<TextInput>(null);

	// Timer
	const [timerOn, setTimerOn] = useState(false);
	const [displayTime, setDisplayTime] = useState(0);
	const startTime = useRef<number>(-1);

	// Finish Times
	const [finishTimes, setFinishTimes] = useState<Array<number>>([]);
	const finishTimesRef = useRef(finishTimes);

	// Checker Bibs
	const [checkerBibs, setCheckerBibs] = useState<Array<number>>([]);
	const checkerBibsRef = useRef(checkerBibs);

	// Alert
	const [alertVisible, setAlertVisible] = useState(false);
	const [alertIndex, setAlertIndex] = useState<number>();

	// Other
	const [loading, setLoading] = useState(true);
	const isUnmounted = useRef(false);
	const flatListRef = useRef<FlatList>(null);

	// Leave with alert
	const backTapped = useCallback(() => {
		Alert.alert("Go to Mode Screen", "Are you sure you want to go back to the Mode Screen? Changes will be saved, but you should not edit Results until you complete recording data here.", [
			{
				text: "Leave",
				onPress: (): void => {
					navigation.navigate("ModeScreen");
				},
				style: "destructive",
			},
			{ text: "Cancel", onPress: (): void => { return; } },
		]);
	}, [navigation]);

	/** Save the finish times and checker bibs to local storage and/or RSU API */
	const addToStorage = useCallback(async (final, finishTimesParam, checkerBibsParam) => {
		if (context.online) {
			// Set start time locally
			GetLocalRaceEvent(context.raceID, context.eventID).then(([raceList, raceIndex, eventIndex]) => {
				if (raceIndex !== -1 && eventIndex !== -1) {
					raceList[raceIndex].events[eventIndex].finish_times = finishTimesParam;
					raceList[raceIndex].events[eventIndex].checker_bibs = checkerBibsParam;
					AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));
				}
			});

			if (final) {
				try {
					const bibs = await getBibs(context.raceID, context.eventID);

					if (bibs && bibs.length > 0) {
						// If there are already bibs saved from Chute Mode, navigate to Verification Mode
						AsyncStorage.setItem(`chuteDone:${context.raceID}:${context.eventID}`, "true");
						setLoading(false);
						navigation.navigate("ModeScreen");
						navigation.navigate("VerificationMode");
					} else {
						// Otherwise push bibs
						// Formatting and appending bib numbers
						const formData = new FormData();
						formData.append(
							"request",
							JSON.stringify({
								last_finishing_place: 0,
								bib_nums: checkerBibsParam
							})
						);

						await postBibs(context.raceID, context.eventID, formData);
						setLoading(false);
						navigation.navigate("ModeScreen");
					}

					// Don't allow further changes to Finish Line Mode
					// However, there is a use case where someone could complete Finish Line Mode without adding bibs,
					// And then want to add the bibs at the end of the race in Chute Mode,
					// So we leave that option open to them
					AsyncStorage.setItem(`finishLineDone:${context.raceID}:${context.eventID}`, "true");

				} catch (error) {
					if (error instanceof Error) {
						if (error.message === undefined || error.message === "Network Error") {
							Alert.alert("Connection Error", "No response received from the server. Please check your internet connection and try again.");
						} else {
							// Something else
							Alert.alert("Unknown Error", `${JSON.stringify(error.message)}`);
							Logger.log(error);
						}
					}
					setLoading(false);
				}
			}
		} else {
			GetLocalOfflineEvent(context.time).then(([eventList, eventIndex]) => {
				if (eventIndex !== -1) {
					eventList[eventIndex].finish_times = finishTimesParam;
					eventList[eventIndex].checker_bibs = checkerBibsParam;
					AsyncStorage.setItem("offlineEvents", JSON.stringify(eventList));
				}
			});

			if (final) {
				// Navigate away
				AsyncStorage.setItem(`finishLineDone:${context.time}`, "true");
				setLoading(false);

				navigation.navigate("ModeScreen");
				await AsyncStorage.getItem(`chuteDone:${context.time}`, (_err, result) => {
					if (result === "true") {
						navigation.navigate("VerificationMode");
					}
				});
			}
		}
	}, [context.eventID, context.online, context.raceID, context.time, navigation]);

	/** Updates Finish Times without re-rendering entire list */
	const updateFinishTimes = useCallback((newFinishTimes: Array<number>) => {
		finishTimesRef.current = newFinishTimes;
		setFinishTimes(finishTimesRef.current);
		addToStorage(false, finishTimesRef.current, checkerBibsRef.current);
	}, [addToStorage]);

	/** Updates Checker Bibs without re-rendering entire list */
	const updateCheckerBibs = useCallback((newBibs: Array<number>) => {
		checkerBibsRef.current = newBibs;
		setCheckerBibs(checkerBibsRef.current);
		addToStorage(false, finishTimesRef.current, checkerBibsRef.current);
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
				<HeaderBackButton onPress={backTapped} labelVisible={false} tintColor="white"></HeaderBackButton>
			)
		});

		if (context.online) {
			// Online mode
			GetLocalRaceEvent(context.raceID, context.eventID).then(([raceList, raceIndex, eventIndex]) => {
				if (raceIndex !== -1 && eventIndex !== -1) {
					if (raceList[raceIndex].events[eventIndex].finish_times.length > 0) {
						updateFinishTimes(raceList[raceIndex].events[eventIndex].finish_times);
						updateCheckerBibs(raceList[raceIndex].events[eventIndex].checker_bibs);
						const prevStart = raceList[raceIndex].events[eventIndex].real_start_time;
						if (prevStart !== null && prevStart !== -1) {
							setTimerOn(true);
							startTime.current = prevStart;
						}

						// Alert user of data recovery
						Alert.alert("Data Recovered", "You left Finish Line Mode without saving. Your data has been restored. Tap “Save” when you are done recording data.");
					} else {
						Alert.alert("Warning", "If you enter Finish Line Mode data after another user has already entered it for this event, your data will not be saved. Please check with other users before recording data.");
					}
				}
			});
		}
		else {
			// Offline mode
			GetLocalOfflineEvent(context.time).then(([eventList, eventIndex]) => {
				if (eventIndex !== -1) {
					updateFinishTimes(eventList[eventIndex].finish_times);
					updateCheckerBibs(eventList[eventIndex].checker_bibs);
					const prevStart = eventList[eventIndex].real_start_time;
					if (prevStart !== null && prevStart !== -1) {
						setTimerOn(true);
						startTime.current = prevStart;
					}
					if (eventList[eventIndex].finish_times.length > 0) {
						// Alert user of data recovery
						Alert.alert("Data Recovered", "You left Finish Line Mode without saving. Your data has been restored. Tap “Save” when you are done recording data.");
					}
				}
			});
		}

		// Done with initial loading
		setLoading(false);

		return () => {
			isUnmounted.current = true;
		};
	}, [backTapped, context.eventID, context.online, context.raceID, context.time, navigation, updateCheckerBibs, updateFinishTimes]);

	// Start the timer interval when user asks to record times
	useEffect(() => {

		// Timer hasn't started yet. Exit now
		if (!timerOn) return;

		// No previous start time. Start time as of now
		if (startTime.current === -1) {
			startTime.current = Date.now();
		}

		// Set to AsyncStorage the current time so we can come back to this time if the user app crashes, or leaves this screen
		if (context.online) {
			// Online Functionality
			GetLocalRaceEvent(context.raceID, context.eventID).then(([raceList, raceIndex, eventIndex]) => {
				if (raceIndex !== -1 && eventIndex !== -1) {
					raceList[raceIndex].events[eventIndex].real_start_time = startTime.current;
					AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));
				}
			});

		} else {
			// Offline Functionality
			GetLocalOfflineEvent(context.time).then(([eventList, eventIndex]) => {
				if (eventIndex !== -1) {
					eventList[eventIndex].real_start_time = startTime.current;
					AsyncStorage.setItem("offlineEvents", JSON.stringify(eventList));
				}
			});
		}

		// Start timer interval to display how long race has been occurring
		const interval = setInterval(() => {
			setDisplayTime(Date.now() - startTime.current);
		}, 150);

		// Clean up interval
		return () => {
			clearInterval(interval);
		};

	}, [context.eventID, context.online, context.raceID, context.time, timerOn]);

	const startTimer = useCallback(() => {
		setTimerOn(true);
	}, []);

	// Post Times to API
	const saveResults = useCallback(async () => {
		const formDataStartTime = new FormData();

		const [raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);
		if (raceIndex === -1 || eventIndex === -1) return;

		const formatStartTime = new Date(raceList[raceIndex].events[eventIndex].real_start_time);

		// Append request to API
		formDataStartTime.append(
			"request",
			JSON.stringify({
				start_time: `${formatStartTime.getFullYear()}-${addLeadingZeros(formatStartTime.getMonth() + 1)}-${addLeadingZeros(formatStartTime.getDate())} ${addLeadingZeros(formatStartTime.getHours())}:${addLeadingZeros(formatStartTime.getMinutes())}:${addLeadingZeros(formatStartTime.getSeconds())}`
			})
		);

		// Post start time
		try {
			await postStartTime(context.raceID, context.eventID, formDataStartTime);

			// Post Finish Times data
			if (finishTimesRef.current.length < 1) {
				// Alert if no finishing times have been recorded
				Alert.alert("No Results", "You have not recorded any results. Please try again.");
			} else {
				await postFinishTimes(context.raceID, context.eventID, finishTimesRef.current);
				addToStorage(true, finishTimesRef.current, checkerBibsRef.current);
			}
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === undefined || error.message === "Network Error") {
					Alert.alert("Connection Error", "No response received from the server. Please check your internet connection and try again.");
				} else if (error.message.toLowerCase().includes("out of order")) {
					Alert.alert("Results Error", "Results have already been posted for this event! You cannot re-post results.");
				} else {
					// Something else
					Alert.alert("Unknown Error", `${JSON.stringify(error.message)}`);
					Logger.log(error);
				}
			}
			setLoading(false);
		}
	}, [addToStorage, context.eventID, context.raceID]);


	// Check entries for errors
	const checkEntries = useCallback(() => {
		// If no results posted
		if (checkerBibsRef.current.length < 1) {
			// Alert if no finishing times have been recorded
			Alert.alert("No Results", "You have not recorded any results. Please try again.");
		} else if (checkerBibsRef.current.filter(entry => entry === null).length > 0) {
			// Alert if blank bib entry
			Alert.alert("Incorrect Bib Entry", "There is a blank bib entry in the list. Please fill in the correct value.");
		} else if (checkerBibsRef.current.includes(NaN)) {
			// Alert if non-numeric entry
			Alert.alert("Incorrect Bib Entry", "You have entered a non-numeric character in the bib entries list. Please correct that entry before submitting.");
		} else if (checkerBibsRef.current.filter(entry => (entry.toString().substring(0, 1) === "0" && entry.toString().length > 1)).length > 0) {
			// Filter bib numbers that start with 0
			Alert.alert("Incorrect Bib Entry", "There is a bib entry that starts with 0 in the list. Please fill in the correct value.");
		} else {
			if (context.online) {
				Alert.alert(
					"Save Results",
					"Are you sure you want to save to the cloud and quit?",
					[
						{
							text: "Save & Quit",
							onPress: (): void => {
								saveResults();
							},
							style: "destructive",
						},
						{ text: "Cancel", onPress: (): void => { return; } },
					]
				);
			} else {
				Alert.alert(
					"Save Results",
					"Are you sure you want to save the results and quit?",
					[
						{
							text: "Save & Quit",
							onPress: (): void => {
								if (finishTimesRef.current.length < 1) {
									Alert.alert("No Results", "You have not recorded any results. Please try again.");
								} else {
									setLoading(true);
									addToStorage(true, finishTimesRef.current, checkerBibsRef.current);
								}
							},
							style: "destructive",
						},
						{ text: "Cancel", onPress: () => null },
					]
				);
			}
		}
	}, [addToStorage, saveResults, context.online]);

	/** Add a time to the finish times */
	const recordTime = useCallback(() => {
		// Race hasn't started yet
		if (startTime.current === 0) {
			Alert.alert("Record Error", "You have not started the race. Please press \"Start Timer\" and try again.");
		} else {
			finishTimesRef.current.push(Date.now() - startTime.current);
			if (!bibText) {
				checkerBibsRef.current.push(0);
				updateCheckerBibs([...checkerBibsRef.current]);
			} else {
				checkerBibsRef.current.push(parseInt(bibText));
				updateCheckerBibs([...checkerBibsRef.current]);
				setBibText("");
			}

			const flatListRefCurrent = flatListRef.current;
			if (flatListRefCurrent !== null) {
				setTimeout(() => { flatListRefCurrent.scrollToOffset({ animated: false, offset: TABLE_ITEM_HEIGHT * finishTimesRef.current.length }); }, 100);
			}
		}
	}, [bibText, updateCheckerBibs]);


	// Display save button in header
	useEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				timerOn && <TouchableOpacity onPress={checkEntries}>
					<Text style={globalstyles.headerButtonText}>Save</Text>
				</TouchableOpacity>
			),
		});
	}, [navigation, checkEntries, timerOn]);

	/** Duplicate another read with the same time for the given index */
	const addOne = useCallback((item, index) => {
		finishTimesRef.current.splice(index + 1, 0, item);
		updateFinishTimes([...finishTimesRef.current]);
		checkerBibsRef.current.splice(index + 1, 0, 0);
		updateCheckerBibs([...checkerBibsRef.current]);
	}, [updateCheckerBibs, updateFinishTimes]);

	// Show Edit Alert
	const showAlert = (index: number): void => {
		setAlertIndex(index);
		setAlertVisible(true);
		setInputWasFocused(!!bibInputRef.current?.isFocused());
	};

	// Renders item on screen
	const renderItem = useCallback(({ item, index }) => (
		<MemoFinishLineItem
			time={item}
			index={index}
			bib={isNaN(checkerBibsRef.current[index]) ? "" : checkerBibsRef.current[index]}
			finishTimesRef={finishTimesRef}
			updateFinishTimes={updateFinishTimes}
			checkerBibsRef={checkerBibsRef}
			updateCheckerBibs={updateCheckerBibs}
			addOne={addOne}
			showAlert={showAlert}
		/>
	), [addOne, updateCheckerBibs, updateFinishTimes]);

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<KeyboardAvoidingView style={globalstyles.tableContainer} behavior={Platform.OS == "ios" ? "padding" : "height"}>
				{
					loading ?
						<ActivityIndicator size="large" color={Platform.OS === "android" ? GREEN_COLOR : GRAY_COLOR} />
						:
						<>
							<View style={{ backgroundColor: DARK_GREEN_COLOR, flexDirection: "row", width: "100%", alignItems: "center" }}>
								<View style={[globalstyles.timerView, {backgroundColor: timerOn ? LIGHT_GREEN_COLOR : LIGHT_GRAY_COLOR}]}>
									<Text style={{fontSize: MEDIUM_FONT_SIZE, fontFamily: "RobotoMono_400Regular", color: timerOn ? BLACK_COLOR : GRAY_COLOR }}>
										{GetClockTime(displayTime, true)}
									</Text>
								</View>
								<TextInput
									ref={bibInputRef}
									onChangeText={setBibText}
									editable={timerOn}
									style={globalstyles.timerBibInput}
									value={bibText}
									maxLength={6}
									placeholder="Bib Entry"
									placeholderTextColor={GRAY_COLOR}
									keyboardType="number-pad"
								/>
							</View>

							<FlatList
								style={globalstyles.flatList}
								ref={flatListRef}
								data={finishTimesRef.current}
								renderItem={renderItem}
								initialNumToRender={10}
								windowSize={11}
								getItemLayout={(_, index): ItemLayout => (
									{ length: TABLE_ITEM_HEIGHT, offset: TABLE_ITEM_HEIGHT * index, index }
								)}
								keyExtractor={(_item, index): string => (index + 1).toString()}
								keyboardShouldPersistTaps="handled"
								ListHeaderComponent={<View style={globalstyles.tableHead}>
									<Text style={globalstyles.placeTableHeadText}>#</Text>
									<Text style={globalstyles.bibTableHeadText}>Bib</Text>
									<Text style={globalstyles.timeTableHeadText}>Time</Text>
									<View style={[globalstyles.tableAddButton, {backgroundColor: globalstyles.tableHead.backgroundColor}]}>
										<Text style={{textAlign: "center", fontFamily: "Roboto_700Bold", fontSize: SMALL_FONT_SIZE}}>+</Text>
									</View>
									<View style={[globalstyles.tableDeleteButton, {backgroundColor: globalstyles.tableHead.backgroundColor}]}>
										<Text style={globalstyles.deleteTableText}>-</Text>
									</View>
								</View>}
								stickyHeaderIndices={[0]} />

							
							<View style={{paddingHorizontal: UNIVERSAL_PADDING}}>
								<MainButton 
									onPress={timerOn ? recordTime : startTimer} 
									text={timerOn ? "Record" : "Start Timer"} 
									color={timerOn ? "Green" : "Gray"} 
								/>
							</View>
						</>
				}
				
				{alertIndex !== undefined && <TextInputAlert
					title={`Edit Bib for Row ${alertIndex !== undefined ? alertIndex + 1 : ""}`}
					message={`Edit the bib number for Row ${alertIndex !== undefined ? alertIndex + 1 : ""}.`}
					placeholder="Enter Bib #"
					initialValue={GetBibDisplay(checkerBibsRef.current[alertIndex] !== undefined ? checkerBibsRef.current[alertIndex] : -1)}
					keyboardType={"number-pad"}
					maxLength={6}
					visible={alertVisible}
					actionOnPress={(valArray): void => {
						if (alertIndex !== undefined) {
							if (!isNaN(parseInt(valArray[0]))) {
								// Valid Bib
								checkerBibsRef.current[alertIndex] = parseInt(valArray[0]);
								updateCheckerBibs([...checkerBibsRef.current]);
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
					}} />}
			</KeyboardAvoidingView>
		</TouchableWithoutFeedback>
	);
}