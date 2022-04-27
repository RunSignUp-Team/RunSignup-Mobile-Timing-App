import React, { memo } from "react";
import { Race } from "../screens/RaceListScreen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import MainButton from "./MainButton";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
	item: Race,
	navigationRef: {
		current: ScreenNavigationProp,
	},
	setRaceID(race_id: number): void,
}

export default function RaceListRenderItem(props: Props): React.ReactElement {

	return (
		<MainButton text={props.item.id + ". " + props.item.title + " (" + props.item.next_date + ")"} listButton
			onPress={(): void => {
				props.setRaceID(props.item.race_id);
				props.navigationRef.current.navigate("EventsList");
			}} />
	);
}

export const MemoRaceListItem = memo(RaceListRenderItem);