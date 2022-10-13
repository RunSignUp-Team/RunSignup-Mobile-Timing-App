import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { KeyboardAvoidingView, View, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Text, Alert, FlatList, ActivityIndicator, Platform, BackHandler, Dimensions, TextInput } from "react-native";
import { globalstyles, TABLE_ITEM_HEIGHT, GRAY_COLOR, DARK_GREEN_COLOR, LIGHT_GRAY_COLOR, LIGHT_GREEN_COLOR, BLACK_COLOR, WHITE_COLOR, DARK_GRAY_COLOR, MAX_TIME, BIG_FONT_SIZE, TABLE_FONT_SIZE, UNIVERSAL_PADDING, TABLE_HEADER_HEIGHT } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { MemoFinishLineItem } from "../components/FinishLineModeRenderItem";
import { getParticipants, ParticipantResponse } from "../helpers/APICalls";
import GetClockTime from "../helpers/GetClockTime";
import { HeaderBackButton } from "@react-navigation/elements";
import GetLocalRaceEvent, { DefaultEventData } from "../helpers/GetLocalRaceEvent";
import GetOfflineEvent from "../helpers/GetOfflineEvent";
import { useFocusEffect } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../components/AppStack";
import { ItemLayout } from "../models/ItemLayout";
import TextInputAlert from "../components/TextInputAlert";
import GetBibDisplay from "../helpers/GetBibDisplay";
import Icon from "../components/IcoMoon";
import { MemoBibItem } from "../components/MemoBibItem";
import { AddToStorage } from "../helpers/FLAddToStorage";
import { CheckEntries } from "../helpers/FLCheckEntries";
import { postStartTime } from "../helpers/APICalls";
import Logger from "../helpers/Logger";
import GetBackupEvent from "../helpers/GetBackupEvent";
import MainButton from "../components/MainButton";
import { useHeaderHeight } from "@react-navigation/elements";
import * as Device from "expo-device";

type ScreenNavigationProp = BottomTabNavigationProp<TabParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

export type BibObject = {
	bib: number,
	name: string,
	age: number | null,
	gender: string | null
}

const TimeRefreshRate = 150;
const BibRefreshRate = 60000;

export default function FinishLineModeScreen({ navigation }: Props): React.ReactElement {
	const context = useContext(AppContext);
	const headerHeight = useHeaderHeight();

	// Bib Input
	const [bibText, setBibText] = useState("");
	const [inputWasFocused, setInputWasFocused] = useState(true);
	const bibInputRef = useRef<TextInput>(null);

	// Timer
	const [timerOn, setTimerOn] = useState(false);
	const [displayTime, setDisplayTime] = useState(0);
	const startTime = useRef<number>(-1);
	const timerInterval = useRef<NodeJS.Timer>();

	// Finish Times
	const [finishTimes, setFinishTimes] = useState<Array<number>>([]);
	const finishTimesRef = useRef(finishTimes);

	// Checker Bibs
	const [checkerBibs, setCheckerBibs] = useState<Array<number>>([]);
	const checkerBibsRef = useRef(checkerBibs);

	// Grid View
	const [gridView, setGridView] = useState(false);
	const [bibObjects, setBibObjects] = useState<Array<BibObject>>([]);
	const bibObjectsRef = useRef<Array<BibObject>>(bibObjects);
	const bibsInterval = useRef<NodeJS.Timer>();

	// Alerts
	const [alertVisible, setAlertVisible] = useState(false);
	const [alertIndex, setAlertIndex] = useState<number>();
	const [startTimeAlertVisible, setStartTimeAlertVisible] = useState(false);
	const dateRef = useRef(Date.now());

	// Other
	const [loading, setLoading] = useState(true);
	const isUnmounted = useRef(false);
	const flatListRef = useRef<FlatList>(null);
	const deviceType = useRef<"Phone"|"Tablet">("Phone");

	// Get Device Type
	useEffect(() => {
		const getDeviceType = async (): Promise<void> => {
			const type = await Device.getDeviceTypeAsync();
			if (type === 1) {
				deviceType.current = "Phone";
			} else {
				deviceType.current = "Tablet";
			}
		};

		getDeviceType();
	}, []);

	// Leave with alert
	const backTapped = useCallback(() => {
		if (startTime.current > -1) {
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

	/** Updates Finish Times without re-rendering entire list */
	const updateFinishTimes = useCallback((newFinishTimes: Array<number>) => {
		finishTimesRef.current = newFinishTimes;
		setFinishTimes(finishTimesRef.current);
		AddToStorage(context.raceID, context.eventID, context.appMode, context.time, finishTimesRef.current, checkerBibsRef.current, false, setLoading, navigation);
	}, [context.eventID, context.appMode, context.raceID, context.time, navigation]);

	/** Updates Checker Bibs without re-rendering entire list */
	const updateCheckerBibs = useCallback((newBibs: Array<number>) => {
		checkerBibsRef.current = newBibs;
		setCheckerBibs(checkerBibsRef.current);
		AddToStorage(context.raceID, context.eventID, context.appMode, context.time, finishTimesRef.current, checkerBibsRef.current, false, setLoading, navigation);
	}, [context.eventID, context.appMode, context.raceID, context.time, navigation]);

	/** Updates Bib Objects without re-rendering entire list */
	const updateBibObjects = useCallback((newBibs: Array<BibObject>) => {
		bibObjectsRef.current = newBibs;
		setBibObjects(bibObjectsRef.current);
	}, []);

	/** Load RSU Bibs */
	const loadRSUBibs = useCallback(async (alert: boolean, errorAlert: boolean): Promise<void> => {
		if (context.appMode === "Offline") {
			return;
		}
		
		if (alert || errorAlert) {
			setLoading(true);
		}
		let participants: ParticipantResponse[0] | undefined;
		try {
			// Get participants
			participants = await getParticipants(context.raceID, context.eventID);
			// Remove null bibs
			let filteredParticipants = participants.participants?.filter(participant => participant.bib_num !== null);
			// Remove duplicate bibs
			filteredParticipants = filteredParticipants.filter((c, index) => filteredParticipants.map(fParticipant => fParticipant.bib_num).indexOf(c.bib_num) === index);
			// Sort by bibs ascending
			filteredParticipants = filteredParticipants.sort((a, b) => (a.bib_num - b.bib_num));

			// Create Bib Objects
			const bibObjects: Array<BibObject> = [];
			for (let i = 0; i < filteredParticipants.length; i++) {
				const fParticipant = filteredParticipants[i];
				bibObjects.push({
					bib: fParticipant.bib_num,
					name: fParticipant.user.first_name + " " + fParticipant.user.last_name,
					age: fParticipant.age,
					gender: fParticipant.user.gender
				});
			}
			if (participants.participants && bibObjects.length > 0) {
				updateBibObjects(bibObjects);
				if (context.appMode === "Online") {
					AsyncStorage.setItem(`bibObjects:${context.raceID}:${context.eventID}`, JSON.stringify(bibObjects));
				} else {
					AsyncStorage.setItem(`bibObjects:backup:${context.raceID}:${context.eventID}`, JSON.stringify(bibObjects));
				}

				if (alert)
					Alert.alert("Bibs Refreshed", "Bib numbers were successfully refreshed from RunSignup.");
			} else {
				throw Error("No Participants or Bibs");
			}
		} catch {
			let storedBibsString: string | null = null;
			if (context.appMode === "Online") {
				storedBibsString = await AsyncStorage.getItem(`bibsObjects:${context.raceID}:${context.eventID}`);
			} else {
				storedBibsString = await AsyncStorage.getItem(`bibObjects:backup:${context.raceID}:${context.eventID}`);
			}
			if (storedBibsString) {
				updateBibObjects(JSON.parse(storedBibsString));
			} else if (errorAlert) {
				Alert.alert(
					"No Bibs Found",
					"No bib numbers were found for this event at RunSignup. Grid View only works when participants have been assigned bib numbers beforehand. Please try again.",
					[
						{
							text: "Go To List View",
							onPress: (): void => {
								setGridView(false);
							}
						}
					]
				);
			}
		}

		if (alert || errorAlert) {
			setLoading(false);
		}	
	}, [context.appMode, context.eventID, context.raceID, updateBibObjects]);

	/** Load RSU Bibs */
	useFocusEffect(useCallback(() => {
		loadRSUBibs(false, false);
	}, [loadRSUBibs]));

	/** Back Button */
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
	useFocusEffect(useCallback(() => {
		navigation.setOptions({
			headerLeft: () => (
				<HeaderBackButton onPress={backTapped} labelVisible={false} tintColor={WHITE_COLOR}></HeaderBackButton>
			)
		});

		const getOldData = async (): Promise<void> => {
			setLoading(true);
			let alertShown = false;
			if (context.appMode === "Online" || context.appMode === "Backup") {
				// Online modes
				let [raceList, raceIndex, eventIndex] = DefaultEventData;
				if (context.appMode === "Online") {
					[raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);
				} else {
					[raceList, raceIndex, eventIndex] = await GetBackupEvent(context.raceID, context.eventID);
				}

				if (raceIndex >= 0 && eventIndex >= 0) {
					// Check if they previously started recording
					const prevStart = raceList[raceIndex].events[eventIndex].real_start_time;
					if (prevStart !== null && prevStart !== -1) {
						setTimerOn(true);
						startTime.current = prevStart;

						// Show Unsupported Time alert
						alertShown = (Date.now() - startTime.current) > MAX_TIME;
						if (alertShown) {
							Alert.alert(
								"Unsupported Time", 
								`This event has been recorded for over ${GetClockTime(MAX_TIME)}, which is the maximum time supported. You can:\na) Dismiss this alert and tap the timer to adjust the start time if you have not yet recorded any finish times\nb) Dismiss this alert and save the times you have already recorded\nc) Completely reset this event (all data will be lost)`,
								[
									{
										text: "Dismiss",
										style: "cancel"
									},
									{
										text: "Confirm Reset",
										style: "destructive",
										onPress: (): void => {
											Alert.alert(
												"Are You Sure?",
												"Are you sure you want to reset this event? All local data will be lost (finish times & bib numbers). Data stored at RunSignup will not be affected. Careful! This cannot be undone.",
												[
													{
														text: "Cancel",
														style: "cancel"
													},
													{
														text: "Reset",
														style: "destructive",
														onPress: (): void => {
															raceList[raceIndex].events[eventIndex].checker_bibs = [];
															raceList[raceIndex].events[eventIndex].bib_nums = [];
															raceList[raceIndex].events[eventIndex].finish_times = [];
															raceList[raceIndex].events[eventIndex].real_start_time = -1;
															AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));
															navigation.navigate("ModeScreen");
														}
													}
												]
											);
										}
									}
								]);
						}
					}

					// Get latest data
					if (raceList[raceIndex].events[eventIndex].finish_times.length > 0) {
						updateFinishTimes(raceList[raceIndex].events[eventIndex].finish_times);
						updateCheckerBibs(raceList[raceIndex].events[eventIndex].checker_bibs);

						if (!alertShown) {
							// Alert user of data recovery
							Alert.alert("Data Recovered", "You left Finish Line Mode without saving. Your data has been restored. Tap the save icon when you are done recording data.");
						}
					}
				}
			}
			else {
				// Offline mode
				const [eventList, eventIndex] = await GetOfflineEvent(context.time);
				if (eventIndex >= 0) {
					// Check if they previously started recording
					const prevStart = eventList[eventIndex].real_start_time;
					if (prevStart !== null && prevStart !== -1) {
						setTimerOn(true);
						startTime.current = prevStart;

						// Show Unsupported Time alert
						alertShown = (Date.now() - startTime.current) > MAX_TIME;
						if (alertShown) {
							Alert.alert(
								"Unsupported Time", 
								`This event has been recorded for over ${GetClockTime(MAX_TIME)}, which is the maximum time supported. You can:\na) Dismiss this alert and tap the timer to adjust the start time if you have not yet recorded any finish times\nb) Dismiss this alert and save the times you have already recorded\nc) Completely reset this event (all data will be lost)`,
								[
									{
										text: "Dismiss",
										style: "cancel"
									},
									{
										text: "Confirm Reset",
										style: "destructive",
										onPress: (): void => {
											Alert.alert(
												"Are You Sure?",
												"Are you sure you want to reset this event? All data will be lost (finish times & bib numbers). Careful! This cannot be undone.",
												[
													{
														text: "Cancel",
														style: "cancel"
													},
													{
														text: "Reset",
														style: "destructive",
														onPress: (): void => {
															eventList[eventIndex].checker_bibs = [];
															eventList[eventIndex].bib_nums = [];
															eventList[eventIndex].finish_times = [];
															eventList[eventIndex].real_start_time = -1;
															AsyncStorage.setItem("offlineEvents", JSON.stringify(eventList));
															navigation.navigate("ModeScreen");
														}
													}
												]
											);
										}
									}
								]);
						}
					}

					// Get latest data
					if (eventList[eventIndex].finish_times.length > 0) {
						updateFinishTimes(eventList[eventIndex].finish_times);
						updateCheckerBibs(eventList[eventIndex].checker_bibs);

						if (!alertShown) {
							// Alert user of data recovery
							Alert.alert("Data Recovered", "You left Finish Line Mode without saving. Your data has been restored. Tap the save icon when you are done recording data.");
						}
					}
				}
			}

			// Done with initial loading
			setLoading(false);

			const flatListRefCurrent = flatListRef.current;
			if (flatListRefCurrent !== null) {
				setTimeout(() => { flatListRefCurrent.scrollToOffset({ animated: false, offset: TABLE_ITEM_HEIGHT * finishTimesRef.current.length }); }, 100);
			}
		};

		getOldData();

		return () => {
			isUnmounted.current = true;
		};
	}, [backTapped, context.eventID, context.appMode, context.raceID, context.time, navigation, updateCheckerBibs, updateFinishTimes]));

	useEffect(() => {
		const reloadTimer = async (): Promise<void> => {
			if (context.appMode === "Online" || context.appMode === "Backup") {
				let [raceList, raceIndex, eventIndex] = DefaultEventData;
				if (context.appMode === "Online") {
					[raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);
				} else {
					[raceList, raceIndex, eventIndex] = await GetBackupEvent(context.raceID, context.eventID);
				}
				if (raceIndex >= 0 && eventIndex >= 0) {
					const savedStartTime = raceList[raceIndex].events[eventIndex].real_start_time;
					if (savedStartTime >= 0) {
						// Start timerInterval to display how long race has been occurring
						startTime.current = savedStartTime;
						timerInterval.current = setInterval(() => {
							setDisplayTime(Date.now() - startTime.current);
						}, TimeRefreshRate);
						// Start bibs interval to auto-pull latest bibs
						bibsInterval.current = setInterval(() => {
							if (gridView) {
								loadRSUBibs(false, false);
							}
						}, BibRefreshRate);
					}
				}
			} else {
				const [eventList, eventIndex] = await GetOfflineEvent(context.time);
				if (eventIndex >= 0) {
					const savedStartTime = eventList[eventIndex].real_start_time;
					// Start timerInterval to display how long race has been occurring
					if (savedStartTime >= 0) {
						// Start timerInterval to display how long race has been occurring
						startTime.current = savedStartTime;
						timerInterval.current = setInterval(() => {
							setDisplayTime(Date.now() - startTime.current);
						}, TimeRefreshRate);
					}
				}
			}
		};
		reloadTimer();

		return () => {
			if (timerInterval.current) {
				clearInterval(timerInterval.current);
			}
			if (bibsInterval.current) {
				clearInterval(bibsInterval.current);
			}
		};
	}, [context.appMode, context.eventID, context.raceID, context.time, gridView, loadRSUBibs]);

	// Update start time
	const updateStartTime = useCallback(async (timeOfDay: number): Promise<void> => {
		try {
			// Post to RSU
			if (context.appMode === "Online") {
				await postStartTime(context.raceID, context.eventID, timeOfDay);
			}

			// Set to AsyncStorage the current time so we can come back to this time if the app crashes, or the user leaves this screen
			if (context.appMode === "Online" || context.appMode === "Backup") {
				// Online Functionality
				let [raceList, raceIndex, eventIndex] = DefaultEventData;
				if (context.appMode === "Online") {
					[raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);
				} else {
					[raceList, raceIndex, eventIndex] = await GetBackupEvent(context.raceID, context.eventID);
				}

				if (raceIndex >= 0 && eventIndex >= 0) {
					raceList[raceIndex].events[eventIndex].real_start_time = timeOfDay;
					if (context.appMode === "Online") {
						await AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));
					} else {
						await AsyncStorage.setItem("backupRaces", JSON.stringify(raceList));
					}
				}
			} else {
				// Offline Functionality
				const [eventList, eventIndex] = await GetOfflineEvent(context.time);
				if (eventIndex >= 0) {
					eventList[eventIndex].real_start_time = timeOfDay;
					await AsyncStorage.setItem("offlineEvents", JSON.stringify(eventList));
				}
			}

			startTime.current = timeOfDay;
		} catch (error) {
			Logger("Failed to Update Start Time", error, true);
		}
	}, [context.eventID, context.appMode, context.raceID, context.time]);

	/** Start Timer */
	const startTimer = useCallback(async (newTime?: number) => {
		const time = newTime ? newTime : Date.now();
		// To test MAX_TIME rollover -> 
		// startTime.current = time - 359990000;
		startTime.current = time;

		setTimerOn(true);

		updateStartTime(startTime.current);

		// Start timer timerInterval to display how long race has been occurring
		timerInterval.current = setInterval(() => {
			setDisplayTime(Date.now() - startTime.current);
		}, TimeRefreshRate);

		// Start bibs interval to auto-pull latest bibs
		bibsInterval.current = setInterval(() => {
			if (gridView) {
				loadRSUBibs(false, false);
			}
		}, BibRefreshRate);

	}, [gridView, loadRSUBibs, updateStartTime]);

	/** Reset Timer */
	const resetTimer = async (): Promise<void> => {
		setDisplayTime(0);
		setTimerOn(false);
		if (timerInterval.current)
			clearInterval(timerInterval.current);

		// Reset real_start_time in AsyncStorage
		if (context.appMode === "Online" || context.appMode === "Backup") {
			// Online Functionality
			let [raceList, raceIndex, eventIndex] = DefaultEventData;
			if (context.appMode === "Online") {
				[raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);
			} else {
				[raceList, raceIndex, eventIndex] = await GetBackupEvent(context.raceID, context.eventID);
			}

			if (raceIndex >= 0 && eventIndex >= 0) {
				raceList[raceIndex].events[eventIndex].real_start_time = -1;
				if (context.appMode === "Online") {
					await AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));
				} else {
					await AsyncStorage.setItem("backupRaces", JSON.stringify(raceList));
				}
			}
		} else {
			// Offline Functionality
			const [eventList, eventIndex] = await GetOfflineEvent(context.time);
			if (eventIndex >= 0) {
				eventList[eventIndex].real_start_time = -1;
				await AsyncStorage.setItem("offlineEvents", JSON.stringify(eventList));
			}
		}
		
		setStartTimeAlertVisible(false);
	};

	/** Add a time to the finish times */
	const recordTime = useCallback((enterKey: boolean, bib?: number) => {
		// Race hasn't started yet
		if (startTime.current === -1) {
			Alert.alert("Record Error", "You have not started the race. Please press \"Start Timer\" and try again.");
		} else if (Date.now() - startTime.current > MAX_TIME) {
			Alert.alert("Record Error", "You have recorded a time that is too large.");
		} else {
			if (gridView) {
				finishTimesRef.current.push(Date.now() - startTime.current);
				if (bib) {
					// Clear old bib if it exists
					const oldBibIndex = checkerBibsRef.current.indexOf(bib);
					if (oldBibIndex >= 0) {
						checkerBibsRef.current[oldBibIndex] = 0;
					}
					checkerBibsRef.current.push(bib);
				} else {
					checkerBibsRef.current.push(0);
				}
				updateCheckerBibs(checkerBibsRef.current);
			} else {
				if (!bibText) {
					finishTimesRef.current.push(Date.now() - startTime.current);
					checkerBibsRef.current.push(0);
					updateCheckerBibs([...checkerBibsRef.current]);
					setBibText("");
				} else {
					if (isNaN(parseInt(bibText))) {
						Alert.alert("Invalid Bib Number", "You have not entered a valid bib number. Please try again.");
					} else {
						finishTimesRef.current.push(Date.now() - startTime.current);
						checkerBibsRef.current.push(parseInt(bibText));
						updateCheckerBibs([...checkerBibsRef.current]);
						setBibText("");
					}
				}
			}
			const flatListRefCurrent = flatListRef.current;
			if (flatListRefCurrent !== null) {
				setTimeout(() => { flatListRefCurrent.scrollToOffset({ animated: false, offset: TABLE_ITEM_HEIGHT * finishTimesRef.current.length }); }, 100);
			}

			// Refocus Bib Input if enter key pressed on physical keyboard
			if (enterKey) {
				setTimeout(() => { bibInputRef.current?.focus(); }, 100);
			}
		}
	}, [bibText, gridView, updateCheckerBibs]);

	// Display save button in header
	useEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<View 
					style={{ 
						flexDirection: "row", 
						alignItems: "center", 
						width: timerOn ? (context.appMode === "Offline" ? undefined : (gridView ? 100 : 62)) : (gridView ? 60 : undefined), 
						justifyContent: "space-between", 
						marginRight: 15,
					}} >
					{gridView ?
						<TouchableOpacity onPress={async (): Promise<void> => { await loadRSUBibs(true, true); }}>
							<Icon name="loop22" size={18} color={WHITE_COLOR} />
						</TouchableOpacity>
						: null
					}

					{context.appMode === "Online" || context.appMode === "Backup" ?
						<TouchableOpacity
							onPress={async (): Promise<void> => {
								if (!gridView) {
									await loadRSUBibs(false, true);
								}
								setGridView(!gridView);

								const flatListRefCurrent = flatListRef.current;
								if (flatListRefCurrent !== null) {
									setTimeout(() => { flatListRefCurrent.scrollToOffset({ animated: false, offset: TABLE_ITEM_HEIGHT * finishTimesRef.current.length }); }, 100);
								}
							}}>
							<Icon
								name={gridView ? "list-numbered" : "grid"}
								size={22}
								color={WHITE_COLOR}
							/>
						</TouchableOpacity>
						: null
					}

					{timerOn ? <TouchableOpacity onPress={(): void => {
						CheckEntries(context.raceID, context.eventID, context.appMode, context.time, finishTimesRef, checkerBibsRef, setLoading, navigation);
					}}>
						<Icon name={"floppy-disk"} size={22} color={WHITE_COLOR} />
					</TouchableOpacity> : null}
				</View>
			),
		});
	}, [context.eventID, context.appMode, context.raceID, context.time, navigation, timerOn, finishTimes, checkerBibs, loadRSUBibs, gridView]);

	/** Duplicate another read with the same time for the given index */
	const addOne = useCallback((item, index) => {
		finishTimesRef.current.splice(index + 1, 0, item);
		updateFinishTimes([...finishTimesRef.current]);
		checkerBibsRef.current.splice(index + 1, 0, 0);
		updateCheckerBibs([...checkerBibsRef.current]);
	}, [updateCheckerBibs, updateFinishTimes]);

	// Show Edit Alert
	const showAlert = useCallback((index: number): void => {
		setAlertIndex(index);
		setAlertVisible(true);
		setInputWasFocused(!!bibInputRef.current?.isFocused());
	}, []);

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
	), [addOne, showAlert, updateCheckerBibs, updateFinishTimes]);

	const bibRenderItem = useCallback(({ item }: { item: BibObject }) => {
		const checkerBibsIndex = checkerBibsRef.current.indexOf(item.bib);

		return <MemoBibItem
			bibObject={item}
			timerOn={timerOn}
			time={GetClockTime(finishTimesRef.current[checkerBibsIndex])}
			handleBibTap={recordTime}
			alreadyEntered={checkerBibsIndex >= 0}
			checkerBibsRef={checkerBibsRef}
		/>;
	}, [recordTime, timerOn]);

	return (
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

				<View style={{ backgroundColor: DARK_GREEN_COLOR, flexDirection: "row", width: "100%", alignItems: "center" }}>
					<TouchableOpacity
						onPress={(): void => {
							if (finishTimesRef.current.length < 1) {
								setStartTimeAlertVisible(true);
							}
						}}
						activeOpacity={finishTimesRef.current.length < 1 ? 0.5 : 1}
						style={[globalstyles.timerView, { backgroundColor: timerOn ? LIGHT_GREEN_COLOR : LIGHT_GRAY_COLOR }]}>
						<Text style={{ fontSize: BIG_FONT_SIZE, fontFamily: "RobotoMono", color: timerOn ? BLACK_COLOR : GRAY_COLOR }}>
							{(Date.now() - startTime.current >= MAX_TIME && timerOn) ? "TOO LARGE" : GetClockTime(displayTime)}
						</Text>
					</TouchableOpacity>

					{gridView ?
						<TouchableOpacity
							onPress={(): void => {
								if (timerOn) {
									recordTime(false);
								} else {
									startTimer();
								}
							}}
							style={[globalstyles.startButton, { backgroundColor: timerOn ? LIGHT_GREEN_COLOR : DARK_GRAY_COLOR }]}>
							<Text style={globalstyles.startText}>
								{timerOn ? "Blank Bib" : "Start Timer"}
							</Text>
						</TouchableOpacity>
						:
						(timerOn ?
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
								onSubmitEditing={bibText !== "" ? (): void => { recordTime(true); } : undefined}
							/>
							:
							<TouchableOpacity
								onPress={(): void => { startTimer(); }}
								style={[globalstyles.startButton, { backgroundColor: DARK_GRAY_COLOR }]}>
								<Text style={globalstyles.startText}>
									{timerOn ? "Blank Bib" : "Start Timer"}
								</Text>
							</TouchableOpacity>
						)
					}

				</View>

				{/* Header */}
				<View style={globalstyles.tableHead}>
					<Text style={globalstyles.placeTableHeadText}>#</Text>
					<Text style={globalstyles.bibTableHeadText}>Bib</Text>
					<Text style={globalstyles.timeTableHeadText}>Time</Text>
					<View style={globalstyles.tableAddButton}>
						<Icon name="plus" color={BLACK_COLOR} size={10} />
					</View>
					<View style={globalstyles.tableDeleteButton}>
						<Icon name="minus" color={BLACK_COLOR} size={10} />
					</View>
				</View>

				{loading && <ActivityIndicator size="large" color={Platform.OS === "android" ? BLACK_COLOR : GRAY_COLOR} style={{ marginTop: 20 }} />}
				{!loading &&
					<>
						<FlatList
							showsVerticalScrollIndicator={true}
							scrollIndicatorInsets={{ right: -2 }}
							indicatorStyle={"black"}
							style={gridView ? globalstyles.shortFlatList : globalstyles.flatList}
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
						/>

						{gridView ?
							<View>
								{/* Header */}
								<View style={globalstyles.tableHead}>
									<Text style={{ fontFamily: "RobotoBold", fontSize: TABLE_FONT_SIZE }}>Event Bib Numbers</Text>
								</View>

								{/* Bib FlatList */}
								<FlatList
									data={bibObjectsRef.current}
									numColumns={deviceType.current === "Phone" ? 3 : 6}
									style={[globalstyles.gridFlatList, {	
										height: Dimensions.get("window").height - TABLE_ITEM_HEIGHT * 3 - TABLE_HEADER_HEIGHT * 2 - headerHeight - 100
									}]}
									showsVerticalScrollIndicator={true}
									scrollIndicatorInsets={{ right: -2 }}
									indicatorStyle={"black"}
									renderItem={bibRenderItem}
									keyExtractor={(_item, index): string => {
										return "bibObject_" + _item + index;
									}}
									initialNumToRender={10}
									windowSize={11}
									keyboardShouldPersistTaps="handled"
									ListFooterComponent={<View style={{ height: 20 }}/>}
								/>
								<View style={{ height: 10, borderBottomWidth: 1, borderBottomColor: DARK_GRAY_COLOR }} />
								<View style={{ height: 50 }} />
							</View>
							:
							<View style={{ paddingHorizontal: UNIVERSAL_PADDING }}>
								<MainButton
									onPress={(): void => {
										if (timerOn) {
											recordTime(false);
										} else {
											Alert.alert("Record Error", "You have not started the race. Please press \"Start Timer\" and try again.");
										}
									}}
									text={"Record"}
									color={timerOn ? "Green" : "Disabled"}
								/>
							</View>
						}
					</>
				}

				{/* Change Start Time Alert */}
				<TextInputAlert
					title={"Change Start Time"}
					message={`${startTime.current >= 0 && Date.now() - startTime.current > MAX_TIME ? "This event was started more than 24 hours ago.\nYou can change the start date for this event to today and choose a new start time." : "Change the start time for this event."} \nTap AM / PM to toggle between day and night.\nYou can also reset the start time.\n${startTime.current >= 0 && Date.now() - startTime.current > MAX_TIME ? "\nNew ": ""}Start Date: ${(startTime.current < 0 || (Date.now() - startTime.current > MAX_TIME)) ? new Date().toLocaleDateString() : new Date(startTime.current).toLocaleDateString()}`}
					type={"timeofday"}
					keyboardType={"number-pad"}
					visible={startTimeAlertVisible}
					timeInitialValue={(startTime.current < 0 || (Date.now() - startTime.current > MAX_TIME)) ? dateRef.current : startTime.current}
					actionOnPress={(valArray): void => {
						const timeOfDay = parseInt(valArray[1]);
						
						if (!isNaN(timeOfDay) && new Date(timeOfDay) <= new Date()) {
							if (startTime.current < 0) {
								startTimer(timeOfDay);
							} else {
								updateStartTime(timeOfDay);
							}
							setStartTimeAlertVisible(false);
						} else {
							Alert.alert("You cannot select a start time in the future.");
						}

					}} 
					cancelOnPress={(): void => {
						setStartTimeAlertVisible(false);
					}} 
					resetOnPress={timerOn ? (): void => {
						Alert.alert(
							"Are You Sure?",
							"Are you sure you want to reset the timer?",
							[
								{
									text: "Cancel",
									style: "cancel"
								},
								{
									text: "Reset",
									style: "destructive",
									onPress: resetTimer
								}
							]
						);
					} : undefined}
				/>

				{/* Bib Edit Alert */}
				{alertIndex !== undefined &&
					<TextInputAlert
						title={`Edit Bib for Place ${alertIndex !== undefined ? alertIndex + 1 : ""}`}
						message={`Edit the bib number for time ${alertIndex !== undefined ? GetClockTime(finishTimesRef.current[alertIndex]) : ""}.`}
						placeholder={"Enter Bib #"}
						type={"text"}
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
										setTimeout(() => {
											bibInputRef.current?.focus();
										}, 100);
									}
								} else {
									Alert.alert(
										"Incorrect Bib Entry",
										"The bib number you have entered is invalid. Please correct the value. Bibs must be numeric.",
									);
								}
							} else {
								setAlertVisible(false);
								if (inputWasFocused) {
									setTimeout(() => {
										bibInputRef.current?.focus();
									}, 1000);
								}
							}
						}} cancelOnPress={(): void => {
							setAlertVisible(false);
						}}
					/>
				}
			</KeyboardAvoidingView>
		</TouchableWithoutFeedback>
	);
}