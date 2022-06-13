import React, { useEffect, useState } from "react";
import LoginScreen from "../screens/LoginScreen";
import RaceListScreen from "../screens/RaceListScreen";
import EventsListScreen from "../screens/EventsListScreen";
import ModeScreen from "../screens/ModeScreen";
import FinishLineModeScreen from "../screens/FinishLineModeScreen";
import ChuteModeScreen from "../screens/ChuteModeScreen";
import VerificationModeScreen from "../screens/VerificationModeScreen";
import OfflineEventsListScreen from "../screens/OfflineEventsScreen";
import { BIG_FONT_SIZE, GREEN_COLOR } from "./styles";
import { createStackNavigator } from "@react-navigation/stack";
import Logger from "../helpers/Logger";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";

export type RootStackParamList = {
	SplashScreen: undefined,
	Login: undefined,
	OfflineEventsList: undefined,
	RaceList: undefined,
	EventsList: undefined,
	ModeScreen: undefined,
	FinishLineMode: undefined,
	ChuteMode: undefined,
	VerificationMode: undefined
};

const AppStack = createStackNavigator<RootStackParamList>();

export default function StartNavigator(): React.ReactElement {
	const [appIsReady, setAppIsReady] = useState(false);

	useEffect(() => {
		async function prepare(): Promise<void> {
			try {
				// Keep the splash screen visible while we fetch resources
				await SplashScreen.preventAutoHideAsync();
				// Pre-load fonts, make any API calls you need to do here
				await Font.loadAsync({
					"Roboto": require("../assets/Roboto/Roboto-Regular.ttf"),
					"RobotoBold": require("../assets/Roboto/Roboto-Bold.ttf"),
					"RobotoMono": require("../assets/Roboto/RobotoMono-VariableFont_wght.ttf"),
				});
			} catch (error) {
				Logger("Could Not Load Fonts. Please Restart.", error, true);
			} finally {
				SplashScreen.hideAsync();
				setAppIsReady(true);
			}
		}

		prepare();
	}, []);

	return (
		<>
			{appIsReady && <AppStack.Navigator screenOptions={{
				headerStyle: { backgroundColor: GREEN_COLOR },
				headerTitleStyle: { fontSize: BIG_FONT_SIZE, fontFamily: "RobotoBold", color: "white" },
				headerTitleAlign: "left"
			}}>
				<AppStack.Screen name="Login" component={LoginScreen} options={{
					title: "Home",
					headerLeft: () => (null)
				}} />
				<AppStack.Screen name="OfflineEventsList" component={OfflineEventsListScreen} options={{
					title: "Offline Events",
				}} />
				<AppStack.Screen name="RaceList" component={RaceListScreen} options={{
					title: "Your Races",
				}} />
				<AppStack.Screen name="EventsList" component={EventsListScreen}/>
				<AppStack.Screen name="ModeScreen" component={ModeScreen}/>
				<AppStack.Screen name="FinishLineMode" component={FinishLineModeScreen} options={{
					title: "Finish Line Mode",
					gestureEnabled: false
				}} />
				<AppStack.Screen name="ChuteMode" component={ChuteModeScreen} options={{
					title: "Chute Mode",
					gestureEnabled: false
				}} />
				<AppStack.Screen name="VerificationMode" component={VerificationModeScreen} options={{
					title: "Results",
					gestureEnabled: false
				}} />
			</AppStack.Navigator>}
		</>
	);
}