import React, { memo, useCallback } from "react";
import { View, TextInput, Text, TouchableOpacity, Keyboard } from "react-native";
import { globalstyles } from "./styles";
import removeOne from "../helpers/RemoveOne";
import GetClockTime from "../helpers/GetClockTime";
import GetTimeInMils from "../helpers/GetTimeInMils";
import ConflictBoolean from "../helpers/ConflictBoolean";
import GetBibDisplay from "../helpers/GetBibDisplay";

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

	console.log(props.record);

	const updateBib = useCallback((newBib) => {
		if (isNaN(parseInt(newBib))) {
			// Store as -1 if invalid data
			props.recordsRef.current[index][0] = -1;
			props.recordsRef.current[index][2] = -1;
			props.updateRecords([...props.recordsRef.current]);
		} else {
			props.recordsRef.current[index][0] = parseInt(newBib);
			props.recordsRef.current[index][2] = parseInt(newBib);
			props.updateRecords([...props.recordsRef.current]);
		}
	}, [index, props]);

	const updateTime = useCallback((newTime) => {
		props.recordsRef.current[index][1] = GetTimeInMils(newTime);
		props.updateRecords([...props.recordsRef.current]);
	}, [index, props]);

	return (
		<View onStartShouldSetResponder={(): boolean => true} style={{ padding: 0, margin: 0 }}>
			<TouchableOpacity style={conflictItem ? globalstyles.conflictLongTableItem : (index === props.selectedID ? globalstyles.selectedLongTableItem : globalstyles.longTableItem)}
				disabled={!conflictItem}
				onPress={(): void => props.conflictResolution(index)}
			>

				{/* Place */}
				<TouchableOpacity style={[globalstyles.placeTableText, { flexDirection: "row", alignItems: "center" }]}
					hitSlop={{top: 30, bottom: 30, left: 30, right: 30}}
					disabled={!props.editMode}
					onPress={(): void => {
						props.swapEntries(index);
					}}>
					<Text style={globalstyles.placeTableText}>{index + 1}</Text>
				</TouchableOpacity>

				{/* No Conflict Bib */}
				{!conflictItem && <TextInput
					editable={props.editMode}
					style={globalstyles.bibTableText}
					keyboardType="numbers-and-punctuation"
					maxLength={6}
					onChangeText={updateBib}
					onSubmitEditing={Keyboard.dismiss}>
					{GetBibDisplay(props.record[0])}
				</TextInput>}

				{/* Conflict Bib */}
				{conflictItem && <Text style={globalstyles.bibTableText}>
					{`${props.record[0]} /\n${props.record[2]}`}</Text>}

				{/* No Conflict Time */}
				{!conflictItem && <TextInput
					editable={props.editMode}
					style={globalstyles.timeTableText}
					keyboardType="numbers-and-punctuation"
					maxLength={11}
					onChangeText={updateTime}
					onSubmitEditing={Keyboard.dismiss}>
					{GetClockTime(props.record[1])}
				</TextInput>}

				{/* Conflict Time */}
				{conflictItem && <Text style={globalstyles.timeTableText}>
					{GetClockTime(props.record[1])}</Text>}

				{/* No Conflict Participant */}
				{!conflictItem && props.online &&
					<Text style={[globalstyles.nameTableText, { flexWrap: "wrap" }]}>{props.findParticipant(props.record[0])}</Text>}

				{/* Conflict Participant */}
				{conflictItem && props.online &&
					<Text style={[globalstyles.nameTableText, { flexWrap: "wrap" }]}>{`${props.findParticipant(props.record[0])} /\n${props.findParticipant(props.record[2])}`}</Text>}

				{/* Delete Button */}
				{props.editMode &&
					<View style={{ flex: 0.5, alignItems: "center" }}>
						<TouchableOpacity
							style={globalstyles.tableDeleteButton}
							onPress={(): void => props.updateRecords(removeOne(index, props.recordsRef.current))}>
							<Text style={globalstyles.tableButtonText}>-</Text>
						</TouchableOpacity>
					</View>
				}
			</TouchableOpacity>
		</View>
	);
}

export const MemoVerificationItem = memo(VerificationModeRenderItem);