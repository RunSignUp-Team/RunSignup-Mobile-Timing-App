import addLeadingZeros from "./AddLeadingZeros";

export default function getClockTime(timeInMils: number) {
	if (timeInMils !== undefined) {
		// If empty or incorrect time
		if (timeInMils === Number.MAX_SAFE_INTEGER) {
			return "";
		}
		if (timeInMils === -1) {
			return "NaN";
		}
		return `${addLeadingZeros(Math.floor((timeInMils / 3600000) % 24))}:${addLeadingZeros(Math.floor((timeInMils / 60000) % 60))}:${addLeadingZeros(Math.floor((timeInMils / 1000) % 60))}.${isNaN(parseInt(addLeadingZeros(parseInt(timeInMils.toString().substring(timeInMils.toString().length-3, timeInMils.toString().length-1)) % 1000))) ? "00" : addLeadingZeros(parseInt(timeInMils.toString().substring(timeInMils.toString().length-3, timeInMils.toString().length-1)) % 1000)}`;
	}
}