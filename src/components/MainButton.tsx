import React from "react";
import { Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { BIG_FONT_SIZE, BORDER_RADIUS, DARK_GRAY_COLOR, GRAY_COLOR, GREEN_COLOR, MEDIUM_FONT_SIZE, RED_COLOR, SMALL_FONT_SIZE, WHITE_COLOR } from "./styles";

type ButtonColor = "Red" | "Gray" | "Disabled" | "Green";

interface Props {
	onPress: () => void | Promise<void>,
	buttonStyle?: ViewStyle,
	text: string,
	subtitle?: string,
	/** Index of item */
	listButton?: number,
	color?: ButtonColor
}

export default function MainButton(props: Props): React.ReactElement {

	const GetColor = (str: ButtonColor | undefined): string => {
		switch (str) {
			case "Red":
				return RED_COLOR;
			case "Gray":
				return DARK_GRAY_COLOR;
			case "Disabled":
				return GRAY_COLOR;
			default:
				return GREEN_COLOR;
		}
	};

	return (
		<TouchableOpacity 
			style={[
				{
					alignItems: props.subtitle ? "flex-start" : "center",
					paddingHorizontal: 10,
					marginHorizontal: 10,
					marginVertical: props.listButton !== undefined ? 5 : 10,
					paddingVertical: props.listButton !== undefined ? 7 : 10,
					minHeight: props.listButton !== undefined ? 50 : 70,
					width: "100%",
					borderRadius: BORDER_RADIUS,
					alignSelf: "center",
					justifyContent: props.listButton ? "flex-start" : "center",
					backgroundColor: GetColor(props.color),
					flexDirection: "row"
				},
				props.buttonStyle]} 
			onPress={props.onPress}>
			{props.listButton !== undefined && 
				<Text
					style={{
						fontSize: props.listButton !== undefined ? MEDIUM_FONT_SIZE : BIG_FONT_SIZE,
						fontFamily: "RobotoBold",
						color: WHITE_COLOR,
						paddingHorizontal: 1,
					}}>
					{props.listButton + ". "}
				</Text>
			}
			<View style={{flexDirection: "column"}}>
				<Text 
					style={{
						fontSize: props.listButton !== undefined ? MEDIUM_FONT_SIZE : BIG_FONT_SIZE,
						fontFamily: "RobotoBold",
						color: WHITE_COLOR,
						paddingHorizontal: 1,
					}}>
					{props.text}
				</Text>
				{props.subtitle && 
					<Text
						style={{
							fontSize: SMALL_FONT_SIZE,
							fontFamily: "Roboto",
							color: WHITE_COLOR,
							paddingHorizontal: 1,
						}}>
						{props.subtitle}
					</Text>
				}
			</View>
		</TouchableOpacity>
	);
}