import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import Icon from "./IcoMoon";
import { DARK_GRAY_COLOR, DARK_RED_COLOR } from "./styles";

interface Props {
	disabled?: boolean
}

export const SyncAnimation = (props: Props): React.ReactElement => {
	// fadeAnim will be used as the value for opacity. Initial Value: 1
	const fadeAnim = useRef(new Animated.Value(1)).current;

	const animation = 
	Animated.loop(
		Animated.sequence([	
			Animated.timing(fadeAnim, { toValue: 0.3, useNativeDriver: true, duration: 1500 }),		
			Animated.timing(fadeAnim, { toValue: 1, useNativeDriver: true, duration: 1500 }),
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
		<Animated.View 
			style={{ 
				borderRadius: 20, 
				opacity: props.disabled ? 1 : fadeAnim, 
				alignItems: "center", 
				justifyContent: "center",
			}}>
			<View
				style={props.disabled ? undefined : {
					shadowColor: DARK_RED_COLOR,
					shadowOffset: { width: 0, height: 0 },
					shadowOpacity: 1,
					shadowRadius: 3,
					elevation: 5,
				}}
			>
				<Icon name={"cloud2"} color={props.disabled ? DARK_GRAY_COLOR : DARK_RED_COLOR} size={30} />
			</View>
		</Animated.View>
	);

	// return (
	// 	<Animated.View 
	// 		style={{ 
	// 			borderWidth: 4, 
	// 			borderColor: BLACK_COLOR, 
	// 			borderRadius: 15, 
	// 			height: 21, 
	// 			width: 21, 
	// 			opacity: props.disabled ? 1 : fadeAnim, 
	// 			alignItems: "center", 
	// 			justifyContent: "center",
	// 			shadowColor: RED_COLOR,
	// 			shadowOffset: { width: 0, height: 0 },
	// 			shadowOpacity: 1,
	// 			shadowRadius: 4,
	// 			elevation: 5,
	// 		}}>
	// 		{props.disabled ? <View
	// 			style={{
	// 				position: "absolute",
	// 				width: 3,
	// 				height: 29,
	// 				backgroundColor: RED_COLOR, transform: [{ rotate: "45deg" }],
	// 				zIndex: 1,
	// 				shadowColor: BLACK_COLOR,
	// 				shadowOffset: { width: 0, height: 1 },
	// 				shadowOpacity: 1,
	// 				shadowRadius: 3,
	// 				elevation: 10,
	// 			}} /> : null}
	// 		<View 
	// 			style={{ 
	// 				backgroundColor: props.disabled ? DARK_RED_COLOR : DARK_RED_COLOR, 
	// 				borderRadius: 20, 
	// 				width: 8, 
	// 				height: 8,
	// 			}} />
	// 	</Animated.View>
	// );
};