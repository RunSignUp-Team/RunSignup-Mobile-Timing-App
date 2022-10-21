import React, { memo } from "react";
import { Alert } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import MainButton from "./MainButton";
import AddLeadingZeros from "../helpers/AddLeadingZeros";
import DateToDate from "../helpers/DateToDate";
import { AppMode } from "./AppContext";
import { OfflineEvent } from "../models/OfflineEvent";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
	appMode: AppMode,
	index: number,
	item: OfflineEvent,
	navigationRef: {
		current: ScreenNavigationProp,
	},
	eventTitle: string,
	setEventTitle(name: string): void,
	assignData(item: OfflineEvent): void,
	assignBibNums(item: OfflineEvent): void,
	assignFinishTimes(item: OfflineEvent): void,
	setTime(time: number): void,
}

export default function OfflineEventsRenderItem(props: Props): React.ReactElement {

	const time = props.item.time;
	const date = new Date(time);
	const [year, month, day] = DateToDate(date);
	let hour;
	if (date.getHours() === 12 || date.getHours() === 0) {
		hour = 12;
	} else {
		hour = date.getHours() % 12;
	}
	const minutes = AddLeadingZeros(date.getMinutes());
	const ampm = date.getHours() >= 12 ? "PM" : "AM";

	return (
		<MainButton 
			text={props.item.name} 
			listButton={props.index + 1}
			subtitle={`${month}/${day}/${year} - ${hour}:${minutes} ${ampm}`}
			onPress={(): void => {
				if (props.appMode === "Offline") {
					props.setEventTitle(props.item.name);
					props.setTime(props.item.time);
					props.navigationRef.current.navigate("ModeScreen");
				} else {
					Alert.alert(
						"Assign Event",
						`Are you sure you want to assign the data stored in ${props.item.name} to ${props.eventTitle}? This cannot be undone and will replace any existing data.`,
						[
							{ text: "Cancel" },
							{
								text: "Assign",
								onPress: (): void => {
									props.assignData(props.item);
								},
								style: "destructive",
							},

						]
					);
				}
			}} />
	);
}

export const MemoOfflineEventsItem = memo(OfflineEventsRenderItem);