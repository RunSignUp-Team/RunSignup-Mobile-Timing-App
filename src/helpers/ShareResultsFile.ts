import * as Mailer from "expo-mail-composer";
import { AppMode } from "../components/AppContext";
import { GetResultsFilePath, GetTimingFilePath } from "./FSHelper";
import GetOfflineEvent from "./GetOfflineEvent";
import GetLocalRaceEvent, { DefaultEventData } from "./GetLocalRaceEvent";
import GetBackupEvent from "./GetBackupEvent";

/** Open mail app with file path as attachment */
export default async function ShareResultsFile(raceID: number, eventID: number, time: number, appMode: AppMode): Promise<Mailer.MailComposerResult> {
	const resultsFilePath = GetResultsFilePath(raceID, eventID, time, appMode);
	const timingFilePath = GetTimingFilePath(raceID, eventID, time, appMode);

	let body = "";
	if (appMode === "Online" || appMode === "Backup") {
		let [raceList, raceIndex, eventIndex] = DefaultEventData;
		if (appMode === "Online") {
			[raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(raceID, eventID);
		} else {
			[raceList, raceIndex, eventIndex] = await GetBackupEvent(raceID, eventID);
		}

		if (raceIndex >= 0 && eventIndex >= 0 && raceList[raceIndex].events[eventIndex].name) {
			const raceName = raceList[raceIndex].name;
			const eventName = raceList[raceIndex].events[eventIndex].name;
			body = `Attached are results and timing data from:\n\n${raceName}\n${eventName}`;
		}
	} else {
		const [eventList, eventIndex] = await GetOfflineEvent(time);
		if (eventIndex >= 0 && eventList[eventIndex].name) {
			const eventName = eventList[eventIndex].name;
			body = `Attached are results and timing data from:\n\n${eventName}`;
		}
	}

	return new Promise((resolve, reject) => {
		const subject = "RaceDay Mobile Timing Results";

		Mailer.composeAsync({
			subject: subject,
			body: body,
			attachments: [resultsFilePath, timingFilePath]
		}).then((value) => {
			resolve(value);
		}).catch((error) => {
			reject(error);
		});
	});
}