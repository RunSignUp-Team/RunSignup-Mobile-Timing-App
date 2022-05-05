import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { KeyboardAvoidingView, View, FlatList, TouchableOpacity, Text, TextInput, Alert, ActivityIndicator, Platform, Image, TouchableWithoutFeedback, Keyboard, BackHandler } from "react-native";
import { DARK_GREEN_COLOR, globalstyles, GRAY_COLOR, GREEN_COLOR, LONG_TABLE_ITEM_HEIGHT } from "../components/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../components/AppContext";
import { deleteBibs, deleteFinishTimes, getBibs, getFinishTimes, getParticipants, ParticipantDetails, postBibs, postFinishTimes } from "../helpers/AxiosCalls";
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

	// Records
	const [records, setRecords] = useState<VRecords>([]);
	const recordsRef = useRef<VRecords>(records);

	// Search
	const [participants, setParticipants] = useState<Array<ParticipantDetails>>([]);
	const [searchRecords, setSearchRecords] = useState<VRecords>(recordsRef.current);
	const [search, setSearch] = useState("");

	// Edit Alert
	const [alertVisible, setAlertVisible] = useState(false);
	const [alertRecord, setAlertRecord] = useState<[number, number, number]>();
	const [alertIndex, setAlertIndex] = useState<number>();

	// Other
	const flatListRef = useRef<FlatList>(null);
	const isUnmountedRef = useRef(false);
	const [loading, setLoading] = useState(false);

	/** Updates records without re-rendering entire list */
	const updateRecords = useCallback((newRecords: Array<[number, number, number]>) => {
		setRecords(newRecords);
		recordsRef.current = newRecords;
	}, []);

	// Leave with alert
	const backTapped = useCallback(() => {
		if (editMode) {
			Alert.alert(
				"Are You Sure?", 
				"Are you sure you want to leave? Any unsaved changes will be lost!",
				[
					{
						text: "Leave",
						style: "destructive",
						onPress: (): void => {
							navigation.pop(); 
						}
					},
					{
						text: "Cancel",
						style: "default",
						onPress: (): void => { return; }
					},
				]);
		} else {
			navigation.pop(); 
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

	useEffect(() => {
		setLoading(true);
		if (context.online) {
			// Online Functionality
			const getRecords = async (): Promise<void> => {
				try {
					// Get bibs from API
					const bibs = await getBibs(context.raceID, context.eventID);
					// Get finish times from API
					const finishTimes = await getFinishTimes(context.raceID, context.eventID);
					// Get participants from API
					const participantList = await getParticipants(context.raceID, context.eventID);

					// Bibs
					for (let i = 0; i < bibs.length; i++) {
						if (i > recordsRef.current.length - 1) {
							recordsRef.current.push([0, Number.MAX_SAFE_INTEGER, 0]);
						}
						recordsRef.current[i][0] = parseInt(bibs[i].bib_num);
					}

					const [raceList, raceIndex, eventIndex] = await GetLocalRaceEvent(context.raceID, context.eventID);

					if (raceIndex !== null && eventIndex !== null) {
						// Store conflict data in record (whether from Chute or Finish line mode)
						const biggerArray = Math.max(raceList[raceIndex].events[eventIndex].checker_bibs.length, raceList[raceIndex].events[eventIndex].bib_nums.length);
						for (let i = 0; i < biggerArray; i++) {
							if (i > recordsRef.current.length - 1) {
								recordsRef.current.push([0, Number.MAX_SAFE_INTEGER, 0]);
							}

							const bibNum = raceList[raceIndex].events[eventIndex].bib_nums[i];
							const checkerBib = raceList[raceIndex].events[eventIndex].checker_bibs[i];

							// Set checker bib record to conflicting bib
							recordsRef.current[i][2] = (recordsRef.current[i][0] === checkerBib || (isNaN(recordsRef.current[i][0]) && isNaN(checkerBib))) ? (isNaN(bibNum) ? 0 : bibNum) : (isNaN(checkerBib) ? 0 : checkerBib);

							// Good debugging logs
							// Logger.log("Stored in API: ", parseInt(recordsRef.current[i][0]));
							// Logger.log("CheckerBib: ", checkerBib);
							// Logger.log("BibNum: ", bibNum);
							// Logger.log("Conflict Bib: ", parseInt(recordsRef.current[i][2]));
							// Logger.log("\n");

							// Prefer real bibs to zeros
							if (!recordsRef.current[i][0]) {
								if (!(recordsRef.current[i][2])) {
									recordsRef.current[i][0] = 0;
								} else {
									recordsRef.current[i][0] = recordsRef.current[i][2];
								}
							}

							// Without this, conflicts are shown as API Bib / Conflict Bib
							// If there are several conflicts, we want to display to the user the conflicts that they have resolved locally even before the resolutions have been pushed
							// So if checker_bibs[i] === bib_nums[i], we will show that there is no conflict even if the API hasn't been updated yet
							if (checkerBib === bibNum) {
								recordsRef.current[i][0] = bibNum;
							}
						}
					}

					// Finish Times
					for (let i = 0; i < finishTimes.length; i++) {
						if (i > recordsRef.current.length - 1) {
							recordsRef.current.push([0, Number.MAX_SAFE_INTEGER, 0]);
						}
						recordsRef.current[i][1] = GetTimeInMils(finishTimes[i].time);
					}

					// Participants
					if (participantList.participants !== undefined) {
						const parsedTicipants = [];
						for (let i = 0; i < participantList.participants.length; i++) {
							parsedTicipants.push(participantList.participants[i]);
						}
						setParticipants([...parsedTicipants]);
					} else {
						Alert.alert("No Participants", "No participant data found from Runsignup.");
					}

					updateRecords([...recordsRef.current]);
				} catch (error) {
					if (error instanceof Error) {
						if (error.message === undefined || error.message === "Network Error") {
							Alert.alert("Connection Error", "No response received from the server. Please check your internet connection and try again.");
						} else {
							// Something else
							Alert.alert("Unknown Error", `${JSON.stringify(error.message)}`);
							Logger.log(error);
						}
					}
				}
			};
			getRecords();
		} else {
			// Offline Functionality
			GetLocalOfflineEvent(context.time).then(([eventList, eventIndex]) => {
				if (eventIndex !== -1) {
					// Get bibs, finish times, and checker bibs
					for (let i = 0; i < eventList[eventIndex].bib_nums.length; i++) {
						if (i > recordsRef.current.length - 1) {
							recordsRef.current.push([0, Number.MAX_SAFE_INTEGER, 0]);
						}
						recordsRef.current[i][0] = eventList[eventIndex].bib_nums[i];
					}

					for (let i = 0; i < eventList[eventIndex].finish_times.length; i++) {
						if (i > recordsRef.current.length - 1) {
							recordsRef.current.push([0, Number.MAX_SAFE_INTEGER, 0]);
						}
						recordsRef.current[i][1] = eventList[eventIndex].finish_times[i];
					}

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
		}

		if (!isUnmountedRef.current) {
			setLoading(false);
		}
		return () => {
			isUnmountedRef.current = true;
		};
	}, [context.eventID, context.online, context.raceID, context.time, updateRecords]);

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

	// Check conflicts on first load
	const secondRun = useRef(2);
	useEffect(() => {
		if (secondRun.current === 2) {
			secondRun.current--;
			return;
		}
		if (secondRun.current === 1) {
			if (conflicts > 0) {
				Alert.alert("Warning", "There is conflicting data for one or more bib numbers. Please select the conflicting rows and resolve the conflicts.");
			}
			secondRun.current--;
			return;
		}
		if (secondRun.current === 0) {
			return;
		}
	}, [conflicts]);

	// Update local storage to reflect conflict resolved
	const conflictResolved = useCallback((index) => {
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
	}, [context.eventID, context.online, context.raceID, context.time]);

	const conflictResolution = useCallback(async (index) => {
		Alert.alert(
			"Conflict Found",
			"There is conflicting data for this bib number. Please choose the correct bib number for this position.",
			[
				{
					text: `${recordsRef.current[index][0]}`,
					onPress: (): void => {
						recordsRef.current[index][2] = recordsRef.current[index][0];
						updateRecords([...recordsRef.current]);
						conflictResolved(index);
					}
				},
				{
					text: `${recordsRef.current[index][2]}`,
					onPress: (): void => {
						recordsRef.current[index][0] = recordsRef.current[index][2];
						updateRecords([...recordsRef.current]);
						conflictResolved(index);
					}
				},
			]
		);
	}, [conflictResolved, updateRecords]);

	const saveResults = useCallback(async () => {
		// Sort finish times
		updateRecords([...recordsRef.current.sort((a, b) => (a[1] - b[1]))]);

		if (context.online) {
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

			try {
				// Clear old bib data
				await deleteBibs(context.raceID, context.eventID);
				// Post new bib data
				await postBibs(context.raceID, context.eventID, formDataBibs);

				// Clear old finish time data
				await deleteFinishTimes(context.raceID, context.eventID);
				// Post new finish time data
				await postFinishTimes(context.raceID, context.eventID, recordsRef.current.filter(entry => entry[1] !== Number.MAX_SAFE_INTEGER).map(entry => entry[1]));

				// Clear local data upon successful upload
				GetLocalRaceEvent(context.raceID, context.eventID).then(([raceList, raceIndex, eventIndex]) => {
					if (raceIndex !== null && eventIndex !== null) {
						raceList[raceIndex].events[eventIndex].checker_bibs = [];
						raceList[raceIndex].events[eventIndex].bib_nums = [];
						raceList[raceIndex].events[eventIndex].finish_times = [];
						AsyncStorage.setItem("onlineRaces", JSON.stringify(raceList));
					}
				});

				Alert.alert("Success", "Results successfuly uploaded to Runsignup!");

				setEditMode(false);
				setLoading(false);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === undefined || error.message === "Network Error") {
						Alert.alert("Connection Error", "No response received from the server. Please check your internet connection and try again.");
					} else {
						// Something else
						Alert.alert("Unknown Error", `${JSON.stringify(error.message)}`);
						Logger.log(error);
					}
				}
				if (!isUnmountedRef.current) {
					setLoading(false);
				}
			}
		} else {
			// Offline Functionality
			GetLocalOfflineEvent(context.time).then(([eventList, eventIndex]) => {
				eventList[eventIndex].bib_nums = recordsRef.current.map(entry => entry[0]);
				eventList[eventIndex].finish_times = recordsRef.current.filter(entry => entry[1] !== Number.MAX_SAFE_INTEGER).map(entry => entry[1]);
				eventList[eventIndex].checker_bibs = recordsRef.current.map(entry => entry[2]);
				AsyncStorage.setItem("offlineEvents", JSON.stringify(eventList));
			});
			setEditMode(false);
			setLoading(false);

			Alert.alert("Success", "Edits have been saved to your local device!");
		}
	}, [context.eventID, context.online, context.raceID, context.time, updateRecords]);

	// Check entries for errors
	const checkEntries = useCallback(async () => {
		setLoading(true);
		let blankTimes = false;

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
			if (recordsRef.current[i][1] === Number.MAX_SAFE_INTEGER) {
				for (let j = i + 1; j < recordsRef.current.length; j++) {
					if (recordsRef.current[j][1] !== Number.MAX_SAFE_INTEGER && recordsRef.current[j][1] !== undefined) {
						blankTimes = true;
						break;
					}
				}
			}
		}

		updateRecords([...recordsRef.current]);

		if (recordsRef.current.filter((entry) => entry[0] === null).length > 0) {
			// Alert if blank bib entry
			Alert.alert("Incorrect Bib Entry", "There is a blank Bib Entry in the list. Please fill in the correct value.");
			setLoading(false);
		} else if (recordsRef.current.filter(entry => !(/^(\d)+$/gm.test(entry[0].toString()))).length > 0) {
			// Alert if non number
			Alert.alert("Incorrect Bib Entry", "You have entered a non-numeric character in the Bib Entries list. Please correct that entry before submitting.");
			setLoading(false);
		} else if (recordsRef.current.filter((entry) => (entry[0].toString().substring(0, 1) === "0" && entry[0].toString().length > 1)).length > 0) {
			// Alert if starts with 0
			Alert.alert("Incorrect Bib Entry", "There is a Bib Entry that starts with 0 in the list. Please fill in the correct value.");
			setLoading(false);
		} else if (recordsRef.current.filter((entry) => entry[1] === Number.MAX_SAFE_INTEGER).length > 0 && blankTimes) {
			// Alert if blank or incorrect finish time
			Alert.alert("Incorrect Finish Time Entry", "There is a blank Finish Time in the list. Please fill in the correct value.");
			setLoading(false);
		} else if (recordsRef.current.filter((entry) => (entry[1] === -1)).length > 0) {
			// Alert if blank or incorrect finish time
			Alert.alert("Incorrect Finish Time Entry", "There is an incorrectly typed Finish Time in the list. Please correct the value.\nFinish times must be in one of these forms (note the colons and periods):\n\nhh:mm:ss:ms\nhh:mm:ss.ms\nhh:mm:ss\nmm:ss.ms\nmm:ss\nss.ms");
			setLoading(false);
		} else if (recordsRef.current.filter((entry) => (entry[1] > 86399999 && entry[1] !== Number.MAX_SAFE_INTEGER)).length > 0) {
			// Alert if too large finish time
			Alert.alert("Incorrect Finish Time Entry", "There is a Finish Time that is too large in the list. Please correct the value.");
			setLoading(false);
		} else if (recordsRef.current.filter((entry) => entry[1] === 0).length > 0) {
			// Alert if zero finish time
			Alert.alert("Incorrect Finish Time Entry", "There is a Finish Time that is zero in the list. Please correct the value.");
			setLoading(false);
		} else {
			saveResults();
		}
	}, [saveResults, updateRecords]);

	// Save after final conflict resolution
	const firstUpdate2 = useRef(true);
	useEffect(() => {
		if (firstUpdate2.current) {
			firstUpdate2.current = false;
			return;
		}
		if (conflicts === 0) {
			checkEntries();
		}
	}, [checkEntries, conflicts]);

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

	useEffect(() => {
		if (search !== undefined) {
			setSearchRecords([...recordsRef.current.filter(entry => entry[0].toString().includes(search.trim()) || findParticipant(entry[0]).toLowerCase().includes(search.trim().toLowerCase()))]);
		}
	}, [search, saveResults, findParticipant]);

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
			const temp = recordsRef.current[lastIndex][0];
			recordsRef.current[lastIndex][0] = recordsRef.current[index][0];
			recordsRef.current[lastIndex][2] = recordsRef.current[index][2];
			recordsRef.current[index][0] = temp;
			recordsRef.current[index][2] = temp;
			updateRecords([...recordsRef.current]);
		}
	}, [lastIndex, tapped, updateRecords]);

	// Adds record to bottom of Flat List
	const addRecord = useCallback(() => {
		recordsRef.current.push([0, Number.MAX_SAFE_INTEGER, 0]);
		updateRecords([...recordsRef.current]);

		const flatListRefCurrent = flatListRef.current;
		if (flatListRefCurrent !== null) {
			setTimeout(() => { flatListRefCurrent.scrollToOffset({ animated: false, offset: LONG_TABLE_ITEM_HEIGHT * recordsRef.current.length }); }, 100);
		}
	}, [updateRecords]);

	// Enter edit mode
	const editTable = useCallback(() => {
		setEditMode(true);
		Alert.alert(
			"Edit Mode", "Tap on a bib number or finish time to edit it. Tap on two places to swap the entries in the list.\nWARNING: Do not edit data until results have been saved in both the Finish Line and Chute Modes.");
	}, []);

	// Display edit / save button in header
	useEffect(() => {
		if (loading) {
			// Keep user from leaving screen without saving
			navigation.setOptions({
				gestureEnabled: false
			});

			// Hide back button
			navigation.setOptions({
				headerLeft: undefined,
			});
		} else {
			navigation.setOptions({
				headerLeft: () => (
					<HeaderBackButton onPress={(): void => { backTapped(); }} labelVisible={false} tintColor="white"></HeaderBackButton>
				),
			});
		}

		navigation.setOptions({
			headerRight: () => (
				<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
					{editMode && !loading && <TouchableOpacity onPress={(): void => addRecord()} >
						<Image
							style={globalstyles.headerImage}
							source={require("../assets/plus-icon.png")}
						/>
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
	}, [backTapped, addRecord, checkEntries, conflicts, editMode, editTable, loading, navigation]);

	const showAlert = (index: number, record: [number, number, number]) => {
		setAlertRecord(record);
		setAlertIndex(index);
		setAlertVisible(true);
	}

	// Renders item on screen
	const renderItem = ({ item, index }: { item: VRecord, index: number }): React.ReactElement => (
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
			conflictResolution={conflictResolution}
			swapEntries={swapEntries}
			showAlert={showAlert}
			findParticipant={findParticipant}
			online={context.online}
		/>
	);

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<KeyboardAvoidingView style={globalstyles.tableContainer}
				behavior={Platform.OS == "ios" ? "padding" : "height"}
				keyboardVerticalOffset={170}>

				<View style={{backgroundColor: DARK_GREEN_COLOR, flexDirection: "row"}}>
					<TextInput
						style={globalstyles.input}
						onChangeText={setSearch}
						value={search}
						placeholder={context.online ? "Search by Bib # or Name" : "Search by Bib #"}
					/>
				</View>
				
				{loading ? <ActivityIndicator size="large" color={Platform.OS === "android" ? GREEN_COLOR : GRAY_COLOR} /> :
					<FlatList
						keyboardShouldPersistTaps="handled"
						style={globalstyles.longFlatList}
						ref={flatListRef}
						data={(search !== undefined && search.trim().length !== 0) ? searchRecords : recordsRef.current}
						extraData={selectedID}
						renderItem={renderItem}
						keyExtractor={(_item, index): string => (index + 1).toString()}
						initialNumToRender={30}
						windowSize={11}
						getItemLayout={(_, index): ItemLayout => (
							{ length: LONG_TABLE_ITEM_HEIGHT, offset: LONG_TABLE_ITEM_HEIGHT * index, index }
						)}
						ListHeaderComponent={<View style={globalstyles.tableHead}>
							<Text style={globalstyles.placeTableHeadText}>#</Text>
							<Text style={globalstyles.bibTableHeadText}>Bib</Text>
							<Text style={globalstyles.timeTableHeadText}>Time</Text>
							{context.online && <Text style={globalstyles.nameTableHeadText}>Name</Text>}
							{editMode && <Text style={globalstyles.verificationDeleteTableText}>-</Text>}
						</View>}
						stickyHeaderIndices={[0]}
					/>
				}
				{alertVisible !== undefined && alertIndex !== undefined && alertRecord !== undefined && <TextInputAlert
					title={`Edit Row ${alertIndex ? alertIndex + 1 : ""}`}
					message="This is a test message that is longer than the alert width and so it should definitely wrap when it reaches the end."
					placeholder="Enter Bib #"
					secondPlaceholder="Enter Finish Time"
					initialValue={GetBibDisplay(alertRecord ? alertRecord[0] : -1)}
					secondInitialValue={GetClockTime(alertRecord ? alertRecord[1] : -1)}
					maxLength={6}
					secondMaxLength={11}
					visible={alertVisible}
					actionOnPress={(valArray): void => {
						if (alertIndex && alertRecord) {
							if (!isNaN(parseInt(valArray[0])) && GetTimeInMils(valArray[1]) !== -1) {
								// Valid Bib
								recordsRef.current[alertIndex][0] = parseInt(valArray[0]);
								// Valid Time
								recordsRef.current[alertIndex][1] = GetTimeInMils(valArray[1]);
								updateRecords([...recordsRef.current]);
								setAlertVisible(false);
							} else {
								if (isNaN(parseInt(valArray[0]))) {
									Alert.alert(
										"Incorrect Bib Entry", 
										"The bib number you have entered is invalid. Please correct the value. Bibs must be numeric.",
									);
								} else {
									// Invalid Time
									Alert.alert(
										"Incorrect Finish Time Entry", 
										"The finish time you have entered is invalid. Please correct the value.\nFinish times must be in one of these forms (note the colons and periods):\n\nhh:mm:ss:ms\nhh:mm:ss.ms\nhh:mm:ss\nmm:ss.ms\nmm:ss\nss.ms",
									);
								}
							}
						}
					}} cancelOnPress={(): void => {
						setAlertVisible(false);
					}} />}
			</KeyboardAvoidingView>
		</TouchableWithoutFeedback>
	);
};

export default VerificationModeScreen;