import * as Mailer from "expo-mail-composer";
import { AppMode } from "../components/AppContext";
import GetLocalRaceEvent from "./GetLocalRaceEvent";

/** Get support via mail */
export default async function GetSupport(raceID: number, eventID: number, email: string, appMode: AppMode): Promise<Mailer.MailComposerResult> {
	let raceName = "";
	let eventName = "";

	let body = `Please describe your issue below:




	-------`;

	if (appMode === "Online" || appMode === "Backup") {
		const [raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(raceID, eventID);
		if (raceList && raceList.length > 0 && raceList[raceIndex]?.events[eventIndex]?.name) {
			raceName = raceList[raceIndex].name;
			eventName = raceList[raceIndex].events[eventIndex].name;
			body += `\nRace: ${raceName}\nEvent: ${eventName}`;
		}
	
		body += `
		Race Results: https://runsignup.com/Race/${raceID}/Results/Dashboard/EditIndividualResults
		Email: ${email}
		-------
		`;
	} else {
		body += "\nOffline Mode";
	}

	return new Promise((resolve, reject) => {
		const subject = `${raceName} RaceDay Mobile Timing Support`;

		Mailer.composeAsync({
			subject: subject,
			body: body,
			recipients: ["info@runsignup.com"]
		}).then((value) => {
			resolve(value);
		}).catch((error) => {
			reject(error);
		});
	});
}