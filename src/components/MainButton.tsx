import React from "react";
import { Text, TouchableOpacity, ViewStyle } from "react-native";
import { globalstyles, GREEN_COLOR, RED_COLOR } from "./styles";

type ButtonColor = "Red" | "Green";

interface Props {
	onPress: () => void | Promise<void>,
	buttonStyle?: ViewStyle,
	text: string,
	listButton?: boolean,
	color?: ButtonColor
}

export default function MainButton(props: Props) {
	return (
		<TouchableOpacity style={[globalstyles.button, props.buttonStyle, {marginVertical: props.listButton ? 4 : 12, backgroundColor: props.color === "Red" ? RED_COLOR : GREEN_COLOR}]} onPress={props.onPress}>
			<Text style={globalstyles.buttonText}>{props.text}</Text>
		</TouchableOpacity>
	);
}