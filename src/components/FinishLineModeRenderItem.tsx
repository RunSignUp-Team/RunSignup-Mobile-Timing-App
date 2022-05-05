import React, { memo, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import removeOne from "../helpers/RemoveOne";
import { globalstyles } from "./styles";
import GetClockTime from "../helpers/GetClockTime";

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

	const updateCheckerBib = useCallback((newBib) => {
		props.checkerBibsRef.current[props.index] = parseInt(newBib);
		props.updateCheckerBibs([...props.checkerBibsRef.current]);
	}, [props]);

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
				style={{flex: globalstyles.timeTableText.flex + globalstyles.bibTableText.flex, flexDirection: "row", justifyContent: "center"}}
				onPress={(): void => {
					props.showAlert(props.index);
				}}
			>
				<Text style={globalstyles.bibTableText}>{props.bib}</Text>
				<Text style={globalstyles.timeTableText}>{GetClockTime(props.time)}</Text>
			</TouchableOpacity>
			<View style={{ flex: 0.5, alignItems: "center" }}>
				<TouchableOpacity
					style={globalstyles.tableAddButton}
					onPress={addOne}>
					<Text style={globalstyles.tableButtonText}>+</Text>
				</TouchableOpacity>
			</View>
			<View style={{ flex: 0.5, alignItems: "center" }}>
				<TouchableOpacity
					style={globalstyles.tableDeleteButton}
					onPress={removeSelf}>
					<Text style={globalstyles.tableButtonText}>-</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

export const MemoFinishLineItem = memo(FinishLineModeRenderItem);