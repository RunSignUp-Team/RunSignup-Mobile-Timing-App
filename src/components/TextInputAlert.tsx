import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Keyboard, Modal, Platform, Text, TextInput, TouchableHighlight, TouchableOpacity, View, KeyboardTypeOptions, ActivityIndicator, Alert } from "react-native";
import { APPLE_BLUE_COLOR, GRAY_COLOR, GREEN_COLOR, LIGHT_GRAY_COLOR, MEDIUM_FONT_SIZE, RED_COLOR, SMALL_FONT_SIZE, UNIVERSAL_PADDING, WHITE_COLOR } from "./styles";
import TimeEntry from "./TimeEntry";

interface Props {
	visible: boolean,
	title: string,
	message: string,
	type: "text" | "time" | "timeofday" | "text&time"

	placeholder?: string,
	initialValue?: string,
	maxLength?: number,
	keyboardType?: KeyboardTypeOptions,
	timeInitialValue?: number,

	/** onPress for Reset Timer Button */
	resetOnPress?: () => void,
	/** onPress for Cancel Button */
	cancelOnPress: () => void,
	/** onPress for Action Button, returns the Array of values (for the case that there are two TextInputs) */
	actionOnPress: (values: Array<string>) => void,
	/** onPress for Action 2 Button, returns the Array of values (for the case that there are two TextInputs) */
	action2OnPress?: (values: Array<string>) => void,

	/** Title of Cancel Button. Defaults to "Cancel". */
	cancelButtonTitle?: string,
	/** Title of Action Button. Defaults to "OK". */
	actionButtonTitle?: string,
}

/** Text Input Alert */
export default function TextInputAlert(props: Props): React.ReactElement | null {
	const textRef = useRef<TextInput>(null);

	const [textValue, setTextValue] = useState("");
	const [timeValue, setTimeValue] = useState(0);
	const [showLoader, setShowLoader] = useState(false);

	const droid = Platform.OS === "android";
	const androidRadius = 5;
	const iOSRadius = 12;
	const minWidth = Math.max(Dimensions.get("window").width * 0.7, Math.min(Dimensions.get("window").width * 0.9, 300));
	const maxWidth = 500;
	const normalWidth = Math.min(minWidth, maxWidth) - (UNIVERSAL_PADDING * 2);

	// Set text input textValue whenever initial textValue changes
	useEffect(() => {
		if (props.initialValue !== undefined) {
			setTextValue(props.initialValue);
		} else {
			setTextValue("");
		}
	}, [props.initialValue, props.visible]);

	// Set time input timeValue whenever initial timeValue changes
	useEffect(() => {
		if (props.timeInitialValue !== undefined && props.timeInitialValue !== Number.MAX_SAFE_INTEGER) {
			setTimeValue(props.timeInitialValue);
		} else {
			setTimeValue(0);
		}
	}, [props.timeInitialValue, props.visible]);

	// Focus on text input when modal becomes visible
	useEffect(() => {
		if (props.visible) {
			setTimeout(() => {
				textRef.current?.focus();
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

					{(props.type === "text" || props.type === "text&time") ? <View style={{ flexDirection: "row", justifyContent: droid ? "flex-start" : "center" }}>
						{/* Text Input */}
						<TextInput
							ref={textRef}
							value={textValue}
							onChangeText={(val): void => {
								setTextValue(val);
							}}
							onSubmitEditing={(): void => {
								props.actionOnPress([textValue, timeValue.toString()]);
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
					</View> : null}

					{/* Time Entry */}
					{(props.type === "time" || props.type === "text&time" || props.type === "timeofday") ?
						<View style={{ flexDirection: "row", height: droid ? 50 : 40, width: normalWidth, marginVertical: 5 }}>
							<TimeEntry initialValue={props.timeInitialValue} setValue={setTimeValue} timeOfDay={props.type === "timeofday"}/>
						</View>
						: null
					}

					{/* Activity Indicator */}
					{props.action2OnPress ?
						<View style={{ height: 25, alignItems: "center", justifyContent: "center" }}>
							{showLoader ? <ActivityIndicator style={{ height: 25 }} color={droid ? GREEN_COLOR : GRAY_COLOR} /> : null}
						</View>
						: null
					}

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
						{/* Reset Button */}
						{props.resetOnPress ?
							<TouchableHighlight
								underlayColor={underlayColor}
								style={{ width: (Math.min(minWidth, maxWidth) - 4) / 3, borderBottomLeftRadius: droid ? androidRadius : iOSRadius, overflow: "hidden" }} onPress={(): void => {
									if (props.resetOnPress)
										props.resetOnPress();
								}}>
								{/* Reset Button Text */}
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
										{"Reset"}
									</Text>
								</View>
							</TouchableHighlight> 
							: null
						}
						{/* Middle Border Line for Buttons */}
						{props.resetOnPress ?
							<View
								style={{
									width: 1,
									backgroundColor: GRAY_COLOR,
									opacity: 0.7,
									height: "100%"
								}}
							/> 
							: null
						}
						{/* Cancel Button */}
						<TouchableHighlight
							underlayColor={underlayColor}
							style={{ width: (Math.min(minWidth, maxWidth) - 4) / ((props.action2OnPress||props.resetOnPress) ? 3 : 2), borderBottomLeftRadius: droid ? androidRadius : iOSRadius, overflow: "hidden" }} onPress={(): void => {
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
							style={{ width: (Math.min(minWidth, maxWidth) - 4) / ((props.action2OnPress||props.resetOnPress) ? 3 : 2), borderBottomRightRadius: droid ? androidRadius : iOSRadius, overflow: "hidden" }}
							onPress={(): void => {
								if (props.type === "timeofday" && timeValue === -1) {
									Alert.alert("Use 12 Hour Time", "Please use 12 hour time. You can tap AM / PM to toggle between day and night.");
								} else {
									props.actionOnPress([textValue, timeValue.toString()]);
								}
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
						{/* Middle Border Line for Buttons */}
						{props.action2OnPress ?
							<View
								style={{
									width: 1,
									backgroundColor: GRAY_COLOR,
									opacity: 0.7,
									height: "100%"
								}}
							/>
							: null
						}
						{/* Action 2 Button */}
						{props.action2OnPress ?
							<TouchableHighlight
								underlayColor={underlayColor}
								style={{ width: (Math.min(minWidth, maxWidth) - 4) / 3, borderBottomRightRadius: droid ? androidRadius : iOSRadius, overflow: "hidden" }} onPress={(): void => {
									if (props.action2OnPress) {
										if (props.type === "timeofday" && timeValue === -1) {
											Alert.alert("Use 12 Hour Time", "Please use 12 hour time. You can tap AM / PM to toggle between day and night.");
										} else {
											setShowLoader(true);
											props.action2OnPress([textValue, timeValue.toString()]);
											// Force refresh bib field
											if (props.initialValue !== undefined) {
												setTextValue(props.initialValue);
											} else {
												setTextValue("");
											}
											setTimeout(() => {
												setShowLoader(false);
											}, 750);
										}
									}
								}}>
								{ }
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
										{"Next"}
									</Text>
								</View>
							</TouchableHighlight>
							: null
						}
					</View>
				</TouchableOpacity>
			</TouchableOpacity>
		</Modal>
	);
}