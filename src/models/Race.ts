import { Event } from "./Event";

export interface Race {
	/** The Next Date for the Race, set by the race director at RSU */
	next_date: string,
	/** Race Name */
	name: string,
	/** Race ID */
	race_id: number,
	/** Array of Events associated with this Race */
	events: Array<Event>
}