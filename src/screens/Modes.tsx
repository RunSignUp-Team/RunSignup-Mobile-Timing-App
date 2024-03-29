import React, { useCallback, useContext, useEffect, useState } from "react";
import { View, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { BLACK_COLOR, globalstyles, GRAY_COLOR, WHITE_COLOR } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { getBibs, getFinishTimes } from "../helpers/APICalls";
import { HeaderBackButton } from "@react-navigation/elements";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import { deleteTokenInfo } from "../helpers/oAuth2Helper";
import MainButton from "../components/MainButton";
import Logger from "../helpers/Logger";
import GetLocalRaceEvent, { DefaultEventData } from "../helpers/GetLocalRaceEvent";
import { useFocusEffect } from "@react-navigation/native";
import GetOfflineEvent from "../helpers/GetOfflineEvent";
import CreateAPIError from "../helpers/CreateAPIError";
import Icon from "../components/IcoMoon";
import GetSupport from "../helpers/GetSupport";
import { SyncAnimation } from "../components/SyncAnimation";
import GetBackupEvent from "../helpers/GetBackupEvent";
import { OfflineEvent } from "../models/OfflineEvent";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const ModeScreen = ({ navigation }: Props): React.ReactElement => {
	const context = useContext(AppContext);

	const msgHeader = "Permission Denied";
	const FinishLineModeMsg = `You may not enter Finish Line Mode data: \n1) multiple times on the same device, ${!(context.appMode === "Online" || context.appMode === "Backup") ? "or " : ""}2) after creating/editing results${context.appMode === "Online" || context.appMode === "Backup" ? ", 3) after recording Chute Mode data, or 4) with unsaved Chute Mode data stored on your device." : "."}\nIf you have completed all data entry, go to Results to view or edit results.`;
	const ChuteModeMsg = `You may not enter Chute Mode data: \n1) multiple times on the same device, 2) after creating/editing results, or 3) ${context.appMode === "Online" || context.appMode === "Backup" ? "with unsaved Finish Line Mode data stored on your device." : "before saving Finish Line Mode data."}\nIf you have completed all data entry, go to Results to view or edit results.`;

	const [loading, setLoading] = useState(false);

	const [finishLineDone, setFinishLineDone] = useState(false);
	const [finishLineProgress, setFinishLineProgress] = useState(false);
	const [chuteDone, setChuteDone] = useState(false);
	const [chuteProgress, setChuteProgress] = useState(false);
	const [resultsUploaded, setResultsUploaded] = useState(false);

	const noFinishLine = finishLineDone || chuteDone || chuteProgress;
	const noChute = chuteDone || finishLineProgress || (context.appMode !== "Online" && !finishLineDone);
	const noResults = (chuteProgress || finishLineProgress) && !resultsUploaded;

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

		setLoading(true);

		if (context.appMode === "Online") {
			// Get latest RSU data
			try {
				const times = await getFinishTimes(context.raceID, context.eventID);
				const bibs = await getBibs(context.raceID, context.eventID);

				if (times.length < 1) {
					AsyncStorage.setItem(`finishLineDone:${context.raceID}:${context.eventID}`, "false");
				}
				if (bibs.length < 1) {
					AsyncStorage.setItem(`chuteDone:${context.raceID}:${context.eventID}`, "false");
				}
			} catch (error) {
				CreateAPIError("Modes RSU", error, true);
			}

			// Finish Line Done
			flDone = await AsyncStorage.getItem(`finishLineDone:${context.raceID}:${context.eventID}`) === "true";

			// Chute Done
			cDone = await AsyncStorage.getItem(`chuteDone:${context.raceID}:${context.eventID}`) === "true";

			// Check if Finish Line / Chute in progress
			let [raceList, raceIndex, eventIndex] = DefaultEventData;

			if (context.appMode === "Online") {
				[raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);
			} else {
				[raceList, raceIndex, eventIndex] = await GetBackupEvent(context.raceID, context.eventID);
			}
			if (!flDone && raceIndex >= 0 && eventIndex >= 0 && raceList[raceIndex].events[eventIndex].real_start_time > -1) {
				flProgress = true;
			}
			if (!cDone && raceIndex >= 0 && eventIndex >= 0 && raceList[raceIndex].events[eventIndex].bib_nums.length > 0) {
				cProgress = true;
			}
		} else if (context.appMode === "Backup") {
			// Finish Line Done
			flDone = await AsyncStorage.getItem(`finishLineDone:backup:${context.raceID}:${context.eventID}`) === "true";
			// Chute Done
			cDone = await AsyncStorage.getItem(`chuteDone:backup:${context.raceID}:${context.eventID}`) === "true";

			// Check if Finish Line / Chute in progress
			const [raceList, raceIndex, eventIndex] = await GetBackupEvent(context.raceID, context.eventID);
			if (!flDone && raceIndex >= 0 && eventIndex >= 0 && raceList[raceIndex].events[eventIndex].real_start_time >= 0) {
				flProgress = true;
			}
			if (!cDone && raceIndex >= 0 && eventIndex >= 0 && raceList[raceIndex].events[eventIndex].bib_nums.length > 0) {
				cProgress = true;
			}
		} else {
			// Finish Line Done
			flDone = await AsyncStorage.getItem(`finishLineDone:${context.time}`) === "true";
			// Chute Done
			cDone = await AsyncStorage.getItem(`chuteDone:${context.time}`) === "true";

			// Check if Finish Line / Chute in progress
			const [eventList, eventIndex] = await GetOfflineEvent(context.time);
			if (!flDone && eventIndex >= 0 && eventList[eventIndex].real_start_time >= 0) {
				flProgress = true;
			}
			if (!cDone && eventIndex >= 0 && eventList[eventIndex].bib_nums.length > 0) {
				cProgress = true;
			}
		}

		setFinishLineDone(flDone);
		setFinishLineProgress(flProgress);
		setChuteProgress(cProgress);
		setChuteDone(cDone);

		setLoading(false);
	}, [context.eventID, context.appMode, context.raceID, context.time]);

	// Get button colors on focus
	useFocusEffect(useCallback(() => {
		getButtonColors();
	}, [getButtonColors]));

	// Set back button
	useEffect(() => {
		let eventName = "";
		const setNavigation = async (): Promise<void> => {
			if (context.appMode === "Online" || context.appMode === "Backup") {
				let [raceList, raceIndex, eventIndex] = DefaultEventData;

				if (context.appMode === "Online") {
					[raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);
				} else {
					[raceList, raceIndex, eventIndex] = await GetBackupEvent(context.raceID, context.eventID);
				}

				if (raceIndex >= 0 && eventIndex >= 0 && raceList[raceIndex].events[eventIndex].name) {
					eventName = raceList[raceIndex].events[eventIndex].name;
				}
			} else {
				const [eventList, eventIndex] = await GetOfflineEvent(context.time);
				if (eventIndex >= 0 && eventList[eventIndex].name) {
					eventName = eventList[eventIndex].name;
				}
			}


			navigation.setOptions({
				headerLeft: () => (
					<HeaderBackButton onPress={(): void => { navigation.goBack(); }} labelVisible={false} tintColor={WHITE_COLOR}></HeaderBackButton>
				),
				headerRight: () => (
					<View style={{ flexDirection: "row", width: context.appMode === "Offline" ? undefined : 75, marginRight: context.appMode === "Offline" ? 15 : 0, justifyContent: "space-between", alignItems: "center" }}>
						<SyncAnimation appMode={context.appMode} />
						{context.appMode === "Offline" ? null :
							<TouchableOpacity onPress={handleLogOut} style={globalstyles.headerButtonText}>
								<Icon name={"exit"} size={22} color={WHITE_COLOR}></Icon>
							</TouchableOpacity>
						}
					</View>
				),
				headerTitle: eventName ? eventName : "Modes"
			});
		};
		setNavigation();
	}, [context.eventID, context.appMode, context.raceID, context.time, handleLogOut, navigation]);

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
				setLoading(true);
				const finishTimes = await getFinishTimes(context.raceID, context.eventID);
				if (finishTimes && finishTimes.length > 0) {
					Alert.alert(
						"Already Entered",
						"RunSignup already has a record of finish times for this event.\nSee Results for more details."
					);
					setResultsUploaded(true);
				} else {
					navigation.navigate("FinishLineMode");
				}
			} catch (err) {
				CreateAPIError("Finish Times Check", err, true);
				navigation.navigate("FinishLineMode");
			} finally {
				setLoading(false);
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

	// Results Mode tapped
	const resultsTapped = async (): Promise<void> => {
		try {
			// Check for local edits
			if (noResults) {
				Alert.alert(
					"Local Data Not Uploaded",
					"There is local data on your device that has not been saved & uploaded to RunSignup. Please save that data and try again."
				);
			} else {
				navigation.navigate("ResultsMode");
			}
		} catch (error) {
			CreateAPIError("Modes", error);
		}
	};

	// Results Mode tapped (offline)
	const resultsTappedOffline = async (): Promise<void> => {
		try {
			if (noResults) {
				Alert.alert(
					"Local Data Not Saved",
					"There is local data on your device that has not been saved. Please save that data and try again."
				);
			} else {
				navigation.navigate("ResultsMode");
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

	const getSupport = async (): Promise<void> => {
		try {
			await GetSupport(context.raceID, context.eventID, context.email, context.appMode);
		} catch (error) {
			Logger("Failed to Open Mail", error, true);
		}
	};

	return (
		<View style={globalstyles.container}>
			<MainButton disabled={loading} color={noFinishLine || loading ? "Disabled" : "Green"} onPress={context.appMode !== "Online" ? finishLineTappedOffline : finishLineTapped} text={`${finishLineProgress ? "Continue: " : ""}Finish Line Mode`} buttonStyle={{ marginTop: 0 }} />
			<MainButton disabled={loading} color={noChute || loading ? "Disabled" : "Green"} onPress={context.appMode !== "Online" ? chuteTappedOffline : chuteTapped} text={`${chuteProgress ? "Continue: " : ""}Chute Mode`} />
			<MainButton disabled={loading} color={noResults || loading ? "Disabled" : "Green"} onPress={context.appMode !== "Online" ? resultsTappedOffline : resultsTapped} text={"Results"} />
			{context.appMode !== "Backup" ? <MainButton onPress={context.appMode === "Online" ? assignEvent : deleteEvent} text={context.appMode === "Online" ? "Assign Offline Event" : "Delete Offline Event"} color={context.appMode === "Online" ? "Gray" : "Red"} /> : null}
			{loading && <ActivityIndicator size="large" color={Platform.OS === "android" ? BLACK_COLOR : GRAY_COLOR} style={{ marginTop: 20 }} />}
			<MainButton text={"Get Support"} onPress={getSupport} buttonStyle={{ position: "absolute", bottom: 20, minHeight: 50 }} color="Gray" />
		</View>
	);
};

export default ModeScreen;