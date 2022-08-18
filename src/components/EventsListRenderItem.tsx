import React, { memo } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import MainButton from "./MainButton";
import { Event } from "../models/Event";
import { getResultSets } from "../helpers/APICalls";
import CreateAPIError from "../helpers/CreateAPIError";
import { Alert } from "react-native";
import { OpenResultsLink } from "../screens/ResultsMode";
import { AppMode } from "./AppContext";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
	index: number,
	item: Event,
	raceID: number,
	appMode: AppMode,
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
			text={props.item.name} 
			subtitle={`${startDate} - ${startTime}`}
			listButton={props.index + 1}
			onPress={async (): Promise<void> => {
				if (props.appMode === "Online") {
					try {
						const resultSets = await getResultSets(props.raceID, props.item.event_id);
						if (resultSets.individual_results_sets.length > 1) {
							Alert.alert(
								"Multiple Result Sets",
								`Multiple Result Sets detected at RunSignup for the "${props.item.name}" event. RaceDay Mobile Timing does not currently support Multiple Result sets. Please remove the extra Result Sets from RunSignup and try again.`,
								[
									{ text: "Cancel", style: "cancel" },
									{
										text: "Manage Result Sets",
										onPress: (): void => {
											OpenResultsLink(props.raceID);
										}
									},
								],
							);
						} else {
							Alert.alert(
								"Warning",
								"You are in the \"Score & Publish Results\" App Flow. All result sets for this event will be controlled by RaceDay Mobile Timing. Do not use on events scored using other scoring software. Any results from other scoring software will be deleted.",
								[
									{ 
										text: "I Understand", 
										style: "destructive",
										onPress: (): void => {
											props.setEventID(props.item.event_id);
											props.setEventTitle(props.item.name);
											props.navigationRef.current.navigate("ModeScreen");		
										}
									},
									{ text: "Cancel", style: "default" }
								]
							);
						}
					} catch (error) {
						CreateAPIError("Result Sets Check", error, true);
					}
				} else {
					props.setEventID(props.item.event_id);
					props.setEventTitle(props.item.name);
					props.navigationRef.current.navigate("ModeScreen");
				}
			}} />
	);
}

export const MemoEventsListItem = memo(EventsListRenderItem);
