import React, { useCallback, useContext, useEffect } from "react";
import { View, TouchableOpacity, Text, Alert } from "react-native";
import { globalstyles, MEDIUM_FONT_SIZE } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { getBibs, getFinishTimes } from "../helpers/AxiosCalls";
import { HeaderBackButton } from "@react-navigation/elements";
import { OfflineEvent } from "./OfflineEventsScreen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import { deleteTokenInfo } from "../helpers/oAuth2Helper";
import MainButton from "../components/MainButton";
import Logger from "../helpers/Logger";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const ModeScreen = ({ navigation }: Props): React.ReactElement => {
	const context = useContext(AppContext);

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
						Logger.log(error);
					}
				}
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
				context.online ?
					<TouchableOpacity onPress={handleLogOut}>
						<Text style={{ color: "white", fontSize: MEDIUM_FONT_SIZE, fontWeight: "bold" }}>Log Out</Text>
					</TouchableOpacity> :
					null
			)
		});
	}, [context.online, handleLogOut, navigation]);

	// Finish Line Mode tapped
	const finishLineTapped = (): void => {
		AsyncStorage.getItem(
			`finishLineDone:${context.raceID}:${context.eventID}`,
			(_err, result) => {
				if (result === "true") {
					Alert.alert(
						"Already Entered",
						"You have already entered the Finish Line Mode data. Please see Verification Mode for more details or to edit results."
					);
				} else {
					navigation.navigate("FinishLineMode");
				}
			}
		);
	};

	// Finish Line Mode tapped (offline)
	const finishLineTappedOffline = (): void => {
		AsyncStorage.getItem(`finishLineDone:${context.time}`, (_err, result) => {
			if (result === "true") {
				Alert.alert(
					"Already Entered",
					"You have already entered the Finish Line Mode data. Please see Verification Mode for more details or to edit results."
				);
			} else {
				navigation.navigate("FinishLineMode");
			}
		});
	};

	// Chute Mode tapped
	const chuteTapped = (): void => {
		AsyncStorage.getItem(
			`chuteDone:${context.raceID}:${context.eventID}`,
			(_err, result) => {
				if (result === "true") {
					Alert.alert(
						"Already Entered",
						"You have already entered the Chute Mode data. Please see Verification Mode for more details or to edit results."
					);
				} else {
					navigation.navigate("ChuteMode");
				}
			}
		);
	};

	// Chute Mode tapped (offline)
	const chuteTappedOffline = (): void => {
		AsyncStorage.getItem(`chuteDone:${context.time}`, (_err, result) => {
			if (result === "true") {
				Alert.alert("Already Entered", "You have already entered the Chute Mode data. Please see Verification Mode for more details or to edit results.");
			} else {
				navigation.navigate("ChuteMode");
			}
		});
	};

	// Verification Mode tapped
	const verificationTapped = async (): Promise<void> => {
		let bibsExist = false;

		try {
			const bibs = await getBibs(context.raceID, context.eventID);
			// Only open Verification Mode if there is some data to show
			if (bibs !== null && bibs.length > 0) {
				bibsExist = true;
			}
			const finishTimes = await getFinishTimes(context.raceID, context.eventID);
			if (finishTimes !== null && finishTimes.length > 0 && bibsExist) {
				navigation.navigate("VerificationMode");
			} else {
				Alert.alert("No Data Entered", "You have not entered Chute and Finish Line data yet. Please enter that data first and try again.");
			}
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === undefined || error.message === "Network Error") {
					Alert.alert("Connection Error", "No response received from the server. Please check your internet connection and try again.");
				} else {
					// Something else
					Alert.alert("Unknown Error", `${JSON.stringify(error.message)}`);

				}
			}
		}
	};

	// Verification Mode tapped (offline)
	const verificationTappedOffline = (): void => {
		// Only open if Chute and Finish Line data are saved
		AsyncStorage.getItem(`finishLineDone:${context.time}`, (_err, resultFinish) => {
			if (resultFinish === "true") {
				navigation.navigate("VerificationMode");
			} else {
				Alert.alert("No Data Entered", "You have not saved Chute and Finish Line data yet. Please enter that data first and try again.");
			}
		}
		);
	};

	// Delete offline event
	const deleteEvent = (): void => {
		Alert.alert(
			"Delete Event",
			"Are you sure you want to delete this event? This action cannot be reversed!",
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
		const requestParse = JSON.parse((request && request !== null) ? request : "");
		if (requestParse.length > 0) {
			navigation.navigate("OfflineEventsList");
		} else {
			Alert.alert("No Offline Events", "You have not created any Offline Events.");
		}
	};

	return (
		<View style={globalstyles.container}>
			<View style={{ justifyContent: "space-around", alignItems: "center" }}>
				<MainButton onPress={context.online === false ? finishLineTappedOffline : finishLineTapped} text={"Finish Line Mode"} />
				<MainButton onPress={context.online === false ? chuteTappedOffline : chuteTapped} text={"Chute Mode"} />
				<MainButton onPress={context.online === false ? verificationTappedOffline : verificationTapped} text={"Verification Mode"} />
				<MainButton onPress={context.online ? assignEvent : deleteEvent} text={context.online ? "Assign Offline Event" : "Delete Offline Event"} color="Red" />
			</View>
		</View>
	);
};

export default ModeScreen;