import { ResponseType, AuthRequest } from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import { CLIENT_ID, REDIRECT_URI, RUNSIGNUP_URL } from "../constants/oAuth2Constants";
import Logger from "./Logger";

// no-op on native mobile apps...
// WebBrowser.maybeCompleteAuthSession();

// URLS AND INFO
const requestGrantUrl = RUNSIGNUP_URL + "Profile/OAuth2/RequestGrant";
const accessTokenUrl = RUNSIGNUP_URL + "Rest/v2/auth/auth-code-redemption.json?";
const refreshTokenUrl = RUNSIGNUP_URL + "Rest/v2/auth/refresh-token.json";

const clientID = CLIENT_ID;

const rsuAuthorizationCodeGrantType = ResponseType.Code;
const rsuAccessTokenGrantType = "authorization_code";
const rsuRefreshTokenGrantType = "refresh_token";

const scopes = ["rsu_api_read", "rsu_api_write"];

// Secure storage info
const TOKEN_INFO_KEY = "rsu_token_info_key";

interface RsuTokenResponseData {
	access_token: string;
	expires_in: number;
	refresh_token: string;
	token_type: "Bearer";
}

interface RsuTokenErrorData {
	error: string;
	error_description: string;
	hint?: string;
	message: string;
}

type RsuTokenResponses = RsuTokenResponseData | RsuTokenErrorData;

interface LocalTokenInfo {
	access_token: string;
	expires_at: number;
	refresh_token: string;
}

/** 
 * Refresh the access and refresh tokens given a valid refresh token 
 * @param refresh_token
 */
export async function refreshTokens(refresh_token: string): Promise<RsuTokenResponseData | null> {
	const formData = new FormData();

	formData.append("grant_type", rsuRefreshTokenGrantType);
	formData.append("client_id", clientID);
	formData.append("scope", scopes);
	formData.append("refresh_token", refresh_token);

	// We can now send another request to RSU to retrieve the tokens given the auth code we received earlier
	try {
		const response = await fetch(refreshTokenUrl, {
			body: formData,
			method: "POST"
		});

		const json = await response.json() as RsuTokenResponses;

		if ("error" in json) {
			Logger("Failed to Refresh Access & Refresh Tokens", `Error: "${json.error}". Description: "${json.error_description}". Hint: "${json.hint}"`);
			return null;
		}

		// We have the token data. Return it
		return json;


	} catch (error) {
		Logger("Error in Refresh Token", error);
		return null;
	}
}

/**
 * This will call the RSU endpoint with the Authorization Code and exchange that for access/refresh tokens
 * 
 * @param auth_code The authorization code received from the first step
 * @param code_verifier The code verifier initially sent to the RSU API backend
 * @param challenge_method Defaults to `"S256"`.
 */
export async function exchangeTokens(auth_code: string, code_verifier: string, challenge_method = "S256"): Promise<RsuTokenResponseData | null> {
	const formData = new FormData();

	formData.append("grant_type", rsuAccessTokenGrantType);
	formData.append("client_id", clientID);
	formData.append("redirect_uri", REDIRECT_URI);
	formData.append("code", auth_code);
	formData.append("code_verifier", code_verifier);
	formData.append("code_challenge_method", challenge_method);

	// We can now send another request to RSU to retrieve the tokens given the auth code we received earlier
	try {
		const response = await fetch(accessTokenUrl, {
			body: formData,
			method: "POST"
		});

		const json = await response.json();

		if ("error" in json) {
			Logger("Failed to Retrieve Tokens", createRSUApiErrorString(json));
			return null;
		}

		// We have the successful token data
		return (await json);
	} catch (error) {
		Logger("Unknown Token Error", error);
		return null;
	}
}

/**
 * This handles the entire flow for oAuth with RSU.  
 * You can either call this directly, or call other functions individually for more control of the process.   
 *   
 * This will either return the access token, or `null`.  
 * Will first search the local SecureStore for the tokens if available.  
 * Will also attempt refreshing the token first if found locally but expired before prompting user to login again.  
 * _This function doesn't throw any errors_  
 *   
 * This function will not be able to be run if debugging with chrome is open.  
 * 
 * @param force_login This will delete the local tokens before performing all other actions. Forces user to log in again.
 */
export async function oAuthLogin(force_login: boolean): Promise<string | null> {
	try {

		// Delete local tokens - force user to log in again
		if (force_login) {
			await deleteTokenInfo(true);
		}

		// Try getting the local access token (and refresh it if necessary) before prompting user to sign in
		const validLocalAccessToken = await getAndRefreshLocalTokens();
		if (validLocalAccessToken !== null) return validLocalAccessToken;

		// Get new tokens. Create AuthRequest with initial info
		const authRequest = new AuthRequest({
			clientId: clientID as unknown as string,
			redirectUri: REDIRECT_URI,
			responseType: rsuAuthorizationCodeGrantType,
		});

		// Prompt user to login
		const authCodeRes = await authRequest.promptAsync({
			authorizationEndpoint: requestGrantUrl,
		});

		// Not successful
		if (authCodeRes.type !== "success") {
			Logger("Unable to get Authorization Code", authCodeRes.type);
			return null;
		}

		// Now we need to get this Auth Code and exchange it for an access/refresh token
		const finalTokens = await exchangeTokens(authCodeRes.params.code, authRequest.codeVerifier as string, authRequest.codeChallengeMethod);

		// Unable to exchange auth code for access/refresh tokens
		if (finalTokens === null) {
			Logger("Unable to Exchange Code for Tokens", finalTokens);
			return null;
		}

		// Now store this in the SecureStore
		await storeTokenInfo(finalTokens);

		// Just return the access token
		return finalTokens.access_token;
	} catch (error) {
		Logger("Failed Login", error);
		return null;
	}
}

/**
 * Given the RSU API error object, return the string containing info to log
 */
function createRSUApiErrorString(err_object: RsuTokenErrorData): string {
	return `Failed to retrieve access & refresh tokens. Error: "${err_object.error}". Description: "${err_object.error_description}". Hint: "${err_object.hint}"`;
}

/** 
 * Given the tokens (Access/Refresh), store them securely on the device
 * 
 * @param tokenInfo Token response data info returned from RSU
 */
export async function storeTokenInfo(tokenInfo: RsuTokenResponseData): Promise<void> {
	if (!(await canUseSecureStore())) return;

	const stringifiedVal = JSON.stringify({
		access_token: tokenInfo.access_token,
		refresh_token: tokenInfo.refresh_token,
		expires_at: (tokenInfo.expires_in * 1000) + Date.now(),
	});

	return SecureStore.setItemAsync(TOKEN_INFO_KEY, stringifiedVal);
}

/**
 * Retrieve the tokens from the secure store.  
 * Try calling this before making any oAuth2 call to see if the user has local tokens stored.  
 * _NOTE: will return `null` if not found, or the found tokens_
 */
export async function getTokenInfo(): Promise<LocalTokenInfo | null> {

	if (!(await canUseSecureStore())) return null;

	const stringifiedVal = await SecureStore.getItemAsync(TOKEN_INFO_KEY);
	return !stringifiedVal ? null : JSON.parse(stringifiedVal);
}

/**
 * Check if the device can securely store the tokens with SecureStore.  
 * Should be called before attempting to store tokens on device.  
 */
export function canUseSecureStore(): Promise<boolean> {
	return SecureStore.isAvailableAsync();
}

/**
 * Delete the tokens from the SecureStore
 */
export async function deleteTokenInfo(noAlert?: boolean): Promise<void> {

	if (!(await canUseSecureStore())) return;
	SecureStore.deleteItemAsync(TOKEN_INFO_KEY);
	if (noAlert) return;
	Alert.alert("Logged Out", "You have successfully logged out of the RaceDay Mobile Timing app. Note: Your RunSignup credentials may still be saved in your browser.");
}

/** 
 * Check if the locally found access token is valid.  
 * 
 * @param expires_at When the access_token expires. _NOTE: This is `expires_at` not the `expires_in` returned from the RSU API call._  
 */
export function isLocalAccessTokenValid(expires_at: number): boolean {
	return expires_at > Date.now();
}

/**
 * Get the local tokens from the SecureStore, and refresh them if necessary.  
 * Returns the access_token if possible, otherwise `null`
 */
export async function getAndRefreshLocalTokens(): Promise<string | null> {
	// Try getting the local access & refresh tokens
	const localTokens = await getTokenInfo();
	let accessToken = null;

	// If we found local tokens 
	if (localTokens !== null) {
		// The access token is expired. Try refreshing the tokens
		if (!isLocalAccessTokenValid(localTokens.expires_at)) {
			const newRefreshedTokens = await refreshTokens(localTokens.refresh_token);

			// Successful refresh
			if (newRefreshedTokens !== null) {
				await storeTokenInfo(newRefreshedTokens);
				accessToken = newRefreshedTokens.access_token;
			}
		}
		else {
			// Valid access token still
			accessToken = localTokens.access_token;
		}
	}

	return accessToken;
}