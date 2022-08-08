import React, { useContext, useCallback, useState, useEffect } from "react";
import { View, Image, BackHandler, ActivityIndicator, Platform, Alert, TouchableOpacity, Text } from "react-native";
import { BLACK_COLOR, globalstyles, GRAY_COLOR, WHITE_COLOR } from "../components/styles";
import { AppContext, AppMode } from "../components/AppContext";
import { useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import { deleteTokenInfo, getTokenInfo, oAuthLogin } from "../helpers/oAuth2Helper";
import MainButton from "../components/MainButton";
import Logger from "../helpers/Logger";
import { Buffer } from "buffer";
import { getUser } from "../helpers/APICalls";
import * as Linking from "expo-linking";
import * as Network from "expo-network";
import { NetworkErrorBool } from "../helpers/CreateAPIError";
import Icon from "../components/IcoMoon";
import Constants from "expo-constants";

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

	const [loading, setLoading] = useState(false);
	const [loggedIn, setLoggedIn] = useState(false);

	// Handle log out. Delete local tokens
	const handleLogOut = useCallback(() => {
		Alert.alert("Log Out?", "Are you sure you want to log out?", [
			{ text: "Cancel" },
			{
				text: "Log Out",
				style: "destructive",
				onPress: async (): Promise<void> => {
					try {
						await deleteTokenInfo();
						setLoggedIn(false);
					} catch (error) {
						Logger("Could Not Log Out (Home)", error, true);
					}
				}
			},
		]);
	}, []);

	useEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<View style={{ flexDirection: "row", justifyContent: loggedIn ? "space-between" : "flex-end" }}>
					{loggedIn ? <TouchableOpacity onPress={handleLogOut} style={globalstyles.headerButtonText}>
						<Icon name={"exit"} size={22} color={WHITE_COLOR}></Icon>
					</TouchableOpacity> : null}
				</View>
			)
		});
	}, [handleLogOut, loggedIn, navigation]);

	useFocusEffect(
		useCallback(() => {
			const onBackPress = (): boolean => {
				return true;
			};

			const showLogOut = async (): Promise<void> => {
				if (await getTokenInfo()) {
					setLoggedIn(true);
				} else {
					setLoggedIn(false);
				}
			};
			showLogOut();

			BackHandler.addEventListener("hardwareBackPress", onBackPress);

			return () =>
				BackHandler.removeEventListener("hardwareBackPress", onBackPress);
		}, []),
	);

	/** Handle user wanting to record online races */
	const onlineOrTimekeeperTapped = async (appMode: AppMode): Promise<void> => {
		setLoading(true);
		try {
			const accessToken = await oAuthLogin(false);
			if (!accessToken) {
				Logger("Unable to Authenticate", "Unable to authenticate. Please try again.", true);
				deleteTokenInfo(true);
			}
			else {
				// Store User ID on login
				const tokenStr = accessToken.substring(accessToken.indexOf(".")+1, accessToken.indexOf(".", accessToken.indexOf(".")+1));
				const tokenParse = JSON.parse(Buffer.from(tokenStr, "base64").toString()) as TokenParse;

				try {
					const user = await getUser(tokenParse.sub);
					context.setEmail(user.user.email);
				} catch (error) {
					if (!NetworkErrorBool(error)) {
						// Non-connection related error
						Logger("No Email Found", error, false);
					}
				}

				// Go to the race list if connected to internet
				context.setAppMode(appMode);
				if ((await Network.getNetworkStateAsync()).isInternetReachable) {
					navigation.push("RaceList");
				} else {
					Alert.alert("Connection Error", "No response received from the server. Please check your internet connection and try again.");
				}
			}
		} catch (error) {
			Logger("Unable to Authenticate", error, true);
		} finally {
			setLoading(false);
		}
	};

	/** Handle user wanting to record offline races */
	const offlineTapped = (): void => {
		context.setAppMode("Offline");
		navigation.navigate("OfflineEventsList");
	};

	/** Handle start guide link */
	const startGuideTapped = async (): Promise<void> => {
		const url = "https://help.runsignup.com/support/solutions/articles/17000125950-mobile-timing-app";
		if (await Linking.canOpenURL(url)) {
			Linking.openURL(url);
		} else {
			Logger("Cannot Open Link", "Device Not Set Up Correctly", true);
		}
	};

	const version = Constants.manifest?.version;

	return (
		<View style={globalstyles.container}>
			<View style={{ flexDirection: "column", flex: 1 }}>
				<Image
					style={[globalstyles.image, { marginTop: 10 }]}
					source={require("../assets/logo.png")}
				/>
				<MainButton text={"Online Races"} onPress={(): void => { onlineOrTimekeeperTapped("Online"); }} buttonStyle={{ marginTop: 50 }} />
				<MainButton text={"Time Keeper"} onPress={(): void => { onlineOrTimekeeperTapped("TimeKeeper"); }}  />
				<MainButton text={"Local Events"} onPress={offlineTapped} />
				{loading && <ActivityIndicator size="large" color={Platform.OS === "android" ? BLACK_COLOR : GRAY_COLOR} style={{ marginTop: 20 }} />}
				<View style={{ position: "absolute", bottom: 20, width: "100%" }}>
					{version ? <Text style={globalstyles.modalHeader}>{`Version ${version}`}</Text> : null}
					<MainButton text={"Start Guide"} onPress={startGuideTapped} buttonStyle={{ minHeight: 50 }} color="Gray" />
				</View>
			</View>

		</View>
	);
};

export default LoginScreen;