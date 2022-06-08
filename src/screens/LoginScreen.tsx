import React, { useContext, useCallback } from "react";
import { View, Image, BackHandler } from "react-native";
import { globalstyles } from "../components/styles";
import { AppContext } from "../components/AppContext";
import { useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import { oAuthLogin } from "../helpers/oAuth2Helper";
import MainButton from "../components/MainButton";
import Logger from "../helpers/Logger";
import { Buffer } from "buffer";
import { getUser } from "../helpers/AxiosCalls";
import * as Linking from "expo-linking";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

interface TokenParse {
	aud: string,
	exp: number,
	iat: number,
	jty: string,
	nbf: number,
	scopes: Array<object>,
	/** User ID */
	sub: string
}

const LoginScreen = ({ navigation }: Props): React.ReactElement => {
	const context = useContext(AppContext);

	useFocusEffect(
		useCallback(() => {
			const onBackPress = (): boolean => {
				return true;
			};

			BackHandler.addEventListener("hardwareBackPress", onBackPress);

			return () =>
				BackHandler.removeEventListener("hardwareBackPress", onBackPress);
		}, []),
	);

	/** Handle user wanting to record online races */
	const handleRecordOnlineClick = async (): Promise<void> => {
		try {
			const accessToken = await oAuthLogin(false);
			if (!accessToken) {
				Logger("Unable to Authenticate", "Unable to authenticate. Please try again.", true);
			}
			else {
				// Store User ID on login
				const tokenStr = accessToken.substring(accessToken.indexOf(".")+1, accessToken.indexOf(".", accessToken.indexOf(".")+1));
				const tokenParse = JSON.parse(Buffer.from(tokenStr, "base64").toString()) as TokenParse;

				try {
					context.setEmail((await getUser(tokenParse.sub)).user.email);
				} catch (error) {
					Logger("No Email Found", error, false);
				}

				// Go to their race list
				context.setOnline(true);
				navigation.push("RaceList");
			}
		} catch (error) {
			Logger("Unable to Authenticate", error, true);
		}
	};

	/** Handle user wanting to record offline races */
	const handleRecordOfflineClick = (): void => {
		context.setOnline(false);
		navigation.navigate("OfflineEventsList");
	};

	/** Handle start guide link */
	const handleStartGuideClick = async (): Promise<void> => {
		const url = "https://help.runsignup.com/support/solutions/articles/17000125950-mobile-timing-app";
		if (await Linking.canOpenURL(url)) {
			Linking.openURL(url);
		} else {
			Logger("Cannot Open Link", "Device Not Set Up Correctly", true);
		}
	};

	return (
		<View style={globalstyles.container}>

			<View style={{ flexDirection: "column", flex: 1 }}>
				<Image
					style={[globalstyles.image, { marginTop: 10 }]}
					source={require("../assets/logo.png")}
				/>
				<MainButton text={"Online Races"} onPress={handleRecordOnlineClick} buttonStyle={{ marginTop: 50 }} />
				<MainButton text={"Offline Events"} onPress={handleRecordOfflineClick} />
				<MainButton text={"Start Guide"} onPress={handleStartGuideClick} buttonStyle={{ position: "absolute", bottom: 20, minHeight: 50 }} color="Gray" />
			</View>

		</View>
	);
};

export default LoginScreen;