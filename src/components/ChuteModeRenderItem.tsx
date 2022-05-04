import React, { memo, useCallback } from "react";
import { View, TextInput, Text, TouchableOpacity } from "react-native";
import removeOne from "../helpers/RemoveOne";
import { globalstyles } from "./styles";

interface Props {
	updateBibNums(bibNums: Array<number>): void,
	item: string | number
	index: number
	bibNumsRef: {
		current: Array<number>
	}
}

export default function ChuteModeRenderItem(props: Props): React.ReactElement {

	const updateBib = useCallback((newBib) => {
		props.bibNumsRef.current[props.index] = parseInt(newBib);
		props.updateBibNums([...props.bibNumsRef.current]);
	}, [props]);

	const removeSelf = useCallback(() => {
		props.updateBibNums(removeOne(props.index, props.bibNumsRef.current));
	}, [props]);

	return (
		<View style={globalstyles.tableItem}
			onStartShouldSetResponder={(): boolean => true}>
			<Text style={[globalstyles.placeTableText, { flex: 1.5 }]}>{props.index + 1}</Text>
			<TextInput
				style={globalstyles.bibTableText}
				keyboardType="number-pad"
				maxLength={6}
				onChangeText={updateBib}>
				{props.item}
			</TextInput>

			<View style={{ flex: 0.25, alignItems: "center" }}>
				<TouchableOpacity
					style={globalstyles.tableDeleteButton}
					onPress={removeSelf}>
					<Text style={globalstyles.tableButtonText}>-</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

export const MemoChuteItem = memo(ChuteModeRenderItem);

