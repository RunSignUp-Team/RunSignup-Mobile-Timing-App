import addLeadingZeros from "./AddLeadingZeros";

export default function GetClockTime(timeInMils: number): string {
	// If empty or incorrect time
	if (timeInMils === undefined || timeInMils === null || timeInMils === Number.MAX_SAFE_INTEGER) {
		return "";
	}
	if (timeInMils === -1) {
		return "NaN";
	}

	const timeString = timeInMils.toString();

	const GetTwoChars = (str: string): string => {
		if (str.length > 2) {
			return str.substring(0, 2);
		} else if (str.length === 2) {
			return "0" + str.substring(0, 1);
		} else {
			return addLeadingZeros(parseInt(str));
		}
	};

	const hoursString = addLeadingZeros(Math.floor((timeInMils / 3600000) % 24));
	const minutesString = addLeadingZeros(Math.floor((timeInMils / 60000) % 60));
	const secondsString = addLeadingZeros(Math.floor((timeInMils / 1000) % 60));
	const millisecondsString = GetTwoChars(timeString.substring(timeString.length-3));

	return `${hoursString}:${minutesString}:${secondsString}.${millisecondsString}`;
}