import React, { memo, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import removeOne from "../helpers/RemoveOne";
import Icon from "./IcoMoon";
import { globalstyles, RED_COLOR } from "./styles";

interface Props {
	updateBibNums(bibNums: Array<number>): void,
	showAlert(index: number): void,
	item: string | number
	index: number
	bibNumsRef: {
		current: Array<number>
	}
}

export default function ChuteModeRenderItem(props: Props): React.ReactElement {
	const removeSelf = useCallback(() => {
		props.updateBibNums(removeOne(props.index, props.bibNumsRef.current));
	}, [props]);

	return (
		<View style={globalstyles.tableItem}
			onStartShouldSetResponder={(): boolean => true}>
			<Text style={[globalstyles.placeTableText, { flex: 0.3 }]}>{props.index + 1}</Text>
			<TouchableOpacity 
				style={{flexDirection: "row", flex: globalstyles.bibTableText.flex, justifyContent: "center"}}
				onPress={(): void => {
					props.showAlert(props.index);
				}}
			>
				<Text style={globalstyles.bibTableText}>
					{props.item}
				</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={globalstyles.tableDeleteButton}
				onPress={removeSelf}>
				<Icon name="minus-circle" color={RED_COLOR} size={25} />
			</TouchableOpacity>
		</View>
	);
}

export const MemoChuteItem = memo(ChuteModeRenderItem);

