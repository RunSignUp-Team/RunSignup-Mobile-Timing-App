import React, { useState } from "react";

interface Context {
	online: boolean;
	raceID: number;
	eventID: number;
	eventTitle: string;
	time: number;
	setOnline(online: boolean): void;
	setRaceID(id: number): void;
	setEventID(id: number): void;
	setEventTitle(title: string): void;
	setTime(time: number): void;
}

export const AppContext = React.createContext<Context>({
	online: false,
	raceID: -1,
	eventID: -1,
	eventTitle: "",
	time: -1,
	setOnline: () => {return;},
	setRaceID: () => {return;},
	setEventID: () => {return;},
	setEventTitle: () => {return;},
	setTime: () => {return;}
});

interface Props {
	children: React.ReactChild
}

export default function AppProvider(props: Props) {
	// Global variables
	const [online, setOnline] = useState(false);
	const [raceID, setRaceID] = useState(0);
	const [eventID, setEventID] = useState(0);
	const [eventTitle, setEventTitle] = useState("");
	const [time, setTime] = useState(0);

	const contextVariables: Context = {
		online: online,
		raceID: raceID,
		eventID: eventID,
		eventTitle: eventTitle,
		time: time,
		setOnline,
		setRaceID,
		setEventID,
		setEventTitle,
		setTime,
	};

	return (
		<AppContext.Provider value={contextVariables}>
			{props.children}
		</AppContext.Provider>
	);
}