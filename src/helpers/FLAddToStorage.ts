import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { AppMode } from "../components/AppContext";
import { TabParamList } from "../components/AppStack";
import { getBibs, postBibs } from "./APICalls";
import CreateAPIError from "./CreateAPIError";
import GetOfflineEvent from "./GetOfflineEvent";
import GetLocalRaceEvent from "./GetLocalRaceEvent";
import Logger from "./Logger";
import GetBackupEvent from "./GetBackupEvent";

type ScreenNavigationProp = BottomTabNavigationProp<TabParamList>;

/** Save the finish times and checker bibs to local storage and/or RSU API */
export const AddToStorage = async (
	raceID: number,
	eventID: number,
	appMode: AppMode,
	time: number,
	finishTimesParam: Array<number>, 
	checkerBibsParam: Array<number>,
	final: boolean, 
	setLoading: (value: React.SetStateAction<boolean>) => void,
	navigation: ScreenNavigationProp
): Promise<void> => {
	if (appMode === "Online") {
		const [raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(raceID, eventID);

		if (raceIndex >= 0 && eventIndex >= 0) {
			raceList[raceIndex].events[eventIndex].finish_times = finishTimesParam;
			raceList[raceIndex].events[eventIndex].checker_bibs = checkerBibsParam;
			AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));
		} else {
			Logger("Local Storage Error (Finish Line)", [raceList, raceIndex, eventIndex, appMode], true);
		}

		if (final) {
			try {
				const bibs = await getBibs(raceID, eventID);

				if (bibs && bibs.length > 0) {
					// If there are already bibs saved from Chute Mode, navigate to Results Mode
					AsyncStorage.setItem(`chuteDone:${raceID}:${eventID}`, "true");
					setLoading(false);
					navigation.navigate("ModeScreen");
					navigation.navigate("ResultsMode");
				} else {
					// Otherwise push bibs
					// Formatting and appending bib numbers
					const formData = new FormData();
					formData.append(
						"request",
						JSON.stringify({
							last_finishing_place: 0,
							bib_nums: checkerBibsParam
						})
					);

					await postBibs(raceID, eventID, formData);

					raceList[raceIndex].events[eventIndex].checker_bibs = [];
					raceList[raceIndex].events[eventIndex].finish_times = [];
					raceList[raceIndex].events[eventIndex].real_start_time = -1;
					AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));

					setLoading(false);
					navigation.navigate("ModeScreen");
				}

				// Don't allow further changes to Finish Line Mode
				// However, there is a use case where someone could complete Finish Line Mode without adding bibs,
				// And then want to add the bibs at the end of the race in Chute Mode,
				// So we leave that option open to them
				AsyncStorage.setItem(`finishLineDone:${raceID}:${eventID}`, "true");

			} catch (error) {
				CreateAPIError("Post Bibs", error);
				setLoading(false);
			}
		}
	} else if (appMode === "Backup") {
		const [raceList, raceIndex, eventIndex] = await GetBackupEvent(raceID, eventID);

		if (raceIndex >= 0 && eventIndex >= 0) {
			raceList[raceIndex].events[eventIndex].finish_times = finishTimesParam;
			raceList[raceIndex].events[eventIndex].checker_bibs = checkerBibsParam;
			AsyncStorage.setItem("backupRaces", JSON.stringify(raceList));
		} else {
			Logger("Local Storage Error (Finish Line)", [raceList, raceIndex, eventIndex, appMode], true);
		}

		if (final) {
			// Navigate away
			AsyncStorage.setItem(`finishLineDone:backup:${raceID}:${eventID}`, "true");
			setLoading(false);
	
			navigation.navigate("ModeScreen");
			await AsyncStorage.getItem(`chuteDone:backup:${raceID}:${eventID}`, (_err, result) => {
				if (result === "true") {
					navigation.navigate("ResultsMode");
				}
			});
		}
	} else {
		const [eventList, eventIndex] = await GetOfflineEvent(time);

		if (eventIndex >= 0) {
			eventList[eventIndex].finish_times = finishTimesParam;
			eventList[eventIndex].checker_bibs = checkerBibsParam;
			AsyncStorage.setItem("offlineEvents", JSON.stringify(eventList));
		} else {
			Logger("Local Storage Error (Finish Line)", [eventList, eventIndex, appMode], true);
		}

		if (final) {
			// Navigate away
			AsyncStorage.setItem(`finishLineDone:${time}`, "true");
			setLoading(false);
	
			navigation.navigate("ModeScreen");
			await AsyncStorage.getItem(`chuteDone:${time}`, (_err, result) => {
				if (result === "true") {
					navigation.navigate("ResultsMode");
				}
			});
		}
	}

	
};