import Bugsnag from "@bugsnag/expo";
import { Alert } from "react-native";

export default function Logger(msg: string, err: unknown | undefined, showAlert?: boolean, raceId?: number, eventId?: number, eventTitle?: string): void {
	if (__DEV__) {
		if (err !== undefined) {
			console.error(msg, err);
		} else {
			console.error(msg);
		}
	}
	// Build error message
	let tmpError = new Error(msg);
	if (typeof err === "string" || err instanceof String)
		tmpError = new Error(msg + " - " + err);

	// Leave error breadcrumb
	Bugsnag.leaveBreadcrumb("custom_error_info", {
		err: err,
		msg: msg
	});

	// Notify error
	Bugsnag.notify(tmpError, async function (event) {
		event.setUser(`Race ID: ${raceId}, Event ID: ${eventId}`, undefined, `Event Name: ${eventTitle}`);
	});

	if (showAlert) {
		Alert.alert("Error", msg);
	}

	return;
}