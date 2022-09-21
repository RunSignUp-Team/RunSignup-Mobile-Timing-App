import { oAuthLogin } from "./oAuth2Helper";
import { RUNSIGNUP_URL } from "../constants/oAuth2Constants";
import GetClockTime from "./GetClockTime";
import DateToDate from "./DateToDate";
import addLeadingZeros from "./AddLeadingZeros";

type RaceResponse = {
	races: Array<{
		race: RSURace
	}>
}

interface ResultSet {
	alt_event_ids: Array<number>,
	individual_result_set_id: number,
	individual_result_set_name: string,
	pace_type: "T" | "F",
	preliminary_results: "T" | "F",
	public_results: "T" | "F",
	results: Array<object>,
	results_headers: Record<string,string>,
	results_source_name: string | null,
	results_source_url: string | null,
	sort_order: number,
	team_column_display_type: number,
}

interface ResultSetsResponse {
	individual_results_sets: Array<ResultSet>
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

interface StartTimeResponse {
	start_time: string
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
	affiliate_profit: string,
	age: number | null,
	amount_paid: string,
	bib_num: number,
	chip_num: string | null,
	event_id: number,
	extra_fees: string,
	giveaway: string | null,
	giveaway_option_id: number | null,
	imported: "T" | "F",
	last_modified: number,
	offline_payment_amount: string,
	partner_fee: string,
	processing_fee: string,
	processing_fee_paid_by_race: string,
	processing_fee_paid_by_user: string,
	race_fee: string,
	registration_date: string,
	registration_id: number,
	rsu_transaction_id: number | null,
	team_bib_num: number | null,
	team_gender: string | null,
	team_id: number | null,
	team_name: string | null,
	team_type: string | null,
	team_type_id: number | null,
	transaction_id: number | null,
	usatf_discount_additional_field: string | null,
	usatf_discount_amount_in_cents: string,
	user: {
		address: {
			city: string,
			country_code: string,
			state: string,
			street: string | null,
			zipcode: string,
		},
		dob: string | null,
		email: string | null,
		first_name: string,
		gender: string,
		last_name: string,
		middle_name: string | null,
		phone: string | null,
		profile_image_url: string | null,
		user_id: number,
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

/** Get result sets from RSU API */
export const getResultSets = async (raceID: number, eventID: number): Promise<ResultSetsResponse> => {
	const response = await handleGetCall<ResultSetsResponse>(RUNSIGNUP_URL + `Rest/race/${raceID}/results/get-result-sets?format=json&event_id=${eventID}`);
	return response;
};

/** Get Bib Numbers from RSU API */
export const getBibs = async (raceID: number, eventID: number): Promise<BibsResponse["bib_finishing_order"]> => {
	const response = await handleGetCall<BibsResponse>(`${RUNSIGNUP_URL}Rest/race/${raceID}/results/get-chute-data?format=json&event_id=${eventID}`);
	return response.bib_finishing_order;
};

export const getStartTime = async (raceID: number, eventID: number): Promise<string> => {
	const response = await handleGetCall<StartTimeResponse>(`${RUNSIGNUP_URL}Rest/race/${raceID}/results/start-time?format=json&event_id=${eventID}`);
	return response.start_time;
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
export const postStartTime = async (raceID: number, eventID: number, startTime: number): Promise<FormData> => {
	const formData = new FormData();

	const formatStartTime = new Date(startTime);

	// Append request to API
	formData.append(
		"request",
		JSON.stringify({
			start_time: `${formatStartTime.getFullYear()}-${addLeadingZeros(formatStartTime.getMonth() + 1)}-${addLeadingZeros(formatStartTime.getDate())} ${addLeadingZeros(formatStartTime.getHours())}:${addLeadingZeros(formatStartTime.getMinutes())}:${addLeadingZeros(formatStartTime.getSeconds())}`
		})
	);

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
