import React, { memo } from "react";
import { Alert, Text, TouchableOpacity } from "react-native";
import { globalstyles, GRAY_COLOR, GREEN_COLOR } from "./styles";

interface Props {
	bib: number,
	time: string,
	handleBibTap: (bib: number) => void,
	alreadyEntered: boolean,
	checkerBibsRef: React.MutableRefObject<Array<number>>,
}

const BibRenderItem = (props: Props): React.ReactElement => {
	return (
		<TouchableOpacity activeOpacity={1} style={globalstyles.altBibContainer}>
			<TouchableOpacity
				style={[globalstyles.altBibButton, {backgroundColor: props.alreadyEntered ? GRAY_COLOR : GREEN_COLOR}]}
				onPress={(): void => {
					if (props.alreadyEntered) {
						Alert.alert(
							"Already Entered",
							`You have already entered bib ${props.bib} at place ${props.checkerBibsRef.current.indexOf(props.bib) + 1}. Are you sure you want to enter bib ${props.bib} again? This will clear the previous bib entry at place ${props.checkerBibsRef.current.indexOf(props.bib) + 1}.`,
							[
								{
									text: "Cancel",
									style: "cancel",
								},
								{
									text: "Re-Enter",
									onPress: (): void => {
										props.handleBibTap(props.bib);
									}
								}
							]
						);
					} else {
						props.handleBibTap(props.bib);
					}
				}}
			>
				<Text style={globalstyles.altBibText}>{props.bib}</Text>
				{props.time ? <Text style={globalstyles.altTimeText}>{props.time}</Text> : null}
			</TouchableOpacity>
		</TouchableOpacity>
	);
};

/** Memo Bib Item for Alt Finish Line Mode */
export const MemoBibItem = memo(BibRenderItem);