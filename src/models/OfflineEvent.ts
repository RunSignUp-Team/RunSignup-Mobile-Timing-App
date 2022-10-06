export interface OfflineEvent {
	/** The creation time of the offline event, used as a unique ID */
	time: number,
	/** Event Name, set by the user */
	name: string,
	/** The real start time of the event, set when the user starts the event */
	real_start_time: number,
	/** The array of Finish Times for the event (in milliseconds) */
	finish_times: Array<number>,
	/** The array of bibs recorded in Finish Line Mode */
	bib_nums: Array<number>,
	/** The array of bibs recorded in Chute Mode */
	checker_bibs: Array<number>,
}