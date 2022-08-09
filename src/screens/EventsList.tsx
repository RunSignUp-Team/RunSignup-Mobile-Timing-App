import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { View, FlatList, Alert, ActivityIndicator, Text, Platform, TouchableOpacity, TextInput } from "react-native";
import { BLACK_COLOR, DARK_GREEN_COLOR, globalstyles, GRAY_COLOR, UNIVERSAL_PADDING, WHITE_COLOR } from "../components/styles";
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
import CreateAPIError from "../helpers/CreateAPIError";
import { useIsFocused } from "@react-navigation/native";
import Icon from "../components/IcoMoon";
import { SyncAnimation } from "../components/SyncAnimation";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const EventsListScreen = ({ navigation }: Props): React.ReactElement => {
	const context = useContext(AppContext);

	const [finalEventList, setFinalEventList] = useState<Array<Event>>([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);
	const navigationRef = useRef<ScreenNavigationProp>(navigation);
	const isFocused = useIsFocused();

	useEffect(() => {
		setSearch("");
	}, [isFocused]);

	// Handle log out. Delete local tokens
	const handleLogOut = useCallback(async () => {
		Alert.alert("Log Out?", "Are you sure you want to log out?", [
			{ text: "Cancel" },
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
			let response: string | null = null;
			if (context.appMode === "Online") {
				response = await AsyncStorage.getItem("onlineRaces");
			} 
			if (context.appMode === "Backup") {
				response = await AsyncStorage.getItem("backupRaces");
			}
			if (response) {
				const races = JSON.parse(response) as Array<Race>;
				const race = races.find(foundRace => foundRace.race_id === context.raceID);
				if (race) {
					raceName = race.name;
				}
			}

			navigation.setOptions({
				headerLeft: () => (
					<HeaderBackButton onPress={(): void => { navigation.goBack(); }} labelVisible={false} tintColor={WHITE_COLOR}></HeaderBackButton>
				),
				headerRight: () => (
					<View style={{ flexDirection: "row", width: 75, justifyContent: "space-between", alignItems: "center" }}>
						<SyncAnimation disabled={context.appMode === "Backup"} />
						<TouchableOpacity onPress={handleLogOut} style={globalstyles.headerButtonText}>
							<Icon name={"exit"} size={22} color={WHITE_COLOR}></Icon>
						</TouchableOpacity>
					</View>
				),
				headerTitle: raceName ? raceName : "Events"
			});
		};
		setNavigation();
	}, [context.appMode, context.eventID, context.raceID, handleLogOut, navigation]);

	// Get Race data from the API
	const fetchEvents = useCallback(async (): Promise<void> => {
		try {
			setLoading(true);
			
			// Get events
			let response: string | null = null;
			if (context.appMode === "Online") {
				response = await AsyncStorage.getItem("onlineRaces");
			} else {
				response = await AsyncStorage.getItem("backupRaces");
			}
			const localRaceList: Array<Race> = response !== null ? JSON.parse(response) : [];
			const race = localRaceList.find((race) => race.race_id === context.raceID);

			if (race && race.events) {
				const events = race.events;
				setFinalEventList(events);
			}

			setLoading(false);
		} catch (error) {
			CreateAPIError("Events", error);
			setLoading(false);
		}
	}, [context.appMode, context.raceID]);

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
				raceID={context.raceID}
				appMode={context.appMode}
				setEventID={setEventID}
				setEventTitle={setEventTitle}
				navigationRef={navigationRef}
			/>
		);
	};

	const data = finalEventList.filter(event => event.name.toLowerCase().includes(search.toLowerCase().trim()));

	return (
		<>
			{/* Search Bar */}
			{!loading && finalEventList.length > 0 ?
				<View style={{ backgroundColor: DARK_GREEN_COLOR, flexDirection: "row" }}>
					<TextInput
						style={[globalstyles.input, { borderWidth: 0, marginHorizontal: UNIVERSAL_PADDING }]}
						onChangeText={setSearch}
						value={search}
						placeholder={"Search by Event Name"}
						placeholderTextColor={GRAY_COLOR}
					/>
				</View>
				: null
			}

			{/* Main View */}
			<View style={globalstyles.container}>
				{loading && <ActivityIndicator size="large" color={Platform.OS === "android" ? BLACK_COLOR : GRAY_COLOR} style={{ marginTop: 20 }} />}

				{!loading && finalEventList.length < 1 && <Text style={globalstyles.info}>{"No events found for this race. Please confirm that you have set up the race correctly at RunSignup."}</Text>}

				{!loading && finalEventList.length > 0 && data.length < 1 ?
					<Text style={globalstyles.info}>{"No events found with that name. Please try again."}</Text>
					: null
				}

				{!loading &&
					<FlatList
						showsVerticalScrollIndicator={true}
						scrollIndicatorInsets={{ right: -2 }}
						indicatorStyle={"black"}
						data={data}
						renderItem={renderItem}
						keyExtractor={(_item, index): string => (index + 1).toString()}
					/>
				}
			</View>
		</>
	);
};

export default EventsListScreen;