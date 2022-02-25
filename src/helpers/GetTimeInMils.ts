// Returns float value of time string
export default function getTimeInMils(clockTime: string) {
	if (/^(((\d?\d:)?((\d?\d:)\d\d[.]\d\d?)|\d?\d[.]\d\d?)|)$/gm.test((clockTime))) {
		const clockSplit: Array<string> = clockTime.split(/[:]+/);
		let timeInMils: number;
		const timeSplit: Array<number> = [];
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