import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { View, TouchableOpacity, FlatList, Alert, ActivityIndicator, Platform, Image, Modal, TextInput, Text } from "react-native";
import { globalstyles, GRAY_COLOR, GREEN_COLOR, MEDIUM_FONT_SIZE, RED_COLOR, TABLE_ITEM_HEIGHT } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { AppContext } from "../components/AppContext";
import { MemoOfflineEventsItem } from "../components/OfflineEventsRenderItem";
import { deleteBibs, deleteFinishTimes, postBibs, postFinishTimes, postStartTime } from "../helpers/AxiosCalls";
import { HeaderBackButton } from "@react-navigation/elements";
import GetLocalRaceEvent from "../helpers/GetLocalRaceEvent";
import ConflictBoolean from "../helpers/ConflictBoolean";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import addLeadingZeros from "../helpers/AddLeadingZeros";
import { ItemLayout } from "../models/ItemLayout";
import Logger from "../helpers/Logger";
import TextInputAlert from "../components/TextInputAlert";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

export interface OfflineEvent {
	time: number,
	name: string,
	start_time: string,
	real_start_time: number,
	finish_times: Array<number>,
	bib_nums: Array<number>,
	checker_bibs: Array<number>,
}

const OfflineEventsScreen = ({ navigation }: Props): React.ReactElement => {
	const context = useContext(AppContext);

	const [eventList, setEventList] = useState<Array<OfflineEvent>>([]);
	const [eventName, setEventName] = useState("");

	const [alertVisible, setAlertVisible] = useState(false);
	const isVisible = useIsFocused();

	const flatListRef = useRef<FlatList>(null);
	const navigationRef = useRef(navigation);
	const addEventRef = useRef<TextInput>(null);

	const [loading, setLoading] = useState(false);

	// Set back button
	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<HeaderBackButton onPress={(): void => { navigation.pop(); }} labelVisible={false} tintColor="white"></HeaderBackButton>
			),
		});
	}, [context.eventID, context.online, context.raceID, navigation]);

	// Get offline events from local storage, and run again when deleting an offline event
	useEffect(() => {
		setLoading(true);
		const getOfflineEvents = async (): Promise<void> => {
			if (isVisible) {
				const response = await AsyncStorage.getItem("offlineEvents");

				// Check if list is empty or not
				if (response !== null) {
					setEventList(JSON.parse(response));
					setLoading(false);
				} else {
					setLoading(false);
				}
			}
		};
		getOfflineEvents();
	}, [isVisible]);

	// Create event
	useEffect(() => {
		console.log("here", eventName);
		const createEvent = async (): Promise<void> => {
			if ((/^[0-9a-zA-Z(). -]+$/gm).test(eventName)) {
				setAlertVisible(false);
				const createTime = new Date().getTime();
				const offlineEvent: OfflineEvent = {
					time: createTime,
					name: eventName,
					start_time: "",
					real_start_time: -1,
					finish_times: [],
					bib_nums: [],
					checker_bibs: [],
				};
				eventList.push(offlineEvent);
				setEventList([...eventList]);
	
				const flatListRefCurrent = flatListRef.current;
				if (flatListRefCurrent !== null) {
					setTimeout(() => { flatListRefCurrent.scrollToOffset({ animated: false, offset: TABLE_ITEM_HEIGHT * eventList.length }); }, 200);
				}
				await AsyncStorage.setItem("offlineEvents", JSON.stringify(eventList));
				setEventName("");
			} else {
				console.log("YO", eventName);
				Alert.alert("Incorrect Event Name", "You have created an invalid name for this event. Please try again.");
			}
		};

		createEvent();
	}, [eventList, eventName]);
	

	// Delete old Bib Numbers and upload new Bib Numbers
	const assignBibNums = useCallback(async (item: OfflineEvent) => {
		// Appending bib numbers
		const formData = new FormData();
		// Post checker bibs if any of them are non-zero
		if ((!item.bib_nums || item.bib_nums.length < 1) && item.checker_bibs.find(checkerBib => checkerBib !== 0) !== undefined) {
			await deleteBibs(context.raceID, context.eventID);
			formData.append(
				"request",
				"{\"last_finishing_place\": 0,\"bib_nums\": [" +
				item.checker_bibs +
				"]}"
			);
			await postBibs(context.raceID, context.eventID, formData);
		// Else post bib numbers
		} else if (item.bib_nums && item.bib_nums.length > 0) {
			await deleteBibs(context.raceID, context.eventID);
			formData.append(
				"request",
				"{\"last_finishing_place\": 0,\"bib_nums\": [" +
				item.bib_nums +
				"]}"
			);
			await postBibs(context.raceID, context.eventID, formData);
		}

	}, [context.eventID, context.raceID]);

	// Delete old Finish Times and upload new Finish Times
	const assignFinishTimes = useCallback(async (item: OfflineEvent) => {
		await deleteFinishTimes(context.raceID, context.eventID);

		const formatStartTime = new Date(item.real_start_time);

		const formDataStartTime = new FormData();
		// Append request to API
		formDataStartTime.append(
			"request",
			JSON.stringify({
				start_time: `${formatStartTime.getFullYear()}-${addLeadingZeros(formatStartTime.getMonth() + 1)}-${addLeadingZeros(formatStartTime.getDate())} ${addLeadingZeros(formatStartTime.getHours())}:${addLeadingZeros(formatStartTime.getMinutes())}:${addLeadingZeros(formatStartTime.getSeconds())}`
			})
		);

		await postStartTime(context.raceID, context.eventID, formDataStartTime);

		await postFinishTimes(context.raceID, context.eventID, item.finish_times);
	}, [context.eventID, context.raceID]);

	const assignData = useCallback(async (item: OfflineEvent) => {
		setLoading(true);

		const [raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);

		let conflicts = false;

		// Check for conflicts
		const smallerArray = Math.min(item.bib_nums.length, item.checker_bibs.length);
		for (let i = 0; i < smallerArray; i++) {
			if (ConflictBoolean(item.bib_nums[i], item.checker_bibs[i])) {
				Alert.alert("Conflicts Remaining", `The Offline Event "${item.name}" contains conflicts. Please resolve them in the "${item.name}" Results and try again.`);
				conflicts = true;
				setLoading(false);
				break;
			}
		}

		if (!conflicts) {
			// Assign offline bib numbers, finish times, and start time, if any
			try {
				if (item.bib_nums.length > 0 || item.checker_bibs.length > 0) {
					await assignBibNums(item);
				}
				if (item.finish_times.length > 0 && (item.real_start_time !== -1 || item.real_start_time !== null)) {
					await assignFinishTimes(item);
				}
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === undefined || error.message === "Network Error") {
						Alert.alert("Connection Error", "No response received from the server. Please check your internet connection and try again.");
					} else {
						// Something else
						Alert.alert("Unknown Error", `${JSON.stringify(error.message)}`);
						Logger.log(error.message);
					}
				}
			}

			// If no bib numbers, finish times, and checker bibs
			if (item.bib_nums.length < 1 && item.checker_bibs.length < 1 && item.finish_times.length < 1) {
				Alert.alert("No Data", `The Offline Event "${item.name}" does not have saved Bib Numbers and Finish Times. Please make sure to save your data in the "${item.name}" Finish Line and Chute Modes and try again.`);
				setLoading(false);
			} else {
				// Assign Finish Times
				if (item.finish_times.length > 0) {
					await AsyncStorage.setItem(`finishLineDone:${context.raceID}:${context.eventID}`, "true");
					raceList[raceIndex].events[eventIndex].finish_times = item.finish_times;
				}
				// Assign Bibs
				if (item.bib_nums.length > 0 || item.checker_bibs.length > 0) {
					await AsyncStorage.setItem(`chuteDone:${context.raceID}:${context.eventID}`, "true");

					raceList[raceIndex].events[eventIndex].checker_bibs = [];
					if (item.bib_nums === null || item.bib_nums.length < 1) {
						// If offline event bibs are checker_bibs
						raceList[raceIndex].events[eventIndex].bib_nums = item.checker_bibs;
					} else {
						// If offline event bibs are bib_nums
						raceList[raceIndex].events[eventIndex].bib_nums = item.bib_nums;
					}
				}
				

				await AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));
				setLoading(false);
				navigationRef.current.navigate("ModeScreen");
			}
		}
	}, [assignBibNums, assignFinishTimes, context.eventID, context.raceID]);

	// Display save button in header
	useEffect(() => {
		if (!context.online) {
			navigation.setOptions({
				headerRight: () => (
					<TouchableOpacity
						onPress={(): void => {
							// Add event
							setAlertVisible(true);
							setTimeout(() => { addEventRef.current?.focus(); }, 100);
						}}
					>
						<Image
							style={globalstyles.headerImage}
							source={require("../assets/plus-icon.png")}
						/>
					</TouchableOpacity>
				),
			});
		}
	}, [context.online, navigation]);


	// Rendered item in the Flatlist
	const renderItem = ({ item, index }: { item: OfflineEvent, index: number }): React.ReactElement => {
		const setEventTitle = context.setEventTitle;
		const setTime = context.setTime;
		navigationRef.current = navigation;

		return (
			<MemoOfflineEventsItem
				item={item}
				index={index}
				setEventTitle={setEventTitle}
				setTime={setTime}
				online={context.online}
				eventTitle={context.eventTitle}
				assignBibNums={assignBibNums}
				assignFinishTimes={assignFinishTimes}
				assignData={assignData}
				navigationRef={navigationRef}
			/>
		);
	};

	return (
		<View style={globalstyles.container}>
			<TextInputAlert 
				visible={alertVisible} 
				title={"Set Event Name"}
				message={"Enter the name for your offline event."}
				placeholder={"Event Name"}
				actionOnPress={(valArray): void => {
					console.log(valArray);
					setEventName(valArray[0]);
				}}
				cancelOnPress={(): void => {
					setAlertVisible(false);
				}}
			/>
			{loading ? <ActivityIndicator size="large" color={Platform.OS === "android" ? GREEN_COLOR : GRAY_COLOR} /> : eventList.length < 1 ? <Text style={globalstyles.info}>{"No Offline Events.\nClick the + button to create a new Offline Event."}</Text> :
				<FlatList
					data={eventList}
					renderItem={renderItem}
					ref={flatListRef}
					getItemLayout={(_, index): ItemLayout => (
						{ length: TABLE_ITEM_HEIGHT, offset: TABLE_ITEM_HEIGHT * index, index }
					)}
					keyExtractor={(_item, index): string => (index + 1).toString()}
				/>}
		</View >
	);
};

export default OfflineEventsScreen;