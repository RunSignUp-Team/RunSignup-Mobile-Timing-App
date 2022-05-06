import React from "react";
import LoginScreen from "../screens/LoginScreen";
import RaceListScreen from "../screens/RaceListScreen";
import EventsListScreen from "../screens/EventsListScreen";
import ModeScreen from "../screens/ModeScreen";
import FinishLineModeScreen from "../screens/FinishLineModeScreen";
import ChuteModeScreen from "../screens/ChuteModeScreen";
import VerificationModeScreen from "../screens/VerificationModeScreen";
import OfflineEventsListScreen from "../screens/OfflineEventsScreen";
import Loader from "../screens/SplashScreen";
import { BIG_FONT_SIZE, GREEN_COLOR } from "./styles";
import { createStackNavigator } from "@react-navigation/stack";

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
	return (
		<AppStack.Navigator screenOptions={{
			headerStyle: { backgroundColor: GREEN_COLOR },
			headerTitleStyle: { fontSize: BIG_FONT_SIZE, fontFamily: "Roboto_700Bold", color: "white" },
		}}>
			<AppStack.Screen name="SplashScreen" component={Loader} options={{
				headerShown: false,
				headerLeft: () => ( null )
			}} />
			<AppStack.Screen name="Login" component={LoginScreen} options={{
				title: "Home",
				headerLeft: () => ( null )
			}} />
			<AppStack.Screen name="OfflineEventsList" component={OfflineEventsListScreen} options={{
				title: "Offline Events",
			}} />
			<AppStack.Screen name="RaceList" component={RaceListScreen} options={{
				title: "Races",
			}} />
			<AppStack.Screen name="EventsList" component={EventsListScreen} options={{
				title: "Events",
			}} />
			<AppStack.Screen name="ModeScreen" component={ModeScreen} options={{
				title: "Modes",
			}} />
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
		</AppStack.Navigator>
	);
}