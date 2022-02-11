import React, { useContext, useCallback } from "react";
import { View, TouchableOpacity, Text, Image, Alert, BackHandler } from "react-native";
import { globalstyles} from "../components/styles";
import { AppContext } from "../components/AppContext";
import { useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import { oAuthLogin } from "../helpers/oAuth2Helper";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const LoginScreen = ({ navigation }: Props) => {
	const context = useContext(AppContext);

	useFocusEffect(
		useCallback(() => {
			const onBackPress = () => {
				return true;
			};

			BackHandler.addEventListener("hardwareBackPress", onBackPress);

			return () =>
				BackHandler.removeEventListener("hardwareBackPress", onBackPress);
		}, []),
	);

	/** Handle user wanting to record online races */
	const handleRecordOnlineClick = async () => {
		try {
			const accessToken = await oAuthLogin(false);
			if (!accessToken) {
				Alert.alert("Unable To Authenticate", "Unable to authenticate. Please try again.");
			}
			else {
				// Go to their race list
				context.setOnline(true);
				navigation.push("RaceList");
			}
		} catch (error) {
			Alert.alert("Unable To Authenticate", "Unable to authenticate. Please try again.");
		}
	};

	/** Handle user wanting to record offline races */
	const handleRecordOfflineClick = async () => {
		context.setOnline(false);
		navigation.navigate("OfflineEventsList");
	};

	return (
		<View style={globalstyles.container}>

			<View style={{ flexDirection: "column", flex: 1}}>
				<Image
					style={[globalstyles.image, {marginTop: "10%"}]}
					source={require("../assets/logo.png")}
				/>
				<TouchableOpacity style={[globalstyles.button, {marginTop: "25%"}]} onPress={handleRecordOnlineClick}>
					<Text style={globalstyles.buttonText}>Record Online Race</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[globalstyles.button]}
					onPress={handleRecordOfflineClick}>
					<Text style={globalstyles.buttonText}>Record Offline Race</Text>
				</TouchableOpacity>

			</View>

		</View>
	);
};

export default LoginScreen;
