import React, { useCallback, useContext, useEffect, useState } from "react";
import { View, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { BLACK_COLOR, globalstyles, GRAY_COLOR, WHITE_COLOR } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { getFinishTimes } from "../helpers/APICalls";
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
import CreateAPIError from "../helpers/CreateAPIError";
import Icon from "../components/IcoMoon";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const ModeScreen = ({ navigation }: Props): React.ReactElement => {
	const context = useContext(AppContext);

	const msgHeader = "Permission Denied";
	const FinishLineModeMsg = `You may not enter Finish Line Mode data: \n1) multiple times on the same device, ${!context.online ? "or " : ""}2) after creating/editing results${context.online ? ", 3) after recording Chute Mode data, or 4) with unsaved Chute Mode data stored on your device." : "."}\nIf you have completed all data entry, go to Results to view or edit results.`;
	const ChuteModeMsg = `You may not enter Chute Mode data: \n1) multiple times on the same device, 2) after creating/editing results, or 3) ${context.online ? "with unsaved Finish Line Mode data stored on your device." : "before saving Finish Line Mode data."}\nIf you have completed all data entry, go to Results to view or edit results.`;

	const [finishLineDone, setFinishLineDone] = useState(false);
	const [finishLineProgress, setFinishLineProgress] = useState(false);
	const [chuteDone, setChuteDone] = useState(false);
	const [chuteProgress, setChuteProgress] = useState(false);

	const [hasButtonColors, setHasButtonColors] = useState(false);

	const noFinishLine = finishLineDone || chuteDone || chuteProgress;
	const noChute = chuteDone || finishLineProgress || (!context.online && !finishLineDone);
	const noResults = chuteProgress || finishLineProgress;

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

		if (context.online) {
			// Finish Line Done
			flDone = await AsyncStorage.getItem(`finishLineDone:${context.raceID}:${context.eventID}`) === "true";
			try {
				const finishTimes = await getFinishTimes(context.raceID, context.eventID);
				if (finishTimes.length > 0) {
					flDone = true;
				}
			} catch {
				// Ignore
			}

			// Chute Done
			cDone = await AsyncStorage.getItem(`chuteDone:${context.raceID}:${context.eventID}`) === "true";

			// Check if Finish Line / Chute in progress
			const [localRaceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);
			if (!flDone && localRaceList[raceIndex].events[eventIndex].real_start_time > -1) {
				flProgress = true;
			}
			if (!cDone && localRaceList[raceIndex].events[eventIndex].bib_nums.length > 0) {
				cProgress = true;
			}
		} else {
			// Finish Line Done
			flDone = await AsyncStorage.getItem(`finishLineDone:${context.time}`) === "true";
			// Chute Done
			cDone = await AsyncStorage.getItem(`chuteDone:${context.time}`) === "true";

			// Check if Finish Line / Chute in progress
			const [localEventList, eventIndex] = await GetLocalOfflineEvent(context.time);
			if (!flDone && localEventList[eventIndex].real_start_time > -1) {
				flProgress = true;
			}
			if (!cDone && localEventList[eventIndex].bib_nums.length > 0) {
				cProgress = true;
			}
		}

		setFinishLineDone(flDone);
		setFinishLineProgress(flProgress);
		setChuteProgress(cProgress);
		setChuteDone(cDone);

		setHasButtonColors(true);
	}, [context.eventID, context.online, context.raceID, context.time]);

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
					<HeaderBackButton onPress={(): void => { navigation.goBack(); }} labelVisible={false} tintColor={WHITE_COLOR}></HeaderBackButton>
				),
				headerRight: () => (
					context.online ?
						<TouchableOpacity onPress={handleLogOut} style={globalstyles.headerButtonText}>
							<Icon name={"exit"} size={22} color={WHITE_COLOR}></Icon>
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
				msgHeader,
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
				msgHeader,
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
				msgHeader,
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
				msgHeader,
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
			if (noResults) {
				Alert.alert(
					"Local Data Not Uploaded",
					"There is local data on your device that has not been saved & uploaded to RunSignup. Please save that data and try again."
				);
			} else {
				navigation.navigate("VerificationMode");
			}
		} catch (error) {
			CreateAPIError("Modes", error);
		}
	};

	// Verification Mode tapped (offline)
	const verificationTappedOffline = async (): Promise<void> => {
		try {
			if (noResults) {
				Alert.alert(
					"Local Data Not Saved",
					"There is local data on your device that has not been saved. Please save that data and try again."
				);
			} else {
				navigation.navigate("VerificationMode");
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
				{ text: "Cancel" },
				{
					text: "Delete",
					onPress: async (): Promise<void> => {
						Alert.alert(
							"Confirm Delete",
							"Please confirm that you want to delete this event. All local data will be lost.",
							[
								{ text: "Cancel" },
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
			{!hasButtonColors && <ActivityIndicator size="large" color={Platform.OS === "android" ? BLACK_COLOR : GRAY_COLOR} style={{ marginTop: 20 }} />}
			{hasButtonColors && <>
				<MainButton color={noFinishLine ? "Disabled" : "Green"} onPress={context.online === false ? finishLineTappedOffline : finishLineTapped} text={`${finishLineProgress ? "Continue: " : ""}Finish Line Mode`} buttonStyle={{ marginTop: 0 }} />
				<MainButton color={noChute ? "Disabled" : "Green"} onPress={context.online === false ? chuteTappedOffline : chuteTapped} text={`${chuteProgress ? "Continue: " : ""}Chute Mode`} />
				<MainButton color={noResults ? "Disabled" : "Green"} onPress={context.online === false ? verificationTappedOffline : verificationTapped} text={"Results"} />
				<MainButton onPress={context.online ? assignEvent : deleteEvent} text={context.online ? "Assign Offline Event" : "Delete Offline Event"} color={context.online ? "Gray" : "Red"} />
			</>}
		</View>
	);
};

export default ModeScreen;