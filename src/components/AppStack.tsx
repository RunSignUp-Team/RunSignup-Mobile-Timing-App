import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import RaceListScreen from "../screens/RaceListScreen";
import EventsListScreen from "../screens/EventsListScreen";
import ModeScreen from "../screens/ModeScreen";
import FinishLineModeScreen from "../screens/FinishLineModeScreen";
import ChuteModeScreen from "../screens/ChuteModeScreen";
import VerificationModeScreen from "../screens/VerificationModeScreen";
import OfflineEventsListScreen from "../screens/OfflineEventsScreen";
import Loader from "../screens/SplashScreen";
import { GREEN_COLOR } from "./styles";

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

const AppStack = createNativeStackNavigator<RootStackParamList>();

export default function StartNavigator() {
	return (
		<AppStack.Navigator screenOptions={{
			headerBackVisible: false,
			headerTintColor: "white",
			headerStyle: { backgroundColor: GREEN_COLOR },
			headerTitleStyle: { fontSize: 20, fontWeight: "bold" },
		}}>
			<AppStack.Screen name="SplashScreen" component={Loader} options={{
				headerShown: false,
			}} />
			<AppStack.Screen name="Login" component={LoginScreen} options={{
				title: "Login",
				gestureEnabled: false
			}} />
			<AppStack.Screen name="OfflineEventsList" component={OfflineEventsListScreen} options={{
				title: "Offline Events",
			}} />
			<AppStack.Screen name="RaceList" component={RaceListScreen} options={{
				title: "Races",
				gestureEnabled: false
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
				title: "Verification Mode",
			}} />
		</AppStack.Navigator>
	);
}