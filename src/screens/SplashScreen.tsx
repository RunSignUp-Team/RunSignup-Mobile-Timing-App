import React, { useEffect, useRef } from "react";
import { View, Image } from "react-native";
import { BACKGROUND_COLOR, globalstyles } from "../components/styles";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

const Loader = ({ navigation }: Props) => {
	
	const initRef = useRef(true);
	useEffect(() => {
		if (!initRef.current) return;
		initRef.current = false; 
		navigation.navigate("Login");
	}, [navigation]);

	return (
		<View style={{ backgroundColor: BACKGROUND_COLOR }}>
			<Image
				style={globalstyles.image}
				source={require("../assets/logo.png")}
			/>
		</View>
	);
};

export default Loader;
