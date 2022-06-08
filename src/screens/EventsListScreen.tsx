import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { View, FlatList, Alert, ActivityIndicator, Text, Platform, TouchableOpacity } from "react-native";
import { globalstyles, GRAY_COLOR, GREEN_COLOR } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { getEvents } from "../helpers/AxiosCalls";
import { MemoEventsListItem } from "../components/EventsListRenderItem";
import { HeaderBackButton } from "@react-navigation/elements";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import { deleteTokenInfo } from "../helpers/oAuth2Helper";
import Logger from "../helpers/Logger";
import { Event } from "../models/Event";
import { Race } from "../models/Race";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const EventsListScreen = ({ navigation }: Props): React.ReactElement => {
	const context = useContext(AppContext);

	const [finalEventList, setFinalEventList] = useState<Array<Event>>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const navigationRef = useRef<ScreenNavigationProp>(navigation);

	// Handle log out. Delete local tokens
	const handleLogOut = useCallback(async () => {
		Alert.alert("Log Out?", "Are you sure you want to log out?", [
			{
				text: "Log Out",
				style: "destructive",
				onPress: async (): Promise<void> => {
					try {
						await deleteTokenInfo();
						navigation.navigate("Login");
					} catch (error) {
						Logger("Could Not Log Out (Events)", error, true);
					}
				}
			},
			{
				text: "Cancel",
				style: "default",
				onPress: (): void => { return; }
			}
		]);
	}, [navigation]);

	// Set back button
	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<HeaderBackButton onPress={(): void => { navigation.pop(); }} labelVisible={false} tintColor="white"></HeaderBackButton>
			),
			headerRight: () => (
				<TouchableOpacity onPress={handleLogOut}>
					<Text style={globalstyles.headerButtonText}>Log Out</Text>
				</TouchableOpacity>
			)
		});
	}, [handleLogOut, navigation]);

	// Get Race data from the API
	const fetchEvents = useCallback(async (reload: boolean): Promise<void> => {
		try {
			if (reload) {
				setRefreshing(true);
			} else {
				setLoading(true);
			}

			const events = await getEvents(context.raceID);
			const response = await AsyncStorage.getItem("onlineRaces");
			const raceList = response !== null ? JSON.parse(response) : [];
			const race: Race = raceList.find((race: Race) => race.race_id === context.raceID);

			if (race && "events" in race) {
				for (let i = 0; i < events.length; i++) {
					// Create local storage object	
					const event = race.events.find((event: Event) => event.event_id === events[i].event_id);

					let object: Event = {
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
					setFinalEventList(finalEventList => {
						if (!finalEventList.find(foundObject => foundObject.event_id === object.event_id)) {
							finalEventList.push(object);
							race.events = finalEventList;
							AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));
						}
						return finalEventList;
					});
				}
			}

			if (reload) {
				setRefreshing(false);
			} else {
				setLoading(false);
			}
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === undefined || error.message === "Network Error") {
					Alert.alert("Connection Error", "No response received from the server. Please check your internet connection and try again.");
				} else {
					// Something else
					Logger("Unknown Error (Events)", error, true);
				}
			}
			
			if (reload) {
				setRefreshing(false);
			} else {
				setLoading(false);
			}
		}
	}, [context.raceID]);

	const firstRun = useRef(true);
	useEffect(() => {
		if (firstRun.current) {
			firstRun.current = false;
			fetchEvents(false);
		}
	}, [fetchEvents]);

	// Rendered item in the Flatlist
	const renderItem = ({ item, index }: { item: Event, index: number }): React.ReactElement => {
		const setEventID = context.setEventID;
		const setEventTitle = context.setEventTitle;
		navigationRef.current = navigation;

		return (
			<MemoEventsListItem
				index={index}
				item={item}
				setEventID={setEventID}
				setEventTitle={setEventTitle}
				navigationRef={navigationRef}
			/>
		);
	};

	return (
		<View style={globalstyles.container}>
			{loading ? <ActivityIndicator size="large" color={Platform.OS === "android" ? GREEN_COLOR : GRAY_COLOR} style={{ marginTop: 20 }} /> : finalEventList.length < 1 ? <Text style={globalstyles.info}>{"Hmm...looks like you don't have any upcoming events for this race yet!"}</Text> : <FlatList
				data={finalEventList}
				onRefresh={(): void => {fetchEvents(true);}}
				refreshing={refreshing}
				renderItem={renderItem}
				keyExtractor={(_item, index): string => (index + 1).toString()}
			/>}
		</View>
	);
};

export default EventsListScreen;