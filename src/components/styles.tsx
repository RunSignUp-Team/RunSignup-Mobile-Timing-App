import { StyleSheet } from "react-native";

export const GREEN_COLOR = "#00ac65";
export const RED_COLOR = "#ff3b30";
export const BACKGROUND_COLOR = "#f2f2f2";
export const GRAY_COLOR = "#a5a5a5";
export const TABLE_FONT_SIZE = 14;
export const BIG_FONT_SIZE = 25;
export const MEDIUM_FONT_SIZE = 20;
export const BORDER_RADIUS = 12;
export const TABLE_ITEM_HEIGHT = 40;
export const LONG_TABLE_ITEM_HEIGHT = 50;

interface GenericTableText {
	fontSize: number,
	fontWeight: "bold" | "normal",
	textAlign: "left" | "center" | "right",
	paddingVertical: number
}

interface GenericTableItem {
	borderBottomWidth: number,
	borderBottomColor: string,
	flexDirection: "row" | "column",
	paddingHorizontal: number,
	alignItems: "flex-start" | "center" | "flex-end"
}

const genericTableText: GenericTableText = {
	fontSize: TABLE_FONT_SIZE,
	fontWeight: "bold",
	textAlign: "left",
	paddingVertical: 5
};

const genericTableItem: GenericTableItem = {
	borderBottomWidth: 1,
	borderBottomColor: "grey",
	flexDirection: "row",
	paddingHorizontal: 10,
	alignItems: "center"
};

export const globalstyles = StyleSheet.create({
	// Containers
	container: {
		justifyContent: "flex-start",
		flex: 1,
		padding: 16,
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
		fontWeight: "bold"
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
		padding: 20
	},

	// Flat Lists
	flatList: {
		height: "50%",
		flexGrow: 0,
		borderWidth: 1,
		marginBottom: 10,
		overflow: "hidden",
		borderRadius: BORDER_RADIUS
	},
	longFlatList: {
		height: "80%",
		flexGrow: 0,
		borderWidth: 1,
		overflow: "hidden",
		borderRadius: BORDER_RADIUS
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
		paddingHorizontal: 10,
		paddingVertical: 8,
		backgroundColor: BACKGROUND_COLOR,
		borderTopRightRadius: BORDER_RADIUS,
		borderTopLeftRadius: BORDER_RADIUS,
		alignItems: "center"
	},
	tableHeadButtonText: {
		fontSize: TABLE_FONT_SIZE,
		fontWeight: "bold",
		alignSelf: "center",
		textAlign: "center",
		padding: 5,
		paddingRight: 10,
		marginHorizontal: 5,
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
		flex: 1.7,
	},
	nameTableText: {
		...genericTableText,
		paddingLeft: 20,
		flex: 1.5,
	},

	// Table Buttons
	tableDeleteButton: {
		justifyContent: "center",
		backgroundColor: RED_COLOR,
		paddingVertical: 5,
		paddingHorizontal: 8,
		margin: 5,
		borderWidth: 1,
		borderRadius: 20,
		alignSelf: "center",
	},
	tableAddButton: {
		justifyContent: "center",
		backgroundColor: GREEN_COLOR,
		paddingVertical: 5,
		paddingHorizontal: 8,
		margin: 5,
		borderWidth: 1,
		borderRadius: 20,
		alignSelf: "center",
	},
	tableButtonText: {
		fontSize: TABLE_FONT_SIZE,
		color: "white",
		textAlign: "center"
	},

	// Text Input
	input: {
		height: 50,
		margin: 12,
		marginTop: 1,
		borderWidth: 1,
		borderRadius: BORDER_RADIUS,
		padding: 10,
		width: "100%",
		alignSelf: "center",
		fontSize: MEDIUM_FONT_SIZE,
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
		paddingHorizontal: 10,
		paddingVertical: 7,
		borderWidth: 1,
		borderRadius: BORDER_RADIUS,
		marginBottom: 10,
		marginRight: 5,
		flex: 2,
		fontSize: BIG_FONT_SIZE,
		overflow: "hidden"
	},
	timerBibInput: {
		paddingHorizontal: 10,
		paddingVertical: 7,
		borderWidth: 1,
		borderRadius: BORDER_RADIUS,
		marginBottom: 10,
		marginLeft: 5,
		flex: 1,
		fontSize: BIG_FONT_SIZE,
	},
});