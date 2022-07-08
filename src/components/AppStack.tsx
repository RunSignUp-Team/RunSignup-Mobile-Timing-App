import React, { useContext, useEffect, useState } from "react";
import LoginScreen from "../screens/Login";
import RaceListScreen from "../screens/RacesList";
import EventsListScreen from "../screens/EventsList";
import ModeScreen from "../screens/Modes";
import FinishLineModeScreen from "../screens/FinishLineMode";
import ChuteModeScreen from "../screens/ChuteMode";
import ResultsMode from "../screens/ResultsMode";
import OfflineEventsListScreen from "../screens/OfflineEvents";
import { BIG_FONT_SIZE, GREEN_COLOR, WHITE_COLOR, SMALL_FONT_SIZE, BLACK_COLOR } from "./styles";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Logger from "../helpers/Logger";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { StatusBar, View } from "react-native";
import AltFinishLineMode from "../screens/AltFinishLineMode";
import Icon from "./IcoMoon";
import { AppContext } from "../components/AppContext";

export type RootStackParamList = {
	SplashScreen: undefined,
	Login: undefined,
	OfflineEventsList: undefined,
	RaceList: undefined,
	EventsList: undefined,
	ModeScreen: undefined,
	FinishLineMode: undefined,
	AltFinishLineMode: undefined,
	ChuteMode: undefined,
	VerificationMode: undefined,
	ListView: undefined
};

export type TabParamList = RootStackParamList & {
	ListView: undefined,
	GridView: undefined
};

const AppStack = createStackNavigator<RootStackParamList>();
const FinishTimeStack = createBottomTabNavigator<TabParamList>();

function FinishTimeNavigator(): React.ReactElement {	
	return (
		<FinishTimeStack.Navigator screenOptions={{
			header: () => null,
			tabBarStyle: { backgroundColor: GREEN_COLOR },
			tabBarActiveTintColor: WHITE_COLOR,
			tabBarInactiveTintColor: BLACK_COLOR,
			tabBarLabelStyle: { fontSize: SMALL_FONT_SIZE },
			tabBarLabelPosition: "beside-icon",
			tabBarHideOnKeyboard: true
		}}>
			<FinishTimeStack.Screen name="ListView" component={FinishLineModeScreen} options={{
				tabBarShowLabel: false,
				tabBarIcon: (props): React.ReactElement => {
					return (
						<View style={{width: 50, alignItems: "center"}}>
							<Icon
								name="list-numbered"
								color={props.color}
								size={30}
							/>
						</View>
					);
				}
			}} />
			<FinishTimeStack.Screen name="GridView" component={AltFinishLineMode} options={{
				tabBarShowLabel: false,
				tabBarIcon: (props): React.ReactElement => {
					return (
						<View style={{width: 50, alignItems: "center"}}>
							<Icon
								name="grid"
								color={props.color}
								size={30}
							/>
						</View>
					);
				}
			}} />
		</FinishTimeStack.Navigator>
	);
}

export default function StartNavigator(): React.ReactElement {
	const [appIsReady, setAppIsReady] = useState(false);
	const context = useContext(AppContext);


	useEffect(() => {
		async function prepare(): Promise<void> {
			try {
				// Keep the splash screen visible while we fetch resources
				await SplashScreen.preventAutoHideAsync();
				// Pre-load fonts, make any API calls you need to do here
				await Font.loadAsync({
					"Roboto": require("../assets/Fonts/Roboto-Regular.ttf"),
					"RobotoBold": require("../assets/Fonts/Roboto-Bold.ttf"),
					"RobotoMono": require("../assets/Fonts/RobotoMono-VariableFont_wght.ttf"),
					"IcoMoon": require("../assets/Fonts/IcoMoon-Ultimate.ttf")
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
			<StatusBar
				backgroundColor={GREEN_COLOR}
			/>
			{appIsReady && <AppStack.Navigator screenOptions={{
				headerStyle: { backgroundColor: GREEN_COLOR },
				headerTitleStyle: { fontSize: BIG_FONT_SIZE, fontFamily: "RobotoBold", color: WHITE_COLOR },
				headerTitleAlign: "left",
				headerTintColor: WHITE_COLOR,
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
				<AppStack.Screen name="EventsList" component={EventsListScreen} />
				<AppStack.Screen name="ModeScreen" component={ModeScreen} />
				{context.online ?
					<AppStack.Screen name="FinishLineMode" component={FinishTimeNavigator} options={{
						title: "Finish Line Mode",
						gestureEnabled: false,
					}} /> :
					<AppStack.Screen name="FinishLineMode" component={FinishLineModeScreen} options={{
						title: "Finish Line Mode",
						gestureEnabled: false
					}} />
				}
				<AppStack.Screen name="ChuteMode" component={ChuteModeScreen} options={{
					title: "Chute Mode",
					gestureEnabled: false
				}} />
				<AppStack.Screen name="VerificationMode" component={ResultsMode} options={{
					title: "Results",
					gestureEnabled: false
				}} />
			</AppStack.Navigator>}
		</>
	);
}