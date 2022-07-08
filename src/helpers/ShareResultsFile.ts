import * as Mailer from "expo-mail-composer";
import { GetResultsFilePath, GetTimingFilePath } from "./FSHelper";
import GetLocalOfflineEvent from "./GetLocalOfflineEvent";
import GetLocalRaceEvent from "./GetLocalRaceEvent";

/** Open mail app with file path as attachment */
export default async function ShareResultsFile(raceID: number, eventID: number, time: number, online: boolean): Promise<Mailer.MailComposerResult> {
	const resultsFilePath = GetResultsFilePath(raceID, eventID, time, online);
	const timingFilePath = GetTimingFilePath(raceID, eventID, time, online);

	let body = "";
	if (online) {
		const [raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(raceID, eventID);
		if (raceList && raceList.length > 0 && raceList[raceIndex]?.events[eventIndex]?.name) {
			const raceName = raceList[raceIndex].name;
			const eventName = raceList[raceIndex].events[eventIndex].name;
			body = `Attached are results and timing data from:\n\n${raceName}\n${eventName}`;
		}
	} else {
		const [eventList, eventIndex] = await GetLocalOfflineEvent(time);
		if (eventList && eventList.length > 0 && eventList[eventIndex]?.name) {
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