import * as FileSystem from "expo-file-system";
import { AppMode } from "../components/AppContext";
import { VRecords } from "../screens/ResultsMode";
import AddLeadingZeros from "./AddLeadingZeros";
import { getStartTime, ParticipantDetails } from "./APICalls";
import DateToDate from "./DateToDate";
import GetBackupEvent from "./GetBackupEvent";
import GetClockTime from "./GetClockTime";
import GetOfflineEvent from "./GetOfflineEvent";
import Logger from "./Logger";

/** Get file path for specific event results */
export const GetResultsFilePath = (raceID: number, eventID: number, time: number, appMode: AppMode): string => {
	if (appMode === "Online") {
		return FileSystem.documentDirectory + `results_${raceID}_${eventID}.csv`;
	} else if (appMode ==="Backup") {
		return FileSystem.documentDirectory + `results_backup_${raceID}_${eventID}.csv`;
	} else {
		return FileSystem.documentDirectory + `results_${time}.csv`;
	}
};

/** Get file path for specific event timing data */
export const GetTimingFilePath = (raceID: number, eventID: number, time: number, appMode: AppMode): string => {
	if (appMode === "Online") {
		return FileSystem.documentDirectory + `timing_${raceID}_${eventID}.txt`;
	} else if (appMode ==="Backup") {
		return FileSystem.documentDirectory + `timing_backup_${raceID}_${eventID}.csv`;
	} else {
		return FileSystem.documentDirectory + `timing_${time}.txt`;
	}
};

/** Write files to local storage */
export const WriteFiles = async (raceID: number, eventID: number, records: VRecords, participants: Array<ParticipantDetails>, appMode: AppMode, time: number): Promise<void> => {
	// Timing Data File
	let timingString = "";

	let realStartTime = 0;
	if (appMode === "Online") {
		const startTime = await getStartTime(raceID, eventID);
		const startTimeDate = new Date(startTime.replace(" ", "T"));
		if (startTime) {
			realStartTime = startTimeDate.getTime();
		}
	} else if (appMode === "Backup") {
		const [raceList, raceIndex, eventIndex] = await GetBackupEvent(raceID, eventID);
		if (raceIndex >= 0 && eventIndex >= 0) {
			const event = raceList[raceIndex].events[eventIndex];
			if (event.real_start_time > 0) {
				realStartTime = event.real_start_time;
			}
		}
	} else {
		const [eventList, eventIndex] = await GetOfflineEvent(time);
		if (eventIndex >= 0) {
			const event = eventList[eventIndex];
			if (event.real_start_time > 0) {
				realStartTime = event.real_start_time;
			}
		}
	}

	for (let i = 0; i < records.length; i++) {
		const bib = records[i][0];
		let dateString = "";
		if (!(records[i][1] < 0) && !(records[i][1] === Number.MAX_SAFE_INTEGER)) {
			const time = new Date(records[i][1] + realStartTime);

			const [year, month, day] = DateToDate(time);

			const hour = AddLeadingZeros(time.getHours());
			const minutes = AddLeadingZeros(time.getMinutes());
			const seconds = AddLeadingZeros(time.getSeconds());
			let milli = AddLeadingZeros(time.getMilliseconds());

			while (milli.length < 3) {
				milli += "0";
			}

			dateString = `${year}-${month}-${day} ${hour}:${minutes}:${seconds}.${milli}`;
		}


		timingString += `${bib},${dateString}\n`;
	}

	// Results File
	let resultsString = "";

	if (appMode === "Online" || appMode === "Backup") {
		resultsString = "Place,Bib,Name,Gender,Age,City,State,Finish Time\n";
	} else {
		resultsString = "Bib,Finish Time\n";
	}

	for (let i = 0; i < records.length; i++) {
		const bib = records[i][0];
		const time = records[i][1];

		let name = "No Name";
		let gender = "N/A";
		let age = "N/A";
		let city = "N/A";
		let state = "N/A";
		if (appMode === "Online" || appMode === "Backup" && bib > 0) {
			const p = participants.find((participant) => participant.bib_num === bib);
			if (p) {
				name = `${p.user.first_name} ${p.user.last_name}`;
				gender = p.user.gender ? p.user.gender : "N/A";
				age = p.age ? p.age.toString() : "N/A";
				city = p.user.address.city ? p.user.address.city : "N/A";
				state = p.user.address.state ? p.user.address.state : "N/A";
			}
		}

		if (appMode === "Online" || appMode === "Backup") {
			resultsString += `${i + 1},${bib},${name},${gender},${age},${city},${state},${GetClockTime(time)}\n`;
		} else {
			resultsString += `${bib},${GetClockTime(time)}\n`;
		}
	}

	try {
		await FileSystem.writeAsStringAsync(GetTimingFilePath(raceID, eventID, time, appMode), timingString);
		await FileSystem.writeAsStringAsync(GetResultsFilePath(raceID, eventID, time, appMode), resultsString);
	} catch (error) {
		Logger("Failed to write results.", error, true);
	}
};

/** Delete files from local storage */
export const DeleteFiles = async (raceID: number, eventID: number, time: number, appMode: AppMode): Promise<void> => {
	try {
		await FileSystem.deleteAsync(GetTimingFilePath(raceID, eventID, time, appMode));
		await FileSystem.deleteAsync(GetResultsFilePath(raceID, eventID, time, appMode));
	} catch (error) {
		Logger("Failed to remove results.", error, true);
	}
};