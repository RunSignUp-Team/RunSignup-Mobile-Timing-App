import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { BLACK_COLOR, DARK_GRAY_COLOR, RED_COLOR } from "./styles";

interface Props {
	disabled?: boolean
}

export const SyncAnimation = (props: Props): React.ReactElement => {
	// fadeAnim will be used as the value for opacity. Initial Value: 1
	const fadeAnim = useRef(new Animated.Value(1)).current;

	const animation = 
	Animated.loop(
		Animated.sequence([	
			Animated.timing(fadeAnim, { toValue: 0.3, useNativeDriver: true, duration: 1250 }),		
			Animated.timing(fadeAnim, { toValue: 1, useNativeDriver: true, duration: 1250 }),
			Animated.delay(250),
		])
	);

	useEffect(() => {
		if (props.disabled) {
			animation.reset();
		} else {
			animation.start();
		}
	}, [animation, fadeAnim, props.disabled]);

	return (
		<Animated.View style={{ borderWidth: 4, borderColor: props.disabled ? DARK_GRAY_COLOR : BLACK_COLOR, borderRadius: 20, height: 21, width: 21, opacity: props.disabled ? 1 : fadeAnim, alignItems: "center", justifyContent: "center" }}>
			{props.disabled ? <View style={{ position: "absolute", width: 3, height: 29, backgroundColor: RED_COLOR, transform: [{ rotate: "45deg" }], zIndex: 4 }} /> : null}
			<View style={{ backgroundColor: props.disabled ? DARK_GRAY_COLOR : RED_COLOR, borderRadius: 20, width: 9, height: 9 }} />
		</Animated.View>
	);
};