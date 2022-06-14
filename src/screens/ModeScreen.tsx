import React, { useCallback, useContext, useEffect, useState } from "react";
import { View, TouchableOpacity, Text, Alert, ActivityIndicator, Platform } from "react-native";
import { globalstyles, GRAY_COLOR, GREEN_COLOR, WHITE_COLOR } from "../components/styles";
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
import { Race } from "../models/Race";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const ModeScreen = ({ navigation }: Props): React.ReactElement => {
	const context = useContext(AppContext);

	const FinishLineModeMsg = `You may not enter Finish Line Mode data${context.online ? ": \n1)" : ""} multiple times on the same device${context.online ? ", 2) after recording Chute Mode data, 3) or with unsaved Chute Mode data stored on your device." : "."}\nIf you have completed all data entry, see "Results" to view or edit results.`;
	const ChuteModeMsg = `You may not enter Chute Mode data: \n1) multiple times on the same device or 2) ${context.online ? "with unsaved Finish Line Mode data stored on your device." : "before saving Finish Line Mode data."}\nIf you have completed all data entry, see "Results" to view or edit results.`;

	const [finishLineDone, setFinishLineDone] = useState(false);
	const [finishLineProgress, setFinishLineProgress] = useState(false);
	const [chuteDone, setChuteDone] = useState(false);
	const [chuteProgress, setChuteProgress] = useState(false);
	const [localEdits, setLocalEdits] = useState(true);
	const [insuffData, setInsuffData] = useState(false);

	const [hasButtonColors, setHasButtonColors] = useState(false);

	const noFinishLine = finishLineDone || chuteDone || chuteProgress || (context.online && !insuffData);
	const noChute = chuteDone || finishLineProgress || (!context.online && !finishLineDone);
	const noResults = localEdits || insuffData || (!context.online && !finishLineDone);

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
		let flProgress = false;
		let cProgress = false;
		let lEdits = false;
		let iData = false;

		if (context.online) {
			// Finish Line Done
			flDone = await AsyncStorage.getItem(`finishLineDone:${context.raceID}:${context.eventID}`);
			// Chute Done
			cDone = await AsyncStorage.getItem(`chuteDone:${context.raceID}:${context.eventID}`);

			// Finish Line In Progress
			const raceList = await AsyncStorage.getItem("onlineRaces");
			if (raceList) {
				const races = JSON.parse(raceList) as Array<Race>;
				const race = races.find(race => race.race_id === context.raceID);
				const event = race?.events.find(event => event.event_id === context.eventID);
				if (!(flDone === "true") && event && event.finish_times && event.finish_times.length > 0) {
					flProgress = true;
				}
				if (!(cDone === "true") && event && event.bib_nums && event.bib_nums.length > 0) {
					cProgress = true;
				}
			}

			// Results Disabled
			try {
				const finishTimes = await getFinishTimes(context.raceID, context.eventID);
				if (finishTimes === null || finishTimes.length < 1) {
					iData = true;
				}
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === undefined || error.message === "Network Error") {
						// Do nothing
					} else {
						// Something else
						Logger("Unknown Error (Results Disabled)", error, true);
					}
				}
			}

			const [localRaceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);
			if (!finishLineDone && localRaceList[raceIndex].events[eventIndex].finish_times.length > 0) {
				lEdits = true;
			}
		} else {
			// Finish Line Done
			flDone = await AsyncStorage.getItem(`finishLineDone:${context.time}`);
			// Chute Done
			cDone = await AsyncStorage.getItem(`chuteDone:${context.time}`);

			// Finish Line In Progress
			const eventList = await AsyncStorage.getItem("offlineEvents");
			if (eventList) {
				const events = JSON.parse(eventList) as Array<OfflineEvent>;
				const event = events.find(foundEvent => foundEvent.time === context.time);
				if (!(flDone === "true") && event?.finish_times && event?.finish_times.length > 0) {
					flProgress = true;
				}
				if (!(cDone === "true") && event?.bib_nums && event.bib_nums.length > 0) {
					cProgress = true;
				}
			}

			// Results Disabled
			const [localEventList, eventIndex] = await GetLocalOfflineEvent(context.time);
			if (!finishLineDone && localEventList[eventIndex].finish_times.length > 0) {
				lEdits = true;
			}
		}

		setFinishLineDone(flDone === "true" ? true : false);
		setFinishLineProgress(flProgress);
		setChuteProgress(cProgress);
		setChuteDone(cDone === "true" ? true : false);
		setLocalEdits(lEdits);
		setInsuffData(iData);

		setHasButtonColors(true);
	}, [context.eventID, context.online, context.raceID, context.time, finishLineDone]);

	// Get button colors on focus
	useFocusEffect(
		useCallback(() => {
			getButtonColors();
		}, [getButtonColors]),
	);

	// Set back button
	useEffect(() => {
		let eventName = "";
		const setNavigation = async (): Promise<void> => {
			if (context.online) {
				const [raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);
				if (raceList && raceList.length > 0 && raceList[raceIndex]?.events[eventIndex]?.name) {
					eventName = raceList[raceIndex].events[eventIndex].name;
				}
			} else {
				const [eventList, eventIndex] = await GetLocalOfflineEvent(context.time);
				if (eventList && eventList.length > 0 && eventList[eventIndex]?.name) {
					eventName = eventList[eventIndex].name;
				}
			}
	
	
			navigation.setOptions({
				headerLeft: () => (
					<HeaderBackButton onPress={(): void => { navigation.pop(); }} labelVisible={false} tintColor={WHITE_COLOR}></HeaderBackButton>
				),
				headerRight: () => (
					context.online ?
						<TouchableOpacity onPress={handleLogOut}>
							<Text style={globalstyles.headerButtonText}>Log Out</Text>
						</TouchableOpacity> :
						null
				),
				headerTitle: eventName ? eventName : "Modes"
			});
		};
		setNavigation();
	}, [context.eventID, context.online, context.raceID, context.time, handleLogOut, navigation]);

	// Finish Line Mode tapped
	const finishLineTapped = async (): Promise<void> => {
		if (noFinishLine) {
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
		if (noFinishLine) {
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
		if (noChute) {
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
		if (noChute) {
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
			// Check for local edits
			if (localEdits) {
				Alert.alert(
					"Local Data Not Uploaded", 
					"There is local data on your device that has not been saved & uploaded to RunSignup. Please save that data and try again."
				);
			} else {
				if (insuffData) {
					Alert.alert(
						"No Data Found", 
						"Insufficient data found on RunSignup. Please enter finish times on this device or another and try again."
					);
				} else {
					navigation.navigate("VerificationMode");
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
			if (localEdits) {
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
						Alert.alert(
							"Confirm Delete",
							"Please confirm that you want to delete this event. All local data will be lost.",
							[
								{ text: "Cancel", onPress: (): void => { return; } },
								{
									text: "Delete",
									onPress: async (): Promise<void> => {
										try {
											const response = await AsyncStorage.getItem("offlineEvents");
											let eventsList = response !== null ? JSON.parse(response) : [];
											eventsList = eventsList.filter((event: OfflineEvent) => event.time !== context.time);
					
											await AsyncStorage.setItem("offlineEvents", JSON.stringify(eventsList));
											navigation.navigate("OfflineEventsList");
										} catch (error) {
											Logger("Unknown Error (Delete Offline Event)", error, true);
										}
									},
									style: "destructive",
								},
							]
						);
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
			{!hasButtonColors && <ActivityIndicator size="large" color={Platform.OS === "android" ? GREEN_COLOR : GRAY_COLOR} style={{ marginTop: 20 }} />}
			<View style={{ justifyContent: "space-around", alignItems: "center" }}>
				{hasButtonColors && <>
					<MainButton color={noFinishLine ? "Disabled" : "Green"} onPress={context.online === false ? finishLineTappedOffline : finishLineTapped} text={`${finishLineProgress ? "Continue: " : ""}Finish Line Mode`} />
					<MainButton color={noChute ? "Disabled" : "Green"} onPress={context.online === false ? chuteTappedOffline : chuteTapped} text={`${chuteProgress ? "Continue: " : ""}Chute Mode`} />
					<MainButton color={noResults ? "Disabled" : "Green"} onPress={context.online === false ? verificationTappedOffline : verificationTapped} text={"Results"} />
					<MainButton onPress={context.online ? assignEvent : deleteEvent} text={context.online ? "Assign Offline Event" : "Delete Offline Event"} color={context.online ? "Gray" : "Red"} />
				</>}
			</View>
		</View>
	);
};

export default ModeScreen;