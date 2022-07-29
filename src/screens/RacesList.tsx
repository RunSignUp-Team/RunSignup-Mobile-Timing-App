import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { View, FlatList, Alert, Text, ActivityIndicator, Platform, BackHandler, TouchableOpacity, TextInput } from "react-native";
import { BLACK_COLOR, DARK_GREEN_COLOR, globalstyles, GRAY_COLOR, UNIVERSAL_PADDING, WHITE_COLOR } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { getRaces } from "../helpers/APICalls";
import { MemoRacesListItem } from "../components/RacesListRenderItem";
import { HeaderBackButton } from "@react-navigation/elements";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import { deleteTokenInfo } from "../helpers/oAuth2Helper";
import Logger from "../helpers/Logger";
import { Race } from "../models/Race";
import { Event } from "../models/Event";
import CreateAPIError from "../helpers/CreateAPIError";
import Icon from "../components/IcoMoon";
import ToggleSync from "../helpers/ToggleSync";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const RaceListScreen = ({ navigation }: Props): React.ReactElement => {
	const context = useContext(AppContext);

	const [finalRaceList, setFinalRaceList] = useState<Array<Race>>([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const navigationRef = useRef(navigation);
	const isFocused = useIsFocused();
	const [syncEnabled, setSyncEnabled] = useState(true);

	useFocusEffect(useCallback(() => {
		const getSyncFromStorage = async (): Promise<void> => {
			// Check if Sync Enabled
			const sEnabled = !(await AsyncStorage.getItem("syncEnabled") === "false");
			setSyncEnabled(sEnabled);
		};
		getSyncFromStorage();
	}, []));

	useEffect(() => {
		setSearch("");
	}, [isFocused]);

	// Log out with alert
	const goToHomeScreen = useCallback(() => {
		navigation.navigate("Login");
	}, [navigation]);

	// Handle log out. Delete local tokens
	const handleLogOut = useCallback(() => {
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
				<HeaderBackButton onPress={goToHomeScreen} labelVisible={false} tintColor={WHITE_COLOR}></HeaderBackButton>
			),
			headerRight: () => (
				<View style={{ flexDirection: "row", width: 75, justifyContent: "space-between" }}>
					<TouchableOpacity onPress={(): void => { ToggleSync(syncEnabled, setSyncEnabled); }} style={globalstyles.headerButtonText}>
						<Icon name={syncEnabled ? "blocked" : "loop3"} size={22} color={WHITE_COLOR}></Icon>
					</TouchableOpacity>
					<TouchableOpacity onPress={handleLogOut} style={globalstyles.headerButtonText}>
						<Icon name={"exit"} size={22} color={WHITE_COLOR}></Icon>
					</TouchableOpacity>
				</View>
			)
		});
	}, [goToHomeScreen, handleLogOut, navigation, syncEnabled]);

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
			const localRaceList: Array<Race> = response !== null ? JSON.parse(response) : [];
			const combinedRaceList: Array<Race> = [];

			for (let i = 0; i < races.length; i++) {
				const race = races[i].race;
				const localRace = localRaceList.find(foundRace => foundRace.race_id === race.race_id);
				let raceObject: Race;
				// We use the event object to store the Finish Times, Checker Bibs, and Bib Numbers for the event,
				// So we can't just refresh the race and overrride all our local data;
				// Instead, we check to see if we already have the race stored locally,
				// And only update unimportant data like name and start time
				if (localRace) {
					raceObject = {
						name: race.name,
						next_date: race.next_date,
						race_id: race.race_id,
						events: localRace.events.map(mapEvent => {
							const updatedEvent = race.events.find(foundEvent => foundEvent.event_id === mapEvent.event_id);
							const eventObject: Event = {
								name: mapEvent.name,
								start_time: mapEvent.start_time,
								event_id: mapEvent.event_id,
								real_start_time: mapEvent.real_start_time,
								finish_times: mapEvent.finish_times,
								checker_bibs: mapEvent.checker_bibs,
								bib_nums: mapEvent.bib_nums
							};

							if (updatedEvent) {
								eventObject.name = updatedEvent.name;
								eventObject.start_time = updatedEvent.start_time;
							}

							return eventObject;
						})
					};
					// Race that does not exist locally yet
				} else {
					raceObject = {
						name: race.name,
						next_date: race.next_date,
						race_id: race.race_id,
						events: race.events.map(mapEvent => {
							const eventObject: Event = {
								name: mapEvent.name,
								start_time: mapEvent.start_time,
								event_id: mapEvent.event_id,
								real_start_time: -1,
								finish_times: [],
								checker_bibs: [],
								bib_nums: []
							};

							return eventObject;
						})
					};
				}
				combinedRaceList.push(raceObject);
			}

			// Update race list and local storage
			setFinalRaceList([...combinedRaceList]);
			AsyncStorage.setItem("onlineRaces", JSON.stringify(combinedRaceList));

			if (reload) {
				setRefreshing(false);
			} else {
				setLoading(false);
			}
		} catch (error) {
			CreateAPIError("Races", error);

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
			<MemoRacesListItem
				index={index}
				item={item}
				setRaceID={setRaceID}
				navigationRef={navigationRef}
			/>
		);
	};

	const data = finalRaceList.filter(race => race.name.toLowerCase().includes(search.toLowerCase().trim()));

	return (
		<>
			{/* Search Bar */}
			{!loading && finalRaceList.length > 0 ?
				<View style={{ backgroundColor: DARK_GREEN_COLOR, flexDirection: "row" }}>
					<TextInput
						style={[globalstyles.input, { borderWidth: 0, marginHorizontal: UNIVERSAL_PADDING }]}
						onChangeText={setSearch}
						value={search}
						placeholder={"Search by Race Name"}
						placeholderTextColor={GRAY_COLOR}
					/>
				</View>
				: null
			}

			{/* Main View */}
			<View style={globalstyles.container}>
				{loading && <ActivityIndicator size="large" color={Platform.OS === "android" ? BLACK_COLOR : GRAY_COLOR} style={{ marginTop: 20 }} />}

				{!loading && finalRaceList.length < 1 && <Text style={globalstyles.info}>{"No upcoming races found for this account. Please confirm that you have set up any races correctly at RunSignup."}</Text>}

				{!loading && finalRaceList.length > 0 && data.length < 1 ?
					<Text style={globalstyles.info}>{"No races found with that name. Please try again."}</Text>
					: null
				}

				{!loading &&
					<FlatList
						showsVerticalScrollIndicator={false}
						data={data}
						onRefresh={(): void => { fetchRaces(true); }}
						refreshing={refreshing}
						renderItem={renderItem}
						keyExtractor={(_item, index): string => (index + 1).toString()}
					/>
				}
			</View>
		</>
	);
};

export default RaceListScreen;