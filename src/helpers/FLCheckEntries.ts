import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Alert } from "react-native";
import { TabParamList } from "../components/AppStack";
import { AddToStorage } from "./FLAddToStorage";
import { SaveResults } from "./FLSaveResults";

type ScreenNavigationProp = BottomTabNavigationProp<TabParamList>;

// Check entries for errors
export const CheckEntries = (
	raceID: number,
	eventID: number,
	online: boolean, 
	time: number,
	finishTimesRef: React.MutableRefObject<Array<number>>,
	checkerBibsRef: React.MutableRefObject<Array<number>>, 
	setLoading: (value: React.SetStateAction<boolean>) => void,
	navigation: ScreenNavigationProp,
	syncEnabled: boolean
): void => {
	// If no results posted
	if (checkerBibsRef.current.length < 1) {
		// Alert if no finishing times have been recorded
		Alert.alert("No Results", "You have not recorded any results. Please try again.");
	} else if (checkerBibsRef.current.filter(entry => entry === null).length > 0) {
		// Alert if blank bib entry
		Alert.alert("Incorrect Bib Entry", "There is a blank bib entry in the list. Please fill in the correct value.");
	} else if (checkerBibsRef.current.includes(NaN)) {
		// Alert if non-numeric entry
		Alert.alert("Incorrect Bib Entry", "You have entered a non-numeric character in the bib entries list. Please correct that entry before submitting.");
	} else if (checkerBibsRef.current.filter(entry => (entry.toString().substring(0, 1) === "0" && entry.toString().length > 1)).length > 0) {
		// Filter bib numbers that start with 0
		Alert.alert("Incorrect Bib Entry", "There is a bib entry that starts with 0 in the list. Please fill in the correct value.");
	} else {
		if (online && syncEnabled) {
			Alert.alert(
				"Save Results",
				"Are you sure you want to save to the cloud and quit?",
				[
					{ text: "Cancel" },
					{
						text: "Save & Quit",
						onPress: (): void => {
							setLoading(true);
							SaveResults(
								raceID, 
								eventID, 
								online,
								time,
								finishTimesRef, 
								checkerBibsRef, 
								setLoading,
								navigation,
								syncEnabled
							);
						},
						style: "destructive",
					},
				]
			);
		} else {
			Alert.alert(
				"Save Results",
				"Are you sure you want to save the results and quit?",
				[
					{ text: "Cancel" },
					{
						text: "Save & Quit",
						onPress: (): void => {
							if (finishTimesRef.current.length < 1) {
								Alert.alert("No Results", "You have not recorded any results. Please try again.");
							} else {
								setLoading(true);
								AddToStorage(
									raceID,
									eventID,
									online,
									time,
									finishTimesRef.current, 
									checkerBibsRef.current,
									true,
									setLoading,
									navigation,
									syncEnabled
								);
							}
						},
						style: "destructive",
					},
				]
			);
		}
	}
};