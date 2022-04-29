import AsyncStorage from "@react-native-async-storage/async-storage";
import { Race } from "../models/Race";

/** 
 * Get the local racelist, race index, and event index if possible 
*/
export default async function GetLocalRaceEvent(raceID: number, eventID: number): Promise<[Array<Race>, number, number]> {    
	const response = await AsyncStorage.getItem("onlineRaces");
	if (response !== null) {
		const raceList = JSON.parse(response);
		let raceIndex = -1;
		let eventIndex = -1;
    
		for (let i = 0; i < raceList.length; i++) {
			if (raceList[i].race_id === raceID) {
				for (let j = 0; j < raceList[i].events.length; j++) {
					if (raceList[i].events[j].event_id === eventID) {
						// Found correct race/event
						raceIndex = i;
						eventIndex = j;
						return [raceList, raceIndex, eventIndex];
					}
				}
			}
		}
    
	}

	return [[], -1, -1];
}