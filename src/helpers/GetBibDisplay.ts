export default function GetBibDisplay (bib: number): string {
	if (bib === -1) {
		// Return empty string if invalid data
		return "";
	} else {
		return bib.toString();
	}
}