import Bugsnag from "@bugsnag/expo";
Bugsnag.start();

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import StartNavigator from "./src/components/AppStack";
import AppProvider from "./src/components/AppContext";

const App = () => {
	return (
		<AppProvider>
			<NavigationContainer>
				<StartNavigator/>
			</NavigationContainer>
		</AppProvider>
	);
};
export default App;