import React, { memo, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import removeOne from "../helpers/RemoveOne";
import { globalstyles, GREEN_COLOR, RED_COLOR } from "./styles";
import GetClockTime from "../helpers/GetClockTime";
import Icon from "./IcoMoon";

interface Props {
	checkerBibsRef: {
		current: Array<number>,
	}
	index: number,
	updateCheckerBibs(checkerBibs: Array<number>): void,
	updateFinishTimes(finishTimes: Array<number>): void,
	addOne(time: number, index: number): void,
	showAlert(index: number): void,
	time: number,
	bib: string | number
	finishTimesRef: {
		current: Array<number>
	},
}

export default function FinishLineModeRenderItem(props: Props): React.ReactElement {

	const addOne = useCallback(() => {
		props.addOne(props.time, props.index);
	}, [props]);

	const removeSelf = useCallback(() => {
		props.updateCheckerBibs(removeOne(props.index, props.checkerBibsRef.current));
		props.updateFinishTimes(removeOne(props.index, props.finishTimesRef.current));
	}, [props]);

	return (
		<View style={globalstyles.tableItem}
			onStartShouldSetResponder={(): boolean => true}>
			<Text style={globalstyles.placeTableText}>{props.index + 1}</Text>
			<TouchableOpacity
				style={{ flex: globalstyles.bibTableText.flex, flexDirection: "row", justifyContent: "center" }}
				onPress={(): void => {
					props.showAlert(props.index);
				}}
			>
				<Text style={globalstyles.bibTableText}>{props.bib}</Text>
			</TouchableOpacity>
			<Text style={globalstyles.timeTableText}>{GetClockTime(props.time)}</Text>
			<TouchableOpacity 
				style={globalstyles.tableAddButton}
				onPress={addOne}>
				<Icon  name="plus-circle" color={GREEN_COLOR} size={25}/>
			</TouchableOpacity>
			<TouchableOpacity
				style={globalstyles.tableDeleteButton}
				onPress={removeSelf}>
				<Icon  name="minus-circle" color={RED_COLOR} size={25}/>
			</TouchableOpacity>
		</View>
	);
}

export const MemoFinishLineItem = memo(FinishLineModeRenderItem);