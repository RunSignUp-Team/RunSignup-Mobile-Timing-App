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
		if (props.appMode === "Offline") {
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
						"Publishing Results",
						"You are currently in the \"Score & Publish Results\" App Flow.\nParticipant data will sync down from RunSignup and all of your results will be uploaded to RunSignup."
					);
				} else if (props.appMode === "Backup") {
					Alert.alert(
						"Backup Timing",
						"You are currently in the \"Backup Timer\" App Flow.\nParticipant data will sync down from RunSignup, but none of your results will be uploaded to RunSignup.\nYou will need to export them from \"Results\"."
					);
				} else {
					Alert.alert(
						"Offline Scoring",
						"You are currently in the \"Score Offline\" App Flow.\nNo participant data will sync down from RunSignup and none of your results will be uploaded to RunSignup.\nHowever, you can score an Offline Event without an Internet Connection.\nData can be exported from \"Results\" or assigned to an Online Event in the \"Score & Publish Results\" App Flow."
					);
				}

			}}
		>
			<Animated.View
				style={{
					borderRadius: 20,
					opacity: props.appMode !== "Offline" ? fadeAnim : 1,
					alignItems: "center",
					justifyContent: "center",
				}}>
				<View
					style={props.appMode === "Offline" ? undefined : {
						shadowColor: WHITE_COLOR,
						shadowOffset: { width: 0, height: 0 },
						shadowOpacity: 1,
						shadowRadius: 3,
						elevation: 5,
					}}
				>
					<Icon name={props.appMode === "Backup" ? "cloud-download" : (props.appMode === "Offline" ? "cloud-x" : "cloud-upload")} color={props.appMode !== "Online" ? DARK_GRAY_COLOR : DARK_RED_COLOR} size={30} />
				</View>
			</Animated.View>
		</TouchableOpacity>
	);
};