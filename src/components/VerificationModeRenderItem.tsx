import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { globalstyles } from "./styles";
import removeOne from "../helpers/RemoveOne";
import GetClockTime from "../helpers/GetClockTime";
import ConflictBoolean from "../helpers/ConflictBoolean";
import GetBibDisplay from "../helpers/GetBibDisplay";

interface Props {
	record: [number, number, number],
	recordsRef: {
		current: Array<[number, number, number]>
	},
	selectedID: number,
	editMode: boolean,
	maxTime: number,
	online: boolean,
	recordsRefSearchBib: number,
	searchRecordsSearchBib: number,
	conflictBoolean: boolean,
	conflictResolution(index: number): void,
	swapEntries(index: number): void,
	showAlert(index: number, record: [number, number, number]): void,
	findParticipant(bib: number): string,
	updateRecords(records: Array<[number, number, number]>): void,
	updateMaxTime(maxTime: number): void
}


export default function VerificationModeRenderItem(props: Props): React.ReactElement {
	const index = props.recordsRef.current.indexOf(props.record);
	const conflictItem = ConflictBoolean(props.record[0], props.record[2]);

	return (
		<View onStartShouldSetResponder={(): boolean => true} style={{ padding: 0, margin: 0 }}>
			<TouchableOpacity style={conflictItem ? globalstyles.conflictLongTableItem : (index === props.selectedID ? globalstyles.selectedLongTableItem : globalstyles.longTableItem)}
				disabled={!conflictItem}
				onPress={(): void => props.conflictResolution(index)}
			>

				{/* Place */}
				<TouchableOpacity style={[globalstyles.placeTableText, { flexDirection: "row", alignItems: "center" }]}
					hitSlop={{ top: 30, bottom: 30, left: 30 }}
					disabled={!props.editMode}
					onPress={(): void => {
						props.swapEntries(index);
					}}>
					<Text style={globalstyles.placeTableText}>{index + 1}</Text>
				</TouchableOpacity>


				{!conflictItem &&
					<TouchableOpacity
						hitSlop={{ top: 30, bottom: 30 }}
						style={{
							flex: globalstyles.bibTableText.flex + globalstyles.timeTableText.flex,
							flexDirection: "row",
							alignItems: "center"
						}}
						disabled={!props.editMode}
						onPress={(): void => {
							props.showAlert(index, props.record);
						}}
					>
						{/* No Conflict Bib */}
						<Text style={globalstyles.bibTableText}>
							{GetBibDisplay(props.record[0])}
						</Text>

						{/* No Conflict Time */}
						<Text style={globalstyles.timeTableText}>
							{GetClockTime(props.record[1])}
						</Text>
					</TouchableOpacity>
				}

				{/* Conflict Bib */}
				{conflictItem && <Text style={globalstyles.bibTableText}>
					{`${props.record[0]} /\n${props.record[2]}`}</Text>}


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
					<TouchableOpacity
						style={globalstyles.tableDeleteButton}
						onPress={(): void => {
							props.updateRecords(removeOne(index, props.recordsRef.current));
							if (props.maxTime === props.record[1]) {
								let maxTime = 0;
								const timeArray = props.recordsRef.current.map(record => record[1]).filter(time => time < Number.MAX_SAFE_INTEGER);
								for (let i = 0; i < timeArray.length; i++) {
									if (timeArray[i] > maxTime) {
										maxTime = timeArray[i];
									}	
								}
								props.updateMaxTime(maxTime);
							}
						}}>
						<Text style={globalstyles.tableButtonText}>-</Text>
					</TouchableOpacity>
				}
			</TouchableOpacity>
		</View>
	);
}

export const MemoVerificationItem = memo(VerificationModeRenderItem);