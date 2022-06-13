import { Event } from "./Event";

export interface Race {
	next_date: string,
	name: string,
	race_id: number,
	events: Array<Event>
}