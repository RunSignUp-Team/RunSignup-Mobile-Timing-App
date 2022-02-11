import React, { memo } from "react";
import { Text, TouchableOpacity, Alert } from "react-native";
import { OfflineEvent } from "../screens/OfflineEventsScreen";
import { globalstyles } from "./styles";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
	online: boolean,
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

export default function OfflineEventsRenderItem(props: Props) {
	return (
		<TouchableOpacity
			style={globalstyles.listItem}
			onPress={() => {
				if (!props.online) {
					props.setEventTitle(props.item.name);
					props.setTime(props.item.time);
					props.navigationRef.current.navigate("ModeScreen");
				} else {
					Alert.alert(
						"Assign Event",
						`Are you sure you want to assign the data stored in ${props.item.name} to ${props.eventTitle}? This cannot be undone and will replace any existing data.`,
						[
							{ text: "Cancel", onPress: () => {return;} },
							{
								text: "Assign",
								onPress: () => {
									props.assignData(props.item);
								},
								style: "destructive",
							},
							
						]
					);
				}
			}}>
			<Text style={globalstyles.listText}>{props.item.name}</Text>
		</TouchableOpacity>
	);
}

export const MemoOfflineEventsItem = memo(OfflineEventsRenderItem);
