import React, { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardTypeOptions, Platform, Text, TextInput, View } from "react-native";
import addLeadingZeros from "../helpers/AddLeadingZeros";
import { globalstyles, GREEN_COLOR, LIGHT_GRAY_COLOR } from "./styles";

interface Props {
	initialValue?: string,
	setValue: React.Dispatch<React.SetStateAction<string>>;
}

type FocusLocation = "Previous" | "Next" | "Tap" | "None";

/** Time Entry Component */
export default function TimeEntry(props: Props): React.ReactElement {
	const [hours, setHours] = useState(props.initialValue ? props.initialValue.substring(0, 2) : "00");
	const [minutes, setMinutes] = useState(props.initialValue ? props.initialValue.substring(3, 5) : "00");
	const [seconds, setSeconds] = useState(props.initialValue ? props.initialValue.substring(6, 8) : "00");
	const [milli, setMilli] = useState(props.initialValue ? props.initialValue.substring(9, 11) : "00");

	const [flipFlop, setFlipFlop] = useState(true);

	const hoursRef = useRef<TextInput>(null);
	const minutesRef = useRef<TextInput>(null);
	const secondsRef = useRef<TextInput>(null);
	const milliRef = useRef<TextInput>(null);

	const createClockTime = useCallback((): string => {
		if (hours || minutes || seconds || milli) {
			return addLeadingZeros(Number(hours)) + ":" + addLeadingZeros(Number(minutes)) + ":" + addLeadingZeros(Number(seconds)) + "." + addLeadingZeros(Number(milli));
		} else {
			return "";
		}
	}, [hours, milli, minutes, seconds]);

	useEffect(() => {
		props.setValue(createClockTime());
	}, [props, createClockTime]);

	const reset = useRef(true);
	// Keep track of where focus came from
	const focusFrom = useRef<FocusLocation>("None");

	const keyboardType = useRef<KeyboardTypeOptions | undefined>(Platform.OS === "android" ? undefined : "number-pad");

	return (
		<View style={globalstyles.timeInput}>

			{/* Hours */}
			<View style={[globalstyles.timeInputButton, { borderBottomColor: hoursRef.current?.isFocused() ? GREEN_COLOR : LIGHT_GRAY_COLOR }]}>
				<TextInput
					keyboardType={keyboardType.current}
					style={{ height: Platform.OS === "android" ? 1 : 0, width: Platform.OS === "android" ? 1 : 0 }}
					caretHidden={true}
					value={hours}
					ref={hoursRef}
					onBlur={(): void => {
						setFlipFlop(!flipFlop);
					}}
					onFocus={(): void => {
						if (focusFrom.current === "None") {
							focusFrom.current = "Tap";
						}
						reset.current = true;
						setFlipFlop(!flipFlop);
					}}
					onKeyPress={({ nativeEvent }): void => {
						const char = nativeEvent.key;
						if (!isNaN(Number(char))) {
							if (reset.current) {
								setHours(char);
							} else {
								setHours(hours + char);
								if (hours.length > 0) {
									minutesRef.current?.focus();
									focusFrom.current = "Previous";
								}
							}
							reset.current = false;
						} else if (nativeEvent.key === "Backspace") {
							setHours(hours.substring(0, hours.length - 1));
							reset.current = false;
							focusFrom.current = "None";
						}
					}}
				/>
				<Text 
					style={globalstyles.timeInputText} 
					onPress={(): void => {
						hoursRef.current?.focus(); 
					}}
				>
					{hours}
				</Text>
			</View>
			<Text style={globalstyles.timeSeparator}>:</Text>

			{/* Minutes */}
			<View style={[globalstyles.timeInputButton, { borderBottomColor: minutesRef.current?.isFocused() ? GREEN_COLOR : LIGHT_GRAY_COLOR }]}>
				<TextInput
					keyboardType={keyboardType.current}
					style={{ height: Platform.OS === "android" ? 1 : 0, width: Platform.OS === "android" ? 1 : 0 }}
					caretHidden={true}
					value={minutes}
					ref={minutesRef}
					onBlur={(): void => {
						setFlipFlop(!flipFlop);
					}}
					onFocus={(): void => {
						if (focusFrom.current === "None") {
							focusFrom.current = "Tap";
						}
						reset.current = true;
						setFlipFlop(!flipFlop);
					}}
					onKeyPress={({ nativeEvent }): void => {
						const char = nativeEvent.key;
						if (!isNaN(Number(char))) {
							if (reset.current) {
								setMinutes(char);
							} else {
								setMinutes(minutes + char);
								if (minutes.length > 0) {
									secondsRef.current?.focus();
									focusFrom.current = "Previous";
								}
							}
							reset.current = false;
						} else if (nativeEvent.key === "Backspace") {
							if (minutes.length < 2) {
								hoursRef.current?.focus();
							}
							setMinutes(minutes.substring(0, minutes.length - 1));
							focusFrom.current = "Next";
							reset.current = false;
						}
					}}
				/>
				<Text 
					style={globalstyles.timeInputText} 
					onPress={(): void => {
						minutesRef.current?.focus(); 
						reset.current = true;
					}}
				>
					{minutes}
				</Text>
			</View>
			<Text style={globalstyles.timeSeparator}>:</Text>

			{/* Seconds */}
			<View style={[globalstyles.timeInputButton, { borderBottomColor: secondsRef.current?.isFocused() ? GREEN_COLOR : LIGHT_GRAY_COLOR }]}>
				<TextInput
					keyboardType={keyboardType.current}
					style={{ height: Platform.OS === "android" ? 1 : 0, width: Platform.OS === "android" ? 1 : 0 }}
					caretHidden={true}
					value={seconds}
					ref={secondsRef}
					onBlur={(): void => {
						setFlipFlop(!flipFlop);
					}}
					onFocus={(): void => {
						if (focusFrom.current === "None") {
							focusFrom.current = "Tap";
						}
						reset.current = true;
						setFlipFlop(!flipFlop);
					}}
					onKeyPress={({ nativeEvent }): void => {
						const char = nativeEvent.key;
						if (!isNaN(Number(char))) {
							if (reset.current) {
								setSeconds(char);
							} else {
								setSeconds(seconds + char);
								if (seconds.length > 0) {
									milliRef.current?.focus();
									focusFrom.current = "Previous";
								}
							}
							reset.current = false;
						} else if (nativeEvent.key === "Backspace") {
							if (seconds.length < 2) {
								minutesRef.current?.focus();
							}
							setSeconds(seconds.substring(0, seconds.length - 1));
							focusFrom.current = "Next";
							reset.current = false;
						}
					}}
				/>
				<Text 
					style={globalstyles.timeInputText} 
					onPress={(): void => {
						secondsRef.current?.focus(); 
					}}
				>
					{seconds}
				</Text>
			</View>
			<Text style={globalstyles.timeSeparator}>.</Text>

			{/* Milliseconds */}
			<View style={[globalstyles.timeInputButton, { borderBottomColor: milliRef.current?.isFocused() ? GREEN_COLOR : LIGHT_GRAY_COLOR }]}>
				<TextInput
					keyboardType={keyboardType.current}
					style={{ height: Platform.OS === "android" ? 1 : 0, width: Platform.OS === "android" ? 1 : 0 }}
					caretHidden={true}
					value={milli}
					ref={milliRef}
					onBlur={(): void => {
						setFlipFlop(!flipFlop);
					}}
					onFocus={(): void => {
						if (focusFrom.current === "None") {
							focusFrom.current = "Tap";
						}
						reset.current = true;
						setFlipFlop(!flipFlop);
					}}
					onKeyPress={({ nativeEvent }): void => {
						const char = nativeEvent.key;
						if (!isNaN(Number(char))) {
							if (reset.current) {
								setMilli(char);
							} else {
								if (milli.length < 2) {
									setMilli(milli + char);
								}
							}
							reset.current = false;
						} else if (nativeEvent.key === "Backspace") {
							if (milli.length < 2) {
								secondsRef.current?.focus();
							}
							setMilli(milli.substring(0, milli.length - 1));
							focusFrom.current = "Next";
							reset.current = false;
						}
					}}
				/>
				<Text 
					style={globalstyles.timeInputText} 
					onPress={(): void => {
						milliRef.current?.focus(); 
					}}
				>
					{milli}
				</Text>
			</View>
		</View>
	);
}