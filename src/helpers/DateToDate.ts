import AddLeadingZeros from "./AddLeadingZeros";

export default function DateToDate(date: Date): [string, string, string] {
	const year = date.getFullYear().toString();
	const month = AddLeadingZeros(date.getMonth()+1);
	const day = AddLeadingZeros(date.getDate());
	return [year, month, day];
}