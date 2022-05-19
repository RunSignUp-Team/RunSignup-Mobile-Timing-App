import Bugsnag from '@bugsnag/expo';
Bugsnag.start();

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import StartNavigator from "./src/components/AppStack";
import AppProvider from "./src/components/AppContext";
import AppLoading from "expo-app-loading";
import {
	useFonts,
	Roboto_400Regular,
	Roboto_500Medium_Italic,
	Roboto_700Bold
  } from "@expo-google-fonts/roboto";
import {
	RobotoMono_400Regular
} from "@expo-google-fonts/roboto-mono";


const App = () => {
	let [fontsLoaded] = useFonts({
		Roboto_400Regular, // Regular
		Roboto_500Medium_Italic, // Italic
		Roboto_700Bold, // Bold,
		RobotoMono_400Regular, // Monospaced
	});

	if (!fontsLoaded) {
		return <AppLoading />;
	  }

	return (
		<AppProvider>
			<NavigationContainer>
				<StartNavigator/>
			</NavigationContainer>
		</AppProvider>
	);
};
export default App;