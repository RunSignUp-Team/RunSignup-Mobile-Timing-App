// Add leading zeros (ex. 0 -> 00, or 3 -> 03)
export default function addLeadingZeros(number: number): string {
	return number <= 9 ? `0${number}` : number.toString().substring(0,2);
}