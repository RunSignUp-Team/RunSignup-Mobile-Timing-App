import React, { memo } from "react";
import { Event } from "../screens/EventsListScreen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import MainButton from "./MainButton";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
	item: Event,
	setEventID(id: number): void,
	setEventTitle(title: string): void;
	navigationRef: {
		current: ScreenNavigationProp
	};

}

export default function EventsListRenderItem(props: Props) {

	return (
		<MainButton text={`${props.item.id}. ${props.item.title} (${props.item.start_time})`} listButton
			onPress={() => {
				props.setEventID(props.item.event_id);
				props.setEventTitle(props.item.title);
				props.navigationRef.current.navigate("ModeScreen");
			}} />
	);
}

export const MemoEventsListItem = memo(EventsListRenderItem);
