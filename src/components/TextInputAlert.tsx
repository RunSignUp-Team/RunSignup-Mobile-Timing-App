import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Keyboard, KeyboardTypeOptions, Modal, Platform, Text, TextInput, TouchableHighlight, TouchableOpacity, View } from "react-native";
import { APPLE_BLUE_COLOR, GRAY_COLOR, GREEN_COLOR, LIGHT_GRAY_COLOR, MEDIUM_FONT_SIZE, SMALL_FONT_SIZE, UNIVERSAL_PADDING, WHITE_COLOR } from "./styles";

interface Props {
	visible: boolean,
	title: string,
	message: string,
	placeholder: string,
	initialValue?: string,
	maxLength?: number,
	keyboardType?: KeyboardTypeOptions,

	/** onPress for Cancel Button */
	cancelOnPress: () => void,
	/** onPress for Action Button, returns the Array of values (for the case that there are two TextInputs) */
	actionOnPress: (values: Array<string>) => void,

	/** Title of Cancel Button. Defaults to "Cancel". */
	cancelButtonTitle?: string,
	/** Title of Action Button. Defaults to "OK". */
	actionButtonTitle?: string,

	/** Placeholder for second Text Input; if this is defined, the second TextInput appears */
	secondPlaceholder?: string,
	secondInitialValue?: string,
	secondMaxLength?: number,
	secondKeyboardType?: KeyboardTypeOptions
}

/** Text Input Alert */
export default function TextInputAlert(props: Props): React.ReactElement | null {
	const inputRef = useRef<TextInput>(null);

	const [value, setValue] = useState("");
	const [secondValue, setSecondValue] = useState("");

	const droid = Platform.OS === "android";
	const androidRadius = 5;
	const iOSRadius = 12;
	const minWidth = Math.max(Dimensions.get("window").width * 0.7, Math.min(Dimensions.get("window").width * 0.9, 300));
	const maxWidth = 500;
	const normalWidth = Math.min(minWidth, maxWidth) - (UNIVERSAL_PADDING * 2);

	// Set text input value whenever initial value changes
	useEffect(() => {
		if (props.initialValue !== undefined) {
			setValue(props.initialValue);
		} else {
			setValue("");
		}
	}, [props.initialValue, props.visible]);

	// Set second text input value whenever second initial value changes
	useEffect(() => {
		if (props.secondInitialValue !== undefined) {
			setSecondValue(props.secondInitialValue);
		} else {
			setSecondValue("");
		}
	}, [props.secondInitialValue, props.visible]);

	// Focus on text input when modal becomes visible
	useEffect(() => {
		if (props.visible) {
			setTimeout(() => {
				inputRef.current?.focus();
			}, 200);
		}
	}, [props.visible]);

	if (!props.visible) {
		return null;
	}

	const backgroundColor = droid ? WHITE_COLOR : "rgba(255,255,255,0.97)";
	const underlayColor = "rgba(225,225,225,0.97)";

	return (
		<Modal
			transparent={true}
			animationType="fade"
		>
			<TouchableOpacity
				activeOpacity={1}
				onPress={Keyboard.dismiss}
				style={{
					position: "absolute",
					backgroundColor: "rgba(0,0,0,0.4)",
					height: "100%",
					width: "100%",
					alignItems: "center",
				}}>
				{/* Main View */}
				<TouchableOpacity
					activeOpacity={1}
					onPress={(): void => { return; }}
					style={{
						top: "25%",
						backgroundColor: backgroundColor,
						borderWidth: droid ? 0 : 1,
						borderRadius: droid ? androidRadius : iOSRadius,
						borderColor: GRAY_COLOR,
						minHeight: "10%",
						width: Math.min(minWidth, maxWidth),
						alignItems: "center",
					}}
				>
					<TouchableOpacity activeOpacity={1} style={{ width: "100%", alignItems: "center" }} onPress={Keyboard.dismiss}>
						{/* Title */}
						<View style={{ alignItems: droid ? "flex-start" : "center" }}>
							<Text
								style={{
									marginTop: UNIVERSAL_PADDING,
									width: normalWidth,
									textAlign: droid ? "left" : "center",
									fontFamily: "RobotoBold",
									fontSize: MEDIUM_FONT_SIZE
								}}
							>
								{props.title}
							</Text>
						</View>
						{/* Message */}
						<View style={{ alignItems: droid ? "flex-start" : "center" }}>
							<Text
								style={{
									width: normalWidth,
									marginVertical: 5,
									flexWrap: "wrap",
									textAlign: droid ? "left" : "center",
									fontFamily: "Roboto",
									fontSize: SMALL_FONT_SIZE
								}}
							>
								{props.message}
							</Text>
						</View>
					</TouchableOpacity>

					<View style={{ flexDirection: "row", justifyContent: droid ? "flex-start" : "center" }}>
						{/* Text Input One */}
						<TextInput
							ref={inputRef}
							value={value}
							onChangeText={(val): void => {
								setValue(val);
							}}
							onSubmitEditing={(): void => {
								props.actionOnPress([value, secondValue]);
							}}
							style={{
								backgroundColor: LIGHT_GRAY_COLOR,
								height: droid ? 50 : 40,
								borderRadius: droid ? 0 : 8,
								borderWidth: droid ? 0 : 1,
								borderBottomWidth: 1,
								borderColor: droid ? GREEN_COLOR : GRAY_COLOR,
								marginVertical: 5,
								width: normalWidth,
								paddingHorizontal: 8,
								fontFamily: "Roboto",
								fontSize: SMALL_FONT_SIZE
							}}
							placeholder={props.placeholder}
							placeholderTextColor={GRAY_COLOR}
							maxLength={props.maxLength}
							keyboardType={props.keyboardType}
						/>
					</View>
					<View style={{ flexDirection: "row", justifyContent: droid ? "flex-start" : "center" }}>
						{/* Text Input Two */}
						{props.secondPlaceholder &&
							<TextInput
								value={secondValue}
								onChangeText={(val): void => {
									setSecondValue(val);
								}}
								onSubmitEditing={(): void => {
									props.actionOnPress([value, secondValue]);
								}}
								style={{
									backgroundColor: LIGHT_GRAY_COLOR,
									height: droid ? 50 : 40,
									borderRadius: droid ? 0 : 8,
									borderWidth: droid ? 0 : 1,
									borderBottomWidth: 1,
									borderColor: droid ? GREEN_COLOR : GRAY_COLOR,
									marginVertical: 5,
									width: normalWidth,
									paddingHorizontal: 8,
									fontFamily: "Roboto",
									fontSize: SMALL_FONT_SIZE
								}}
								placeholder={props.secondPlaceholder}
								placeholderTextColor={GRAY_COLOR}
								maxLength={props.secondMaxLength}
								keyboardType={props.secondKeyboardType}
							/>
						}
					</View>

					{/* Top Border Line for Buttons */}
					<View
						style={{
							backgroundColor: GRAY_COLOR,
							opacity: 0.7,
							height: 1,
							marginTop: 10,
							width: Math.min(minWidth, maxWidth) - 2,
						}}
					/>
					{/* Buttons Wrapper View */}
					<View
						style={{
							height: 50,
							flexDirection: "row",
							alignItems: "center",
							maxWidth: Math.min(minWidth, maxWidth),
							borderBottomLeftRadius: droid ? androidRadius : iOSRadius,
							borderBottomRightRadius: droid ? androidRadius : iOSRadius
						}}
					>
						{/* Cancel Button */}
						<TouchableHighlight
							underlayColor={underlayColor}
							style={{ width: (Math.min(minWidth, maxWidth) - 4) / 2, borderBottomLeftRadius: droid ? androidRadius : iOSRadius, overflow: "hidden" }} onPress={(): void => {
								props.cancelOnPress();
							}}>
							{/* Cancel Button Text */}
							<View
								style={{
									flex: 1,
									justifyContent: "center"
								}}>
								<Text
									style={{
										color: droid ? GREEN_COLOR : APPLE_BLUE_COLOR,
										textAlign: "center",
										fontFamily: "RobotoBold",
										fontSize: SMALL_FONT_SIZE
									}}
								>
									{props.cancelButtonTitle ? props.cancelButtonTitle : "Cancel"}
								</Text>
							</View>
						</TouchableHighlight>
						{/* Middle Border Line for Buttons */}
						<View
							style={{
								width: 1,
								backgroundColor: GRAY_COLOR,
								opacity: 0.7,
								height: "100%"
							}}
						/>
						{/* Action Button */}
						<TouchableHighlight
							underlayColor={underlayColor}
							style={{ width: (Math.min(minWidth, maxWidth) - 4) / 2, borderBottomRightRadius: droid ? androidRadius : iOSRadius, overflow: "hidden" }} onPress={(): void => {
								props.actionOnPress([value, secondValue]);
							}}>
							{/* Action Button Text */}
							<View
								style={{
									flex: 1,
									justifyContent: "center"
								}}>
								<Text
									style={{
										color: droid ? GREEN_COLOR : APPLE_BLUE_COLOR,
										textAlign: "center",
										fontFamily: "RobotoBold",
										fontSize: SMALL_FONT_SIZE
									}}
								>
									{props.actionButtonTitle ? props.actionButtonTitle : "OK"}
								</Text>
							</View>
						</TouchableHighlight>
					</View>
				</TouchableOpacity>
			</TouchableOpacity>
		</Modal>
	);
}