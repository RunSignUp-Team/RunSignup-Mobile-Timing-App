import React, { useEffect, useState } from "react";
import BugsnagHelper from "../helpers/BugsnagHelper";

export interface Context {
	online: boolean;
	raceID: number;
	eventID: number;
	eventTitle: string;
	time: number;
	email: string;
	setOnline(online: boolean): void;
	setRaceID(id: number): void;
	setEventID(id: number): void;
	setEventTitle(title: string): void;
	setTime(time: number): void;
	setEmail(email: string): void;
}

export const AppContext = React.createContext<Context>({
	online: false,
	raceID: -1,
	eventID: -1,
	eventTitle: "",
	time: -1,
	email: "",
	setOnline: () => { return; },
	setRaceID: () => { return; },
	setEventID: () => { return; },
	setEventTitle: () => { return; },
	setTime: () => { return; },
	setEmail: () => { return; }
});

interface Props {
	children: React.ReactChild
}

export default function AppProvider(props: Props): React.ReactElement {
	// Global variables
	const [online, setOnline] = useState(false);
	const [raceID, setRaceID] = useState(0);
	const [eventID, setEventID] = useState(0);
	const [eventTitle, setEventTitle] = useState("");
	const [time, setTime] = useState(0);
	const [email, setEmail] = useState("");

	// Update Bugsnag Helper
	useEffect(() => {
		BugsnagHelper.setRaceId(raceID);
	}, [raceID]);

	useEffect(() => {
		BugsnagHelper.setEmail(email);
	}, [email]);

	useEffect(() => {
		BugsnagHelper.setEventId(eventID);
	}, [eventID]);

	const contextVariables: Context = {
		online: online,
		raceID: raceID,
		eventID: eventID,
		eventTitle: eventTitle,
		time: time,
		email: email,
		setOnline,
		setRaceID,
		setEventID,
		setEventTitle,
		setTime,
		setEmail
	};

	return (
		<AppContext.Provider value={contextVariables}>
			{props.children}
		</AppContext.Provider>
	);
}