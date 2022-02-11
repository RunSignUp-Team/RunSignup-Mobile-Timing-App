import { StyleSheet } from "react-native";

export const GREEN_COLOR = "#00ac65";
export const RED_COLOR = "#ff3b30";
export const BACKGROUND_COLOR = "#f2f2f2";
export const TABLE_FONT_SIZE = 14;
export const BUTTON_BORDER_RADIUS = 100;
export const TABLE_ITEM_HEIGHT = 40;

export const globalstyles = StyleSheet.create({
	// Containers
	container: {
		justifyContent: "flex-start",
		flex: 1,
		padding: 16,
		backgroundColor: BACKGROUND_COLOR
	},
	safeArea: {
		alignItems: "flex-start",
		flex: 1,
		padding: 16,
	},

	// Text
	title: {
		fontSize: 20,
	},
	text: {
		fontSize: 16,
	},
	header: {
		fontSize: 23,
		marginTop: 0,
		marginBottom: 10,
		textAlign: "center",
	},
	connectionText: {
		fontSize: 23,
		marginTop: 10,
		textAlign: "center",
	},
	buttonText: {
		fontSize: 18,
		color: "white",
		paddingHorizontal: 1
	},
	headerButtonText: {
		fontSize: 18,
		color: "white",
	},
	info: {
		fontSize: 23,
		marginTop: 0,
		marginBottom: 10,
		textAlign: "center",
		borderWidth: 1, 
		borderColor: "black", 
		borderRadius: 20, 
		padding: 20
	},

	// Buttons
	button: {
		alignItems: "center",
		backgroundColor: GREEN_COLOR,
		padding: 20,
		width: "100%",
		margin: 12,
		borderWidth: 1,
		borderRadius: BUTTON_BORDER_RADIUS,
		alignSelf: "center",
	},
	disabledButton: {
		alignItems: "center",
		backgroundColor: "#808080",
		padding: 20,
		width: "100%",
		margin: 12,
		borderWidth: 1,
		borderRadius: BUTTON_BORDER_RADIUS,
		alignSelf: "center",
	},
	deleteButton: {
		alignItems: "center",
		backgroundColor: RED_COLOR,
		padding: 20,
		width: "100%",
		margin: 12,
		borderWidth: 1,
		borderRadius: BUTTON_BORDER_RADIUS,
		alignSelf: "center",
	},
	recordButton: {
		alignItems: "center",
		backgroundColor: RED_COLOR,
		padding: 15,
		width: "100%",
		margin: 1,
		borderWidth: 1,
		borderRadius: BUTTON_BORDER_RADIUS,
		alignSelf: "center",
	},

	// Flat Lists
	flatList: {
		height: "50%",
		flexGrow: 0,
		borderWidth: 1,
		marginBottom: 10,
		overflow: "hidden"
	},
	longFlatList: {
		height: "80%",
		flexGrow: 0,
		borderWidth: 1,
		overflow: "hidden"
	},

	// Tables
	tableItem: {
		borderBottomWidth: 1,
		borderBottomColor: "grey",
		flexDirection: "row",
		paddingLeft: 10,
		height: TABLE_ITEM_HEIGHT
	},
	longTableItem: {
		borderBottomWidth: 1,
		borderBottomColor: "grey",
		flexDirection: "row",
		padding: 5,
		paddingLeft: 20,
	},
	selectedLongTableItem: {
		backgroundColor: GREEN_COLOR,
		borderBottomWidth: 1,
		borderBottomColor: "grey",
		flexDirection: "row",
		padding: 5,
		paddingLeft: 20,
	},
	conflictLongTableItem: {
		backgroundColor: RED_COLOR,
		borderBottomWidth: 1,
		borderBottomColor: "grey",
		flexDirection: "row",
		padding: 5,
		paddingLeft: 20,
	},
	tableHead: {
		flexDirection: "row",
		borderBottomWidth: 1,
		paddingLeft: 15,
		paddingVertical: 3,
		backgroundColor: BACKGROUND_COLOR
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
	tableTextOne: {
		fontSize: TABLE_FONT_SIZE,
		fontWeight: "bold",
		flex: 2,
		alignSelf: "center",
		textAlign: "left",
		paddingTop: 5,
		paddingBottom: 5,
	},
	tableTextTwo: {
		fontSize: TABLE_FONT_SIZE,
		fontWeight: "bold",
		flex: 1.5,
		alignSelf: "center",
		textAlign: "left",
		paddingTop: 5,
		paddingBottom: 5,
	},
	tableTextThree: {
		fontSize: TABLE_FONT_SIZE,
		fontWeight: "bold",
		flex: 1,
		alignSelf: "center",
		textAlign: "left",
		paddingTop: 5,
		paddingBottom: 5,
	},
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
		height: 40,
		margin: 12,
		marginTop: 1,
		borderWidth: 1,
		borderRadius: 20,
		padding: 10,
		width: "100%",
		alignSelf: "center",
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

	// Race List / Event List Items
	listItem: {
		borderWidth: 1,
		borderRadius: BUTTON_BORDER_RADIUS,
		margin: 5,
		padding: 15,
		backgroundColor: GREEN_COLOR,
	},
	listText: {
		fontSize: 20,
		color: "white",
	},

	// Timer
	timer: {
		paddingHorizontal: 10,
		paddingVertical: 7,
		borderWidth: 1,
		borderRadius: 20,
		marginBottom: 10,
		marginRight: 5,
		flex: 2,
		fontSize: 25,
		overflow: "hidden"
	},
	timerBibInput: {
		paddingHorizontal: 10,
		paddingVertical: 7,
		borderWidth: 1,
		borderRadius: 20,
		marginBottom: 10,
		marginLeft: 5,
		flex: 1,
		fontSize: 20,
	},
});