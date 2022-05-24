

class BugsnagHelper {
	private email = "";
	private raceId = 0;
	private eventId = 0;

	/** Set Email */
	setEmail = (newEmail: string): void => {
		this.email = newEmail;
	};

	/** Set Race ID */
	setRaceId = (raceId: number): void => {
		this.raceId = raceId;
	};

	/** Set Event ID */
	setEventId = (eventId: number): void => {
		this.eventId = eventId;
	};

	/** Get All Info */
	getInfo = (): [number, string, number] => {
		return [this.raceId, this.email, this.eventId];
	};
}

export default new BugsnagHelper();