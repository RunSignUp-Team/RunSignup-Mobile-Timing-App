import React, { memo } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import MainButton from "./MainButton";
import { Event } from "../models/Event";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
	item: Event,
	setEventID(id: number): void,
	setEventTitle(title: string): void;
	navigationRef: {
		current: ScreenNavigationProp
	};

}

export default function EventsListRenderItem(props: Props): React.ReactElement {

	// Convert 13:25 to 1:25 PM
	const militaryToStandard = (militaryTime: string): string => {
		const timeSplit = militaryTime.split(":");
		if (parseInt(timeSplit[0]) !== 12 && parseInt(timeSplit[0]) !== 0) {
			// Normal Time
			return (parseInt(timeSplit[0]) % 12) + ":" + timeSplit[1] + (parseInt(timeSplit[0]) >= 12 ? " PM" : " AM");
		} else if (parseInt(timeSplit[0]) === 0) {
			// 00:00
			return "12:00 AM";
		} else {
			// 12:00
			return "12:00 PM";
		}
	};

	const startTimeSplit = props.item.start_time.split(" ");
	const startDate = startTimeSplit[0];
	const startTime = militaryToStandard(startTimeSplit[1]);

	return (
		<MainButton 
			text={`${props.item.id}.\t${props.item.title}`} 
			subtitle={`\t${startDate} - ${startTime}`}
			listButton
			onPress={(): void => {
				props.setEventID(props.item.event_id);
				props.setEventTitle(props.item.title);
				props.navigationRef.current.navigate("ModeScreen");
			}} />
	);
}

export const MemoEventsListItem = memo(EventsListRenderItem);
