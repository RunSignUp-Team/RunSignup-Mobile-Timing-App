import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Alert } from "react-native";
import { TabParamList } from "../components/AppStack";
import addLeadingZeros from "./AddLeadingZeros";
import { postStartTime, postFinishTimes } from "./APICalls";
import CreateAPIError from "./CreateAPIError";
import { AddToStorage } from "./FLAddToStorage";
import GetLocalRaceEvent from "./GetLocalRaceEvent";

type ScreenNavigationProp = BottomTabNavigationProp<TabParamList>;

// Post Times to API
export const SaveResults = async (
	raceID: number,
	eventID: number,
	online: boolean,
	time: number,
	finishTimesRef: React.MutableRefObject<Array<number>>,
	checkerBibsRef: React.MutableRefObject<Array<number>>,
	setLoading: (value: React.SetStateAction<boolean>) => void,
	navigation: ScreenNavigationProp,
	syncEnabled: boolean
): Promise<void> => {
	if (syncEnabled) {
		const formDataStartTime = new FormData();

		const [raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(raceID, eventID);
		if (raceIndex === -1 || eventIndex === -1) return;

		const formatStartTime = new Date(raceList[raceIndex].events[eventIndex].real_start_time);

		// Append request to API
		formDataStartTime.append(
			"request",
			JSON.stringify({
				start_time: `${formatStartTime.getFullYear()}-${addLeadingZeros(formatStartTime.getMonth() + 1)}-${addLeadingZeros(formatStartTime.getDate())} ${addLeadingZeros(formatStartTime.getHours())}:${addLeadingZeros(formatStartTime.getMinutes())}:${addLeadingZeros(formatStartTime.getSeconds())}`
			})
		);

		// Post start time
		try {
			await postStartTime(raceID, eventID, formDataStartTime);

			// Post Finish Times data
			if (finishTimesRef.current.length < 1) {
				// Alert if no finishing times have been recorded
				Alert.alert("No Results", "You have not recorded any results. Please try again.");
			} else {
				try {
					await postFinishTimes(raceID, eventID, finishTimesRef.current);
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
	}
};