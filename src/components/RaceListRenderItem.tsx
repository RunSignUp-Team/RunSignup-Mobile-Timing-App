import React, { memo } from "react";
import { Text, TouchableOpacity } from "react-native";
import { Race } from "../screens/RaceListScreen";
import { globalstyles } from "./styles";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
	item: Race,
	navigationRef: {
		current: ScreenNavigationProp,
	},
	setRaceID(race_id: number): void,
}

export default function RaceListRenderItem(props: Props) {

	return (
		<TouchableOpacity
			onPress={() => {
				props.setRaceID(props.item.race_id);
				props.navigationRef.current.navigate("EventsList");
			}}
			style={globalstyles.listItem}>
			<Text style={globalstyles.listText}>
				{props.item.id + ". " + props.item.title + " (" + props.item.next_date + ")"}
			</Text>
		</TouchableOpacity>
	);
}

export const MemoRaceListItem = memo(RaceListRenderItem);
