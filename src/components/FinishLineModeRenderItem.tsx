import React, { memo, useCallback } from "react";
import { View, TextInput, Text, TouchableOpacity } from "react-native";
import removeOne from "../helpers/RemoveOne";
import { globalstyles } from "./styles";
import getClockTime from "../helpers/GetClockTime";

interface Props {
	checkerBibsRef: {
		current: Array<number>,
	}
	index: number,
	updateCheckerBibs(checkerBibs: Array<number>): void,
	updateFinishTimes(finishTimes: Array<number>): void,
	addOne(time: number, index: number): void,
	time: number,
	bib: string | number
	finishTimesRef: {
		current: Array<number>
	},
}

export default function FinishLineModeRenderItem(props: Props) {
    
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
			onStartShouldSetResponder={() => true}>
			<Text style={globalstyles.tableTextThree}>{props.index + 1}</Text>
			<Text style={globalstyles.tableTextOne}>{getClockTime(props.time)}</Text>
			<TextInput
				style={globalstyles.tableTextTwo}
				keyboardType="number-pad"
				maxLength={6}
				onChangeText={updateCheckerBib}>
				{props.bib}
			</TextInput>
			<TouchableOpacity
				style={globalstyles.tableAddButton}
				onPress={addOne}>
				<Text style={globalstyles.tableButtonText}>+</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={globalstyles.tableDeleteButton}
				onPress={removeSelf}>
				<Text style={globalstyles.tableButtonText}>-</Text>
			</TouchableOpacity>
		</View>
	);
}

export const MemoFinishLineItem = memo(FinishLineModeRenderItem);
