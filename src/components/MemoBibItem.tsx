import React, { memo } from "react";
import { Alert, Text, TouchableOpacity } from "react-native";
import { BibObject } from "../screens/FinishLineMode";
import { globalstyles, GRAY_COLOR, GREEN_COLOR, MEDIUM_FONT_SIZE, SMALL_FONT_SIZE } from "./styles";

interface Props {
	bibObject: BibObject,
	time: string,
	handleBibTap: (bib: number) => void,
	alreadyEntered: boolean,
	checkerBibsRef: React.MutableRefObject<Array<number>>,
}

const bibTapLogic = (props: Props): void => {
	if (props.alreadyEntered) {
		Alert.alert(
			"Already Entered",
			`You have already entered bib ${props.bibObject.bib} at place ${props.checkerBibsRef.current.indexOf(props.bibObject.bib) + 1}. Are you sure you want to enter bib ${props.bibObject.bib} again? This will clear the previous bib entry at place ${props.checkerBibsRef.current.indexOf(props.bibObject.bib) + 1}.`,
			[
				{
					text: "Cancel",
					style: "cancel",
				},
				{
					text: "Re-Enter",
					onPress: (): void => {
						props.handleBibTap(props.bibObject.bib);
					}
				}
			]
		);
	} else {
		props.handleBibTap(props.bibObject.bib);
	}
};

const BibRenderItem = (props: Props): React.ReactElement => {
	return (
		<TouchableOpacity activeOpacity={1} style={globalstyles.gridBibContainer}>
			<TouchableOpacity
				style={[globalstyles.gridBibButton, {backgroundColor: props.alreadyEntered ? GRAY_COLOR : GREEN_COLOR}]}
				onPress={(): void => {
					bibTapLogic(props);
				}}

				// User Info Alert
				onLongPress={(): void => {
					Alert.alert(
						"Participant Information",
						`Bib Number: ${props.bibObject.bib}\nName: ${props.bibObject.name}\nAge: ${props.bibObject.age ?? "Not Set"}\nGender: ${props.bibObject.gender ?? "Not Set"}`,
						[
							{ text: "Cancel", style: "cancel" },
							{ 
								text: "Record Time",
								style: "default",
								onPress: (): void => {
									bibTapLogic(props);
								}
							}
						]
					);
				}}
			>
				<Text style={[globalstyles.gridBibText, {fontSize: props.bibObject.bib.toString().length > 6 ? SMALL_FONT_SIZE : MEDIUM_FONT_SIZE}]}>{props.bibObject.bib}</Text>
				{props.time ? <Text style={globalstyles.gridTimeText}>{props.time}</Text> : null}
			</TouchableOpacity>
		</TouchableOpacity>
	);
};

/** Memo Bib Item for Alt Finish Line Mode */
export const MemoBibItem = memo(BibRenderItem);