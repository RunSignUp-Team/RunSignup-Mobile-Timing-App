import { Platform, StyleSheet } from "react-native";

export const GREEN_COLOR = "#00ac65";
export const DARK_GREEN_COLOR = "#00663C";
export const LIGHT_GREEN_COLOR = "#00cc77";

export const RED_COLOR = "#ff3b30";

export const APPLE_BLUE_COLOR = "#0a84ff";

export const BLACK_COLOR = "#000";
export const DARK_GRAY_COLOR = "#4f4f4f";
export const GRAY_COLOR = "#a5a5a5";
export const LIGHT_GRAY_COLOR = "#e6e6e6";
export const BACKGROUND_COLOR = "#f2f2f2";
export const WHITE_COLOR = "#fff";

export const BIG_FONT_SIZE = 23;
export const MEDIUM_FONT_SIZE = 20;
export const SMALL_FONT_SIZE = 16;
export const TABLE_FONT_SIZE = 15;

export const BORDER_RADIUS = 12;

export const TABLE_ITEM_HEIGHT = 50;
export const LONG_TABLE_ITEM_HEIGHT = 50;

export const UNIVERSAL_PADDING = 15;

export const MAX_TIME = 86399999;

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
	fontFamily: "RobotoBold",
};

const genericTableText: GenericTableText = {
	fontSize: TABLE_FONT_SIZE,
	textAlign: "left",
	color: BLACK_COLOR, // Needed for Android
	fontFamily: "RobotoMono",
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
		flex: 1,
		backgroundColor: BACKGROUND_COLOR
	},

	// Headers
	modalHeader: {
		fontSize: MEDIUM_FONT_SIZE,
		fontFamily: "RobotoBold",
		marginTop: 0,
		marginBottom: 10,
		textAlign: "center",
	},
	headerButtonText: {
		fontSize: MEDIUM_FONT_SIZE,
		fontFamily: "RobotoBold",
		color: WHITE_COLOR,
		marginRight: 10,
		textAlign: "right"
	},

	// Text
	info: {
		fontSize: BIG_FONT_SIZE,
		color: WHITE_COLOR,
		backgroundColor: DARK_GRAY_COLOR,
		fontFamily: "Roboto",
		textAlign: "center",
		borderRadius: BORDER_RADIUS,
		padding: UNIVERSAL_PADDING,
		overflow: "hidden"
	},

	// Flat Lists
	flatList: {
		height: "50%",
		flexGrow: 0,
		borderBottomWidth: 1,
		borderColor: DARK_GRAY_COLOR,
		overflow: "hidden",
	},
	longFlatList: {
		overflow: "hidden",
	},
	shortFlatList: {
		borderBottomWidth: 1,
		borderColor: DARK_GRAY_COLOR,
		overflow: "hidden",
		maxHeight: TABLE_ITEM_HEIGHT * 2,
		minHeight: TABLE_ITEM_HEIGHT * 2
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
		height: undefined,
		minHeight: LONG_TABLE_ITEM_HEIGHT,
		maxHeight: LONG_TABLE_ITEM_HEIGHT * 2
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
		flex: 0.75, // Overriden on Chute mode,
	},
	bibTableText: {
		...genericTableText,
		flex: 1.1,
		flexWrap: "wrap"
	},
	timeTableText: {
		...genericTableText,
		flex: 1.75,
	},
	nameTableText: {
		fontSize: TABLE_FONT_SIZE,
		fontFamily: "Roboto",
		paddingLeft: UNIVERSAL_PADDING,
		flex: 1.5,
	},

	placeTableHeadText: {
		...genericTableHeadText,
		flex: 0.75, // Overriden on Chute mode
	},
	bibTableHeadText: {
		...genericTableHeadText,
		flex: 1.1,
	},
	timeTableHeadText: {
		...genericTableHeadText,
		flex: 1.75,
	},
	nameTableHeadText: {
		...genericTableHeadText,
		paddingLeft: UNIVERSAL_PADDING,
		flex: 1.5,
	},

	deleteTableText: {
		...genericTableHeadText,
		textAlign: "center",
		fontSize: SMALL_FONT_SIZE + 3,
	},
	addTableText: {
		...genericTableHeadText,
		marginRight: 5
	},
	
	// Table Buttons (flex set in individual files)
	tableDeleteButton: {
		...genericTableButton,
	},
	tableAddButton: {
		...genericTableButton,
		marginRight: 5
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
		fontFamily: "Roboto",
		backgroundColor: LIGHT_GRAY_COLOR,
	},

	// Images
	image: {
		alignSelf: "center",
		width: "100%",
		height: "15%",
		resizeMode: "contain",
	},

	// Timer
	timerView: {
		paddingHorizontal: 8,
		borderRadius: BORDER_RADIUS,
		margin: 10,
		marginLeft: UNIVERSAL_PADDING,
		flex: 2,
		height: 45,
		overflow: "hidden",
		justifyContent: "center"
	},
	timerBibInput: {
		paddingHorizontal: 8,
		borderRadius: BORDER_RADIUS,
		margin: 10,
		marginRight: UNIVERSAL_PADDING,
		flex: 1,
		height: 45,
		fontSize: MEDIUM_FONT_SIZE,
		fontFamily: "RobotoBold",
		backgroundColor: LIGHT_GRAY_COLOR,
	},

	// Time Entry
	timeInput: {
		flexDirection: "row", 
		alignItems: "center", 
		justifyContent: "space-between", 
		backgroundColor: LIGHT_GRAY_COLOR,
		borderRadius: Platform.OS === "android" ? 0 : 8,
		overflow: "hidden",
		borderColor: GRAY_COLOR,
		borderWidth: Platform.OS === "android" ? 0 : 1,
		flex: 1,
	}, 
	timeInputButton: {
		flex: 1,
		borderBottomWidth: 2,
		justifyContent: "center",
		alignItems: "center",
		marginHorizontal: 8
	},
	timeInputText: {
		fontFamily: "Roboto",
		fontSize: SMALL_FONT_SIZE,
		textAlign: "center",
		minWidth: 30,
		paddingTop: 2,
		alignSelf: "center",
		minHeight: 20
	},
	timeSeparator: {
		fontFamily: "RobotoBold",
		fontSize: SMALL_FONT_SIZE,
		width: 10,
		textAlign: "center"
	},

	altStartButton: {
		paddingHorizontal: 8,
		borderRadius: BORDER_RADIUS,
		margin: 10,
		marginRight: UNIVERSAL_PADDING,
		flex: 1,
		height: 45,
		alignItems: "center",
		justifyContent: "center"
	},
	altStartText: {
		fontSize: MEDIUM_FONT_SIZE,
		fontFamily: "RobotoBold",
		color: WHITE_COLOR
	},
	altBibContainer: {
		flex: 1, 
		alignItems: "center", 
		padding: 7,
		flexDirection: "row",
	},
	altBibButton: {
		height: 45,
		alignItems: "center",
		justifyContent: "center",
		flexGrow: 1,
		borderRadius: 5
	},
	altBibText: {
		color: WHITE_COLOR, 
		fontFamily: "RobotoBold", 
		fontSize: MEDIUM_FONT_SIZE,
	},
	altTimeText: {
		color: WHITE_COLOR, 
		fontFamily: "Roboto", 
		fontSize: TABLE_FONT_SIZE,
	}
});