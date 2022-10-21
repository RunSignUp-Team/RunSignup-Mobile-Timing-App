export interface Event {
	/** Event Name */
	name: string,
	/** The official start time of the event, set by the race director at RSU */
	start_time: string,
	/** Event ID */
	event_id: number,
	/** The real start time of the event, set when the user starts the event */
	real_start_time: number,
	/** The array of Finish Times for the event (in milliseconds) */
	finish_times: Array<number>,
	/** The array of bibs recorded in Finish Line Mode */
	checker_bibs: Array<number>,
	/** The array of bibs recorded in Chute Mode */
	bib_nums: Array<number>,
}