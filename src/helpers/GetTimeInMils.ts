// Supported Time Formats
// hh:mm:ss:ms | hh:mm:ss.ms (equivalent)
// hh:mm:ss
//    mm:ss
//    mm:ss.ms
//       ss.ms

// Returns float value of time string
export default function getTimeInMils(clockTime: string): number {
	if (/^\d{1,2}(:\d{1,2})?(:\d{1,2})?(\.\d{1,2})?$/gm.test((clockTime))) {
		// Clock Time split into array
		const clockSplit: Array<string> = clockTime.split(/[:.]+/);

		// If format is 00:00:00:00, effectively convert it to 00:00:00.00,
		// so at the switch statement, there are a maximum of three elements in the array,
		// with ss.ms being treated as a decimal number
		if (clockSplit.length === 4) {
			clockSplit[2] = clockSplit[2] + "." + clockSplit[3];
			clockSplit.pop();
		}

		// Final return value
		let timeInMils: number;

		const timeSplit: Array<number> = [];
		// Get elements in clockSplit as floats
		for (let i = 0; i < clockSplit.length; i++) {
			timeSplit[i] = parseFloat(clockSplit[i]);
		}

		switch (clockSplit.length) {
			case 3:
				timeInMils = timeSplit[0] * 3600000 + timeSplit[1] * 60000 + timeSplit[2] * 1000;
				break;
			case 2:
				timeInMils = timeSplit[0] * 60000 + timeSplit[1] * 1000;
				break;
			default:
				timeInMils = timeSplit[0] * 1000;
				break;
		}
		return timeInMils;
	} else {
		return -1;
	}
}