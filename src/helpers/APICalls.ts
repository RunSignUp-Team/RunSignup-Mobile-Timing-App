import { oAuthLogin } from "./oAuth2Helper";
import { RUNSIGNUP_URL } from "../constants/oAuth2Constants";
import GetClockTime from "./GetClockTime";
import DateToDate from "./DateToDate";

type RaceResponse = {
	races: Array<{
		race: RSURace
	}>
}

export interface RSURace {
	next_date: string,
	name: string,
	race_id: number,
	events: Array<RSUEvent>
}

export interface RSUEvent {
	age_calc_base_date: string | null,
	details: object,
	distance: string,
	end_time: string,
	event_id: number,
	event_type: string,
	name: string,
	race_event_days_id: number,
	registration_opens: string,
	registration_periods: Array<{
		processing_fee: string,
		race_fee: string,
		registration_closes: string,
		registration_opens: string,
	}>,
	require_dob: string,
	require_phone: string,
	start_time: string,
	volunteer: string,
}

interface BibsResponse {
	bib_finishing_order: Array<{
		bib_num: string
	}>
}

interface TimesResponse {
	finishing_times: Array<{
		time: string
	}>
}

interface UserResponse {
	user: {
		address: {
			city: string,
			country_code: string,
			state: string,
			street: string,
			zipcode: string
		},
		dob: string | null,
		email: string,
		first_name: string,
		middle_name: string | null,
		last_name: string,
		gender: string | null,
		phone: string,
		profile_image_url: string,
		user_id: number
	}
}

export type ParticipantDetails = {
	bib_num: number,
	user: {
		first_name: string,
		last_name: string
	}
}

interface KeyAuthenticationError {
	error: {
		error_code: 6;
		error_msg: "Key authentication failed";
	};
}

type Participants = {
	participants: Array<ParticipantDetails>
}

export type ParticipantResponse = [
	Participants
]

/**
 * Wrapper to handle all GET calls, and oAuth login process.  
 * Throws error if unable to get access token.  
 * 
 * @param url 
 */
async function handleGetCall<T>(url: string): Promise<T> {
	const controller = new AbortController();
	const signal = controller.signal;

	// If all else fails, abort API call after 15 seconds
	setTimeout(() => {
		controller.abort();
	}, 15000);

	const attemptApiCall = async (force_login: boolean): Promise<T | KeyAuthenticationError> => {
		if (__DEV__) {
			console.log("GET: ", url);
		}

		const accessToken = await oAuthLogin(force_login);
		if (accessToken === null) {
			throw new Error("Unable to authenticate");
		}

		// GET call
		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${accessToken}`
			},
			signal
		});

		const json = await response.json();
		return json;
	};

	let response = await attemptApiCall(false);

	// Permission Denied... Try again
	if ("error" in response && response.error.error_code === 6) {
		response = await attemptApiCall(true);
	}

	// Still not a valid response. Throw error
	if ("error" in response) {
		throw new Error(response.error.error_msg);
	}

	return response;
}

/** 
 * Wrapper to handle all POST calls, and oAuth login process.  
* Throws error if unable to get access token.  
 * 
 * @param url URL for API call to be sent to
 * @param formData FormData for API call
 * 
 * 
 */
async function handlePostCall<T extends FormData | null>(url: string, formData: T): Promise<T> {
	const controller = new AbortController();
	const signal = controller.signal;

	// If all else fails, abort API call after 15 seconds
	setTimeout(() => {
		controller.abort();
	}, 15000);

	const attemptApiCall = async (force_login: boolean): Promise<T | KeyAuthenticationError> => {
		if (__DEV__) {
			console.log("POST: ", url);
		}

		const accessToken = await oAuthLogin(force_login);
		if (accessToken === null) {
			throw new Error("Unable to Authenticate (API)");
		}

		// POST call
		const response = await fetch(url, {
			method: "POST",
			body: formData,
			headers: {
				"Authorization": `Bearer ${accessToken}`
			},
			signal
		});

		const json = await response.json();
		return json;
	};

	let response = await attemptApiCall(false);

	// Permission Denied... Try again
	if ("error" in (response as KeyAuthenticationError) && (response as KeyAuthenticationError).error.error_code === 6) {
		response = await attemptApiCall(true);
	}

	// Still not a valid response. Throw error
	if ("error" in (response as KeyAuthenticationError)) {
		throw new Error((response as KeyAuthenticationError).error.error_msg);
	}

	return response as T;
}

/** Get user information from RSU API */
export const getUser = async (userId: string): Promise<UserResponse> => {
	const response = await handleGetCall<UserResponse>(`${RUNSIGNUP_URL}Rest/user/${userId}?format=json`);
	return response;
};

/** Get up to 250 Races for a specific User from RSU API */
export const getRaces = async (): Promise<RaceResponse["races"]> => {
	// Get races from last week -> future
	const weekGraceDate = new Date(new Date().getTime() - (86400000*7));
	const [year, month, day] = DateToDate(weekGraceDate);
	const response = await handleGetCall<RaceResponse>(RUNSIGNUP_URL + `Rest/races?format=json&results_per_page=250&start_date=${year}-${month}-${day}&events=T&sort=date+ASC`);
	return response.races;
};

/** Get Bib Numbers from RSU API */
export const getBibs = async (raceID: number, eventID: number): Promise<BibsResponse["bib_finishing_order"]> => {
	const response = await handleGetCall<BibsResponse>(`${RUNSIGNUP_URL}Rest/race/${raceID}/results/get-chute-data?format=json&event_id=${eventID}`);
	return response.bib_finishing_order;
};

/** Get Finish Times from RSU API */
export const getFinishTimes = async (raceID: number, eventID: number): Promise<TimesResponse["finishing_times"]> => {
	const response = await handleGetCall<TimesResponse>(`${RUNSIGNUP_URL}Rest/race/${raceID}/results/get-timing-data?format=json&event_id=${eventID}`);
	return response.finishing_times;
};

/** Get up to 2000 Participants from RSU API */
export const getParticipants = async (raceID: number, eventID: number): Promise<ParticipantResponse[0]> => {
	const response = await handleGetCall<ParticipantResponse>(`${RUNSIGNUP_URL}Rest/race/${raceID}/participants?format=json&sort=registration_id&event_id=${eventID}&results_per_page=2000`);
	return response[0];
};

/** Post Start Time to RSU API */
export const postStartTime = async (raceID: number, eventID: number, formData: FormData): Promise<FormData> => {
	const response = await handlePostCall(
		`${RUNSIGNUP_URL}Rest/race/${raceID}/results/start-time?format=json&event_id=${eventID}&request_format=json`,
		formData
	);
	return response;
};

/** Post Finish Times to RSU API */
export const postFinishTimes = async (raceID: number, eventID: number, times: Array<number>): Promise<FormData> => {

	const timeString = [];

	for (let i = 0; i < times.length; i++) {
		timeString[i] = GetClockTime(times[i]);
	}

	const formData = new FormData();
	formData.append(
		"request",
		JSON.stringify({
			last_finishing_time_id: 0,
			finishing_times: timeString
		})
	);

	const response = await handlePostCall(
		`${RUNSIGNUP_URL}Rest/race/${raceID}/results/finishing-times?format=json&event_id=${eventID}&request_format=json`,
		formData
	);
	return response;
};

/** Post Bib Numbers to RSU API */
export const postBibs = async (raceID: number, eventID: number, formData: FormData): Promise<FormData> => {
	const response = await handlePostCall(
		`${RUNSIGNUP_URL}Rest/race/${raceID}/results/bib-order?format=json&event_id=${eventID}&request_format=json`,
		formData
	);
	return response;
};

/** Delete Finish Times from RSU API */
export const deleteFinishTimes = async (raceID: number, eventID: number): Promise<null> => {
	const response = await handlePostCall(
		`${RUNSIGNUP_URL}Rest/race/${raceID}/results/delete-timing-data?format=json&event_id=${eventID}&clear_all_result_sets=T`,
		null
	);
	return response;
};

/** Delete Bib Numbers from RSU API */
export const deleteBibs = async (raceID: number, eventID: number): Promise<null> => {
	const response = await handlePostCall(
		`${RUNSIGNUP_URL}Rest/race/${raceID}/results/delete-chute-data?format=json&event_id=${eventID}`,
		null
	);
	return response;
};
