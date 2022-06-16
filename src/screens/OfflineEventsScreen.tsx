import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { View, FlatList, Alert, ActivityIndicator, Platform } from "react-native";
import { BLACK_COLOR, globalstyles, GRAY_COLOR, TABLE_ITEM_HEIGHT, WHITE_COLOR } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { AppContext } from "../components/AppContext";
import { MemoOfflineEventsItem } from "../components/OfflineEventsRenderItem";
import { deleteBibs, deleteFinishTimes, postBibs, postFinishTimes, postStartTime } from "../helpers/APICalls";
import { HeaderBackButton } from "@react-navigation/elements";
import GetLocalRaceEvent from "../helpers/GetLocalRaceEvent";
import ConflictBoolean from "../helpers/ConflictBoolean";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import addLeadingZeros from "../helpers/AddLeadingZeros";
import { ItemLayout } from "../models/ItemLayout";
import TextInputAlert from "../components/TextInputAlert";
import MainButton from "../components/MainButton";
import CreateAPIError from "../helpers/CreateAPIError";

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

	const [alertVisible, setAlertVisible] = useState(false);
	const isFocused = useIsFocused();

	const flatListRef = useRef<FlatList>(null);
	const navigationRef = useRef(navigation);

	const [loading, setLoading] = useState(false);
	const [doneInitialLoad, setDoneInitialLoad] = useState(false);

	// Set back button
	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<HeaderBackButton onPress={(): void => { navigation.goBack(); }} labelVisible={false} tintColor={WHITE_COLOR}></HeaderBackButton>
			),
		});
	}, [context.eventID, context.online, context.raceID, navigation]);

	// Get offline events from local storage, and run again when deleting an offline event
	useEffect(() => {
		const getOfflineEvents = async (): Promise<void> => {
			setLoading(true);
			const response = await AsyncStorage.getItem("offlineEvents");

			// Check if list is empty or not
			if (response !== null) {
				setEventList(JSON.parse(response));
			}

			setDoneInitialLoad(true);
			setLoading(false);
		};
		getOfflineEvents();
	}, [isFocused]);

	// Delete old Bib Numbers and upload new Bib Numbers
	const assignBibNums = useCallback(async (item: OfflineEvent) => {
		const formData = new FormData();
		// Post checker bibs if they exist
		if (item.checker_bibs?.length > 0) {
			await deleteBibs(context.raceID, context.eventID);

			// Appending checker bib
			formData.append(
				"request",
				"{\"last_finishing_place\": 0,\"bib_nums\": [" +
				item.checker_bibs +
				"]}"
			);
			await postBibs(context.raceID, context.eventID, formData);
		// Else post bib numbers if they exist
		} else if (item.bib_nums?.length > 0) {
			await deleteBibs(context.raceID, context.eventID);

			// Appending bib numbers
			formData.append(
				"request",
				"{\"last_finishing_place\": 0,\"bib_nums\": [" +
				item.bib_nums +
				"]}"
			);
			await postBibs(context.raceID, context.eventID, formData);
		// Else unknown error
		} else {
			throw new Error(JSON.stringify([item.bib_nums, item.checker_bibs]));
		}
	}, [context.eventID, context.raceID]);

	// Delete old Finish Times and upload new Finish Times
	const assignFinishTimes = useCallback(async (item: OfflineEvent) => {
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
		await deleteFinishTimes(context.raceID, context.eventID);
		await postFinishTimes(context.raceID, context.eventID, item.finish_times);
	}, [context.eventID, context.raceID]);

	// Assign offline bib numbers, finish times, and start time, if any
	const assignData = useCallback(async (item: OfflineEvent): Promise<void> => {
		try {
			setLoading(true);

			// Finish Line Done
			const flDone = await AsyncStorage.getItem(`finishLineDone:${context.time}`) === "true";
			// Chute Done
			const cDone = await AsyncStorage.getItem(`chuteDone:${context.time}`) === "true";

			// Check status of offline event
			if (
				item.checker_bibs?.length < 1 ||
				item.finish_times?.length < 1 ||
				(item.bib_nums?.length > 0 && !cDone) ||
				(item.checker_bibs?.length > 0 && !flDone) ||
				(item.finish_times?.length > 0 && !flDone)
			) {
				Alert.alert("Invalid Data", `${item.name} does not have saved data. Please make sure to save your data in ${item.name} Finish Line and Chute Modes and try again.`);
				setLoading(false);
				return;
			}

			// Get Local Race & Event
			const [raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);

			// Check for conflicts
			const smallerArray = Math.min(item.bib_nums ? item.bib_nums.length : 0, item.checker_bibs ? item.checker_bibs.length : 0);
			for (let i = 0; i < smallerArray; i++) {
				if (ConflictBoolean(item.bib_nums[i], item.checker_bibs[i])) {
					Alert.alert("Conflicts Remaining", `${item.name} contains conflicts. Please resolve them in ${item.name} Results and try again.`);
					setLoading(false);
					return;
				}
			}

			// Push to RunSignup
			await assignBibNums(item);
			await assignFinishTimes(item);

			// Mark modes as complete
			await AsyncStorage.setItem(`chuteDone:${context.raceID}:${context.eventID}`, "true");
			await AsyncStorage.setItem(`finishLineDone:${context.raceID}:${context.eventID}`, "true");

			// Clear local data for event
			raceList[raceIndex].events[eventIndex].checker_bibs = [];
			raceList[raceIndex].events[eventIndex].bib_nums = [];
			raceList[raceIndex].events[eventIndex].finish_times = [];
			await AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));

			Alert.alert("Success", `The data in ${item.name} has been successfully assigned to ${raceList[raceIndex]?.events[eventIndex]?.name}!`);
			navigationRef.current.navigate("ModeScreen");
		} catch (error) {
			CreateAPIError("Assign Event", error);
		} finally {
			setLoading(false);
		}
	}, [assignBibNums, assignFinishTimes, context.eventID, context.raceID, context.time]);

	// Save offline events to storage
	useEffect(() => {
		if (doneInitialLoad && isFocused && !context.online) {
			const saveOfflineEvents = async (): Promise<void> => {
				await AsyncStorage.setItem("offlineEvents", JSON.stringify(eventList));
			};
			saveOfflineEvents();
		}
	}, [context.online, doneInitialLoad, eventList, isFocused]);

	// Create Offline Event
	const createEvent = async (eventName: string): Promise<void> => {
		if (eventName) {
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

			setEventList(eventList => {
				eventList.push(offlineEvent);
				return [...eventList];
			});

			const flatListRefCurrent = flatListRef.current;
			if (flatListRefCurrent !== null) {
				setTimeout(() => { flatListRefCurrent.scrollToOffset({ animated: false, offset: TABLE_ITEM_HEIGHT * eventList.length }); }, 200);
			}

			setAlertVisible(false);
		} else {
			Alert.alert("Name Required", "A name is required to create an offline event.");
		}
	};

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
				message={"Enter the name of your offline event."}
				placeholder={"Event Name"}
				maxLength={15}
				actionOnPress={(valArray): void => {
					createEvent(valArray[0]);
				}}
				cancelOnPress={(): void => {
					setAlertVisible(false);
				}}
			/>

			{loading && <ActivityIndicator size="large" color={Platform.OS === "android" ? BLACK_COLOR : GRAY_COLOR} style={{ marginTop: 20 }} />}
			{!loading &&
				<FlatList
					ListHeaderComponent={context.online ? undefined : <MainButton color="Gray" text="Add Offline Event" onPress={(): void => { setAlertVisible(true); }} buttonStyle={{ minHeight: 50 }} />}
					showsVerticalScrollIndicator={false}
					data={eventList}
					renderItem={renderItem}
					ref={flatListRef}
					getItemLayout={(_, index): ItemLayout => (
						{ length: TABLE_ITEM_HEIGHT, offset: TABLE_ITEM_HEIGHT * index, index }
					)}
					keyExtractor={(_item, index): string => (index + 1).toString()}
				/>
			}
		</View >
	);
};

export default OfflineEventsScreen;