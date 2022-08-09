import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Alert } from "react-native";
import { AppMode } from "../components/AppContext";
import { TabParamList } from "../components/AppStack";
import { postStartTime, postFinishTimes } from "./APICalls";
import CreateAPIError from "./CreateAPIError";
import { AddToStorage } from "./FLAddToStorage";
import GetLocalRaceEvent, { DefaultEventData } from "./GetLocalRaceEvent";

type ScreenNavigationProp = BottomTabNavigationProp<TabParamList>;

// Post Times to API
export const SaveResults = async (
	raceID: number,
	eventID: number,
	appMode: AppMode,
	time: number,
	finishTimesRef: React.MutableRefObject<Array<number>>,
	checkerBibsRef: React.MutableRefObject<Array<number>>,
	setLoading: (value: React.SetStateAction<boolean>) => void,
	navigation: ScreenNavigationProp
): Promise<void> => {
	try {
		let [raceList, raceIndex, eventIndex] = DefaultEventData;

		// Post Start Time
		if (appMode === "Online") {
			[raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(raceID, eventID);
			if (raceIndex < 0 || eventIndex < 0) return;
			await postStartTime(raceID, eventID, raceList[raceIndex].events[eventIndex].real_start_time);
		}

		// Post Finish Times data
		if (finishTimesRef.current.length < 1) {
			// Alert if no finishing times have been recorded
			Alert.alert("No Results", "You have not recorded any results. Please try again.");
		} else {
			try {
				if (appMode === "Online") {
					await postFinishTimes(raceID, eventID, finishTimesRef.current);
				}
				
				AddToStorage(
					raceID,
					eventID,
					appMode,
					time,
					finishTimesRef.current,
					checkerBibsRef.current,
					true,
					setLoading,
					navigation
				);
			} catch (error) {
				if (error instanceof Error && error.message.toLowerCase().includes("out of order")) {
					Alert.alert("Results Error", "Results have already been posted for this event! You cannot re-post results.");
				} else {
					CreateAPIError("Post Times", error);
				}
				setLoading(false);
			}
		}
	} catch (error) {
		CreateAPIError("Start Time", error);
	}
};