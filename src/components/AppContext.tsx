import React, { useEffect, useState } from "react";
import BugsnagHelper from "../helpers/BugsnagHelper";

export type AppMode = "Online" | "Offline" | "Backup";

export interface Context {
	appMode: AppMode;
	raceID: number;
	eventID: number;
	eventTitle: string;
	time: number;
	email: string;
	setAppMode(appMode: AppMode): void;
	setRaceID(id: number): void;
	setEventID(id: number): void;
	setEventTitle(title: string): void;
	setTime(time: number): void;
	setEmail(email: string): void;
}

export const AppContext = React.createContext<Context>({
	appMode: "Offline",
	raceID: -1,
	eventID: -1,
	eventTitle: "",
	time: -1,
	email: "",
	setAppMode: () => { return; },
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
	const [appMode, setAppMode] = useState<AppMode>("Offline");
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
		appMode: appMode,
		raceID: raceID,
		eventID: eventID,
		eventTitle: eventTitle,
		time: time,
		email: email,
		setAppMode,
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