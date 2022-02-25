import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { View, FlatList, Alert, ActivityIndicator, Text, Platform, TouchableOpacity } from "react-native";
import { globalstyles, GREEN_COLOR } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { getEvents } from "../helpers/AxiosCalls";
import { MemoEventsListItem } from "../components/EventsListRenderItem";
import { HeaderBackButton } from "@react-navigation/elements";
import { Race } from "./RaceListScreen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import { deleteTokenInfo } from "../helpers/oAuth2Helper";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

export interface Event {
	id: number,
	title: string,
	start_time: string,
	event_id: number,
	real_start_time: number,
	finish_times: Array<number>,
	checker_bibs: Array<number>,
	bib_nums: Array<number>,
}

const EventsListScreen = ({ navigation }: Props) => {
	const context = useContext(AppContext);

	const [finalEventList, setFinalEventList] = useState<Array<Event>>([]);
	const [loading, setLoading] = useState(false);
	const navigationRef = useRef<ScreenNavigationProp>(navigation);

	// Handle log out. Delete local tokens
	const handleLogOut = useCallback(async () => {
		Alert.alert("Log Out?", "Are you sure you want to log out?", [
			{
				text: "Cancel",
				style: "default",
				onPress: () => {return;}
			},
			{
				text: "Log Out",
				style: "destructive",
				onPress: async () => {
					try {
						await deleteTokenInfo();
						navigation.navigate("Login");
					} catch (error) {
						console.log(error);
					}
				}
			}
		]);
	},[navigation]);

	// Set back button
	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<HeaderBackButton onPress={() => { navigation.pop(); }} label="Race List" labelVisible={Platform.OS === "ios"} tintColor="white"></HeaderBackButton>
			),
			headerRight: () => (
				<TouchableOpacity onPress={handleLogOut}>
					<Text style={{color: "white", fontSize: 18}}>Log Out</Text>
				</TouchableOpacity>
			)
		});
	}, [handleLogOut, navigation]);

	useEffect(() => {
		setLoading(true);
		// Get Race data from the API
		const fetchEvents = async () => {
			try {
				let events = await getEvents(context.raceID);
				const response = await AsyncStorage.getItem("onlineRaces");
				const raceList = response !== null ? JSON.parse(response) : [];
				const race = raceList.find((race: Race) => race.race_id === context.raceID);

				// Filter events to only show those in the present/future (48-hour grace period)
				events = events.filter(fEvent => new Date(fEvent.start_time) >= new Date(new Date().getTime() - 172800000));

				for (let i = 0; i < events.length; i++) {
					// Create local storage object
					let event: Event = {
						id: 0,
						title: "",
						start_time: "",
						event_id: 0,
						real_start_time: -1,
						finish_times: [],
						checker_bibs: [],
						bib_nums: []
					};

					if (race !== undefined && race.events !== undefined) {
						event = race.events.find((event: Event) => event.event_id === events[i].event_id);
					}
					const realIndex = i + 1;

					let object: Event = {
						id: realIndex,
						title: events[i].name,
						start_time: events[i].start_time,
						event_id: events[i].event_id,
						real_start_time: -1,
						finish_times: [],
						checker_bibs: [],
						bib_nums: [],
					};
					
					// If there is local data don't overwrite it
					if (event !== undefined) {
						object = {
							id: realIndex,
							title: events[i].name,
							start_time: events[i].start_time,
							real_start_time: (event.real_start_time !== null) ? event.real_start_time : -1,
							event_id: events[i].event_id,
							finish_times: (event.finish_times !== null) ? event.finish_times : [],
							checker_bibs: (event.checker_bibs !== null) ? event.checker_bibs : [],
							bib_nums: (event.bib_nums !== null) ? event.bib_nums : [],
						};
					}
					// Don't push an object that already exists in the list
					if (!finalEventList.find(foundObject => foundObject.event_id === object.event_id)) {
						finalEventList.push(object);
						setFinalEventList([...finalEventList]);
					}
				}
				setLoading(false);
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
		};
		fetchEvents();
	}, [context.raceID, finalEventList]);

	// Update local race data
	const firstRun = useRef(true);
	useEffect(() => {
		if (firstRun.current) {
			firstRun.current = false;
			return;
		}
		const updateLocalRace = async () => {
			const response = await AsyncStorage.getItem("onlineRaces");
			const raceList = response !== null ? JSON.parse(response) : [];
			const race = raceList.find((race: Race) => race.race_id === context.raceID);
			race.events = finalEventList;

			await AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));
		};
		updateLocalRace();
	}, [context.raceID, finalEventList]);

	// Rendered item in the Flatlist
	const renderItem = ({ item } : { item: Event }) => {
		const setEventID = context.setEventID;
		const setEventTitle = context.setEventTitle;
		navigationRef.current = navigation;

		return (
			<MemoEventsListItem 
				item={item} 
				setEventID={setEventID}
				setEventTitle={setEventTitle}
				navigationRef={navigationRef}
			/>
		);
	};

	return (
		<View style={globalstyles.container}>
			{loading ? <ActivityIndicator size="large" color={Platform.OS === "android" ? GREEN_COLOR : "808080"} /> : finalEventList.length === 0 ? <Text style={globalstyles.info}>{"Hmm...looks like you don't have any upcoming events for this race yet!"}</Text> : <FlatList
				data={finalEventList}
				renderItem={renderItem}
				keyExtractor={(_item, index) => (index + 1).toString()}
			/>}
		</View>
	);
};

export default EventsListScreen;