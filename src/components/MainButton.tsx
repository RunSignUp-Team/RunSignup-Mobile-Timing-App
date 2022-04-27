import React from "react";
import { Text, TouchableOpacity, ViewStyle } from "react-native";
import { BIG_FONT_SIZE, BORDER_RADIUS, GREEN_COLOR, MEDIUM_FONT_SIZE, RED_COLOR } from "./styles";

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
		<TouchableOpacity 
			style={[
				{
					alignItems: props.listButton ? "flex-start" : "center",
					paddingHorizontal: 10,
					width: "100%",
					marginHorizontal: 10,
					borderRadius: BORDER_RADIUS,
					alignSelf: "center",
					paddingVertical: props.listButton ? 15 : 20,
					marginVertical: props.listButton ? 5 : 10,
					backgroundColor: props.color === "Red" ? RED_COLOR : GREEN_COLOR
				},
				props.buttonStyle]} 
			onPress={props.onPress}>
			<Text 
				style={{
					fontSize: props.listButton ? MEDIUM_FONT_SIZE : BIG_FONT_SIZE,
					fontWeight: "bold",
					color: "white",
					paddingHorizontal: 1
				}}>
				{props.text}
			</Text>
		</TouchableOpacity>
	);
}