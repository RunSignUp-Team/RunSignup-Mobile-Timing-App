import axios, { AxiosResponse } from "axios";
import { oAuthLogin } from "./oAuth2Helper";
import { RUNSIGNUP_URL } from "../constants/oAuth2Constants";
import GetClockTime from "./GetClockTime";

interface RaceResponse {
	races: Array<{
		race: {
			next_date: string,
			name: string,
			race_id: number
		}
	}>
}

interface EventResponse {
	race: {
		events: Array<{
			start_time: string,
			name: string,
			event_id: number,
		}>
	}
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

type ParticipantResponse = [
	Participants
]

/**
 * Wrapper to handle all Axios GET calls, and oAuth login process.  
 * Throws error if unable to get access token.  
 * 
 * @param url 
 */
async function handleAxiosGetCall<T>(url: string): Promise<AxiosResponse<T>> {
	const source = axios.CancelToken.source();
	// const timeout = setTimeout(() => {
	// 	source.cancel();
	// }, 10000);

	const attemptApiCall = async (force_login: boolean): Promise<AxiosResponse<T | KeyAuthenticationError>> => {
		const accessToken = await oAuthLogin(force_login);
		if (accessToken === null) {
			throw new Error("Unable to authenticate");
		}

		return axios.get<T | KeyAuthenticationError>(
			url,
			{
				cancelToken: source.token,
				headers: {
					"Authorization": `Bearer ${accessToken}`,
				}
			}
		);
	};

	let response = await attemptApiCall(false);

	// Permission Denied... Try again
	if ("error" in response.data && response.data.error.error_code === 6) {
		response = await attemptApiCall(true);
	}

	// Still not a valid response. Throw error
	if ("error" in response.data) {
		throw new Error(response.data.error.error_msg);
	}

	return response as AxiosResponse<T>;
}



/** 
 * Wrapper to handle all Axios POST calls, and oAuth login process.  
* Throws error if unable to get access token.  
 * 
 * @param url URL for Axios call to be sent to
 * @param formData FormData for Axios call
 * 
 * 
 */
async function handleAxiosPostCall<T extends FormData | null>(url: string, formData: T): Promise<AxiosResponse<T>> {
	const source = axios.CancelToken.source();
	// const timeout = setTimeout(() => {
	// 	source.cancel();
	// }, 10000);

	const attemptApiCall = async (force_login: boolean): Promise<AxiosResponse<T | KeyAuthenticationError>> => {

		const accessToken = await oAuthLogin(force_login);
		if (accessToken === null) {
			throw new Error("Unable to authenticate");
		}

		// POST call
		return axios.post<T | KeyAuthenticationError>(
			url,
			formData,
			{
				cancelToken: source.token,
				headers: {
					"Authorization": `Bearer ${accessToken}`,
				}
			});
	};

	let response = await attemptApiCall(false);

	// Permission Denied... Try again
	if ("error" in (response.data as KeyAuthenticationError) && (response.data as KeyAuthenticationError).error.error_code === 6) {
		response = await attemptApiCall(true);
	}

	// Still not a valid response. Throw error
	if ("error" in (response.data as KeyAuthenticationError)) {
		throw new Error((response.data as KeyAuthenticationError).error.error_msg);
	}

	// clearTimeout(timeout);
	return response as AxiosResponse<T>;
}

/** Get Races for a specific User from RSU API */
export const getRaces = async (): Promise<RaceResponse["races"]> => {
	const response = await handleAxiosGetCall<RaceResponse>(RUNSIGNUP_URL + "Rest/races?format=json");
	return response.data.races;
};

/** Get Events for a specific Race from RSU API */
export const getEvents = async (raceID: number): Promise<EventResponse["race"]["events"]> => {
	const response = await handleAxiosGetCall<EventResponse>(`${RUNSIGNUP_URL}Rest/race/${raceID}?format=json`);
	return response.data.race.events;
};

/** Get Bib Numbers from RSU API */
export const getBibs = async (raceID: number, eventID: number): Promise<BibsResponse["bib_finishing_order"]> => {
	const response = await handleAxiosGetCall<BibsResponse>(`${RUNSIGNUP_URL}Rest/race/${raceID}/results/get-chute-data?format=json&event_id=${eventID}`);
	return response.data.bib_finishing_order;
};

/** Get Finish Times from RSU API */
export const getFinishTimes = async (raceID: number, eventID: number): Promise<TimesResponse["finishing_times"]> => {
	const response = await handleAxiosGetCall<TimesResponse>(`${RUNSIGNUP_URL}Rest/race/${raceID}/results/get-timing-data?format=json&event_id=${eventID}`);
	return response.data.finishing_times;
};

/** Get participants from RSU API */
export const getParticipants = async (raceID: number, eventID: number): Promise<ParticipantResponse[0]> => {
	const response = await handleAxiosGetCall<ParticipantResponse>(`${RUNSIGNUP_URL}Rest/race/${raceID}/participants?format=json&sort=registration_id&event_id=${eventID}`);
	return response.data[0];
};

/** Post Start Time to RSU API */
export const postStartTime = async (raceID: number, eventID: number, formData: FormData): Promise<AxiosResponse<FormData>> => {
	const response = await handleAxiosPostCall(
		`${RUNSIGNUP_URL}Rest/race/${raceID}/results/start-time?format=json&event_id=${eventID}&request_format=json`,
		formData
	);
	return response;
};

/** Post Finish Times to RSU API */
export const postFinishTimes = async (raceID: number, eventID: number, times: Array<number>): Promise<AxiosResponse<FormData>> => {

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

	const response = await handleAxiosPostCall(
		`${RUNSIGNUP_URL}Rest/race/${raceID}/results/finishing-times?format=json&event_id=${eventID}&request_format=json`,
		formData
	);
	return response;
};

/** Post Bib Numbers to RSU API */
export const postBibs = async (raceID: number, eventID: number, formData: FormData): Promise<AxiosResponse<FormData>> => {
	const response = await handleAxiosPostCall(
		`${RUNSIGNUP_URL}Rest/race/${raceID}/results/bib-order?format=json&event_id=${eventID}&request_format=json`,
		formData
	);
	return response;
};

/** Delete Finish Times from RSU API */
export const deleteFinishTimes = async (raceID: number, eventID: number): Promise<AxiosResponse<null>> => {
	const response = await handleAxiosPostCall(
		`${RUNSIGNUP_URL}Rest/race/${raceID}/results/delete-timing-data?format=json&event_id=${eventID}&clear_all_result_sets=T`,
		null
	);
	return response;
};

/** Delete Bib Numbers from RSU API */
export const deleteBibs = async (raceID: number, eventID: number): Promise<AxiosResponse<null>> => {
	const response = await handleAxiosPostCall(
		`${RUNSIGNUP_URL}Rest/race/${raceID}/results/delete-chute-data?format=json&event_id=${eventID}`,
		null
	);
	return response;
};
