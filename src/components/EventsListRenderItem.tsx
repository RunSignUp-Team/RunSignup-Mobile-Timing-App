import React, { memo } from "react";
import { Text, TouchableOpacity } from "react-native";
import { Event } from "../screens/EventsListScreen";
import { globalstyles } from "./styles";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";

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
		<TouchableOpacity
			onPress={() => {
				props.setEventID(props.item.event_id);
				props.setEventTitle(props.item.title);
				props.navigationRef.current.navigate("ModeScreen");
			}}
			style={globalstyles.listItem}>
			<Text style={globalstyles.listText}>
				{props.item.id + ". " + props.item.title + " (" + props.item.start_time + ")"}
			</Text>
		</TouchableOpacity>
	);
}

export const MemoEventsListItem = memo(EventsListRenderItem);
