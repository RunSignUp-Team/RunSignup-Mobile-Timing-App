import React, { useCallback, useContext, useEffect } from "react";
import { View, TouchableOpacity, Text, Alert, Platform } from "react-native";
import { globalstyles } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { getBibs, getFinishTimes } from "../helpers/AxiosCalls";
import { HeaderBackButton } from "@react-navigation/elements";
import { OfflineEvent } from "./OfflineEventsScreen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import { deleteTokenInfo } from "../helpers/oAuth2Helper";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const ModeScreen = ({ navigation }: Props) => {
	const context = useContext(AppContext);

	// Handle log out. Delete local tokens
	const handleLogOut = useCallback(async () => {
		Alert.alert("Log Out?", "Are you sure you want to log out?", [
			{
				text: "Cancel",
				style: "default",
				onPress: () => {return;}
			},
			{
				text: "Log Out",
				style: "destructive",
				onPress: async () => {
					try {
						await deleteTokenInfo();
						navigation.navigate("Login");
					} catch (error) {
						console.log(error);
					}
				}
			}
		]);
	},[navigation]);

	// Set back button
	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<HeaderBackButton onPress={() => { navigation.pop(); }} label="Events List" labelVisible={Platform.OS === "ios"} tintColor="white"></HeaderBackButton>
			),
			headerRight: () => (
				context.online ?
					<TouchableOpacity onPress={handleLogOut}>
						<Text style={{color: "white", fontSize: 18}}>Log Out</Text>
					</TouchableOpacity> : 
					null
			)
		});
	}, [context.online, handleLogOut, navigation]);

	// Finish Line Mode tapped
	const finishLineTapped = () => {
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
	const finishLineTappedOffline = () => {
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
	const chuteTapped = () => {
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
	const chuteTappedOffline = () => {
		AsyncStorage.getItem(`chuteDone:${context.time}`, (_err, result) => {
			if (result === "true") {
				Alert.alert("Already Entered", "You have already entered the Chute Mode data. Please see Verification Mode for more details or to edit results.");
			} else {
				navigation.navigate("ChuteMode");
			}
		});
	};

	// Verification Mode tapped
	const verificationTapped = async () => {
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
	const verificationTappedOffline = () => {
		// Only open if Chute and Finish Line data are saved
		AsyncStorage.getItem(`finishLineDone:${context.time}`, (_err, resultFinish) => {
			if (resultFinish === "true") {
				navigation.navigate("VerificationMode");
			} else {
				Alert.alert("No Data Entered", "You have not entered Chute and Finish Line data yet. Please enter that data first and try again.");
			}
		}
		);
	};

	// Delete offline event
	const deleteEvent = () => {
		Alert.alert(
			"Delete Event",
			"Are you sure you want to delete this event? This action cannot be reversed!",
			[
				{ text: "Cancel", onPress: () => {return;} },
				{
					text: "Delete",
					onPress: async () => {
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
	const assignEvent = async () => {
		const request = await AsyncStorage.getItem("offlineEvents");
		if (request !== null) {
			navigation.navigate("OfflineEventsList");
		} else {
			Alert.alert("No Offline Events", "You have not created any Offline Events.");
		}
	};

	return (
		<View style={globalstyles.container}>
			<View style={{ justifyContent: "space-around", alignItems: "center" }}>
				<TouchableOpacity
					style={globalstyles.button}
					onPress={context.online === false ? finishLineTappedOffline : finishLineTapped}
				>
					<Text style={globalstyles.buttonText}>Finish Line Mode</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={globalstyles.button}
					onPress={context.online === false ? chuteTappedOffline : chuteTapped}
				>
					<Text style={globalstyles.buttonText}>Chute Mode</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={globalstyles.button}
					onPress={context.online === false ? verificationTappedOffline : verificationTapped}
				>
					<Text style={globalstyles.buttonText}>Verification Mode</Text>
				</TouchableOpacity>
				{!context.online && (
					<TouchableOpacity
						style={globalstyles.deleteButton}
						onPress={deleteEvent}
					>
						<Text style={globalstyles.buttonText}>Delete Offline Event</Text>
					</TouchableOpacity>
				)}
				{context.online && (
					<TouchableOpacity
						style={globalstyles.deleteButton}
						onPress={assignEvent}
					>
						<Text style={globalstyles.buttonText}>Assign Offline Event</Text>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
};

export default ModeScreen;
