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

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const RaceListScreen = ({ navigation }: Props): React.ReactElement => {
	const context = useContext(AppContext);

	const [finalRaceList, setFinalRaceList] = useState<Array<Race>>([]);
	const [loading, setLoading] = useState(false);
	const navigationRef = useRef(navigation);

	// Log out with alert
	const goToHomeScreen = useCallback(() => {
		navigation.navigate("Login");
	}, [navigation]);

	// Handle log out. Delete local tokens
	const handleLogOut = useCallback(() => {
		Alert.alert("Log Out?", "Are you sure you want to log out?", [
			{
				text: "Log Out",
				style: "destructive",
				onPress: async (): Promise<void> => {
					try {
						await deleteTokenInfo();
						navigation.navigate("Login");
					} catch (error) {
						Logger.log(error);
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

	useEffect(() => {
		setLoading(true);
		// Get Race List data from API
		const fetchRaces = async (): Promise<void> => {
			try {
				let races = await getRaces();
				const response = await AsyncStorage.getItem("onlineRaces");
				const raceList = response !== null ? JSON.parse(response) : [];

				// Filter races to only show those in the present/future (48-hour grace period)
				races = races.filter(fRace => new Date(fRace.race.next_date) >= new Date(new Date().getTime() - 172800000));

				for (let i = 0; i < races.length; i++) {
					// Create local storage object
					let raceListRace: Race = {
						id: 0,
						title: "",
						next_date: "",
						race_id: 0,
						events: []
					};

					if (raceList !== null && raceList.length > 0) {
						raceListRace = raceList.find((race: Race) => race.race_id === races[i].race.race_id);
					}
					const realIndex = i + 1;

					let object: Race = {
						id: realIndex,
						title: races[i].race.name,
						next_date: races[i].race.next_date,
						race_id: races[i].race.race_id,
						events: []
					};

					// If there is local data don't overwrite it
					if (raceListRace !== undefined && raceListRace.events !== undefined && raceListRace.events !== null) {
						object = {
							id: realIndex,
							title: races[i].race.name,
							next_date: races[i].race.next_date,
							race_id: races[i].race.race_id,
							events: raceListRace.events
						};
					}

					if (!finalRaceList.find(foundObject => foundObject.race_id === object.race_id)) {
						finalRaceList.push(object);
						setFinalRaceList([...finalRaceList]);
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
						Logger.log(error);
					}
				}
				setLoading(false);
			}
		};

		fetchRaces();
	}, [finalRaceList, setFinalRaceList]);

	// Update local race data
	const firstRun = useRef(true);
	useEffect(() => {
		if (firstRun.current) {
			firstRun.current = false;
			return;
		}
		const updateLocalRace = async (): Promise<void> => {
			await AsyncStorage.setItem("onlineRaces", JSON.stringify(finalRaceList));
		};
		updateLocalRace();
	}, [finalRaceList]);


	// Rendered item in the Flatlist
	const renderItem = ({ item }: { item: Race }): React.ReactElement => {
		const setRaceID = context.setRaceID;
		navigationRef.current = navigation;

		return (
			<MemoRaceListItem
				item={item}
				setRaceID={setRaceID}
				navigationRef={navigationRef}
			/>
		);
	};

	return (
		<View style={globalstyles.container}>
			{loading ? <ActivityIndicator size="large" color={Platform.OS === "android" ? GREEN_COLOR : GRAY_COLOR} /> : finalRaceList.length < 1 ? <Text style={globalstyles.info}>{"Hmm...looks like you don't have any upcoming races yet!"}</Text> : <FlatList
				data={finalRaceList}
				renderItem={renderItem}
				keyExtractor={(_item, index): string => (index + 1).toString()} />}
		</View>
	);
};

export default RaceListScreen;