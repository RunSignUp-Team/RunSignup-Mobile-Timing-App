import { StyleSheet } from "react-native";

export const GREEN_COLOR = "#00ac65";
export const DARK_GREEN_COLOR = "#00663C";
export const LIGHT_GREEN_COLOR = "#00cc77";

export const RED_COLOR = "#ff3b30";

export const BACKGROUND_COLOR = "#f2f2f2";
export const GRAY_COLOR = "#a5a5a5";
export const LIGHT_GRAY_COLOR = "#e6e6e6";

export const TABLE_FONT_SIZE = 14;
export const BIG_FONT_SIZE = 23;
export const MEDIUM_FONT_SIZE = 20;

export const BORDER_RADIUS = 12;

export const TABLE_ITEM_HEIGHT = 50;
export const LONG_TABLE_ITEM_HEIGHT = 50;

export const UNIVERSAL_PADDING = 20;

interface GenericTableText {
	fontSize: number,
	fontWeight: "bold" | "normal",
	textAlign: "left" | "center" | "right",
	paddingVertical: number
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
	justifyContent: "flex-start" | "center" | "flex-end",
}

const genericTableText: GenericTableText = {
	fontSize: TABLE_FONT_SIZE,
	fontWeight: "bold",
	textAlign: "left",
	paddingVertical: 5
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
	width: 31,
	height: 31,
	borderRadius: 20,
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
		marginTop: 0,
		marginBottom: 10,
		textAlign: "center",
	},
	headerButtonText: {
		fontSize: MEDIUM_FONT_SIZE,
		color: "white",
	},

	// Text
	info: {
		fontSize: BIG_FONT_SIZE,
		marginTop: 0,
		marginBottom: 10,
		textAlign: "center",
		borderWidth: 1,
		borderColor: "black",
		borderRadius: BORDER_RADIUS,
		padding: UNIVERSAL_PADDING
	},

	// Flat Lists
	flatList: {
		height: "50%",
		flexGrow: 0,
		marginBottom: 10,
		borderBottomWidth: 1,
		overflow: "hidden",
	},
	longFlatList: {
		overflow: "hidden",
		borderBottomWidth: 1,
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
		paddingHorizontal: UNIVERSAL_PADDING,
		paddingVertical: 10,
		backgroundColor: LIGHT_GRAY_COLOR,
		alignItems: "center"
	},

	// Table Text
	placeTableText: {
		...genericTableText,
		flex: 1,
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
		...genericTableText,
		paddingLeft: UNIVERSAL_PADDING,
		flex: 1.5,
	},
	finishDeleteTableText: {
		...genericTableText,
		textAlign: "center",
		flex: 0.5,
		marginLeft: 5
	},
	chuteDeleteTableText: {
		...genericTableText,
		textAlign: "center",
		flex: 0.25,
	},
	verificationDeleteTableText: {
		...genericTableText,
		textAlign: "center",
		flex: 0.45,
	},
	addTableText: {
		...genericTableText,
		textAlign: "center",
		flex: 0.5
	},
	
	// Table Buttons
	finishTableDeleteButton: {
		...genericTableButton,
		backgroundColor: RED_COLOR,
		marginLeft: 5,
		flex: 0.5
	},
	chuteTableDeleteButton: {
		...genericTableButton,
		backgroundColor: RED_COLOR,
		flex: 0.25
	},
	verificationTableDeleteButton: {
		...genericTableButton,
		backgroundColor: RED_COLOR,
		flex: 0.45
	},
	tableAddButton: {
		...genericTableButton,
		backgroundColor: GREEN_COLOR,
		flex: 0.5
	},
	tableButtonText: {
		fontSize: 24,
		paddingBottom: 31,
		fontWeight: "bold",
		color: "white",
		textAlign: "center",
		textAlignVertical: "center"
	},

	// Text Input
	input: {
		height: 40,
		borderWidth: 1,
		borderRadius: BORDER_RADIUS,
		margin: 10,
		paddingHorizontal: 10,
		flex: 1,
		alignSelf: "center",
		fontSize: MEDIUM_FONT_SIZE,
		backgroundColor: LIGHT_GRAY_COLOR
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
	timer: {
		padding: 10,
		borderWidth: 1,
		borderRadius: BORDER_RADIUS,
		margin: 10,
		marginRight: 0,
		flex: 2,
		fontSize: BIG_FONT_SIZE,
		overflow: "hidden",
	},
	timerBibInput: {
		padding: 10,
		borderWidth: 1,
		borderRadius: BORDER_RADIUS,
		margin: 10,
		flex: 1,
		fontSize: BIG_FONT_SIZE,
		backgroundColor: LIGHT_GRAY_COLOR
	},
});