import * as Mailer from "expo-mail-composer";
import GetLocalRaceEvent from "./GetLocalRaceEvent";

/** Get support via mail */
export default async function GetSupport(raceID: number, eventID: number, email: string): Promise<Mailer.MailComposerResult> {
	let body = `Please describe your issue below:




	-------`;

	const [raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(raceID, eventID);
	if (raceList && raceList.length > 0 && raceList[raceIndex]?.events[eventIndex]?.name) {
		const raceName = raceList[raceIndex].name;
		const eventName = raceList[raceIndex].events[eventIndex].name;
		body += `\nRace: ${raceName}\nEvent: ${eventName}`;
	}

	body += `
	Race Results: https://runsignup.com/Race/${raceID}/Results/Dashboard/EditIndividualResults
	Email: ${email}
	-------
	`;

	return new Promise((resolve, reject) => {
		const subject = "RaceDay Mobile Timing Support";

		Mailer.composeAsync({
			subject: subject,
			body: body,
		}).then((value) => {
			resolve(value);
		}).catch((error) => {
			reject(error);
		});
	});
}