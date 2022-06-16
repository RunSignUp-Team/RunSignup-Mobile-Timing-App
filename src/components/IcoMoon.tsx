import React from "react";
import json from "../assets/Fonts/selection.json";
import { createIconSetFromIcoMoon } from "@expo/vector-icons";

interface IconProps {
	name: string;
	color?: string;
	size?: number;
	strokeWidth?: number;
	offset?: number;
}

export default function Icon({ name, ...restProps }: IconProps): React.ReactElement {
	const Icon = createIconSetFromIcoMoon(
		json,
		"IcoMoon",
		"icomoon.ttf"
	);

	return <Icon name={name} {...restProps} />;
}