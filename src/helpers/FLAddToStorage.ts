import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../components/AppStack";
import { getBibs, postBibs } from "./APICalls";
import CreateAPIError from "./CreateAPIError";
import GetLocalOfflineEvent from "./GetLocalOfflineEvent";
import GetLocalRaceEvent from "./GetLocalRaceEvent";
import Logger from "./Logger";

type ScreenNavigationProp = BottomTabNavigationProp<TabParamList>;

/** Save the finish times and checker bibs to local storage and/or RSU API */
export const AddToStorage = async (
	raceID: number,
	eventID: number,
	online: boolean,
	time: number,
	finishTimesParam: Array<number>, 
	checkerBibsParam: Array<number>,
	final: boolean, 
	setLoading: (value: React.SetStateAction<boolean>) => void,
	navigation: ScreenNavigationProp,
	syncEnabled: boolean
): Promise<void> => {
	if (online) {
		// Set start time locally
		GetLocalRaceEvent(raceID, eventID).then(([raceList, raceIndex, eventIndex]) => {
			if (raceIndex !== -1 && eventIndex !== -1) {
				raceList[raceIndex].events[eventIndex].finish_times = finishTimesParam;
				raceList[raceIndex].events[eventIndex].checker_bibs = checkerBibsParam;
				AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));
			} else {
				Logger("Local Storage Error (Finish Line)", [raceList, raceIndex, eventIndex], true);
			}
		});

		if (final) {
			try {
				if (syncEnabled) {
					const bibs = await getBibs(raceID, eventID);

					if (bibs && bibs.length > 0) {
						// If there are already bibs saved from Chute Mode, navigate to Verification Mode
						AsyncStorage.setItem(`chuteDone:${raceID}:${eventID}`, "true");
						navigation.navigate("ModeScreen");
						navigation.navigate("VerificationMode");
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
	
						// Clear local data upon successful upload
						GetLocalRaceEvent(raceID, eventID).then(([raceList, raceIndex, eventIndex]) => {
							if (raceIndex !== null && eventIndex !== null) {
								raceList[raceIndex].events[eventIndex].checker_bibs = [];
								raceList[raceIndex].events[eventIndex].finish_times = [];
								raceList[raceIndex].events[eventIndex].real_start_time = -1;
								AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));
							}
						});
	
						navigation.navigate("ModeScreen");
					}
				} else {
					navigation.navigate("ModeScreen");
				}

				// Don't allow further changes to Finish Line Mode
				// However, there is a use case where someone could complete Finish Line Mode without adding bibs,
				// And then want to add the bibs at the end of the race in Chute Mode,
				// So we leave that option open to them
				AsyncStorage.setItem(`finishLineDone:${raceID}:${eventID}`, "true");
			} catch (error) {
				CreateAPIError("Post Bibs", error);
			} finally {
				setLoading(false);
			}
		}
	} else {
		GetLocalOfflineEvent(time).then(([eventList, eventIndex]) => {
			if (eventIndex !== -1) {
				eventList[eventIndex].finish_times = finishTimesParam;
				eventList[eventIndex].checker_bibs = checkerBibsParam;
				AsyncStorage.setItem("offlineEvents", JSON.stringify(eventList));
			} else {
				Logger("Local Storage Error (Finish Line)", [eventList, eventIndex], true);
			}
		});

		if (final) {
			// Navigate away
			AsyncStorage.setItem(`finishLineDone:${time}`, "true");
			setLoading(false);

			navigation.navigate("ModeScreen");
			await AsyncStorage.getItem(`chuteDone:${time}`, (_err, result) => {
				if (result === "true") {
					navigation.navigate("VerificationMode");
				}
			});
		}
	}
};