import AsyncStorage from "@react-native-async-storage/async-storage";
import { OfflineEvent } from "../screens/OfflineEvents";
import Logger from "./Logger";

/**
 * Get the local event list and event index if possible
 */
export default async function GetOfflineEvent(time: number): Promise<[Array<OfflineEvent>, number]> {
	try {
		const response = await AsyncStorage.getItem("offlineEvents");
		if (response !== null) {
			const eventList = JSON.parse(response);
			let eventIndex = -1;
	
			for (let i = 0; i < eventList.length; i++) {
				if (eventList[i].time === time) {
					// Found correct event
					eventIndex = i;
					break;
				}
			}
	
			return [eventList, eventIndex];
		}
	} catch (error) {
		Logger("Could Not Load Offline Race Event", error, true);
	}

	return [[], -1];
}