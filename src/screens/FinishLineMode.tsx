import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { KeyboardAvoidingView, View, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Text, TextInput, Alert, FlatList, ActivityIndicator, Platform, BackHandler } from "react-native";
import { globalstyles, TABLE_ITEM_HEIGHT, GRAY_COLOR, DARK_GREEN_COLOR, LIGHT_GRAY_COLOR, LIGHT_GREEN_COLOR, UNIVERSAL_PADDING, BLACK_COLOR, MEDIUM_FONT_SIZE, WHITE_COLOR, MAX_TIME } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { MemoFinishLineItem } from "../components/FinishLineModeRenderItem";
import GetClockTime from "../helpers/GetClockTime";
import { HeaderBackButton } from "@react-navigation/elements";
import GetLocalRaceEvent from "../helpers/GetLocalRaceEvent";
import GetLocalOfflineEvent from "../helpers/GetLocalOfflineEvent";
import { useFocusEffect } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../components/AppStack";
import MainButton from "../components/MainButton";
import { ItemLayout } from "../models/ItemLayout";
import TextInputAlert from "../components/TextInputAlert";
import GetBibDisplay from "../helpers/GetBibDisplay";
import Icon from "../components/IcoMoon";
import { AddToStorage } from "../helpers/FLAddToStorage";
import { CheckEntries } from "../helpers/FLCheckEntries";

type ScreenNavigationProp = BottomTabNavigationProp<TabParamList>;

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
		AddToStorage(context.raceID, context.eventID, context.online, context.time, finishTimesRef.current, checkerBibsRef.current, false, setLoading, navigation);
	}, [context.eventID, context.online, context.raceID, context.time, navigation]);

	/** Updates Checker Bibs without re-rendering entire list */
	const updateCheckerBibs = useCallback((newBibs: Array<number>) => {
		checkerBibsRef.current = newBibs;
		setCheckerBibs(checkerBibsRef.current);
		AddToStorage(context.raceID, context.eventID, context.online, context.time, finishTimesRef.current, checkerBibsRef.current, false, setLoading, navigation);
	}, [context.eventID, context.online, context.raceID, context.time, navigation]);

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
		const nav = navigation.getParent() ? navigation.getParent() : navigation;
		nav?.setOptions({
			headerLeft: () => (
				<HeaderBackButton onPress={backTapped} labelVisible={false} tintColor={WHITE_COLOR}></HeaderBackButton>
			)
		});

		if (context.online) {
			// Online mode
			GetLocalRaceEvent(context.raceID, context.eventID).then(([raceList, raceIndex, eventIndex]) => {
				if (raceIndex !== -1 && eventIndex !== -1) {
					// Check if they previously started recording
					const prevStart = raceList[raceIndex].events[eventIndex].real_start_time;
					if (prevStart !== null && prevStart !== -1) {
						setTimerOn(true);
						startTime.current = prevStart;
					}

					// Get latest data
					if (raceList[raceIndex].events[eventIndex].finish_times.length > 0) {
						updateFinishTimes(raceList[raceIndex].events[eventIndex].finish_times);
						updateCheckerBibs(raceList[raceIndex].events[eventIndex].checker_bibs);
					}
				}
			});
		}
		else {
			// Offline mode
			GetLocalOfflineEvent(context.time).then(([eventList, eventIndex]) => {
				if (eventIndex !== -1) {
					// Check if they previously started recording
					const prevStart = eventList[eventIndex].real_start_time;
					if (prevStart !== null && prevStart !== -1) {
						setTimerOn(true);
						startTime.current = prevStart;
					}

					// Get latest data
					if (eventList[eventIndex].finish_times.length > 0) {
						updateFinishTimes(eventList[eventIndex].finish_times);
						updateCheckerBibs(eventList[eventIndex].checker_bibs);	
					}	
				}
			});
		}

		const flatListRefCurrent = flatListRef.current;
		if (flatListRefCurrent !== null) {
			setTimeout(() => { flatListRefCurrent.scrollToOffset({ animated: false, offset: TABLE_ITEM_HEIGHT * finishTimesRef.current.length }); }, 100);
		}

		// Done with initial loading
		setLoading(false);

		return () => {
			isUnmounted.current = true;
		};
	}, [backTapped, context.eventID, context.online, context.raceID, context.time, navigation, updateCheckerBibs, updateFinishTimes]));

	// Start the timer interval when user asks to record times
	useEffect(() => {
		// Timer hasn't started yet. Exit now
		if (!timerOn) return;

		// No previous start time. Start time as of now
		if (startTime.current === -1) {
			startTime.current = Date.now();
		}

		// Set to AsyncStorage the current time so we can come back to this time if the app crashes, or the user leaves this screen
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

	/** Add a time to the finish times */
	const recordTime = useCallback(() => {
		// Race hasn't started yet
		if (startTime.current === -1) {
			Alert.alert("Record Error", "You have not started the race. Please press \"Start Timer\" and try again.");
		} else if (Date.now() - startTime.current > MAX_TIME) {
			Alert.alert("Record Error", "You have recorded a time that is too large.");
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
		const nav = navigation.getParent() ? navigation.getParent() : navigation;
		nav?.setOptions({
			headerRight: () => (
				timerOn && <TouchableOpacity onPress={(): void => {
					CheckEntries(context.raceID, context.eventID, context.online, context.time, finishTimesRef, checkerBibsRef, setLoading, navigation);
				}}>
					<Text style={globalstyles.headerButtonText}>Save</Text>
				</TouchableOpacity>
			),
		});
	}, [context.eventID, context.online, context.raceID, context.time, navigation, timerOn, finishTimes, checkerBibs]);

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
			<KeyboardAvoidingView 
				style={globalstyles.tableContainer}
				behavior={Platform.OS == "ios" ? "padding" : undefined}
				keyboardVerticalOffset={70}>
	
				<View style={{ backgroundColor: DARK_GREEN_COLOR, flexDirection: "row", width: "100%", alignItems: "center" }}>
					<View style={[globalstyles.timerView, { backgroundColor: timerOn ? LIGHT_GREEN_COLOR : LIGHT_GRAY_COLOR }]}>
						<Text style={{ fontSize: MEDIUM_FONT_SIZE, fontFamily: "RobotoMono", color: timerOn ? BLACK_COLOR : GRAY_COLOR }}>
							{(startTime.current !== -1 && Date.now() - startTime.current > MAX_TIME) ?  "Too Large" : GetClockTime(displayTime)}
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

				{/* Header */}
				<View style={globalstyles.tableHead}>
					<Text style={globalstyles.placeTableHeadText}>#</Text>
					<Text style={globalstyles.bibTableHeadText}>Bib</Text>
					<Text style={globalstyles.timeTableHeadText}>Time</Text>
					<View style={globalstyles.tableAddButton}>
						<Icon name="plus2" color={BLACK_COLOR} size={10} />
					</View>
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

						<View style={{ paddingHorizontal: UNIVERSAL_PADDING }}>
							<MainButton
								onPress={timerOn ? recordTime : startTimer}
								text={timerOn ? "Record" : "Start Timer"}
								color={timerOn ? "Green" : "Gray"}
							/>
						</View>
					</>
				}

				{alertIndex !== undefined &&
					<TextInputAlert
						title={`Edit Bib for Row ${alertIndex !== undefined ? alertIndex + 1 : ""}`}
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
}