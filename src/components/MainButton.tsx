import React from "react";
import { Text, TouchableOpacity, ViewStyle } from "react-native";
import { BIG_FONT_SIZE, BORDER_RADIUS, DARK_GRAY_COLOR, GREEN_COLOR, MEDIUM_FONT_SIZE, RED_COLOR, SMALL_FONT_SIZE, TABLE_FONT_SIZE } from "./styles";

type ButtonColor = "Red" | "Gray" | "Green";

interface Props {
	onPress: () => void | Promise<void>,
	buttonStyle?: ViewStyle,
	text: string,
	subtitle?: string,
	listButton?: boolean,
	color?: ButtonColor
}

export default function MainButton(props: Props): React.ReactElement {

	const GetColor = (str: ButtonColor | undefined): string => {
		switch (str) {
			case "Red":
				return RED_COLOR;
			case "Gray":
				return DARK_GRAY_COLOR;
			default:
				return GREEN_COLOR;
		}
	};

	return (
		<TouchableOpacity 
			style={[
				{
					alignItems: props.listButton ? "flex-start" : "center",
					paddingHorizontal: 10,
					marginHorizontal: 10,
					marginVertical: props.listButton ? 5 : 10,
					paddingVertical: props.listButton ? 5 : 10,
					minHeight: props.listButton ? 50 : 70,
					width: "100%",
					borderRadius: BORDER_RADIUS,
					alignSelf: "center",
					justifyContent: "center",
					backgroundColor: GetColor(props.color),
					flexDirection: props.listButton ? "column" : "row"
				},
				props.buttonStyle]} 
			onPress={props.onPress}>
			<Text 
				style={{
					fontSize: props.listButton ? MEDIUM_FONT_SIZE : BIG_FONT_SIZE,
					fontFamily: "Roboto_700Bold",
					color: "white",
					paddingHorizontal: 1,
				}}>
				{props.text}
			</Text>
			{props.subtitle && 
				<Text
					style={{
						fontSize: SMALL_FONT_SIZE,
						fontFamily: "Roboto_400Regular",
						color: "white",
						paddingHorizontal: 1,
					}}>
					{props.subtitle}
				</Text>
			}
		</TouchableOpacity>
	);
}