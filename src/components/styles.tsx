import { StyleSheet } from "react-native";

export const GREEN_COLOR = "#00ac65";
export const DARK_GREEN_COLOR = "#00663C";
export const LIGHT_GREEN_COLOR = "#00cc77";

export const RED_COLOR = "#ff3b30";

export const BLACK_COLOR = "#000";
export const DARK_GRAY_COLOR = "#4f4f4f";
export const GRAY_COLOR = "#a5a5a5";
export const LIGHT_GRAY_COLOR = "#e6e6e6";
export const BACKGROUND_COLOR = "#f2f2f2";

export const BIG_FONT_SIZE = 23;
export const MEDIUM_FONT_SIZE = 20;
export const SMALL_FONT_SIZE = 16;
export const TABLE_FONT_SIZE = 14;

export const BORDER_RADIUS = 12;

export const TABLE_ITEM_HEIGHT = 50;
export const LONG_TABLE_ITEM_HEIGHT = 50;

export const UNIVERSAL_PADDING = 20;

interface GenericTableText {
	fontSize: number,
	textAlign: "left" | "center" | "right",
	color?: string,
	fontFamily: string
}

interface GenericTableItem {
	borderBottomWidth: number,
	borderBottomColor: string,
	height: number,
	flexDirection: "row" | "column",
	paddingHorizontal: number,
	alignItems: "flex-start" | "center" | "flex-end"
}

interface GenericTableButton {
	width: number,
	height: number,
	borderRadius: number,
	alignItems: "flex-start" | "center" | "flex-end",
	justifyContent: "flex-start" | "center" | "flex-end",
}

const genericTableHeadText: GenericTableText = {
	fontSize: SMALL_FONT_SIZE,
	textAlign: "left",
	fontFamily: "Roboto_700Bold",
};

const genericTableText: GenericTableText = {
	fontSize: TABLE_FONT_SIZE,
	textAlign: "left",
	color: BLACK_COLOR, // Needed for Android
	fontFamily: "RobotoMono_400Regular",
};

const genericTableItem: GenericTableItem = {
	borderBottomWidth: 1,
	borderBottomColor: GRAY_COLOR,
	height: TABLE_ITEM_HEIGHT,
	flexDirection: "row",
	paddingHorizontal: UNIVERSAL_PADDING,
	alignItems: "center"
};

const genericTableButton: GenericTableButton = {
	width: 30,
	height: 30,
	borderRadius: 20,
	alignItems: "center",
	justifyContent: "center",
};

export const globalstyles = StyleSheet.create({
	// Containers
	container: {
		justifyContent: "flex-start",
		flex: 1,
		padding: UNIVERSAL_PADDING,
		backgroundColor: BACKGROUND_COLOR
	},
	tableContainer: {
		flex: 0.9,
		backgroundColor: BACKGROUND_COLOR
	},

	// Headers
	modalHeader: {
		fontSize: MEDIUM_FONT_SIZE,
		fontFamily: "Roboto_700Bold",
		marginTop: 0,
		marginBottom: 10,
		textAlign: "center",
	},
	headerButtonText: {
		fontSize: MEDIUM_FONT_SIZE,
		fontFamily: "Roboto_400Regular",
		color: "white",
	},

	// Text
	info: {
		fontSize: BIG_FONT_SIZE,
		fontFamily: "Roboto_400Regular",
		marginTop: 0,
		marginBottom: 10,
		textAlign: "center",
		borderWidth: 1,
		borderColor: "black",
		borderRadius: BORDER_RADIUS,
		padding: UNIVERSAL_PADDING,
	},

	// Flat Lists
	flatList: {
		height: "50%",
		flexGrow: 0,
		marginBottom: 10,
		borderBottomWidth: 1,
		borderColor: DARK_GRAY_COLOR,
		overflow: "hidden",
	},
	longFlatList: {
		overflow: "hidden",
		borderBottomWidth: 1,
		borderColor: DARK_GRAY_COLOR
	},

	// Table Items
	tableItem: {
		...genericTableItem
	},
	longTableItem: {
		...genericTableItem,
		paddingVertical: 5,
		minHeight: LONG_TABLE_ITEM_HEIGHT,
	},
	selectedLongTableItem: {
		...genericTableItem,
		backgroundColor: GREEN_COLOR,
		paddingVertical: 5,
		minHeight: LONG_TABLE_ITEM_HEIGHT,
	},
	conflictLongTableItem: {
		...genericTableItem,
		backgroundColor: RED_COLOR,
		paddingVertical: 5,
		minHeight: LONG_TABLE_ITEM_HEIGHT,
	},

	// Table Head
	tableHead: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderColor: DARK_GRAY_COLOR,
		paddingHorizontal: UNIVERSAL_PADDING,
		height: TABLE_ITEM_HEIGHT,
		backgroundColor: LIGHT_GRAY_COLOR,
		alignItems: "center",
	},

	// Table Text
	placeTableText: {
		...genericTableText,
		flex: 1, // Overriden on Chute mode
	},
	bibTableText: {
		...genericTableText,
		flex: 1.5,
	},
	timeTableText: {
		...genericTableText,
		flex: 2,
	},
	nameTableText: {
		fontSize: TABLE_FONT_SIZE,
		fontFamily: "Roboto_400Regular",
		paddingLeft: UNIVERSAL_PADDING,
		flex: 1.5,
	},

	placeTableHeadText: {
		...genericTableHeadText,
		flex: 1, // Overriden on Chute mode
	},
	bibTableHeadText: {
		...genericTableHeadText,
		flex: 1.5,
	},
	timeTableHeadText: {
		...genericTableHeadText,
		flex: 2,
	},
	nameTableHeadText: {
		...genericTableHeadText,
		paddingLeft: UNIVERSAL_PADDING,
		flex: 1.5,
	},

	finishDeleteTableText: {
		...genericTableHeadText,
		textAlign: "center",
		flex: 0.5, // Need to update everywhere this style is used as well (for the corresponding button)
	},
	chuteDeleteTableText: {
		...genericTableHeadText,
		textAlign: "center",
		flex: 0.25, // Need to update everywhere this style is used as well (for the corresponding button)
	},
	verificationDeleteTableText: {
		...genericTableHeadText,
		textAlign: "center",
		flex: 0.5, // Need to update everywhere this style is used as well (for the corresponding button)
	},
	addTableText: {
		...genericTableHeadText,
		textAlign: "center",
		flex: 0.5, // Need to update everywhere this style is used as well (for the corresponding button)
		marginRight: 5
	},
	
	// Table Buttons (flex set in individual files)
	tableDeleteButton: {
		...genericTableButton,
		backgroundColor: RED_COLOR,
	},
	tableAddButton: {
		...genericTableButton,
		backgroundColor: GREEN_COLOR,
		textAlignVertical: "center",
		marginRight: 5
	},
	tableButtonText: {
		fontSize: MEDIUM_FONT_SIZE,
		fontFamily: "Roboto_400Regular",
		color: "white",
		textAlign: "center",
		textAlignVertical: "center"
	},

	// Text Input
	input: {
		height: 45,
		borderWidth: 1,
		borderRadius: BORDER_RADIUS,
		borderColor: DARK_GRAY_COLOR,
		margin: 10,
		paddingHorizontal: 10,
		flex: 1,
		alignSelf: "center",
		fontSize: MEDIUM_FONT_SIZE,
		fontFamily: "Roboto_400Regular",
		backgroundColor: LIGHT_GRAY_COLOR,
	},

	// Images
	image: {
		alignSelf: "center",
		width: "100%",
		height: "15%",
		resizeMode: "contain",
	},
	headerImage: {
		alignSelf: "center",
		height: 15,
		width: 15,
		resizeMode: "contain",
		marginRight: 15,
	},

	// Timer
	timerView: {
		paddingLeft: 10,
		borderWidth: 1,
		borderRadius: BORDER_RADIUS,
		borderColor: DARK_GRAY_COLOR,
		margin: 10,
		marginRight: 0,
		flex: 2,
		height: 45,
		overflow: "hidden",
		justifyContent: "center"
	},
	timerBibInput: {
		paddingLeft: 10,
		borderWidth: 1,
		borderRadius: BORDER_RADIUS,
		borderColor: DARK_GRAY_COLOR,
		margin: 10,
		flex: 1,
		height: 45,
		fontSize: BIG_FONT_SIZE,
		fontFamily: "Roboto_400Regular",
		backgroundColor: LIGHT_GRAY_COLOR,
	},
});