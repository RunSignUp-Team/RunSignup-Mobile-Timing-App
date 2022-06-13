import React, { useCallback, useContext, useEffect, useState } from "react";
import { View, TouchableOpacity, Text, Alert } from "react-native";
import { globalstyles } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { getFinishTimes } from "../helpers/AxiosCalls";
import { HeaderBackButton } from "@react-navigation/elements";
import { OfflineEvent } from "./OfflineEventsScreen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import { deleteTokenInfo } from "../helpers/oAuth2Helper";
import MainButton from "../components/MainButton";
import Logger from "../helpers/Logger";
import GetLocalRaceEvent from "../helpers/GetLocalRaceEvent";
import { useFocusEffect } from "@react-navigation/native";
import GetLocalOfflineEvent from "../helpers/GetLocalOfflineEvent";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const FinishLineModeMsg = "You may not re-enter Finish Line Mode on the same device, or enter Finish Line Mode data after recording Chute Mode data.\nIf you have completed all data entry, see Results to view or edit results.";
const ChuteModeMsg = "You may not re-enter Chute Mode data on the same device.\nIf you have completed all data entry, see Results to view or edit results.";

const ModeScreen = ({ navigation }: Props): React.ReactElement => {
	const context = useContext(AppContext);

	const [finishLineDone, setFinishLineDone] = useState(false);
	const [chuteDone, setChuteDone] = useState(false);

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
						Logger("Could Not Log Out (Modes)", error, true);
					}
				}
			},

		]);
	}, [navigation]);

	// Get button colors
	const getButtonColors = useCallback(async (): Promise<void> => {
		let flDone = null;
		let cDone = null;
		if (context.online) {
			flDone = await AsyncStorage.getItem(`finishLineDone:${context.raceID}:${context.eventID}`);
			cDone = await AsyncStorage.getItem(`chuteDone:${context.raceID}:${context.eventID}`);
		} else {
			flDone = await AsyncStorage.getItem(`finishLineDone:${context.time}`);
			cDone = await AsyncStorage.getItem(`chuteDone:${context.time}`);
		}
		setFinishLineDone(flDone === "true" ? true : false);
		setChuteDone(cDone === "true" ? true : false);
	}, [context.eventID, context.online, context.raceID, context.time]);

	// Get button colors on focus
	useFocusEffect(
		useCallback(() => {
			getButtonColors();
		}, [getButtonColors]),
	);

	// Set back button
	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<HeaderBackButton onPress={(): void => { navigation.pop(); }} labelVisible={false} tintColor="white"></HeaderBackButton>
			),
			headerRight: () => (
				context.online ?
					<TouchableOpacity onPress={handleLogOut}>
						<Text style={globalstyles.headerButtonText}>Log Out</Text>
					</TouchableOpacity> :
					null
			)
		});
	}, [context.online, handleLogOut, navigation]);

	// Finish Line Mode tapped
	const finishLineTapped = async (): Promise<void> => {
		if (finishLineDone) {
			Alert.alert(
				"Cannot Re-Enter Data",
				FinishLineModeMsg
			);
		} else {
			// Check if Finish Times have already been recorded for this event
			try {
				const finishTimes = await getFinishTimes(context.raceID, context.eventID);
				if (finishTimes && finishTimes.length > 0) {
					Alert.alert(
						"Already Entered",
						"Runsignup already has a record of finish times for this event.\nSee Results for more details."
					);
				} else {
					navigation.navigate("FinishLineMode");
				}
			} catch (err) {
				Logger("Finish Times Check", err, false);
				navigation.navigate("FinishLineMode");
			}
		}
	};

	// Finish Line Mode tapped (offline)
	const finishLineTappedOffline = (): void => {
		if (finishLineDone) {
			Alert.alert(
				"Cannot Re-Enter Data",
				FinishLineModeMsg
			);
		} else {
			navigation.navigate("FinishLineMode");
		}
	};

	// Chute Mode tapped
	const chuteTapped = (): void => {
		if (chuteDone) {
			Alert.alert(
				"Cannot Re-Enter Data",
				ChuteModeMsg
			);
		} else {
			navigation.navigate("ChuteMode");
		}
	};

	// Chute Mode tapped (offline)
	const chuteTappedOffline = (): void => {
		if (chuteDone) {
			Alert.alert(
				"Cannot Re-Enter Data", 
				ChuteModeMsg
			);
		} else {
			navigation.navigate("ChuteMode");

		}
	};

	// Verification Mode tapped
	const verificationTapped = async (): Promise<void> => {
		try {
			const [raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);

			// Check for local edits
			if (raceList[raceIndex].events[eventIndex].finish_times.length > 0 || raceList[raceIndex].events[eventIndex].bib_nums.length > 0) {
				Alert.alert(
					"Local Data Not Uploaded", 
					"There is local data on your device that has not been saved & uploaded to RunSignup. Please save that data and try again."
				);
			} else {
				const finishTimes = await getFinishTimes(context.raceID, context.eventID);
				if ((finishTimes !== null && finishTimes.length > 0)) {
					navigation.navigate("VerificationMode");
				} else {
					Alert.alert(
						"No Data Found", 
						"Insufficient data found on RunSignup. Please enter finish times / bibs and try again."
					);
				}
			}
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === undefined || error.message === "Network Error") {
					Alert.alert("Connection Error", "No response received from the server. Please check your internet connection and try again.");
				} else {
					// Something else
					Logger("Unknown Error (Modes)", error, true);
				}
			}
		}
	};

	// Verification Mode tapped (offline)
	const verificationTappedOffline = async (): Promise<void> => {
		try {
			const [eventList, eventIndex] = await GetLocalOfflineEvent(context.time);

			if (eventList[eventIndex].finish_times.length > 0 || eventList[eventIndex].bib_nums.length > 0) {
				Alert.alert(
					"Local Data Not Saved", 
					"There is local data on your device that has not been saved. Please save that data and try again."
				);
			} else {
				// Only open if Finish Line data is saved
				if (finishLineDone) {
					navigation.navigate("VerificationMode");
				} else {
					Alert.alert(
						"No Data Entered",
						"Insufficient data found. Please enter finish times / bibs and try again."
					);
				}
			}
		} catch (error) {
			Logger("Unknown Error (Offline Modes)", error, true);
		}
	};

	// Delete offline event
	const deleteEvent = (): void => {
		Alert.alert(
			"Delete Event",
			"Are you sure you want to delete this event? You will lose all local data. This action cannot be reversed!",
			[
				{ text: "Cancel", onPress: (): void => { return; } },
				{
					text: "Delete",
					onPress: async (): Promise<void> => {
						const response = await AsyncStorage.getItem("offlineEvents");
						let eventsList = response !== null ? JSON.parse(response) : [];
						eventsList = eventsList.filter((event: OfflineEvent) => event.time !== context.time);

						await AsyncStorage.setItem("offlineEvents", JSON.stringify(eventsList));
						navigation.navigate("OfflineEventsList");
					},
					style: "destructive",
				},
			]
		);
	};

	// Assign offline event to online event
	const assignEvent = async (): Promise<void> => {
		const request = await AsyncStorage.getItem("offlineEvents");
		if (request) {
			const requestParse = JSON.parse(request);
			if (requestParse.length > 0) {
				navigation.navigate("OfflineEventsList");
			} else {
				Alert.alert("No Offline Events", "You have not created any Offline Events.");
			}
		} else {
			Alert.alert("No Offline Events", "You have not created any Offline Events.");
		}
	};

	return (
		<View style={globalstyles.container}>
			<View style={{ justifyContent: "space-around", alignItems: "center" }}>
				<MainButton color={finishLineDone ? "Disabled" : "Green"} onPress={context.online === false ? finishLineTappedOffline : finishLineTapped} text={"Finish Line Mode"} />
				<MainButton color={chuteDone ? "Disabled" : "Green"} onPress={context.online === false ? chuteTappedOffline : chuteTapped} text={"Chute Mode"} />
				<MainButton color={!finishLineDone ? "Disabled" : "Green"} onPress={context.online === false ? verificationTappedOffline : verificationTapped} text={"Results"} />
				<MainButton onPress={context.online ? assignEvent : deleteEvent} text={context.online ? "Assign Offline Event" : "Delete Offline Event"} color={context.online ? "Gray" : "Red"} />
			</View>
		</View>
	);
};

export default ModeScreen;