import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { View, FlatList, TouchableOpacity, Text, TextInput, Alert, ActivityIndicator, Platform, BackHandler, AlertButton, Linking } from "react-native";
import { BLACK_COLOR, DARK_GREEN_COLOR, globalstyles, GRAY_COLOR, LONG_TABLE_ITEM_HEIGHT, WHITE_COLOR } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { deleteBibs, deleteFinishTimes, getBibs, getFinishTimes, getParticipants, ParticipantDetails, postBibs, postFinishTimes } from "../helpers/APICalls";
import { MemoVerificationItem } from "../components/VerificationModeRenderItem";
import GetTimeInMils from "../helpers/GetTimeInMils";
import { HeaderBackButton } from "@react-navigation/elements";
import GetLocalRaceEvent from "../helpers/GetLocalRaceEvent";
import GetLocalOfflineEvent from "../helpers/GetLocalOfflineEvent";
import ConflictBoolean from "../helpers/ConflictBoolean";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/AppStack";
import { ItemLayout } from "../models/ItemLayout";
import { useFocusEffect } from "@react-navigation/native";
import Logger from "../helpers/Logger";
import TextInputAlert from "../components/TextInputAlert";
import GetBibDisplay from "../helpers/GetBibDisplay";
import GetClockTime from "../helpers/GetClockTime";
import CreateAPIError from "../helpers/CreateAPIError";
import Icon from "../components/IcoMoon";

type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
	navigation: ScreenNavigationProp;
};

type VRecord = [
	bibNum: number,
	finishTime: number,
	checkerBib: number
];

type VRecords = Array<VRecord>;

const VerificationModeScreen = ({ navigation }: Props): React.ReactElement => {
	const context = useContext(AppContext);

	// Swap
	const [selectedID, setSelectedID] = useState(-1);
	const [tapped, setTapped] = useState(1);
	const [lastIndex, setLastIndex] = useState(-1);

	// Editing
	const [editMode, setEditMode] = useState(false);
	const [conflicts, setConflicts] = useState(0);
	const [hasAPIData, setHasAPIData] = useState(false);
	const maxTime = useRef(0);

	// Records
	const [records, setRecords] = useState<VRecords>([]);
	const recordsRef = useRef<VRecords>(records);
	const [rStartLength, setRStartLength] = useState(0);

	// Search
	const [participants, setParticipants] = useState<Array<ParticipantDetails>>([]);
	const [searchRecords, setSearchRecords] = useState<VRecords>(recordsRef.current);
	const [search, setSearch] = useState("");
	// [index]: bib
	const prevSearchRecord = useRef<Record<number, Array<number>>>({});

	// Edit Alert
	const [alertVisible, setAlertVisible] = useState(false);
	const [alertRecord, setAlertRecord] = useState<[number, number, number]>();
	const [alertIndex, setAlertIndex] = useState<number>();

	// Other
	const flatListRef = useRef<FlatList>(null);
	const isUnmountedRef = useRef(false);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	/** Updates records without re-rendering entire list */
	const updateRecords = useCallback((newRecords: Array<[number, number, number]>) => {
		setRecords(newRecords);
		recordsRef.current = newRecords;
	}, []);

	/** Updates records without re-rendering entire list */
	const updateMaxTime = (newTime: number): void => {
		maxTime.current = newTime;
	};

	// Leave with alert
	const backTapped = useCallback(() => {
		if (editMode) {
			Alert.alert(
				"Are You Sure?",
				"Are you sure you want to leave? Any unsaved changes will be lost!",
				[
					{ text: "Cancel" },
					{
						text: "Leave",
						style: "destructive",
						onPress: (): void => {
							navigation.goBack();
						}
					},
				]);
		} else {
			navigation.goBack();
		}
	}, [editMode, navigation]);

	useFocusEffect(
		useCallback(() => {
			const onBackPress = (): boolean => {
				backTapped();
				return true;
			};

			BackHandler.addEventListener("hardwareBackPress", onBackPress);

			return () =>
				BackHandler.removeEventListener("hardwareBackPress", onBackPress);
		}, [backTapped]),
	);

	// Online Functionality
	const getRecords = useCallback(async (reload: boolean): Promise<void> => {
		if (reload) {
			setRefreshing(true);
		} else {
			setLoading(true);
		}

		try {
			// Get bibs from API
			const bibs = await getBibs(context.raceID, context.eventID);
			// Get finish times from API
			const finishTimes = await getFinishTimes(context.raceID, context.eventID);
			// Get participants from API
			const participantList = await getParticipants(context.raceID, context.eventID);

			const [raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);

			// Bibs & Checker Bibs
			if (raceIndex !== null && eventIndex !== null) {
				// Store conflict data in record (whether from Chute or Finish line mode)
				const biggerArray = Math.max(raceList[raceIndex].events[eventIndex].checker_bibs.length, raceList[raceIndex].events[eventIndex].bib_nums.length, bibs.length);
				for (let i = 0; i < biggerArray; i++) {
					if (i > recordsRef.current.length - 1) {
						recordsRef.current.push([0, Number.MAX_SAFE_INTEGER, 0]);
					}

					const localBib = raceList[raceIndex].events[eventIndex].bib_nums[i];
					const localCheckerBib = raceList[raceIndex].events[eventIndex].checker_bibs[i];
					const apiBib = parseInt(bibs[i]?.bib_num);

					// Batch Conflict Resolution assumes that API Bibs will be in the [i][0]
					if (localBib !== undefined && localCheckerBib !== undefined) {
						// Case 1: Bibs & Checker Bibs on same device
						recordsRef.current[i][0] = localBib;
						recordsRef.current[i][2] = localCheckerBib;
					} else if (localCheckerBib !== undefined && !isNaN(apiBib)) {
						// Case 2: Bibs in API & Checker Bibs on device
						if (!hasAPIData) {
							setHasAPIData(true);
						}

						recordsRef.current[i][0] = apiBib;
						recordsRef.current[i][2] = localCheckerBib;
					} else if (localBib !== undefined && !isNaN(apiBib)) {
						// Case 3: Checker Bibs in API & Bibs on device
						if (!hasAPIData) {
							setHasAPIData(true);
						}

						recordsRef.current[i][0] = apiBib;
						recordsRef.current[i][2] = localBib;
					} else if (!isNaN(apiBib)) {
						// Case 4: Only API Bib
						recordsRef.current[i][0] = apiBib;
						recordsRef.current[i][2] = apiBib;
					} else if (localBib !== undefined) {
						// Case 5: Only Local Bib
						recordsRef.current[i][0] = localBib;
						recordsRef.current[i][2] = localBib;
					} else if (localCheckerBib !== undefined) {
						// Case 5: Only Local Checker Bib
						recordsRef.current[i][0] = localCheckerBib;
						recordsRef.current[i][2] = localCheckerBib;
					} else {
						Logger("Unknown Error (Get Bibs)", [localBib, localCheckerBib, apiBib], true);
					}

					// Deal with simple conflicts right away
					if (!recordsRef.current[i][0] && recordsRef.current[i][2]) {
						recordsRef.current[i][0] = recordsRef.current[i][2];
					}
					if (!recordsRef.current[i][2] && recordsRef.current[i][0]) {
						recordsRef.current[i][2] = recordsRef.current[i][0];
					}

					// Good debugging logs
					// console.log("Stored in API: ", apiBib);
					// console.log("CheckerBib: ", localCheckerBib);
					// console.log("BibNum: ", localBib);
					// console.log("Record[0]: ", recordsRef.current[i][0]);
					// console.log("Record[2]: ", recordsRef.current[i][2]);
					// console.log("\n");
				}
			}

			// Finish Times
			for (let i = 0; i < finishTimes.length; i++) {
				if (i > recordsRef.current.length - 1) {
					recordsRef.current.push([0, Number.MAX_SAFE_INTEGER, 0]);
				}
				const time = GetTimeInMils(finishTimes[i].time);
				recordsRef.current[i][1] = time;

				// Get Max Time for Adding New Records
				if (time > maxTime.current) {
					maxTime.current = time;
				}
			}

			// Participants
			if (participantList.participants !== undefined) {
				const parsedTicipants = [];
				for (let i = 0; i < participantList.participants.length; i++) {
					parsedTicipants.push(participantList.participants[i]);
				}
				setParticipants([...parsedTicipants]);
			} else if (!__DEV__) {
				Logger("No Participant Data Found", "No data from Runsignup", true);
			}

			updateRecords([...recordsRef.current]);
		} catch (error) {
			CreateAPIError("Get Records", error);
		} finally {
			if (reload) {
				setRefreshing(false);
			} else {
				setLoading(false);
			}
		}
	}, [context.eventID, context.raceID, hasAPIData, updateRecords]);

	const firstRun = useRef(true);
	useEffect(() => {
		if (firstRun.current) {
			firstRun.current = false;
			if (context.online) {
				getRecords(false);
			} else {
				setLoading(true);
				// Offline Functionality
				GetLocalOfflineEvent(context.time).then(([eventList, eventIndex]) => {
					if (eventIndex !== -1) {
						// Get Bibs
						for (let i = 0; i < eventList[eventIndex].bib_nums.length; i++) {
							if (i > recordsRef.current.length - 1) {
								recordsRef.current.push([0, Number.MAX_SAFE_INTEGER, 0]);
							}
							recordsRef.current[i][0] = eventList[eventIndex].bib_nums[i];
						}

						// Get Finish Times
						const finishTimes = eventList[eventIndex].finish_times;
						for (let i = 0; i < finishTimes.length; i++) {
							const finishTime = finishTimes[i];
							if (i > recordsRef.current.length - 1) {
								recordsRef.current.push([0, Number.MAX_SAFE_INTEGER, 0]);
							}
							recordsRef.current[i][1] = finishTime;

							// Get Max Time for Adding New Records
							if (finishTime > maxTime.current) {
								maxTime.current = finishTime;
							}
						}

						// Get Checker Bibs
						for (let i = 0; i < eventList[eventIndex].checker_bibs.length; i++) {
							if (i > recordsRef.current.length - 1) {
								recordsRef.current.push([0, Number.MAX_SAFE_INTEGER, 0]);
							}
							recordsRef.current[i][2] = eventList[eventIndex].checker_bibs[i];

							// Get best bib data available into records[0]
							if (!recordsRef.current[i][0]) {
								if (recordsRef.current[i][2] !== undefined && recordsRef.current[i][2] !== null && recordsRef.current[i][2] !== 0) {
									recordsRef.current[i][0] = recordsRef.current[i][2];
								} else {
									recordsRef.current[i][0] = 0;
								}
							}
						}

						updateRecords([...recordsRef.current]);
						// Toggle searchID useEffect
						setSearch("");
					}
				});
				if (!isUnmountedRef.current) {
					setLoading(false);
				}
			}
		}

		return () => {
			isUnmountedRef.current = true;
		};
	}, [context.online, context.time, getRecords, updateRecords]);

	// Only show delete alert if there were previously records saved for the event
	const secondRun = useRef(1);
	useEffect(() => {
		if (secondRun.current === 0) {
			setRStartLength(recordsRef.current.length);
		}
		if (secondRun.current >= 0) {
			secondRun.current = secondRun.current - 1;
		}
	}, [records]);

	// Set conflicts
	useEffect(() => {
		let count = 0;
		for (let i = 0; i < recordsRef.current.length; i++) {
			if (ConflictBoolean(recordsRef.current[i][0], recordsRef.current[i][2])) {
				count++;
			}
		}
		setConflicts(count);
	}, [records]);

	const pushAndClear = useCallback(async () => {
		if (context.online) {
			try {
				// Clear old bib data
				await deleteBibs(context.raceID, context.eventID);
				// Post new bib data if the user hasn't deleted all records
				if (recordsRef.current.length > 0) {
					// Online Funtionality
					// Form Data
					const formDataBibs = new FormData();
					formDataBibs.append(
						"request",
						JSON.stringify({
							last_finishing_place: 0,
							bib_nums: recordsRef.current.map(entry => entry[0])
						})
					);

					await postBibs(context.raceID, context.eventID, formDataBibs);
					AsyncStorage.setItem(`chuteDone:${context.raceID}:${context.eventID}`, "true");
				} else {
					AsyncStorage.setItem(`chuteDone:${context.raceID}:${context.eventID}`, "false");
				}

				// Clear old finish time data
				await deleteFinishTimes(context.raceID, context.eventID);
				// Post new finish time data if the user hasn't deleted all records
				if (recordsRef.current.length > 0) {
					await postFinishTimes(context.raceID, context.eventID, recordsRef.current.filter(entry => entry[1] !== Number.MAX_SAFE_INTEGER).map(entry => entry[1]));
					AsyncStorage.setItem(`finishLineDone:${context.raceID}:${context.eventID}`, "true");
				} else {
					AsyncStorage.setItem(`finishLineDone:${context.raceID}:${context.eventID}`, "false");
				}

				// Clear local data upon successful upload
				GetLocalRaceEvent(context.raceID, context.eventID).then(([raceList, raceIndex, eventIndex]) => {
					if (raceIndex !== null && eventIndex !== null) {
						raceList[raceIndex].events[eventIndex].checker_bibs = [];
						raceList[raceIndex].events[eventIndex].bib_nums = [];
						raceList[raceIndex].events[eventIndex].finish_times = [];
						raceList[raceIndex].events[eventIndex].real_start_time = -1;
						AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));
					}
				});


				setEditMode(false);
				setLoading(false);

				if (recordsRef.current.length > 0) {
					Alert.alert("Success", "Results successfully uploaded to Runsignup!");
				} else {
					Alert.alert("Success", "Results successfully deleted from Runsignup!");
					navigation.goBack();
				}
			} catch (error) {
				CreateAPIError("confirm all bibs & finish times are formatted correctly", error);

				if (!isUnmountedRef.current) {
					setLoading(false);
				}
			}
		} else {
			try {
				// Offline Functionality
				if (recordsRef.current.length > 0) {
					GetLocalOfflineEvent(context.time).then(([eventList, eventIndex]) => {
						eventList[eventIndex].bib_nums = recordsRef.current.map(entry => entry[0]);
						eventList[eventIndex].finish_times = recordsRef.current.filter(entry => entry[1] !== Number.MAX_SAFE_INTEGER).map(entry => entry[1]);
						eventList[eventIndex].checker_bibs = recordsRef.current.map(entry => entry[2]);
						AsyncStorage.setItem("offlineEvents", JSON.stringify(eventList));
						AsyncStorage.setItem(`finishLineDone:${context.time}`, "true");
						AsyncStorage.setItem(`chuteDone:${context.time}`, "true");
						Alert.alert("Success", "Results successfully saved to your local device!");
					});
				} else {
					GetLocalOfflineEvent(context.time).then(([eventList, eventIndex]) => {
						eventList[eventIndex].bib_nums = [];
						eventList[eventIndex].finish_times = [];
						eventList[eventIndex].checker_bibs = [];
						eventList[eventIndex].real_start_time = -1;
						AsyncStorage.setItem("offlineEvents", JSON.stringify(eventList));
						AsyncStorage.setItem(`finishLineDone:${context.time}`, "false");
						AsyncStorage.setItem(`chuteDone:${context.time}`, "false");
						Alert.alert("Success", "Results successfully deleted from your local device!");
						navigation.goBack();
					});
				}

				setEditMode(false);
			} catch (error) {
				Logger("Unknown Error (Offline: confirm all bibs & finish times are formatted correctly)", error, true);
			} finally {
				setLoading(false);
			}

		}
		setRStartLength(recordsRef.current.length);
	}, [context.eventID, context.online, context.raceID, context.time, navigation]);

	const saveResults = useCallback(() => {
		if (recordsRef.current.length < 1 && rStartLength !== 0) {
			setLoading(false);
			Alert.alert(
				"Are You Sure?",
				"Are you sure you want to delete all records?",
				[
					{ text: "Cancel" },
					{ text: "Delete All", onPress: (): void => { 
						Alert.alert(
							"Confirm Delete?",
							"Please confirm that you want to delete all records for this event. All data will be lost.",
							[
								{ text: "Cancel" },
								{ text: "Delete All", onPress: (): void => { pushAndClear(); }, style: "destructive"}
							]
						);
					}, style: "destructive"}
				]
			);
		} else {
			pushAndClear();
		}
	}, [pushAndClear, rStartLength]);

	// Check entries for errors
	const checkEntries = useCallback(async () => {
		setLoading(true);
		let blankTimes = false;

		// Sort finish times
		updateRecords([...recordsRef.current.sort((a, b) => (a[1] - b[1]))]);

		// Reformat times and bibs
		for (let i = 0; i < recordsRef.current.length; i++) {
			if (recordsRef.current[i][1] === undefined) {
				recordsRef.current[i][1] = Number.MAX_SAFE_INTEGER;
			}

			if (isNaN(recordsRef.current[i][0]) || recordsRef.current[i][0] === undefined || recordsRef.current[i][0] === null) {
				recordsRef.current[i][0] = 0;
				recordsRef.current[i][2] = 0;
			}

			// Ignore empty finish times at the end of the list
			// Should theoretically never happen, 
			// Now that we sort records before entering this if statement
			if (recordsRef.current[i][1] === Number.MAX_SAFE_INTEGER) {
				for (let j = i + 1; j < recordsRef.current.length; j++) {
					if (recordsRef.current[j][1] !== Number.MAX_SAFE_INTEGER && recordsRef.current[j][1] !== undefined) {
						blankTimes = true;
						break;
					}
				}
			}
		}

		const blankBibIndex = recordsRef.current.findIndex((entry) => entry[0] === null);
		const badBibIndex = recordsRef.current.findIndex(entry => !(/^(\d)+$/gm.test(entry[0].toString())));
		const zeroBibIndex = recordsRef.current.findIndex((entry) => (entry[0].toString().substring(0, 1) === "0" && entry[0].toString().length > 1));
		const blankTimeIndex = recordsRef.current.findIndex((entry) => entry[1] === Number.MAX_SAFE_INTEGER);
		const badTimeIndex = recordsRef.current.findIndex((entry) => (entry[1] === -1));
		const bigTimeIndex = recordsRef.current.findIndex((entry) => (entry[1] > 86399999 && entry[1] !== Number.MAX_SAFE_INTEGER));
		const zeroTimeIndex = recordsRef.current.findIndex((entry) => entry[1] === 0);

		if (blankBibIndex !== -1) {
			// Alert if blank bib entry
			Alert.alert("Incorrect Bib Entry", `There is a blank bib number at row ${blankBibIndex + 1}. Please correct the value.`);
			setLoading(false);
		} else if (badBibIndex !== -1) {
			// Alert if non number
			Alert.alert("Incorrect Bib Entry", `There is a non-numeric bib number at row ${badBibIndex + 1}. Please correct the value.`);
			setLoading(false);
		} else if (zeroBibIndex !== -1) {
			// Alert if starts with 0
			Alert.alert("Incorrect Bib Entry", `There is a bib number that starts with 0 at row ${zeroBibIndex + 1}. Please fill in the correct value.`);
			setLoading(false);
		} else if (blankTimeIndex !== -1 && blankTimes) {
			// Alert if blank finish time
			Alert.alert("Incorrect Finish Time Entry", `There is a blank finish time at row ${blankTimeIndex + 1}. Please fill in the correct value.`);
			setLoading(false);
		} else if (badTimeIndex !== -1) {
			// Alert if incorrect finish time
			Alert.alert("Incorrect Finish Time Entry", `There is an incorrectly typed finish time at row ${badTimeIndex + 1}. Please correct the value.\nFinish times must be in one of these forms (note the colons and periods):\n\nHH : MM : SS : MS\nHH : MM: SS . MS\nHH : MM : SS\nMM : SS . MS\nMM : SS\nSS . MS`);
			setLoading(false);
		} else if (bigTimeIndex !== -1) {
			// Alert if too large finish time
			Alert.alert("Incorrect Finish Time Entry", `There is a finish time that is too large at row ${bigTimeIndex + 1}. Please correct the value.`);
			setLoading(false);
		} else if (zeroTimeIndex !== -1) {
			// Alert if zero finish time
			Alert.alert("Incorrect Finish Time Entry", `There is a finish time that is zero at row ${zeroTimeIndex}. Please correct the value.`);
			setLoading(false);
		} else {
			saveResults();
		}
	}, [saveResults, updateRecords]);

	// Update local storage to reflect conflict resolved
	const conflictResolved = useCallback((index) => {
		// Save results when all conflicts are resolved
		if (conflicts === 1) {
			checkEntries();
		}

		if (context.online) {
			// Online Functionality
			GetLocalRaceEvent(context.raceID, context.eventID).then(([raceList, raceIndex, eventIndex]) => {
				if (raceIndex !== null && eventIndex !== null) {
					raceList[raceIndex].events[eventIndex].bib_nums[index] = recordsRef.current[index][0];
					raceList[raceIndex].events[eventIndex].checker_bibs[index] = recordsRef.current[index][0];
					AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));
				}
			});
		} else {
			// Offline Functionality
			GetLocalOfflineEvent(context.time).then(([eventList, eventIndex]) => {
				if (eventIndex !== null) {
					eventList[eventIndex].bib_nums[index] = recordsRef.current[index][0];
					eventList[eventIndex].checker_bibs[index] = recordsRef.current[index][0];
					AsyncStorage.setItem("offlineEvents", JSON.stringify(eventList));
				}
			});
		}
	}, [checkEntries, conflicts, context.eventID, context.online, context.raceID, context.time]);

	// Check conflicts
	const prevConflicts = useRef(0);
	useEffect(() => {
		// If there are any conflicts and conflicts have not decreased by one
		// (don't show alert every time the user resolves a conflict)
		if (conflicts > 0 && conflicts > prevConflicts.current) {
			const alertMsg = `There is conflicting data for ${conflicts === 1 ? "1 bib number" : `${conflicts} bib numbers`}. You can resolve conflicts ${hasAPIData ? "individually " : ""}by selecting the conflicting rows${hasAPIData ? ", or you can choose to clear your local conflicting data and replace it with the latest data from RunSignup" : ""}.`;
			if (hasAPIData) {
				Alert.alert(
					"Warning",
					alertMsg,
					[
						{ text: "Resolve" },
						// Batch Conflict Resolution
						{
							text: "Clear Local",
							style: "destructive",
							onPress: (): void => {
								Alert.alert(
									"Confirm Clear",
									"Are you sure you want to clear your local conflicting data? This cannot be undone.",
									[
										{ text: "Cancel" },
										{
											text: "Clear Local",
											style: "destructive",
											onPress: (): void => {
												for (let i = 0; i < recordsRef.current.length; i++) {
													if (ConflictBoolean(recordsRef.current[i][0], recordsRef.current[i][2])) {
														recordsRef.current[i][2] = recordsRef.current[i][0];
														conflictResolved(i);
														updateRecords([...recordsRef.current]);
													}
												}
											}
										}
									]
								);
							}
						}
					]
				);
			} else {
				Alert.alert("Warning", alertMsg);
			}
		}
		prevConflicts.current = conflicts - 1;
	}, [conflictResolved, conflicts, hasAPIData, updateRecords]);

	const conflictResolution = useCallback(async (index) => {
		const buttons: Array<AlertButton> = [];
		if (Platform.OS === "android") {
			buttons.push({ text: "Cancel" });
		}
		buttons.push({
			text: `${recordsRef.current[index][0]}`,
			onPress: (): void => {
				recordsRef.current[index][2] = recordsRef.current[index][0];
				conflictResolved(index);
				updateRecords([...recordsRef.current]);
			}
		},
		{
			text: `${recordsRef.current[index][2]}`,
			onPress: (): void => {
				recordsRef.current[index][0] = recordsRef.current[index][2];
				conflictResolved(index);
				updateRecords([...recordsRef.current]);
			}
		});
		if (Platform.OS === "ios") {
			buttons.push({ text: "Cancel" });
		}
		Alert.alert(
			"Resolve Conflict",
			"There is conflicting data for this bib number. Please choose the correct bib number for this position.",
			buttons
		);
	}, [conflictResolved, updateRecords]);

	// Returns participant with bib number of index if found
	const findParticipant = useCallback((bib: number) => {
		if (context.online) {
			try {
				const p = participants.find((participant) => participant.bib_num.toString() === bib.toString());
				return p !== undefined ? `${p.user.first_name} ${p.user.last_name}` : "No Name";
			} catch {
				return "No Name";
			}
		} else {
			return "";
		}
	}, [context.online, participants]);

	// Search records
	const searchList = useCallback(() => {
		if (search !== undefined && search.trim().length > 0) {
			setSearchRecords([...recordsRef.current.filter((entry, index) => {
				// Search records
				if (entry[0].toString().includes(search.trim()) || findParticipant(entry[0]).toLowerCase().includes(search.trim().toLowerCase())) {
					return true;
				}

				// Search previous bibs to still show just-edited participants
				const prevSearchBibs = prevSearchRecord.current[index];

				if (prevSearchBibs) {
					for (let i = 0; i < prevSearchBibs.length; i++) {
						const prevSearchBib = prevSearchBibs[i];
						if (
							(prevSearchBib.toString().includes(search.trim()) ||
							findParticipant(prevSearchBib).toLowerCase().includes(search.trim().toLowerCase()))
						) {
							return true;
						}
					}
				}

				return false;
			}
			)]);
		}
	}, [findParticipant, search]);

	// Search records when data changes
	useEffect(() => {
		searchList();
	}, [search, saveResults, findParticipant, records, alertVisible, searchList]);

	// Clear prevSearchRecord when search changes
	useEffect(() => {
		prevSearchRecord.current = {};
		searchList();
	}, [search, searchList]);

	// Swap two entries in table
	const swapEntries = useCallback((index) => {
		setTapped(tapped + 1);

		// Check if first or second tap
		if (tapped % 2 === 1) {
			setSelectedID(index);
			setLastIndex(index);
		} else {
			// Swap
			setSelectedID(-1);
			if (recordsRef.current[lastIndex]) {
				const temp = recordsRef.current[lastIndex][0];
				recordsRef.current[lastIndex][0] = recordsRef.current[index][0];
				recordsRef.current[lastIndex][2] = recordsRef.current[index][2];
				recordsRef.current[index][0] = temp;
				recordsRef.current[index][2] = temp;
				updateRecords([...recordsRef.current]);
			}
		}
	}, [lastIndex, tapped, updateRecords]);

	// Adds record to bottom of Flat List
	const addRecord = useCallback(() => {
		// Only increase time if we are not at 23:59:59:99
		if (maxTime.current + 10 <= 86399999) {
			recordsRef.current.push([0, maxTime.current + 10, 0]);
			maxTime.current = maxTime.current + 10;
		} else {
			recordsRef.current.push([0, maxTime.current, 0]);
		}
		updateRecords([...recordsRef.current]);

		const flatListRefCurrent = flatListRef.current;
		if (flatListRefCurrent !== null) {
			setTimeout(() => { flatListRefCurrent.scrollToOffset({ animated: false, offset: LONG_TABLE_ITEM_HEIGHT * recordsRef.current.length }); }, 100);
		}
	}, [maxTime, updateRecords]);

	// Enter edit mode
	const editTable = useCallback(() => {
		setEditMode(true);
		Alert.alert(
			"Edit Mode", 
			`WARNING: Once data has been edited here, you will not be able to re-open either Finish Line Mode or Chute Mode.\n${recordsRef.current.length > 0 ? "Tap on a bib number or finish time to edit it. Tap on two places to swap the bibs in the list. " : ""}Tap + to add a record.`,
			[
				{ text: "I Understand", style: "destructive" }
			]
		);
	}, []);

	const openLink = useCallback(async (): Promise<void> => {
		const url = `https://runsignup.com/Race/${context.raceID}/Results/Dashboard/EditIndividualResults`;
		if (await Linking.canOpenURL(url)) {
			Linking.openURL(url);
		} else {
			Logger("Cannot Open Link", "Device Not Set Up Correctly", true);
		}
	}, [context.raceID]);

	// Display edit / save button in header
	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<HeaderBackButton onPress={(): void => { loading ? undefined : backTapped(); }} labelVisible={false} disabled={loading} tintColor={WHITE_COLOR}></HeaderBackButton>
			),
			headerRight: () => (
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					{editMode && !loading && <TouchableOpacity style={{ marginRight: 15 }} onPress={(): void => addRecord()} >
						<Icon name={"plus3"} size={22} color={WHITE_COLOR} />
					</TouchableOpacity>}
					{!editMode && !loading && <TouchableOpacity style={{ marginRight: 15 }} onPress={openLink} >
						<Icon name={"stats-bars2"} size={22} color={WHITE_COLOR} />
					</TouchableOpacity>}

					{!loading && conflicts === 0 && <TouchableOpacity
						onPress={(): void => {
							if (!editMode) {
								editTable();
							} else {
								checkEntries();
							}
						}}>
						{!editMode && <Text style={globalstyles.headerButtonText}>Edit</Text>}
						{editMode && <Text style={globalstyles.headerButtonText}>Save</Text>}
					</TouchableOpacity>}
				</View>
			),
		});
	}, [backTapped, addRecord, checkEntries, conflicts, editMode, editTable, loading, navigation, openLink]);

	// Show Edit Alert
	const showAlert = (index: number, record: [number, number, number]): void => {
		setAlertRecord(record);
		setAlertIndex(index);
		setAlertVisible(true);
	};

	const onAlertSave = (valArray: Array<string>): void => {
		if (alertIndex !== undefined && alertRecord) {
			if (!valArray[0]) {
				// Alert if blank bib entry
				Alert.alert("Incorrect Bib Entry", "The bib number you have entered is blank. Please correct the value.");
			} else if (!(/^(\d)+$/gm.test(valArray[0]))) {
				// Alert if non number
				Alert.alert("Incorrect Bib Entry", "The bib number you have entered is not a number. Please correct the value.");
			} else if (GetTimeInMils(valArray[1]) === -1 && (recordsRef.current[alertIndex][1] !== Number.MAX_SAFE_INTEGER || valArray[1] !== "")) {
				// Alert if incorrect finish time
				Alert.alert("Incorrect Finish Time Entry", "The finish time you have entered is incorrectly typed. Please correct the value.\nFinish times must be in one of these forms (note the colons and periods):\n\nHH : MM : SS : MS\nHH : MM : SS . MS\nHH : MM : SS\nMM : SS . MS\nMM : SS\nSS . MS");
			} else if (GetTimeInMils(valArray[1]) > 86399999 && GetTimeInMils(valArray[1]) !== Number.MAX_SAFE_INTEGER) {
				// Alert if too large finish time
				Alert.alert("Incorrect Finish Time Entry", "The finish time you have entered is too large. Please correct the value.");
			} else if (GetTimeInMils(valArray[1]) === 0) {
				// Alert if zero finish time
				Alert.alert("Incorrect Finish Time Entry", "The finish time you have entered is zero. Please correct the value.");
			} else {
				// Add previous bib to prevSearchRecord for searching
				if (search !== undefined && search.trim().length > 0) {
					prevSearchRecord.current[alertIndex] = prevSearchRecord.current[alertIndex] ? [...prevSearchRecord.current[alertIndex], recordsRef.current[alertIndex][0]] : [recordsRef.current[alertIndex][0]];
				}

				// Valid Bib
				recordsRef.current[alertIndex][0] = parseInt(valArray[0]);
				recordsRef.current[alertIndex][2] = parseInt(valArray[0]);
				// Valid Time
				if (valArray[1] !== "") {
					recordsRef.current[alertIndex][1] = GetTimeInMils(valArray[1]);

					// Update Max Time
					if (GetTimeInMils(valArray[1]) > maxTime.current) {
						maxTime.current = GetTimeInMils(valArray[1]);
					}
				}
				updateRecords([...recordsRef.current]);
				setAlertVisible(false);
			}
		} else {
			setAlertVisible(false);
		}
	};

	// Renders item on screen
	const renderItem = ({ item, index }: { item: VRecord, index: number }): React.ReactElement | null => (
		// When searching, the records do not update immediately when a record is deleted,
		// So we show null here until they do
		recordsRef.current[index] ?
			<MemoVerificationItem
				// Passed down to trigger rerender when a bib is edited or a conflict is resolved
				recordsRefSearchBib={recordsRef.current[index][0]}
				searchRecordsSearchBib={searchRecords[index] !== undefined ? searchRecords[index][0] : -1}
				conflictBoolean={ConflictBoolean(recordsRef.current[index][0], recordsRef.current[index][2])}

				recordsRef={recordsRef}
				updateRecords={updateRecords}
				record={item}
				selectedID={selectedID}
				editMode={editMode}
				maxTime={maxTime.current}
				updateMaxTime={updateMaxTime}
				conflictResolution={conflictResolution}
				swapEntries={swapEntries}
				showAlert={showAlert}
				findParticipant={findParticipant}
				online={context.online}
			/> : null
	);

	return (
		<View style={globalstyles.tableContainer}>
			{!loading && !editMode && recordsRef.current.length < 1 &&
				<View style={globalstyles.container}>
					<Text style={globalstyles.info}>
						No records found for this event. Enter data in Finish Line Mode & Chute Mode, then come back here to view & edit results (or directly enter data here by tapping Edit).
					</Text>
				</View>
			}


			{(recordsRef.current.length > 0 || editMode) &&
				<View style={{ backgroundColor: DARK_GREEN_COLOR, flexDirection: "row" }}>
					<TextInput
						style={[globalstyles.input, { borderWidth: 0 }]}
						onChangeText={setSearch}
						value={search}
						placeholder={context.online ? "Search by Bib # or Name" : "Search by Bib #"}
						placeholderTextColor={GRAY_COLOR}
					/>
				</View>
			}

			{/* Header */}
			{(recordsRef.current.length > 0 || editMode) &&
				<View style={globalstyles.tableHead}>
					<Text style={globalstyles.placeTableHeadText}>#</Text>
					<Text style={globalstyles.bibTableHeadText}>Bib</Text>
					<Text style={globalstyles.timeTableHeadText}>Time</Text>
					{context.online && <Text style={globalstyles.nameTableHeadText}>Name</Text>}
					{editMode &&
						<View style={globalstyles.tableDeleteButton}>
							<Icon name="minus2" color={BLACK_COLOR} size={10} />
						</View>
					}
				</View>
			}

			{loading && <ActivityIndicator size="large" color={Platform.OS === "android" ? BLACK_COLOR : GRAY_COLOR} style={{ marginTop: 20 }} />}
			{!loading && recordsRef.current.length > 0 &&
				<FlatList
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					style={globalstyles.longFlatList}
					ref={flatListRef}
					onRefresh={(context.online && !editMode) ? (): void => { getRecords(true); } : undefined}
					refreshing={refreshing}
					data={(search !== undefined && search.trim().length !== 0) ? searchRecords : recordsRef.current}
					extraData={selectedID}
					renderItem={renderItem}
					keyExtractor={(_item, index): string => (index + 1).toString()}
					initialNumToRender={30}
					windowSize={11}
					getItemLayout={(_, index): ItemLayout => (
						{ length: LONG_TABLE_ITEM_HEIGHT, offset: LONG_TABLE_ITEM_HEIGHT * index, index }
					)}
				/>
			}

			{alertIndex !== undefined && alertRecord !== undefined &&
				<TextInputAlert
					title={`Edit Row ${alertIndex !== undefined ? alertIndex + 1 : ""}`}
					message={`Edit the bib number or finish time for Row ${alertIndex !== undefined ? alertIndex + 1 : ""}.`}
					placeholder="Enter Bib #"
					secondPlaceholder="Enter Finish Time"
					initialValue={GetBibDisplay(alertRecord ? alertRecord[0] : -1)}
					secondInitialValue={GetClockTime(alertRecord ? alertRecord[1] : -1)}
					keyboardType={"number-pad"}
					secondKeyboardType={"numbers-and-punctuation"}
					maxLength={6}
					secondMaxLength={11}
					visible={alertVisible}
					actionOnPress={onAlertSave}
					cancelOnPress={(): void => {
						setAlertVisible(false);
					}} />
			}
		</View>
	);
};

export default VerificationModeScreen;