import * as FileSystem from "expo-file-system";
import { VRecords } from "../screens/ResultsMode";
import AddLeadingZeros from "./AddLeadingZeros";
import { getStartTime, ParticipantDetails } from "./APICalls";
import DateToDate from "./DateToDate";
import GetClockTime from "./GetClockTime";
import GetLocalOfflineEvent from "./GetLocalOfflineEvent";
import Logger from "./Logger";

/** Get file path for specific event results */
export const GetResultsFilePath = (raceID: number, eventID: number, time: number, online: boolean): string => {
	if (online) {
		return FileSystem.documentDirectory + `results_${raceID}_${eventID}.csv`;
	} else {
		return FileSystem.documentDirectory + `results_${time}.csv`;
	}
};

/** Get file path for specific event timing data */
export const GetTimingFilePath = (raceID: number, eventID: number, time: number, online: boolean): string => {
	if (online) {
		return FileSystem.documentDirectory + `timing_${raceID}_${eventID}.txt`;
	} else {
		return FileSystem.documentDirectory + `timing_${time}.txt`;
	}
};

/** Write files to local storage */
export const WriteFiles = async (raceID: number, eventID: number, records: VRecords, participants: Array<ParticipantDetails>, online: boolean, time: number): Promise<void> => {
	let resultsString = "";
	if (online) {
		resultsString = "Place,Bib,Name,Gender,Age,City,State,Finish Time\n";
	} else {
		resultsString = "Bib,Finish Time\n";
	}

	let timingString = "";

	// Results File
	for (let i = 0; i < records.length; i++) {
		const bib = records[i][0];
		const time = records[i][1];

		let name = "No Name";
		let gender = "N/A";
		let age = "N/A";
		let city = "N/A";
		let state = "N/A";
		if (online && bib > 0) {
			const p = participants.find((participant) => participant.bib_num === bib);
			if (p) {
				name = `${p.user.first_name} ${p.user.last_name}`;
				gender = p.user.gender ? p.user.gender : "N/A";
				age = p.age ? p.age.toString() : "N/A";
				city = p.user.address.city ? p.user.address.city : "N/A";
				state = p.user.address.state ? p.user.address.state : "N/A";
			}
		}
		
		if (online) {
			resultsString += `${i+1},${bib},${name},${gender},${age},${city},${state},${GetClockTime(time)}\n`;
		} else {
			resultsString += `${bib},${GetClockTime(time)}\n`;
		}
	}

	// Timing Data File
	let realStartTime = 0;
	if (online) {
		const startTime = await getStartTime(raceID, eventID);
		const startTimeDate = new Date(startTime.replace(" ","T"));
		if (startTime) {
			realStartTime = startTimeDate.getTime();
		}
	} else {
		const [eventList, eventIndex] = await GetLocalOfflineEvent(time);
		const event = eventList[eventIndex];
		if (event?.real_start_time > 0) {
			realStartTime = event.real_start_time;
		}
	}

	for (let i = 0; i < records.length; i++) {
		const bib = records[i][0];
		const time = new Date(records[i][1] + realStartTime);

		const [year, month, day] = DateToDate(time);

		const hour = AddLeadingZeros(time.getHours());
		const minutes = AddLeadingZeros(time.getMinutes());
		const seconds = AddLeadingZeros(time.getSeconds());
		let milli = AddLeadingZeros(time.getMilliseconds());

		while (milli.length < 3) {
			milli += "0";
		}

		const dateString = `${year}-${month}-${day} ${hour}:${minutes}:${seconds}.${milli}`;
		
		timingString += `${bib}\t${dateString}\n`;
	}

	try {
		await FileSystem.writeAsStringAsync(GetResultsFilePath(raceID, eventID, time, online), resultsString);
		await FileSystem.writeAsStringAsync(GetTimingFilePath(raceID, eventID, time, online), timingString);
	} catch (error) {
		Logger("Failed to write results.", error, true);
	}
};

/** Delete files from local storage */
export const DeleteFiles = async (raceID: number, eventID: number, time: number, online: boolean): Promise<void> => {
	try {
		await FileSystem.deleteAsync(GetResultsFilePath(raceID, eventID, time, online));
		await FileSystem.deleteAsync(GetTimingFilePath(raceID, eventID, time, online));
	} catch (error) {
		Logger("Failed to remove results.", error, true);
	}
};