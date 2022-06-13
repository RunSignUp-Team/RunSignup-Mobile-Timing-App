import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { View, FlatList, Alert, ActivityIndicator, Text, Platform, TouchableOpacity } from "react-native";
import { globalstyles, GRAY_COLOR, GREEN_COLOR } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
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
	const navigationRef = useRef<ScreenNavigationProp>(navigation);

	// Handle log out. Delete local tokens
	const handleLogOut = useCallback(async () => {
		Alert.alert("Log Out?", "Are you sure you want to log out?", [
			{
				text: "Cancel",
				style: "default",
				onPress: (): void => { return; }
			},
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
		]);
	}, [navigation]);

	// Set back button
	useEffect(() => {
		const setNavigation = async (): Promise<void> => {
			let raceName = "";
			const response = await AsyncStorage.getItem("onlineRaces");
			if (response) {
				const races = JSON.parse(response) as Array<Race>;
				const race = races.find(foundRace => foundRace.race_id === context.raceID);
				if (race) {
					raceName = race.name;
				}
			}

			navigation.setOptions({
				headerLeft: () => (
					<HeaderBackButton onPress={(): void => { navigation.pop(); }} labelVisible={false} tintColor="white"></HeaderBackButton>
				),
				headerRight: () => (
					<TouchableOpacity onPress={handleLogOut}>
						<Text style={globalstyles.headerButtonText}>Log Out</Text>
					</TouchableOpacity>
				),
				headerTitle: raceName ? raceName : "Events"
			});
		};
		setNavigation();
	}, [context.eventID, context.raceID, handleLogOut, navigation]);

	// Get Race data from the API
	const fetchEvents = useCallback(async (): Promise<void> => {
		try {
			setLoading(true);

			// Get events
			const response = await AsyncStorage.getItem("onlineRaces");
			const localRaceList: Array<Race> = response !== null ? JSON.parse(response) : [];
			const race = localRaceList.find((race) => race.race_id === context.raceID);

			if (race && race.events) {
				const events = race.events;
				setFinalEventList(events);
			}

			setLoading(false);
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === undefined || error.message === "Network Error") {
					Alert.alert("Connection Error", "No response received from the server. Please check your internet connection and try again.");
				} else {
					// Something else
					Logger("Unknown Error (Events)", error, true);
				}
			}
			
			setLoading(false);
		}
	}, [context.raceID]);

	const firstRun = useRef(true);
	useEffect(() => {
		if (firstRun.current) {
			firstRun.current = false;
			fetchEvents();
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
			{loading
				?
				<ActivityIndicator size="large" color={Platform.OS === "android" ? GREEN_COLOR : GRAY_COLOR} style={{ marginTop: 20 }} />
				: finalEventList.length < 1
					?
					<Text style={globalstyles.info}>{"Hmm...looks like you don't have any upcoming events for this race yet!"}</Text>
					: <FlatList
						showsVerticalScrollIndicator={false}
						data={finalEventList}
						renderItem={renderItem}
						keyExtractor={(_item, index): string => (index + 1).toString()}
					/>}
		</View>
	);
};

export default EventsListScreen;