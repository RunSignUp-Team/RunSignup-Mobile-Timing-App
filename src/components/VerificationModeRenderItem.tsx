import React, { memo, useCallback } from "react";
import { View, TextInput, Text, TouchableOpacity, Keyboard } from "react-native";
import { globalstyles } from "./styles";
import removeOne from "../helpers/RemoveOne";
import getClockTime from "../helpers/GetClockTime";
import getTimeInMils from "../helpers/GetTimeInMils";
import ConflictBoolean from "../helpers/ConflictBoolean";

interface Props {
	record: [number, number, number],
	recordsRef: {
		current: Array<[number, number, number]>
	},
	selectedID: number,
	editMode: boolean,
	online: boolean,
	recordsRefSearchBib: number,
	searchRecordsSearchBib: number,
	conflictBoolean: boolean,
	conflictResolution(index: number): void,
	swapEntries(index: number): void,
	findParticipant(bib: number): string,
	updateRecords(records: Array<[number, number, number]>): void,
}

export default function VerificationModeRenderItem(props: Props): React.ReactElement {
	const index = props.recordsRef.current.indexOf(props.record);
	const conflictItem = ConflictBoolean(props.record[0], props.record[2]);

	const updateBib = useCallback((newBib) => {
		props.recordsRef.current[index][0] = Number(newBib);
		props.recordsRef.current[index][2] = Number(newBib);
		props.updateRecords([...props.recordsRef.current]);
	}, [index, props]);

	const updateTime = useCallback((newTime) => {
		props.recordsRef.current[index][1] = getTimeInMils(newTime);
		props.updateRecords([...props.recordsRef.current]);
	}, [index, props]);

	return (
		<View onStartShouldSetResponder={(): boolean => true} style={{ padding: 0, margin: 0 }}>
			<TouchableOpacity style={conflictItem ? globalstyles.conflictLongTableItem : (index === props.selectedID ? globalstyles.selectedLongTableItem : globalstyles.longTableItem)}
				disabled={!conflictItem}
				onPress={(): void => props.conflictResolution(index)}
			>

				<Text style={globalstyles.tableTextThree}
					onPress={(): void => {
						if (props.editMode) {
							props.swapEntries(index);
						}
					}}>{index + 1}
				</Text>

				{!conflictItem && <TextInput
					editable={props.editMode}
					style={globalstyles.tableTextTwo}
					keyboardType="numbers-and-punctuation"
					maxLength={6}
					onChangeText={updateBib}
					onSubmitEditing={Keyboard.dismiss}>
					{props.record[0]}
				</TextInput>}

				{conflictItem && <Text style={globalstyles.tableTextTwo}>
					{`${props.record[0]} /\n${props.record[2]}`}</Text>}

				{!conflictItem && <TextInput
					editable={props.editMode}
					style={globalstyles.tableTextOne}
					keyboardType="numbers-and-punctuation"
					maxLength={11}
					onChangeText={updateTime}
					onSubmitEditing={Keyboard.dismiss}>
					{getClockTime(props.record[1])}
				</TextInput>}

				{conflictItem && <Text style={globalstyles.tableTextOne}>
					{getClockTime(props.record[1])}</Text>}

				{!conflictItem && props.online &&
					<Text style={[globalstyles.tableTextTwo, { fontWeight: "normal" }]}>{props.findParticipant(props.record[0])}</Text>}

				{conflictItem && props.online &&
					<Text style={[globalstyles.tableTextTwo, { fontWeight: "normal" }]}>{`${props.findParticipant(props.record[0])} /\n${props.findParticipant(props.record[2])}`}</Text>}

				{props.editMode && <TouchableOpacity
					style={globalstyles.tableDeleteButton}
					onPress={(): void => props.updateRecords(removeOne(index, props.recordsRef.current))}>
					<Text style={globalstyles.tableButtonText}>-</Text>
				</TouchableOpacity>}
			</TouchableOpacity>
		</View>
	);
}

export const MemoVerificationItem = memo(VerificationModeRenderItem);