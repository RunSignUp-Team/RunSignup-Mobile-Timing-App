import React, { useEffect, useRef } from "react";
import { Alert, Animated, TouchableOpacity, View } from "react-native";
import { AppMode } from "./AppContext";
import Icon from "./IcoMoon";
import { DARK_GRAY_COLOR, DARK_RED_COLOR, WHITE_COLOR } from "./styles";

interface Props {
	appMode: AppMode
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
		if (props.appMode !== "Online") {
			animation.reset();
		} else {
			animation.start();
		}
	}, [animation, fadeAnim, props.appMode]);

	return (
		<TouchableOpacity
			onPress={(): void => {
				if (props.appMode === "Online") {
					Alert.alert(
						"Syncing Results",
						"You are currently in the \"Score & Publish Results\" App Flow. All of your results for any event will be uploaded to RunSignup."
					);
				} else if (props.appMode === "Backup") {
					Alert.alert(
						"Not Syncing Results",
						"You are currently in the \"Score as Backup Timer\" App Flow. None of your results for any event will be uploaded to RunSignup. You must manually export them."
					);
				} else {
					Alert.alert(
						"Not Syncing Results",
						"You are currently in the \"Score Offline\" App Flow. None of your results for any event will be uploaded to RunSignup, and you can continue to score an Offline Event without an Internet Connection."
					);
				}

			}}
		>
			<Animated.View
				style={{
					borderRadius: 20,
					opacity: props.appMode === "Online" ? fadeAnim : 1,
					alignItems: "center",
					justifyContent: "center",
				}}>
				<View
					style={props.appMode !== "Online" ? undefined : {
						shadowColor: WHITE_COLOR,
						shadowOffset: { width: 0, height: 0 },
						shadowOpacity: 1,
						shadowRadius: 3,
						elevation: 5,
					}}
				>
					<Icon name={props.appMode === "Backup" ? "cloud-x" : (props.appMode === "Offline" ? "folder" : "cloud-check")} color={props.appMode !== "Online" ? DARK_GRAY_COLOR : DARK_RED_COLOR} size={30} />
				</View>
			</Animated.View>
		</TouchableOpacity>
	);
};