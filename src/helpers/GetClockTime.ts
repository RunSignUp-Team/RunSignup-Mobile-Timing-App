import addLeadingZeros from "./AddLeadingZeros";

export default function getClockTime(timeInMils: number, timer?: boolean): string {
	if (timeInMils) {
		// If empty or incorrect time
		if (timeInMils === Number.MAX_SAFE_INTEGER) {
			return "";
		}
		if (timeInMils === -1) {
			return "NaN";
		}

		const timeString = timeInMils.toString();

		const GetTwoChars = (str: string): string => {
			if (str.length > 2) {
				return str.substring(0, 2);
			} else {
				return addLeadingZeros(parseInt(str));
			}
		};

		const hoursString = addLeadingZeros(Math.floor((timeInMils / 3600000) % 24));
		const minutesString = addLeadingZeros(Math.floor((timeInMils / 60000) % 60));
		const secondsString = addLeadingZeros(Math.floor((timeInMils / 1000) % 60));
		const millisecondsString = GetTwoChars(timeString.substring(timeString.length-3));

		return `${hoursString}:${minutesString}:${secondsString}.${millisecondsString}`;
	} else {
		if (timer) {
			return "00:00:00.00";
		}
		return "";
	}
}