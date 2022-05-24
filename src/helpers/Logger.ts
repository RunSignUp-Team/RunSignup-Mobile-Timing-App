import Bugsnag from "@bugsnag/expo";
import { Alert } from "react-native";
import BugsnagHelper from "./BugsnagHelper";

export default function Logger(msg: string, err: unknown | undefined, showAlert?: boolean): void {
	if (__DEV__) {
		if (err !== undefined) {
			console.error(msg, err);
		} else {
			console.error(msg);
		}
	}
	// Build error message
	let tmpError = new Error(msg);
	if (typeof err === "string" || err instanceof String) {
		tmpError = new Error(msg + " - " + err);
	}

	const bugsnagInfo = BugsnagHelper.getInfo();

	// Leave error breadcrumb
	Bugsnag.leaveBreadcrumb("custom_error_info", {
		err: err,
		msg: msg
	});

	// Notify error
	Bugsnag.notify(tmpError, async function (event) {
		event.setUser(bugsnagInfo[0].toString(), bugsnagInfo[1], bugsnagInfo[2].toString());
	});

	if (showAlert) {
		Alert.alert("Error", msg);
	}

	return;
}