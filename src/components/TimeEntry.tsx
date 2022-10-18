import React, { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardTypeOptions, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import addLeadingZeros from "../helpers/AddLeadingZeros";
import GetTimeInMils from "../helpers/GetTimeInMils";
import { globalstyles, GREEN_COLOR, LIGHT_GRAY_COLOR } from "./styles";

interface Props {
	/** Date */
	initialValue?: number,
	setValue: (value: number) => void,
	/** True if the value is a time of day, not an absolute time */
	timeOfDay?: boolean
}

type FocusLocation = "Previous" | "Next" | "Tap" | "None";
type AMPM = "AM" | "PM" | "";

/** Time Entry Component */
export default function TimeOfDayEntry(props: Props): React.ReactElement {
	const [extraDateInfo, setExtraDateInfo] = useState("");
	const [hours, setHours] = useState("");
	const [minutes, setMinutes] = useState("");
	const [seconds, setSeconds] = useState("");
	const [milli, setMilli] = useState("");
	const [ampm, setAmpm] = useState<AMPM>("");

	const [flipFlop, setFlipFlop] = useState(true);

	const hoursRef = useRef<TextInput>(null);
	const minutesRef = useRef<TextInput>(null);
	const secondsRef = useRef<TextInput>(null);
	const milliRef = useRef<TextInput>(null);

	const getHours = (hours: string, ampm: AMPM): number => {
		const hourNum = Number(hours);
		if (ampm === "PM") {
			if (hourNum % 12 !== 0) {
				return hourNum + 12;
			} else {
				return hourNum;
			}
		} else {
			if (hourNum % 12 === 0) {
				return 0;
			} else {
				return hourNum;
			}
		}
	};

	const createClockTime = useCallback((): number => {
		if (props.timeOfDay && Number(hours) <= 24) {
			let clockTime = "";
			if (hours || minutes || seconds || milli) {
				clockTime = addLeadingZeros(props.timeOfDay ? getHours(hours, ampm) : Number(hours)) + ":" + addLeadingZeros(Number(minutes)) + ":" + addLeadingZeros(Number(seconds)) + "." + addLeadingZeros(Number(milli));
			} else {
				clockTime = "";
			}

			return parseInt(extraDateInfo) + GetTimeInMils(clockTime); 
		}  else if (!props.timeOfDay && Number(hours) <= 99) {
			let clockTime = "";
			if (hours || minutes || seconds || milli) {
				clockTime = addLeadingZeros(props.timeOfDay ? getHours(hours, ampm) : Number(hours)) + ":" + addLeadingZeros(Number(minutes)) + ":" + addLeadingZeros(Number(seconds)) + "." + addLeadingZeros(Number(milli));
			} else {
				clockTime = "";
			}

			return GetTimeInMils(clockTime);
		// Don't change blank values when cycling through them
		} else if (!props.timeOfDay && Math.floor((Number.MAX_SAFE_INTEGER / 3600000))) {
			return Number.MAX_SAFE_INTEGER;
		} else {
			return -1;
		}
	}, [ampm, extraDateInfo, hours, milli, minutes, props.timeOfDay, seconds]);

	useEffect(() => {
		if (props.initialValue) {
			const date = new Date(props.initialValue === Number.MAX_SAFE_INTEGER ? 0 : props.initialValue);
			if (props.timeOfDay) {
				setExtraDateInfo(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime().toString());
				setAmpm(date.getHours() >= 12 ? "PM" : "AM");
			}

			// Handle different number of millisecond digits
			const milliString = date.getUTCMilliseconds().toLocaleString();
			let milliDisplay = "";
			switch (milliString.length) {
				case 3:
					milliDisplay = addLeadingZeros(date.getUTCMilliseconds());
					break;
				case 2:
					milliDisplay = "0" + milliString.substring(0, 1);
					break;
				default:
					milliDisplay = "00";
					break;
			}

			// We want to respect timezone if we are dealing with time of day
			const initialValue = (props.initialValue ?? 0);
			setHours(props.timeOfDay ? addLeadingZeros(date.getHours() % 12 === 0 ? 12 : date.getHours() % 12) : Math.floor(initialValue / 3600000).toString());
			setMinutes(addLeadingZeros(date.getUTCMinutes()));
			setSeconds(addLeadingZeros(date.getUTCSeconds()));
			setMilli(milliDisplay);

			hoursRef.current?.blur();
			minutesRef.current?.blur();
			secondsRef.current?.blur();
			milliRef.current?.blur();
		}
	}, [props.initialValue, props.timeOfDay]);

	/** We do this so that we are not depending on props, but rather props.setValue */
	useEffect(() => {
		const setValue = props.setValue;
		if (typeof setValue === "function") {
			setValue(createClockTime());
		}
	}, [ampm, createClockTime, props.setValue]);

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
					{Number(hours) === Math.floor((Number.MAX_SAFE_INTEGER / 3600000)) ? 0 : hours}
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
			{props.timeOfDay && ampm ?
				<TouchableOpacity
					onPress={(): void => {
						if (ampm === "AM") {
							setAmpm("PM");
						} else {
							setAmpm("AM");
						}
					}}
					style={[globalstyles.timeInputButton, { borderBottomWidth: 0 }]}>
					<Text
						style={[globalstyles.timeInputText, { paddingTop: 0, color: GREEN_COLOR, fontFamily: "RobotoBold" }]}>
						{ampm}
					</Text>
				</TouchableOpacity>
				: null
			}
		</View>
	);
}