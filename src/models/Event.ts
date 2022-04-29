export interface Event {
	id: number,
	title: string,
	start_time: string,
	event_id: number,
	real_start_time: number,
	finish_times: Array<number>,
	checker_bibs: Array<number>,
	bib_nums: Array<number>,
}