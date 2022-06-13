import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { View, FlatList, Alert, Text, ActivityIndicator, Platform, BackHandler, TouchableOpacity } from "react-native";
import { globalstyles, GRAY_COLOR, GREEN_COLOR } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { getRaces } from "../helpers/AxiosCalls";
import { MemoRaceListItem } from "../components/RaceListRenderItem";
import { HeaderBackButton } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import { deleteTokenInfo } from "../helpers/oAuth2Helper";
import Logger from "../helpers/Logger";
import { Race } from "../models/Race";
import { Event } from "../models/Event";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const RaceListScreen = ({ navigation }: Props): React.ReactElement => {
	const context = useContext(AppContext);

	const [finalRaceList, setFinalRaceList] = useState<Array<Race>>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const navigationRef = useRef(navigation);

	// Log out with alert
	const goToHomeScreen = useCallback(() => {
		navigation.navigate("Login");
	}, [navigation]);

	// Handle log out. Delete local tokens
	const handleLogOut = useCallback(() => {
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
						Logger("Could Not Log Out (Races)", error, true);
					}
				}
			},
		]);
	}, [navigation]);

	useFocusEffect(
		useCallback(() => {
			const onBackPress = (): boolean => {
				goToHomeScreen();
				return true;
			};

			BackHandler.addEventListener("hardwareBackPress", onBackPress);

			return () =>
				BackHandler.removeEventListener("hardwareBackPress", onBackPress);
		}, [goToHomeScreen]),
	);

	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<HeaderBackButton onPress={goToHomeScreen} labelVisible={false} tintColor="white"></HeaderBackButton>
			),
			headerRight: () => (
				<TouchableOpacity onPress={handleLogOut}>
					<Text style={globalstyles.headerButtonText}>Log Out</Text>
				</TouchableOpacity>
			)
		});
	}, [goToHomeScreen, handleLogOut, navigation]);

	// Get Race List data from API
	const fetchRaces = async (reload: boolean): Promise<void> => {
		try {
			if (reload) {
				setRefreshing(true);
			} else {
				setLoading(true);
			}
			
			const races = await getRaces();
			const response = await AsyncStorage.getItem("onlineRaces");
			const raceList: Array<Race> = response !== null ? JSON.parse(response) : [];

			for (let i = 0; i < races.length; i++) {
				const race = races[i];
				const eventList: Array<Event> = [];
				// Create local storage raceObject
				let raceListRace: Race | undefined;

				if (raceList !== null && raceList.length > 0) {
					raceListRace = raceList.find((foundRace) => foundRace.race_id === race.race.race_id);
				}

				// Convert RSUEvents to Events
				for (let i = 0; i < race.race.events.length; i++) {
					const event = race.race.events[i];
					eventList.push({
						name: event.name,
						start_time: event.start_time,
						event_id: event.event_id,
						real_start_time: -1,
						finish_times: [],
						checker_bibs: [],
						bib_nums: [],
					});
				}

				// Create race raceObject
				let raceObject: Race = {
					name: race.race.name,
					next_date: race.race.next_date,
					race_id: race.race.race_id,
					events: eventList
				};

				// If there is local data don't overwrite it
				if (raceListRace && raceListRace.events) {
					raceObject = {
						name: race.race.name,
						next_date: race.race.next_date,
						race_id: race.race.race_id,
						events: raceListRace.events
					};
				}

				// Don't push an raceObject that already exists in the list
				setFinalRaceList(finalRaceList => {
					if (!finalRaceList.find(foundObject => foundObject.race_id === raceObject.race_id)) {
						finalRaceList.push(raceObject);
						AsyncStorage.setItem("onlineRaces", JSON.stringify(finalRaceList));
					}
					return [...finalRaceList];
				});
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
					Logger("Unknown Error (Races)", error, true);
				}
			}
			
			if (reload) {
				setRefreshing(false);
			} else {
				setLoading(false);
			}
		}
	};

	const firstRun = useRef(true);
	useEffect(() => {
		if (firstRun.current) {
			firstRun.current = false;
			fetchRaces(false);
		}
	}, [context.eventID, context.eventTitle, context.raceID]);

	// Rendered item in the Flatlist
	const renderItem = ({ item, index }: { item: Race, index: number }): React.ReactElement => {
		const setRaceID = context.setRaceID;
		navigationRef.current = navigation;

		return (
			<MemoRaceListItem
				index={index}
				item={item}
				setRaceID={setRaceID}
				navigationRef={navigationRef}
			/>
		);
	};

	return (
		<View style={globalstyles.container}>
			{loading
				?
				<ActivityIndicator size="large" color={Platform.OS === "android" ? GREEN_COLOR : GRAY_COLOR} style={{ marginTop: 20 }} /> : finalRaceList.length < 1 ? <Text style={globalstyles.info}>{"Hmm...looks like you don't have any upcoming races yet!"}</Text>
					:
					<FlatList
						showsVerticalScrollIndicator={false}
						data={finalRaceList}
						onRefresh={(): void => { fetchRaces(true); }}
						refreshing={refreshing}
						renderItem={renderItem}
						keyExtractor={(_item, index): string => (index + 1).toString()} />}
		</View>
	);
};

export default RaceListScreen;