import { Event } from "./Event";

export interface Race {
	title: string,
	next_date: string,
	race_id: number,
	events: Array<Event>
}