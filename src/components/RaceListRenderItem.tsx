import React, { memo } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import MainButton from "./MainButton";
import { Race } from "../models/Race";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
	index: number,
	item: Race,
	navigationRef: {
		current: ScreenNavigationProp,
	},
	setRaceID(race_id: number): void,
}

export default function RaceListRenderItem(props: Props): React.ReactElement {


	return (
		<MainButton 
			text={props.item.title} 
			subtitle={`${props.item.next_date}`}
			listButton={props.index + 1}
			onPress={(): void => {
				props.setRaceID(props.item.race_id);
				props.navigationRef.current.navigate("EventsList");
			}} />
	);
}

export const MemoRaceListItem = memo(RaceListRenderItem);