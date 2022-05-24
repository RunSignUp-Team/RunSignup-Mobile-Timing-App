// Test Formats (Supported)
// hh:mm:ss:ms | hh:mm:ss.ms (equivalent)
// hh:mm:ss
//    mm:ss
//    mm:ss.ms
//       ss.ms
// And all of the above, but with only one digit not two

// Test Formats (Unsupported)
// dd
// dd: | dd.
// :dd | .dd

// Returns float value of time string
export default function GetTimeInMils(clockTime: string): number {
	if (/^(\d{1,2}:){0,2}\d{1,2}((\.|:)\d{1,2})$/gm.test((clockTime))) {
		// Clock Time split into array
		const clockSplit: Array<string> = clockTime.split(/[:.]+/);


		// If format is hh:mm:ss.ms, it is initially stored as [hh, mm, ss, ms],
		// But we want to convert it to [hh, mm, ss.ms]
		// Similarly with mm:ss.ms -> [mm, ss, ms] -> [mm, ss.ms]
		// Similarly with ss.ms -> [ss, ms] -> [ss.ms]
		if (clockSplit.length === 4 || (clockSplit.length >= 2 && clockTime.includes("."))) {
			clockSplit[clockSplit.length - 2] = clockSplit[clockSplit.length - 2] + "." + clockSplit[clockSplit.length - 1];
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