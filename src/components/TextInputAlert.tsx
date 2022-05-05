import React, { ForwardedRef, useEffect, useRef, useState } from "react";
import { KeyboardTypeOptions, Modal, Platform, ScrollView, Text, TextInput, TouchableHighlight, View } from "react-native";
import { APPLE_BLUE_COLOR, BACKGROUND_COLOR, GRAY_COLOR, GREEN_COLOR, LIGHT_GRAY_COLOR, MEDIUM_FONT_SIZE, SMALL_FONT_SIZE } from "./styles";

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

export default function TextInputAlert (props: Props): React.ReactElement | null {
	const inputRef = useRef<TextInput>(null);

	const [value, setValue] = useState("");
	const [secondValue, setSecondValue] = useState("");

	const droid = Platform.OS === "android";
	const androidRadius = 5;
	const iOSRadius = 12;

	// Set text input value whenever initial value changes
	useEffect(() => {
		if (props.initialValue !== undefined) {
			setValue(props.initialValue);
		}
	}, [props.initialValue])

	// Set second text input value whenever second initial value changes
	useEffect(() => {
		if (props.secondInitialValue !== undefined) {
			setSecondValue(props.secondInitialValue);
		}
	}, [props.secondInitialValue])

	// Focus on text input when modal becomes visible
	useEffect(() => {
		if (props.visible) {
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		}
	}, [props.visible])

	if (!props.visible) {
		return null;
	}

	return (
		<Modal transparent={true} animationType={"fade"}>
			{/* Main View */}
			<ScrollView scrollEnabled={false} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} keyboardShouldPersistTaps='handled'>
				<View
					style={{
						backgroundColor: BACKGROUND_COLOR,
						borderWidth: 1,
						borderRadius: droid ? androidRadius : iOSRadius,
						borderColor: GRAY_COLOR,
						minHeight: "20%",
						maxHeight: "40%",
						minWidth: "45%",
						maxWidth: "80%",
						justifyContent: "space-between",
						marginBottom: droid ? 0 : "40%"
					}}
				>
					{/* Wrapping View */}
					<View>
						{/* Title */}
						<Text
							style={{
								fontSize: MEDIUM_FONT_SIZE,
								fontWeight: "bold",
								marginTop: 20,
								width: "90%",
								alignSelf: "center",
								textAlign: droid ? "left" : "center"
							}}
						>
							{props.title}
						</Text>
						{/* Message */}
						<Text
							style={{
								fontSize: SMALL_FONT_SIZE,
								marginVertical: 5,
								alignSelf: "center",
								width: "90%",
								flexWrap: "wrap",
								textAlign: droid ? "left" : "center"
							}}
						>
							{props.message}
						</Text>
						{/* Text Input One */}
						<TextInput
							// autoFocus={true}
							ref={inputRef}
							value={value}
							onChangeText={(val): void => {
								setValue(val);
							}}
							onSubmitEditing={() => {
								props.actionOnPress([value, secondValue]);
							}}
							style={{
								alignSelf: "center",
								textAlign: "left",
								width: "90%",
								backgroundColor: LIGHT_GRAY_COLOR,
								height: droid ? 50 : 40,
								borderRadius: droid ? 0 : 8,
								borderWidth: droid ? 0 : 1,
								borderBottomWidth: 1,
								borderColor: droid ? GREEN_COLOR : GRAY_COLOR,
								marginVertical: 5,
								paddingHorizontal: 8,
								marginHorizontal: 20,
							}}
							placeholder={props.placeholder}
							placeholderTextColor={GRAY_COLOR}
							maxLength={props.maxLength}
							keyboardType={props.keyboardType}
						/>
						{/* Text Input Two */}
						{props.secondPlaceholder &&
							<TextInput
								value={secondValue}
								onChangeText={(val): void => {
									setSecondValue(val);
								}}
								onSubmitEditing={() => {
									props.actionOnPress([value, secondValue]);
								}}
								style={{
									alignSelf: "center",
									textAlign: "left",
									width: "90%",
									backgroundColor: LIGHT_GRAY_COLOR,
									height: droid ? 50 : 40,
									borderRadius: droid ? 0 : 8,
									borderWidth: droid ? 0 : 1,
									borderBottomWidth: 1,
									borderColor: droid ? GREEN_COLOR : GRAY_COLOR,
									marginVertical: 5,
									paddingHorizontal: 8,
									marginHorizontal: 20
								}}
								placeholder={props.secondPlaceholder}
								placeholderTextColor={GRAY_COLOR}
								maxLength={props.secondMaxLength}
								keyboardType={props.secondKeyboardType}
							/>
						}
						{/* Top Border Line for Buttons */}
						<View
							style={{
								backgroundColor: GRAY_COLOR,
								opacity: 0.7,
								height: 1,
								marginTop: 10
							}}
						/>
						{/* Buttons Wrapper View */}
						<View
							style={{
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
								height: 50,
							}}
						>
							{/* Cancel Button */}
							<TouchableHighlight style={{ flex: 1, borderBottomLeftRadius: droid ? androidRadius : iOSRadius, overflow: "hidden" }} onPress={(): void => {
								props.cancelOnPress();
							}}>
								{/* Cancel Button Text */}
								<View style={{flex: 1, backgroundColor: BACKGROUND_COLOR, justifyContent: "center" }}>
								<Text
									style={{
										fontSize: SMALL_FONT_SIZE,
										fontWeight: "bold",
										color: droid ? GREEN_COLOR : "#ff443a",
										textAlign: "center",
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
							<TouchableHighlight style={{ flex: 1, borderBottomRightRadius: droid ? androidRadius : iOSRadius, overflow: "hidden" }} onPress={(): void => {
								props.actionOnPress([value, secondValue]);
							}}>
								{/* Action Button Text */}
								<View style={{flex: 1, backgroundColor: BACKGROUND_COLOR, justifyContent: "center" }}>
									<Text
										style={{
											fontSize: SMALL_FONT_SIZE,
											fontWeight: "bold",
											color: droid ? GREEN_COLOR : APPLE_BLUE_COLOR,
											textAlign: "center",
										}}
									>
										{props.actionButtonTitle ? props.actionButtonTitle : "OK"}
									</Text>
								</View>
							</TouchableHighlight>
						</View>
					</View>
				</View>
			</ScrollView>
		</Modal>
	);
}