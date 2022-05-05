import React, { ForwardedRef, useEffect, useRef, useState } from "react";
import { KeyboardTypeOptions, Modal, Platform, ScrollView, Text, TextInput, TouchableHighlight, View } from "react-native";
import { APPLE_BLUE_COLOR, BACKGROUND_COLOR, GRAY_COLOR, GREEN_COLOR, LIGHT_GRAY_COLOR, MEDIUM_FONT_SIZE, SMALL_FONT_SIZE, UNIVERSAL_PADDING } from "./styles";

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

export default function TextInputAlert(props: Props): React.ReactElement | null {
	const inputRef = useRef<TextInput>(null);

	const [value, setValue] = useState("");
	const [secondValue, setSecondValue] = useState("");

	const droid = Platform.OS === "android";
	const androidRadius = 5;
	const iOSRadius = 12;
	const minWidth = "70%";
	const maxWidth = 500;

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
			}, 200);
		}
	}, [props.visible])

	if (!props.visible) {
		return null;
	}

	return (
		<Modal transparent={true} animationType={"fade"}>
			{/* Main View */}
			<ScrollView scrollEnabled={false} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }} style={{ backgroundColor: "rgba(0,0,0,0.4)" }} keyboardShouldPersistTaps='handled'>
				<View
					style={{
						backgroundColor: BACKGROUND_COLOR,
						borderWidth: 1,
						borderRadius: droid ? androidRadius : iOSRadius,
						borderColor: GRAY_COLOR,
						minHeight: "10%",
						minWidth: minWidth,
						maxWidth: maxWidth,
						marginBottom: droid ? 0 : "40%"
					}}
				>
					{/* Wrapping View */}
					<View>
						{/* Title */}
						<View>
							<Text
								style={{
									fontSize: MEDIUM_FONT_SIZE,
									fontWeight: "bold",
									marginTop: UNIVERSAL_PADDING,
									marginHorizontal: droid ? 0 : UNIVERSAL_PADDING,
									marginLeft: UNIVERSAL_PADDING,
									textAlign: droid ? "left" : "center"
								}}
							>
								{props.title}
							</Text>
						</View>
						{/* Message */}
						<View style={{alignItems: droid ? "flex-start" : "center"}}>
							<Text
								style={{
									fontSize: SMALL_FONT_SIZE,
									maxWidth: minWidth,
									marginVertical: 5,
									marginHorizontal: droid ? 0 : UNIVERSAL_PADDING,
									marginLeft: UNIVERSAL_PADDING,
									flexWrap: "wrap",
									textAlign: droid ? "left" : "center",
								}}
							>
								{props.message}
							</Text>
						</View>
						<View style={{ flexDirection: "row", justifyContent: droid ? "flex-start" : "center", minWidth: minWidth, maxWidth: maxWidth }}>
							{/* Text Input One */}
							<TextInput
								ref={inputRef}
								value={value}
								onChangeText={(val): void => {
									setValue(val);
								}}
								onSubmitEditing={() => {
									props.actionOnPress([value, secondValue]);
								}}
								style={{
									backgroundColor: LIGHT_GRAY_COLOR,
									height: droid ? 50 : 40,
									borderRadius: droid ? 0 : 8,
									borderWidth: droid ? 0 : 1,
									borderBottomWidth: 1,
									borderColor: droid ? GREEN_COLOR : GRAY_COLOR,
									flex: droid ? 1 : 0.9,
									marginVertical: 5,
									marginHorizontal: UNIVERSAL_PADDING,
									paddingHorizontal: 8,
								}}
								placeholder={props.placeholder}
								placeholderTextColor={GRAY_COLOR}
								maxLength={props.maxLength}
								keyboardType={props.keyboardType}
							/>
						</View>
						<View style={{ flexDirection: "row", justifyContent: droid ? "flex-start" : "center", minWidth: minWidth, maxWidth: maxWidth }}>
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
										backgroundColor: LIGHT_GRAY_COLOR,
										height: droid ? 50 : 40,
										borderRadius: droid ? 0 : 8,
										borderWidth: droid ? 0 : 1,
										borderBottomWidth: 1,
										borderColor: droid ? GREEN_COLOR : GRAY_COLOR,
										flex: droid ? 1 : 0.9,
										marginVertical: 5,
										marginHorizontal: UNIVERSAL_PADDING,
										paddingHorizontal: 8,
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
								maxWidth: maxWidth,
							}}
						/>
						{/* Buttons Wrapper View */}
						<View
							style={{
								flexDirection: "row",
								height: 50,
								minWidth: minWidth,
								maxWidth: maxWidth - 5,
							}}
						>
							{/* Cancel Button */}
							<TouchableHighlight style={{ flex: 1, borderBottomLeftRadius: droid ? androidRadius : iOSRadius, overflow: "hidden" }} onPress={(): void => {
								props.cancelOnPress();
							}}>
								{/* Cancel Button Text */}
								<View style={{ flex: 1, backgroundColor: BACKGROUND_COLOR, justifyContent: "center" }}>
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
								<View style={{ flex: 1, backgroundColor: BACKGROUND_COLOR, justifyContent: "center" }}>
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