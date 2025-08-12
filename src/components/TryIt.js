
import { useState, useEffect, useRef, useCallback } from 'react';

import { Box, Button, VStack, Text, Heading, Container, SimpleGrid, useToast, Progress, Badge, HStack, Icon, Stat, StatLabel, StatNumber, StatHelpText, 
    NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, FormControl, FormLabel, Select,
    Tooltip, useBreakpointValue, Flex, Drawer, DrawerBody, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton,
    useDisclosure, IconButton} from '@chakra-ui/react';

import { FaMicrophone, FaInfoCircle, FaChartLine, FaClock, FaQuestionCircle, FaBars, FaCog, FaUser, FaHome,  FaHistory, 
         FaDownload} from 'react-icons/fa';
         
import AboutTab from './TryIt/AboutTab';
import SettingsTab from './TryIt/SettingsTab';
import ProfileTab from './TryIt/ProfileTab';
import RecordingsTab from './TryIt/RecordingsTab';
import { data, useNavigate } from 'react-router-dom';
import AudioWaveform from './waveform';


function createAudioUrl(audioBlob) {
    if (!audioBlob) return '';
    return URL.createObjectURL(audioBlob);
}

//audio blob to MP3 file
function downloadAudioAsMp3(blob, filename = 'recording.mp3') {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

const STORAGE_PREFERENCE_KEY = 'procomm-storage-preference';
const RECORDING_HISTORY_KEY = 'procomm-recording-history';
const MAX_STORAGE_ITEMS = 200; 
const ESTIMATED_MAX_STORAGE_MB = 5; 

// Storage functions
const storageUtils = {
    isLocalStorageAvailable: () => {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    },

    getStorageUsage: () => {
        try {
            let total = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key) || '';
                total += (key.length + value.length) * 2; 
            }
            return Math.round(total / 1024); 
        } catch (e) {
            console.error('Error calculating storage usage:', e);
            return 0;
        }
    },
    
    getStoragePercentage: () => {
        const maxStorage = ESTIMATED_MAX_STORAGE_MB * 1024; 
        const currentUsage = storageUtils.getStorageUsage();
        return Math.min(Math.round((currentUsage / maxStorage) * 100), 100);
    },
    
  
    saveRecordings: (recordings) => {
        try {
            // Ensure we don't exceed the maximum number of items
            const limitedRecordings = recordings.slice(-MAX_STORAGE_ITEMS);

            // Process recordings 
            const processedRecordings = limitedRecordings.map(recording => {
                const { audioBlob, audioUrl, ...rest } = recording;
                return {
                    ...rest,
                    hasAudio: !!audioBlob,  
                };
            });

            localStorage.setItem(RECORDING_HISTORY_KEY, JSON.stringify(processedRecordings));
            return true;
        } catch (e) {
            console.error('Failed to save recordings:', e);
            return false;
        }
    },

    // Import recordings from JSON data
    importRecordings: (jsonData) => {
        try {
            const importedData = JSON.parse(jsonData);

            if (!Array.isArray(importedData)) {
                throw new Error('Invalid format: Expected an array of recordings');
            }

            // Convert ISO date strings back to Date objects
            const processedData = importedData.map(record => ({
                ...record,
                timestamp: new Date(record.timestamp)
            }));

            return processedData;
        } catch (e) {
            console.error('Failed to import recordings:', e);
            return null;
        }
    }
};

export default function TryIt(props) {
    const [pitchData, setPitchData] = useState(null);
    const [pauseAnalysis, setPauseAnalysis] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [recordingHistory, setRecordingHistory] = useState([]);
    const [durationValue, setDurationValue] = useState(3); // Default to 3
    const [durationUnit, setDurationUnit] = useState('minutes'); 
    const [timer, setTimer] = useState(180); 
    const [sentiment, setSentiment] = useState('');
    const [sentimentScore, setSentimentScore] = useState(null);
    const [emotion, setEmotion] = useState('');
    const [emotionScore, setEmotionScore] = useState(null);
    const [recordingStartTime, setRecordingStartTime] = useState(null); 
    const [actualRecordingDuration, setActualRecordingDuration] = useState(0); 
    const [durationSource, setDurationSource] = useState('timer-based');
    const [fillerWords, setFillerWords] = useState(null); 
    const [storagePreference, setStoragePreference] = useState('local'); 
    const [storageUsage, setStorageUsage] = useState(0); 
    const [storagePercentage, setStoragePercentage] = useState(0); 
    const [isLocalStorageAvailable, setIsLocalStorageAvailable] = useState(true); 
    const [currentAudioBlob, setCurrentAudioBlob] = useState(null); 
    const [currentAudioUrl, setCurrentAudioUrl] = useState(''); 
    const [isVoiceDetected, setIsVoiceDetected] = useState(false);
    const [vadThreshold, setVadThreshold] = useState(15); 
    const [silenceThreshold, setSilenceThreshold] = useState(2000); 
    const [enableVAD, setEnableVAD] = useState(true); 
    const [significantSilenceCount, setSignificantSilenceCount] = useState(0);
    const toast = useToast();
    
    // Side menu state
    const { isOpen, onOpen, onClose } = useDisclosure();
    const btnRef = useRef();
    const fileInputRef = useRef();
    const navigate = useNavigate();

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    // VAD refs
    const analyserRef = useRef(null);
    const audioContextRef = useRef(null);
    const vadAnimationRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const voiceActivityTimeRef = useRef(null); 
    const totalSilenceDurationRef = useRef(0); 
    const totalVoiceDurationRef = useRef(0); 
    const silenceStartTimeRef = useRef(null); 
    const significantSilenceRef = useRef(0); 
    const [serverConfidenceScore, setServerConfidenceScore] = useState(null);
    const getDurationInSeconds = () => durationUnit === 'minutes' ? durationValue * 60 : durationValue;

    // Cleanup for MediaRecorder and VAD
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current) {
                if (mediaRecorderRef.current.state === "recording") {
                    mediaRecorderRef.current.stop();
                }
                if (mediaRecorderRef.current.stream) {
                    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                }
            }
            cleanupVAD();
        };
    }, []);
    
    const resetSilenceTimer = () => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        
        // new timer if we're recording and VAD is enabled
        if (isRecording && enableVAD && silenceThreshold > 0) {
            silenceTimerRef.current = setTimeout(() => {
                if (isRecording && mediaRecorderRef.current?.state === 'recording') {
                    console.log("Auto-stopping recording due to silence");
                    handleRecord(); // stops
                    toast({
                        title: "Recording stopped",
                        description: "Extended silence detected",
                        status: "info",
                        duration: 3000,
                        isClosable: true,
                    });
                }
            }, silenceThreshold);
        }
    };
    const detectVoiceActivity = () => {
        if (!analyserRef.current || !enableVAD) return false;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Average volume level calculation
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        const voiceDetected = average > vadThreshold;
        const now = Date.now();
        
        // Track voice activity continuously (updated every detection cycle)
        if (voiceActivityTimeRef.current) {
            const elapsedTime = now - voiceActivityTimeRef.current;

            if (isVoiceDetected) {
                totalVoiceDurationRef.current += elapsedTime;
            } 
            
            else {
                totalSilenceDurationRef.current += elapsedTime;
            }
            
            voiceActivityTimeRef.current = now;
        }
        
        // Track significant silences (>1.5 seconds)
        if (voiceDetected) {
            if (silenceStartTimeRef.current) {
                const silenceDuration = now - silenceStartTimeRef.current;
                
                
                if (silenceDuration > 1500) {
                    significantSilenceRef.current += 1;
                    setSignificantSilenceCount(significantSilenceRef.current);
                }
                silenceStartTimeRef.current = null;
            }
            resetSilenceTimer();
        } else if (!silenceStartTimeRef.current) {
            // We just entered silence
            silenceStartTimeRef.current = now;
        }
        
        // Update the voice detection state if it changed
        if (voiceDetected !== isVoiceDetected) {
            setIsVoiceDetected(voiceDetected);
        }
        
        return voiceDetected;
    };
    
    // Start VAD detection loop
    const startVoiceDetection = () => {
        // Reset tracking variables
        voiceActivityTimeRef.current = Date.now();
        totalSilenceDurationRef.current = 0;
        totalVoiceDurationRef.current = 0;
        silenceStartTimeRef.current = null;
        significantSilenceRef.current = 0;
        setSignificantSilenceCount(0);
        
        const detectLoop = () => {
            detectVoiceActivity();
            vadAnimationRef.current = requestAnimationFrame(detectLoop);
        };
        detectLoop();
    };
    
    const stopVoiceDetection = () => {
        if (voiceActivityTimeRef.current) {
            const now = Date.now();
            const elapsedSinceLastUpdate = now - voiceActivityTimeRef.current;

            if (isVoiceDetected) {
                totalVoiceDurationRef.current += elapsedSinceLastUpdate;
            } 
            
            else {
                totalSilenceDurationRef.current += elapsedSinceLastUpdate;
            }
            
            // Check for any final significant silence
            if (silenceStartTimeRef.current && (now - silenceStartTimeRef.current > 1500)) {
                significantSilenceRef.current += 1;
                setSignificantSilenceCount(significantSilenceRef.current);
            }
        }
        
        if (vadAnimationRef.current) {
            cancelAnimationFrame(vadAnimationRef.current);
            vadAnimationRef.current = null;
        }
        
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        
        if (audioContextRef.current) {
            try {
                audioContextRef.current.close();
            } catch (err) {
                console.warn("Error closing audio context:", err);
            }
            audioContextRef.current = null;
        }
        
        analyserRef.current = null;
        setIsVoiceDetected(false);
    };
    
    const cleanupVAD = () => {
        if (vadAnimationRef.current) {
            cancelAnimationFrame(vadAnimationRef.current);
            vadAnimationRef.current = null;
        }
        
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        if (audioContextRef.current) {
            try {
                audioContextRef.current.close();
            } catch (err) {
                console.warn("Error closing audio context:", err);
            }
            audioContextRef.current = null;
        }
        
        analyserRef.current = null;
        voiceActivityTimeRef.current = null;
        totalSilenceDurationRef.current = 0;
        totalVoiceDurationRef.current = 0;
        silenceStartTimeRef.current = null;
        significantSilenceRef.current = 0; 
        setSignificantSilenceCount(0); 
        
        // Reset state
        setIsVoiceDetected(false);
    };
    
    const getVoiceActivityMetrics = () => {
        if (!voiceActivityTimeRef.current) {
            return {
                voiceDuration: 0,
                silenceDuration: 0,
                totalDuration: 0,
                voicePercentage: 0,
                silencePercentage: 0,
                significantSilenceCount: 0
            };
        }
        
        let finalVoiceDuration = totalVoiceDurationRef.current;
        let finalSilenceDuration = totalSilenceDurationRef.current;
        
        // Contingency in case user will end the recording early
        const now = Date.now();
        const elapsedSinceLastUpdate = now - voiceActivityTimeRef.current;
        
        if (isVoiceDetected) {
            
            finalVoiceDuration += elapsedSinceLastUpdate;
        } 
        else{
            finalSilenceDuration += elapsedSinceLastUpdate;
        }
        
        
        const voiceDuration = finalVoiceDuration / 1000;
        const silenceDuration = finalSilenceDuration / 1000;
        const totalDuration = voiceDuration + silenceDuration;
        
        if (totalDuration <= 0) {
            return {
                voiceDuration: 0,
                silenceDuration: 0,
                totalDuration: 0,
                voicePercentage: 0,
                silencePercentage: 0,
                significantSilenceCount: significantSilenceRef.current || 0
            };
        }
        
        let finalSilenceCount = significantSilenceRef.current;
        if (silenceStartTimeRef.current && (now - silenceStartTimeRef.current > 1500)) {
            finalSilenceCount += 1;
        }
        
        return {
            voiceDuration,
            silenceDuration,
            totalDuration,
            voicePercentage: (voiceDuration / totalDuration) * 100,
            silencePercentage: (silenceDuration / totalDuration) * 100,
            significantSilenceCount: finalSilenceCount
        };
    };
    
    // localStorage Checks
    useEffect(() => {
        const localStorageAvailable = storageUtils.isLocalStorageAvailable();
        setIsLocalStorageAvailable(localStorageAvailable);
        console.log("localStorage available:", localStorageAvailable);
        
        if (!localStorageAvailable) {
            toast({
                title: "Storage Not Available",
                description: "Local storage is not available in your browser. Your recordings won't persist after closing the browser.",
                status: "warning",
                duration: 5000,
                isClosable: true,
            });
            setStoragePreference('none');
            console.log("Setting storage preference to 'none' due to unavailable localStorage");
            return;
        }

        // Load storage preference
        const savedPreference = localStorage.getItem(STORAGE_PREFERENCE_KEY);
        console.log("Loaded storage preference from localStorage:", savedPreference);
        
        if (savedPreference) {
            setStoragePreference(savedPreference);
            console.log("Applied storage preference:", savedPreference);
            
            // State Verification (in console)
            setTimeout(() => {
                console.log("After initialization, storage preference state is:", storagePreference);
            }, 0);
        } else {
            console.log("No saved preference found, using default:", storagePreference);
        }

        // Load recording history if storage preference is local
        if (savedPreference === 'local') {
            const loadedRecordings = storageUtils.loadRecordings();
            if (loadedRecordings.length > 0) {
                setRecordingHistory(loadedRecordings);

                updateStorageStats();
                
                toast({
                    title: "Recordings Loaded",
                    description: `Loaded ${loadedRecordings.length} recordings from local storage.`,
                    status: "info",
                    duration: 3000,
                    isClosable: true,
                });
            }
        }
    }, [toast]);
    
    const updateStorageStats = () => {
        if (storageUtils.isLocalStorageAvailable()) {
            const usage = storageUtils.getStorageUsage();
            const percentage = storageUtils.getStoragePercentage();
            setStorageUsage(usage);
            setStoragePercentage(percentage);
        }
    };

    // Save recording history to localStorage whenever it is changed
    useEffect(() => {
        if (storagePreference === 'local' && recordingHistory.length > 0 && isLocalStorageAvailable) {
            const success = storageUtils.saveRecordings(recordingHistory);
            if (!success) {
                toast({
                    title: "Storage Error",
                    description: "Could not save recordings to local storage. You may be reaching storage limits.",
                    status: "warning",
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }

            updateStorageStats();

            if (storagePercentage > 80) {
                toast({
                    title: "Storage Nearly Full",
                    description: `Your local storage is ${storagePercentage}% full. Consider exporting and clearing some recordings.`,
                    status: "warning",
                    duration: 5000,
                    isClosable: true,
                });
            }
        }
    }, [recordingHistory, storagePreference, isLocalStorageAvailable, storagePercentage, toast]);

    useEffect(() => {
        const durationInSeconds = getDurationInSeconds();
        
        if (!isRecording) {
            setTimer(durationInSeconds);
        }
    }, [durationValue, durationUnit, isRecording]);

    // Storage pref changes
    const handleStoragePreferenceChange = (e) => {
        const newPreference = e.target.value;
        console.log("Changing storage preference to:", newPreference);
        console.log("Previous storage preference was:", storagePreference);
        
        setStoragePreference(newPreference);
        console.log("State should now be updated to:", newPreference);
        
        setTimeout(() => {
            console.log("After state update, storage preference is now:", storagePreference);
        }, 0);
        
        if (!isLocalStorageAvailable && newPreference === 'local') {
            toast({
                title: "Storage Not Available",
                description: "Local storage is not available in your browser. Recordings will only be kept in session.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        
        if (isLocalStorageAvailable) {
            console.log("Saving preference to localStorage:", newPreference);
            localStorage.setItem(STORAGE_PREFERENCE_KEY, newPreference);
            
            const savedValue = localStorage.getItem(STORAGE_PREFERENCE_KEY);
            console.log("Verified localStorage value after save:", savedValue);
            
            if (newPreference === 'none' && localStorage.getItem(RECORDING_HISTORY_KEY)) {
                console.log("Clearing recordings from localStorage");
                storageUtils.clearRecordings();
            }
        }
        
        toast({
            title: "Settings Updated",
            description: `Storage preference set to ${newPreference === 'local' ? 'local storage' : newPreference === 'session' ? 'session only' : 'do not store'}`,
            status: "success",
            duration: 3000,
            isClosable: true,
        });
        
        updateStorageStats();
    };

    const handleClearHistory = () => {
        setRecordingHistory([]);
        
        if (storagePreference === 'local' && isLocalStorageAvailable) {
            storageUtils.clearRecordings();
            updateStorageStats();
        }
        
        toast({
            title: "History Cleared",
            description: "All recording history has been cleared.",
            status: "info",
            duration: 3000,
            isClosable: true,
        });
    };
    
    const handleExportRecordings = () => {
        if (recordingHistory.length === 0) {
            toast({
                title: "No Recordings",
                description: "There are no recordings to export.",
                status: "info",
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        
        const success = storageUtils.exportRecordings(recordingHistory);
        
        if (success) {
            toast({
                title: "Export Successful",
                description: `${recordingHistory.length} recordings exported successfully.`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } else {
            toast({
                title: "Export Failed",
                description: "Failed to export recordings. Please try again.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };
    
    const handleImportRecordings = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (!Array.isArray(importedData)) {
                    throw new Error('Invalid format: Expected an array of recordings');
                }
                
                const processedData = importedData.map(record => ({
                    ...record,
                    timestamp: new Date(record.timestamp)
                }));
                
                const updatedRecordings = [...recordingHistory, ...processedData];
                setRecordingHistory(updatedRecordings);
        
                if (storagePreference === 'local' && isLocalStorageAvailable) {
                    storageUtils.saveRecordings(updatedRecordings);
                    updateStorageStats();
                }
                
                toast({
                    title: "Import Successful",
                    description: `Imported ${processedData.length} recordings successfully.`,
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
                
                event.target.value = null;
                
            } catch (error) {
                console.error('Failed to import recordings:', error);
                toast({
                    title: "Import Failed",
                    description: "The selected file is not a valid recordings export file.",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            }
        };
        
        reader.onerror = () => {
            toast({
                title: "Import Failed",
                description: "Failed to read the selected file.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        };
        
        reader.readAsText(file);
    };

    // Update timer when duration settings change
    useEffect(() => {
        const durationInSeconds = getDurationInSeconds();
        
        if (!isRecording) {
            setTimer(durationInSeconds);
        }
    }, [durationValue, durationUnit, isRecording]);

    useEffect(() => {
        let interval;
        if (isRecording && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else if (isRecording && timer === 0) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                try {
                    mediaRecorderRef.current.stop();
                } catch (error) {
                    console.error("Error stopping MediaRecorder on timer end:", error);
                }
                setIsRecording(false);
                toast({
                    title: "Recording Complete",
                    description: "Maximum recording duration reached.",
                    status: "info",
                    duration: 3000,
                    isClosable: true,
                });
            }
        }
        return () => clearInterval(interval);
    }, [isRecording, timer, toast]);

    // Effect to stop recording when timer reaches zero
    useEffect(() => {
        if (isRecording && timer <= 0) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
                toast({
                    title: "Recording Complete",
                    description: "Maximum recording duration reached.",
                    status: "info",
                    duration: 3000,
                    isClosable: true,
                });
            }
        }
    }, [isRecording, timer, toast]);

    const getAudioDurationWithAudioContext = async (audioBlob) => {
        return new Promise((resolve, reject) => {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const audioContext = new AudioContext();
                
                const fileReader = new FileReader();
                
                fileReader.onload = async (event) => {
                    try {
                        // Audio Decoding
                        const audioBuffer = await audioContext.decodeAudioData(event.target.result);
                        
                        const duration = audioBuffer.duration;
                        resolve(Math.round(duration));
                    } catch (error) {
                        console.error("Error decoding audio data:", error);
                        reject(error);
                    }
                };
                
                fileReader.onerror = (error) => {
                    console.error("FileReader error:", error);
                    reject(error);
                };
                
                fileReader.readAsArrayBuffer(audioBlob);
                
            } catch (error) {
                console.error("Audio context error:", error);
                reject(error);
            }
        });
    };

    const getAudioDurationFromBlob = async (audioBlob) => {
        return new Promise((resolve, reject) => {
            try {
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                
                audio.addEventListener('loadedmetadata', () => {
                    const duration = audio.duration;
                    URL.revokeObjectURL(audioUrl);
                    resolve(Math.round(duration));
                });
                
                audio.addEventListener('error', (err) => {
                    URL.revokeObjectURL(audioUrl);
                    reject(new Error('Error loading audio metadata'));
                });
        
                audio.load();
                
            } catch (error) {
                reject(error);
            }
        });
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDurationChange = (value) => {
        let numValue = parseInt(value) || 1;
        if (durationUnit === 'minutes') {
            numValue = Math.min(Math.max(numValue, 1), 30); 
        } else {
            numValue = Math.min(Math.max(numValue, 5), 1800); 
        }
        
        setDurationValue(numValue);
    };

    const handleDurationUnitChange = (e) => {
        const newUnit = e.target.value;
        setDurationUnit(newUnit);
        
        if (newUnit === 'minutes' && durationValue > 30) {
            setDurationValue(30); 
        } else if (newUnit === 'seconds' && durationValue < 5) {
            setDurationValue(5); 
        }
    };

    // Implementation of the error function
    const erf = (x) => {
        // Constants
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        // Save the sign of x
        const sign = (x < 0) ? -1 : 1;
        x = Math.abs(x);

        // Approximation formula
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    };

    const calculateSpeechPercentile = (wpm) => {
        // Based on research data: average conversational speech is around 120-150 wpm
        // We'll use a normal distribution with mean=135, SD=20
        const mean = 135;
        const stdDev = 20;
        
        const zScore = (wpm - mean) / stdDev;
        
        // Converting z-score to percentile using cumulative distribution function approximation
        // This is an approximation of the CDF of the standard normal distribution
        const percentile = (0.5 * (1 + erf(zScore / Math.sqrt(2)))) * 100;
        
        return Math.round(percentile);
    };

    const generateSpeechRateFeedback = (wpm) => {
        let baseFeedback = "";
        
        if (wpm < 110) {
            baseFeedback = "Your speaking pace is slower than the ideal range. Consider practicing to increase your speed slightly for more engaging speech.";
        } else if (wpm >= 110 && wpm <= 150) {
            baseFeedback = "Your speaking pace is within the ideal range for clear communication and audience engagement.";
        } else if (wpm > 150 && wpm <= 180) {
            baseFeedback = "Your speaking pace is faster than average. For critical information, consider slowing down slightly to ensure understanding.";
        } else {
            baseFeedback = "Your speaking pace is very fast. Consider practicing at a slower pace to improve clarity and audience comprehension.";
        }
        
        const percentile = calculateSpeechPercentile(wpm);
        
        const percentileFeedback = ` Your speech rate is faster than approximately ${percentile}% of average speakers.`;
        
        return baseFeedback + percentileFeedback;
    };

    const calculateSpeechRate = (wordCount, durationInSeconds) => {
        // Ensuring enough seconds have passed for a valid speech rate calculation (at least in console)
        if (durationInSeconds <= 0) {
            console.warn("Invalid duration for speech rate calculation:", durationInSeconds);
            return 0; 
        }
        
        if (wordCount <= 0) {
            console.warn("No words detected for speech rate calculation");
            return 0; 
        }

        if (durationInSeconds < 3) {
            console.warn("Recording too short for accurate speech rate calculation");
            return 0; 
        }

        const durationInMinutes = durationInSeconds / 60;
        
        const wpm = Math.round(wordCount / durationInMinutes);
        console.log(`Speech rate calculation: ${wordCount} words / ${durationInSeconds}s = ${wpm} WPM`);
        return wpm;
    };
    
    // Function to evaluate speech rate quality
    const getSpeechRateQuality = (wpm) => {
        if (wpm < 110) return { quality: "Slow", color: "yellow" };
        if (wpm >= 110 && wpm <= 150) return { quality: "Ideal", color: "green" };
        if (wpm > 150 && wpm <= 180) return { quality: "Fast", color: "blue" };
        return { quality: "Very Fast", color: "red" };
    };

    const analyzeSpeech = (text, recordingDuration, durationSource = 'timer-based', serverConfidenceScore = null) => {
        const words = text.trim().split(/\s+/);
        const sentences = text.split(/[.!?]+/).filter(Boolean);
        const wordsPerMinute = calculateSpeechRate(words.length, recordingDuration);
        const rateQuality = getSpeechRateQuality(wordsPerMinute);
        const rateFeedback = generateSpeechRateFeedback(wordsPerMinute);
        const percentile = calculateSpeechPercentile(wordsPerMinute);       
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        const avgSentenceLength = words.length / sentences.length;
        const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
        const vocabularyRichness = ((uniqueWords / words.length) * 100).toFixed(1);
        const adjustedRichness = Math.min(parseFloat(vocabularyRichness), 100); 
        return {
            speech_rate: `${wordsPerMinute} WPM`, 
            rate_quality: rateQuality.quality, 
            rate_color: rateQuality.color, 
            rate_feedback: rateFeedback, 
            rate_percentile: percentile, 
            avg_word_length: `${avgWordLength.toFixed(1)} characters`,
            avg_sentence_length: `${avgSentenceLength.toFixed(1)} words`,
            vocabulary_richness: `${adjustedRichness.toFixed(1)}%`, 
            total_words: words.length,
            unique_words: uniqueWords,
            recording_duration: `${formatDuration(recordingDuration)}`, 
            duration_seconds: recordingDuration, 
            duration_source: durationSource, 
            confidence_score: serverConfidenceScore,
        };
    };

    const handleRecord = async () => {
        if (!window.MediaRecorder) {
            toast({
                title: "Unsupported Browser",
                description: "Your browser does not support audio recording.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        // Only stops it if it's actually recording and in valid state
        if (isRecording) {
            if (mediaRecorderRef.current.state === 'recording') {
                try {
                    mediaRecorderRef.current.stop();
                } catch (error) {
                    console.error("Error stopping MediaRecorder:", error);
                }
            } else {
                console.warn("MediaRecorder not in recording state when stop requested");
            }
            
            // Reset recording state regardless of MediaRecorder state
            setIsRecording(false);
            // Reset recording start time
            setRecordingStartTime(null);
            
            // Stop voice activity detection
            stopVoiceDetection();
            
            toast({
                title: "Recording Stopped",
                description: "Your recording has been stopped manually.",
                status: "info",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        // Duration validation right before recording starts
        const durationInSeconds = getDurationInSeconds();
            
        if (durationInSeconds < 5) {
            toast({
                title: "Invalid Duration",
                description: "Recording duration must be at least 5 seconds.",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        
        setTimer(durationInSeconds);
        
        // Reset duration state
        setActualRecordingDuration(0);
        setDurationSource('timer-based');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            chunksRef.current = [];
            
            if (enableVAD) {
                try {
                    stopVoiceDetection();
                    
                    // Audio context and analyser
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    audioContextRef.current = new AudioContext();
                    const source = audioContextRef.current.createMediaStreamSource(stream);
                    analyserRef.current = audioContextRef.current.createAnalyser();
                    
                    // Analyser config (ngl, i hate that analyzer and analyser both exist)
                    analyserRef.current.fftSize = 256;
                    analyserRef.current.minDecibels = -90;
                    analyserRef.current.maxDecibels = -10;
                    analyserRef.current.smoothingTimeConstant = 0.85;
                    
                    // Connects source to analyzer but not to destination 
                    source.connect(analyserRef.current);
                    
                    startVoiceDetection();
                    
                    console.log("Voice Activity Detection enabled");
                } catch (vadError) {
                    console.error("Failed to set up Voice Activity Detection:", vadError);
                }
            }
            
            const mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                console.warn(`${mimeType} is not supported, falling back to default`);
            }

            // MediaRecorder with timeslice to get data more frequently
            mediaRecorderRef.current = new MediaRecorder(stream, { 
                mimeType,
                audioBitsPerSecond: 128000 
            });

            setIsRecording(true);
            setRecordingStartTime(Date.now());

            // Data requests every second
            mediaRecorderRef.current.start(1000); 

            mediaRecorderRef.current.ondataavailable = (e) => {
                console.log("Data available at:", new Date().toISOString(), e.data);
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                } else {
                    console.warn("Empty audio chunk received.");
                }
            };

            mediaRecorderRef.current.onstop = async () => {

                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                
                if (audioBlob.size === 0) {
                    toast({
                        title: "Audio Error",
                        description: "The audio file is empty. Please ensure your microphone is working.",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                    });
                    return;
                }
                
                // Store the audio blob 
                setCurrentAudioBlob(audioBlob);
                
                const audioUrl = createAudioUrl(audioBlob);
                setCurrentAudioUrl(audioUrl);
                
                // Calculate recording duration using multiple methods in order of accuracy:
                // 1. AudioContext decoding (most accurate)
                // 2. Audio metadata duration
                // 3. Timestamp-based duration
                // 4. Timer-based duration (least accurate)
                let recordingDuration = 0;
                let durationSource = "timer-based";
                
                try {
                    // First try to get duration using AudioContext (most accurate)
                    recordingDuration = await getAudioDurationWithAudioContext(audioBlob);
                    durationSource = "audio-decoded";
                } catch (error) {
                    console.warn("Couldn't get AudioContext duration:", error);
                    
                    try {
                        // Try to get the audio metadata duration
                        recordingDuration = await getAudioDurationFromBlob(audioBlob);
                        console.log("Audio metadata duration:", recordingDuration);
                        durationSource = "audio-metadata";
                    } catch (error) {
                        console.warn("Couldn't get audio metadata duration:", error);
                        
                        // Fall back to timestamp calculation
                        if (recordingStartTime) {
                            recordingDuration = Math.round((Date.now() - recordingStartTime) / 1000);
                            console.log("Timestamp-based duration:", recordingDuration);
                            durationSource = "timestamp";
                        } else {
                            // Last resort: timer-based calculation
                            const initialDuration = durationUnit === 'minutes' ? durationValue * 60 : durationValue;
                            recordingDuration = initialDuration - timer;
                            console.log("Timer-based duration:", recordingDuration);
                            durationSource = "timer-based";
                        }
                    }
                }
                
                recordingDuration = Math.max(1, recordingDuration);
                
                setActualRecordingDuration(recordingDuration);
                setDurationSource(durationSource);
                
                audioBlob.durationSource = durationSource;
                try {
                    setIsAnalyzing(true);

                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'audio.webm');

                    formData.append('duration', recordingDuration.toString());

                    // Get API URLs from environment variables with fallback values
                    const PRIMARY_API_URL = process.env.REACT_APP_PRIMARY_API_URL ;
                    const FALLBACK_API_URL = process.env.REACT_APP_FALLBACK_API_URL || "http://localhost:5000";
                    
                    console.log('Attempting transcription with primary API (VM)');
                    
                    // Try primary (VM) API first (implemented a 100 second timeout)
                    let response;
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 10); 
                        
                        const queryParams = new URLSearchParams();
                        
                        console.log("Current storage preference before API call:", storagePreference);
                        console.log("localStorage preference value:", localStorage.getItem(STORAGE_PREFERENCE_KEY));
                        
                        queryParams.append('storage', storagePreference);
                        console.log("Sending API request with storage preference:", storagePreference);
                        
                        const apiUrl = `${PRIMARY_API_URL}/transcribe?${queryParams.toString()}`;
                        console.log("API request URL with VM query parameters");
                        
                        response = await fetch(apiUrl, {
                            method: 'POST',
                            body: formData,
                            signal: controller.signal
                        });
                        
                        clearTimeout(timeoutId);
                        
                        if (response.ok) {
                            console.log('Primary API request successful');
                        } else {
                            throw new Error(`Primary API returned status: ${response.status}`);
                        }
                    } catch (e) {
                        // If primary fails, use fallback (local) API
                        console.log('Primary API request failed, trying fallback:', e.message);
                        console.log('Attempting fallback API:', FALLBACK_API_URL);
                        

                        // Add storage preference as query parameter
                        const queryParams = new URLSearchParams();
                        queryParams.append('storage', storagePreference);
                        console.log("Sending fallback API request with storage preference:", storagePreference);
                        
                        const apiUrl = `${FALLBACK_API_URL}/transcribe?${queryParams.toString()}`;
                        console.log("Fallback API request URL:", apiUrl);
                        
                        response = await fetch(apiUrl, {
                            method: 'POST',
                            body: formData,
                        });
                    }

                    if (!response.ok) {
                        throw new Error('Failed to transcribe audio');
                    }

                    const data = await response.json();
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    
                    console.log("API response received:", data);

                    if (data.pitch){
                        setPitchData(data.pitch);
                    }
                    
                    if (data.saved) {
                        console.log("Recording saved on server with ID:", data.recording_id);
                        if (data.audio_id) {
                            console.log("Audio file saved with ID:", data.audio_id);
                        }
                    } else {
                        console.log("Recording was not saved on server");
                    }

                    // Handle pause analysis data
                    

                    let cleanedTranscription = data.transcription;
                    
                    //JSON cleaning logic
                    if (cleanedTranscription.includes('"text"')){
                        try{
                            const matches = [...cleanedTranscription.matchAll(/"text"\s*:\s*"([^"]*)"/g)];
                            if (matches.length > 0){
                                cleanedTranscription = matches.map(m => m[1]).join(' ').trim();
                            }
                        } catch (e) {
                            console.warn("Failed to clean JSON in transcription:", e);
                        }
                    }
                    
                    setTranscription(cleanedTranscription);
                    setServerConfidenceScore(data.confidence_score);

                    const results = analyzeSpeech(
                        cleanedTranscription,
                        recordingDuration,
                        durationSource,
                        data.confidence_score
                    );

                    setAnalysis(results);

                    setSentiment(data.sentiment);
                    setSentimentScore(data.sentiment_score);
                    setEmotion(data.emotion);
                    setEmotionScore(data.emotion_score);
                    
                    if (data.filler_words) {
                        setFillerWords(data.filler_words);
                    }

                    if (data.speech_pauses) {
                        setPauseAnalysis({
                            total: data.speech_pauses?.total || 0,
                            speakingTime: data.speech_pauses?.speaking_time || 0,
                            silenceTime: data.speech_pauses?.silence_time || 0,
                            totalDuration: data.speech_pauses?.total_duration || 0,
                            pauses: data.pauses?.total_pauses|| [],
                            pause_percentage: data.speech_pauses?.pause_percentage || 0,
                            pause_segments: data.pauses?.pause_segments || []
                        });
                    }

                    toast({
                        title: "Transcription and Analysis Complete",
                        description: `Recording duration: ${formatDuration(actualRecordingDuration)}`,
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                    });
                } catch (error) {
                    console.error("Transcription error:", error);
                    toast({
                        title: "Transcription failed",
                        description: error.message || "An error occurred during transcription.",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                    });
                } finally {
                    setIsAnalyzing(false);
                }
            };
            setIsRecording(true);
        } catch (error) {
            console.error("Microphone access error:", error);
            toast({
                title: "Microphone Error",
                description: "Please allow microphone access in your browser settings.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleAnalyze = () => {
        if (!transcription) {
            toast({
                title: "No speech to analyze",
                description: "Please record some speech first",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        cleanupVAD();
        
        setIsAnalyzing(true);
        try {
            let recordingDuration;
            let sourceMeasurement = "timer-based";
            
            if (actualRecordingDuration > 0) {
                recordingDuration = actualRecordingDuration;
                sourceMeasurement = durationSource;
            } else {
                const initialDuration = durationUnit === 'minutes' ? durationValue * 60 : durationValue;
                const timerBasedDuration = initialDuration - timer;
                recordingDuration = timerBasedDuration > 0 ? timerBasedDuration : initialDuration;
                sourceMeasurement = "timer-based";
            }
            
            const results = analyzeSpeech(
                transcription, 
                recordingDuration, 
                sourceMeasurement,
                data.confidence_score
            );

            setAnalysis(results);
            
            const newRecording = { 
                transcription, 
                analysis: results, 
                timestamp: new Date(),
                duration: recordingDuration,
                title: `Recording ${new Date().toLocaleString()}`,
                notes: `Analyzed using ProComm. Duration: ${recordingDuration}s. Emotion: ${emotion}.`
            };
            console.log("Adding new recording:", newRecording);
            console.log("Current recording history:", recordingHistory);
            console.log("Storage preference:", storagePreference);
            console.log("Is local storage available:", isLocalStorageAvailable);
            
            const localRecording = {
                ...newRecording,
                audioBlob: currentAudioBlob,
                audioUrl: createAudioUrl(currentAudioBlob)
            };
            
            const updatedHistory = [...recordingHistory, localRecording];
            setRecordingHistory(updatedHistory);
            
            console.log("New recording history length:", updatedHistory.length);
            
            // Handle persistence based on storage preference
            if (storagePreference === 'local' && isLocalStorageAvailable) {
                console.log("Saving to localStorage since storagePreference is 'local'");
            } else if (storagePreference === 'none') {
                console.log("WARNING: Storage preference is set to 'none', recordings won't persist between sessions");
            } else if (storagePreference === 'Session') {
                console.log("Saving to MongoDB via API");
                try {
                    saveRecording(newRecording);
                } catch (error) {
                    console.error("Failed to save to MongoDB:", error);
                }
            }
            
            toast({
                title: "Analysis complete",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Analysis failed",
                description: "Please try again",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
        setIsAnalyzing(false);
    };

    const bgGradient = "linear-gradient(120deg, #0a1120 0%,rgb(92, 67, 189) 40%, #2563eb 75%, #7c3aed 100%)";
    const cardBg = "rgba(30, 41, 59, 0.8)";
    const accentColor = "#38bdf8"; 
    const textColor = "#f8fafc";
    const highlightColor = "#7dd3fc";
    const secondaryAccent = "#4ade80"; 
    const tertiaryAccent = "#c084fc"; 
    const headingSize = useBreakpointValue({ base: "xl", md: "2xl" });
    const [activeTab, setActiveTab] = useState("main");
    
    const handleSidebarHomeClick = () => {
        navigate('/');
    };

    const fetchBackendRecordings = useCallback(async () => {
        try {
            if (storagePreference !== 'local') {
                const res = await fetch('/api/recordings', {
                    headers: {
                        'Accept': 'application/json',
                    },
                });
                if (!res.ok) throw new Error('Failed to fetch recordings');
                const data = await res.json();
                console.log('Fetched recordings from API:', data);
                return data.recordings || [];
            } else {
                console.log('Using local storage, skipping API fetch');
                return null;
            }
        } catch (error) {
            console.error('Error fetching backend recordings:', error);
            return null;
        }
    }, [storagePreference]);
    
    const saveRecording = async (recordingData) => {
        try {
            console.log("In saveRecording function, current storagePreference:", storagePreference);
            console.log("localStorage preference:", localStorage.getItem(STORAGE_PREFERENCE_KEY));
    
            // Only save to API if not using local storage
            if (storagePreference !== 'local') {
                console.log("Saving to API because storagePreference is not 'local':", storagePreference);
    
                const res = await fetch('/api/recordings', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(recordingData),
                });
    
                if (!res.ok) throw new Error('Failed to save recording');
                const result = await res.json();
                console.log('Saved recording to API:', result);
                return result;
            } else if (storagePreference === 'local') {
                console.log('Using local storage only, skipping API save');
                const storedRecordings = storageUtils.loadRecordings();
                console.log('Current stored recordings count:', storedRecordings.length);
            }
            return null;
        } catch (error) {
            console.error('Error saving recording:', error);
            return null;
        }
    };

    // Use fetchBackendRecordings for backend recording fetches
    useEffect(() => {
        const loadBackendRecordings = async () => {
            if (storagePreference !== 'local') {
                const backendRecordings = await fetchBackendRecordings();
                if (backendRecordings) {
                    const processed = backendRecordings.map(r => ({
                        ...r,
                        timestamp: r.timestamp ? new Date(r.timestamp) : new Date(),
                        audioUrl: r.audio_url || '',
                        audioBlob: null,
                    }));
                    setRecordingHistory(processed);
                }
            }
        };
        loadBackendRecordings();
    }, [storagePreference, fetchBackendRecordings]);

    
    return (
        <Flex 
            direction={{ base: 'column', md: 'row' }} 
            height="100vh" 
            overflow="hidden"
            bg="black"
        >
            {/* Mobile Menu Button */}
            <Box 
                display={{ base: "block", md: "none" }} 
                position="fixed"
                top="20px"
                left="20px"
                zIndex="1000"
            >
                <IconButton
                    ref={btnRef}
                    icon={<FaBars />}
                    onClick={onOpen}
                    variant="outline"
                    colorScheme="blue"
                    borderColor="rgba(255, 255, 255, 0.3)"
                    _hover={{
                        bg: 'rgba(255, 255, 255, 0.1)'
                    }}
                    color="white"
                    aria-label="Open menu"
                />
            </Box>
            
            {/* Side Navigation for Desktop */}
            <Box 
                width={{ base: "full", md: "250px" }} 
                borderRight="1px solid rgba(56, 189, 248, 0.15)"
                p={4}
                display={{ base: "none", md: "block" }}
                overflowY="auto"
                boxShadow="2px 0 16px 0 rgba(30,41,59,0.15)"
                bg="#080116ff"
            >
                <VStack spacing={8} align="stretch" height="full">
                    <Box py={4}>
                        <Heading 
                            size="xl" 
                            textAlign="center" 
                            color="#fc6900ff"
                            textShadow={`
                                0 0 8px #fc6900ff,
                                0 0 1px #fc6900ff,
                                0 0 32px #fc690010                            
                            `}
                        >
                            ProComm 
                        </Heading>
                    </Box>
                    
                    <VStack spacing={2} align="stretch">
                        <Button
                            variant={activeTab === "main" ? "solid" : "ghost"}
                            bg={activeTab === "main" ? "#fc6900ff" : "transparent"}
                            justifyContent="flex-start"
                            leftIcon={<Icon as={FaMicrophone} color={activeTab === "main" ? undefined : "white"} />}
                            onClick={() => setActiveTab("main")}
                            borderRadius="md"
                            py={6}
                            _hover={{ bg: 'rgba(111, 56, 6, 1)' }}
                            color="white"
                        >
                            Speech Analyzer
                        </Button>
                        
                        <Button
                            variant={activeTab === "recordings" ? "solid" : "ghost"}
                            bg={activeTab === "recordings" ? "#fc6900ff" : "transparent"}
                            justifyContent="flex-start"
                            leftIcon={<Icon as={FaHistory} color={activeTab === "recordings" ? undefined : "white"} />}
                            onClick={() => setActiveTab("recordings")}
                            borderRadius="md"
                            py={6}
                            _hover={{ bg: 'rgba(111, 56, 6, 1)' }}
                            color="white"
                        >
                            Recordings
                        </Button>
                        
                        <Button
                            variant={activeTab === "about" ? "solid" : "ghost"}
                            bg={activeTab === "about" ? "#fc6900ff" : "transparent"}
                            justifyContent="flex-start"
                            leftIcon={<Icon as={FaInfoCircle} color={activeTab === "about" ? undefined : "white"} />}
                            onClick={() => setActiveTab("about")}
                            borderRadius="md"
                            py={6}
                            _hover={{ bg: 'rgba(111, 56, 6, 1)' }}
                            color="white"
                        >
                            About
                        </Button>
                        
                        <Button
                            variant={activeTab === "settings" ? "solid" : "ghost"}
                            bg={activeTab === "settings" ? "#fc6900ff" : "transparent"}
                            justifyContent="flex-start"
                            leftIcon={<Icon as={FaCog} color={activeTab === "settings" ? undefined : "white"} />}
                            onClick={() => setActiveTab("settings")}
                            borderRadius="md"
                            py={6}
                            _hover={{ bg: 'rgba(111, 56, 6, 1)' }}
                            color="white"
                        >
                            Settings
                        </Button>
                        
                        <Button
                            variant={activeTab === "profile" ? "solid" : "ghost"}
                            bg={activeTab === "profile" ? "#fc6900ff" : "transparent"}
                            justifyContent="flex-start"
                            leftIcon={<Icon as={FaUser} color={activeTab === "profile" ? undefined : "white"} />}
                            onClick={() => setActiveTab("profile")}
                            borderRadius="md"
                            py={6}
                            _hover={{ bg: 'rgba(111, 56, 6, 1)' }}
                            color="white"
                        >
                            Profile
                        </Button>
                    </VStack>
                    
                    <Box flex="1" />
                    
                    <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Icon as={FaHome} color="white" />}
                        borderColor="rgba(255, 255, 255, 0.2)"
                        color ="white"
                        _hover={{
                            bg: 'rgba(255, 255, 255, 0.1)'
                        }}
                        onClick={handleSidebarHomeClick}
                    >
                        Back to Home
                    </Button>
                </VStack>
            </Box>
            
            {/* Mobile Drawer for Small Screens */}
            <Drawer
                isOpen={isOpen}
                placement="left"
                onClose={onClose}
                finalFocusRef={btnRef}
                size="md"
                display={{ base: "block", md: "none" }}
            >
                <DrawerOverlay />
                <DrawerContent bg="#0f172a">
                    <DrawerCloseButton color={textColor} />
                    <DrawerHeader borderBottomWidth="1px" color={highlightColor}>
                        ProComm Menu
                    </DrawerHeader>

                    <DrawerBody p={4}>
                        <VStack spacing={4} align="stretch">
                            <Button
                                variant={activeTab === "main" ? "solid" : "ghost"}
                                colorScheme={activeTab === "main" ? "blue" : "gray"}
                                justifyContent="flex-start"
                                leftIcon={<Icon as={FaMicrophone} color={activeTab === "main" ? undefined : "white"} />}
                                onClick={() => {
                                    setActiveTab("main");
                                    onClose();
                                }}
                                borderRadius="md"
                                py={6}
                                color="white"
                            >
                                Speech Analyzer
                            </Button>
                            
                            <Button
                                variant={activeTab === "recordings" ? "solid" : "ghost"}
                                colorScheme={activeTab === "recordings" ? "blue" : "gray"}
                                justifyContent="flex-start"
                                leftIcon={<Icon as={FaHistory} color={activeTab === "recordings" ? undefined : "white"} />}
                                onClick={() => {
                                    setActiveTab("recordings");
                                    onClose();
                                }}
                                borderRadius="md"
                                py={6}
                                color="white"
                            >
                                Recordings
                            </Button>
                            
                            <Button
                                variant={activeTab === "about" ? "solid" : "ghost"}
                                colorScheme={activeTab === "about" ? "blue" : "gray"}
                                justifyContent="flex-start"
                                leftIcon={<Icon as={FaInfoCircle} color={activeTab === "about" ? undefined : "white"} />}
                                onClick={() => {
                                    setActiveTab("about");
                                    onClose();
                                }}
                                borderRadius="md"
                                py={6}
                                color="white"
                            >
                                About
                            </Button>
                            
                            <Button
                                variant={activeTab === "settings" ? "solid" : "ghost"}
                                colorScheme={activeTab === "settings" ? "blue" : "gray"}
                                justifyContent="flex-start"
                                leftIcon={<Icon as={FaCog} color={activeTab === "settings" ? undefined : "white"} />}
                                onClick={() => {
                                    setActiveTab("settings");
                                    onClose();
                                }}
                                borderRadius="md"
                                py={6}
                                color="white"
                            >
                                Settings
                            </Button>
                            
                            <Button
                                variant={activeTab === "profile" ? "solid" : "ghost"}
                                colorScheme={activeTab === "profile" ? "blue" : "gray"}
                                justifyContent="flex-start"
                                leftIcon={<Icon as={FaUser} color={activeTab === "profile" ? undefined : "white"} />}
                                onClick={() => {
                                    setActiveTab("profile");
                                    onClose();
                                }}
                                borderRadius="md"
                                py={6}
                                color="white"
                            >
                                Profile
                            </Button>
                        </VStack>
                    </DrawerBody>

                    <DrawerFooter borderTopWidth="1px">
                        <Button 
                            variant="outline" 
                            colorScheme="blue"
                            borderColor="rgba(255, 255, 255, 0.2)"
                            color="white"
                            onClick={onClose}
                            _hover={{
                                bg: 'rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            Close
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
            
            {/* Main Content Area */}
            <Box 
                flex="1" 
                overflow="auto"
                position="relative"
                height="100%"
                bg="#091018ff"
                
            >
                {activeTab === "main" ? (
                <Container maxW="container.xl" pt={{ base: 16, md: 6 }} height="100%">
                    <VStack spacing={2} align="center">
                    <Box textAlign="center" mb={4}>                        
                        <Heading 
                            size="3xl"
                            lineHeight="1.3"
                            color="#fc6900ff"
                            textShadow={`
                                0 0 8px #fc6900ff,
                                0 0 1px #fc6900ff,
                                0 0 32px #fc690010
                                `}
                            fontWeight="extrabold"
                            letterSpacing="wide"
                            mb={3}
                        >
                            Speech Analyzer
                        </Heading>
                        <Text 
                            fontSize={{ base: "lg", md: "xl" }} 
                            fontWeight="bold"
                            color={textColor} 
                            maxW="800px"
                        >
                            Enhance your speaking skills with real-time analysis, simply record your voice
                            and get instant feedback on your speech patterns.
                        </Text>
                        <Text fontSize="md" color={`${textColor}80`} mt={2} maxW="800px" mx="1">
                            Speech rate is calculated using true recording time for accuracy.
                        </Text>
                      
                    </Box>                    
                    <Box 
                        p={8}
                        borderRadius="20" 
                        bgGradient="linear-gradient(135deg, #16222fff 60%, #2d241bff 100%)"
                        backdropFilter="blur(10px)"
                        height="100%"
                        width="100%"
                        maxW="1000px"
                        minH="400px"
                        border="1px solid rgba(56, 189, 248, 0.15)"
                        boxShadow="0px 4px 20px rgba(0, 0, 0, 0.1)"
                        transition="all 0.3s ease"
                        _hover={{
                            boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.2)",
                            transform: "translateY(-2px)"
                        }}
                        position="relative"
                        overflow="hidden"
                    >
                        <VStack spacing={6}>
                            {/* Duration Selection */}
                            <HStack width="100%" spacing={4} alignItems="flex-end" justifyContent="space-between">
                                <FormControl w="60%">                                    
                                    <FormLabel color={textColor}>
                                        <HStack>
                                            <Icon as={FaClock} color="#fc6900ff" />
                                            <Text>Recording Duration</Text>
                                        </HStack>
                                    </FormLabel>
                                    <HStack>
                                        <NumberInput 
                                            min={durationUnit === 'minutes' ? 1 : 5} 
                                            max={durationUnit === 'minutes' ? 30 : 1800} 
                                            step={durationUnit === 'minutes' ? 1 : 5} 
                                            value={durationValue}
                                            onChange={handleDurationChange}
                                            isDisabled={isRecording}
                                            w="120px"
                                            bg="rgba(0,0,0,0.2)"
                                            borderColor="rgba(255,255,255,0.1)"
                                        >                                            <NumberInputField textColor={textColor} />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper borderColor="rgba(255,255,255,0.1)" color={textColor} />
                                                <NumberDecrementStepper borderColor="rgba(255,255,255,0.1)" color={textColor} />
                                            </NumberInputStepper>
                                        </NumberInput>                                        
                                        <Select 
                                            fontWeight="bold"
                                            value={durationUnit} 
                                            onChange={handleDurationUnitChange}
                                            w="120px"
                                            isDisabled={isRecording}
                                            bg="rgba(0,0,0,0.2)"
                                            borderColor="rgba(255,255,255,0.1)"
                                            textColor={textColor}
                                        >
                                            <option 
                                                value="seconds" 
                                                style = {{color: "#fc6900ff", background: "#091018ff", fontWeight:"bold"}}
                                            >
                                                Seconds
                                            </option>
                                            <option 
                                                value="minutes" 
                                                style = {{color: "#fc6900ff", background: "#091018ff", fontWeight:"bold" }}
                                            >
                                                Minutes
                                            </option>
                                        </Select>
                                    </HStack>
                                    <Text fontSize="xs" color="#999" mt={1}>
                                        Total: {durationUnit === 'minutes' ? durationValue * 60 : durationValue} seconds
                                    </Text>
                                </FormControl>
                                
                                <HStack spacing={4}>                                    
                                    <Button
                                        size="lg"
                                        bg="#fc6900ff"
                                        color="white"
                                        onClick={handleRecord}
                                        leftIcon={<FaMicrophone />}
                                        minWidth="200px"
                                        h="60px"
                                        fontSize="lg"
                                        boxShadow="0 4px 10px rgba(0, 0, 0, 0.3)"
                                        _hover={{
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 6px 15px rgba(56, 189, 248, 0.4)',
                                            bg: isRecording ? "red.600" : highlightColor
                                        }}
                                        isDisabled={isAnalyzing}
                                    >
                                        {isRecording ? `Stop (${formatDuration(timer)})` : "Start Recording"}
                                    </Button>
                                    
                                    {/*  Analyze Speech button  */}
                                        <Button
                                            onClick={handleAnalyze}
                                            isDisabled={!transcription}
                                            isLoading={isAnalyzing}
                                            bg={secondaryAccent}
                                            color="white"
                                            size="lg"
                                            leftIcon={<FaChartLine />}
                                            minWidth="200px"
                                            h="60px"
                                            fontSize="lg"
                                            boxShadow="0 4px 10px rgba(0, 0, 0, 0.3)"
                                            _hover={{
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 6px 15px rgba(74, 222, 128, 0.4)',
                                                bg: "green.400"
                                            }}
                                        >
                                            Analyze Speech
                                        </Button>
                                </HStack>
                            </HStack>

                            {isRecording && (
                                <VStack width="100%" spacing={1}>
                                    <Progress
                                        size="sm"
                                        width="100%"
                                        value={(1 - (timer / (durationUnit === 'minutes' ? durationValue * 60 : durationValue))) * 100}
                                        colorScheme="blue"
                                        bg="rgba(0,0,0,0.2)"
                                        borderRadius="full"
                                    />
                                    <HStack width="100%" justifyContent="space-between">
                                        <Text fontSize="sm" color="#e0e0e0">
                                            {formatDuration(timer)}
                                        </Text>
                                        <Text fontSize="sm" color="#e0e0e0">
                                            {Math.round((1 - (timer / (durationUnit === 'minutes' ? durationValue * 60 : durationValue))) * 100)}% complete
                                        </Text>
                                    </HStack>
                                </VStack>
                            )}                            
                            <Box 
                                p={6} 
                                bg="rgba(0,0,0,0.3)" 
                                display="flex"
                                flexDirection="column"
                                borderRadius="lg" 
                                width="100%"
                                minHeight="200px"
                                border="1px solid rgba(255,255,255,0.05)"
                                position="relative"
                                overflow="auto"
                                sx={{
                                    '&::-webkit-scrollbar': {
                                        width: '8px',
                                        background: 'rgba(0, 0, 0, 0.1)',
                                        borderRadius: '4px',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        background: `rgba(56, 189, 248, 0.5)`,
                                        borderRadius: '4px',
                                    },
                                }}
                            >
                                <Box flex="1">
                                    <Text lineHeight="1.8" color={textColor} mb={4}>
                                        {transcription || "Your transcription will appear here..."}
                                    </Text>
                                </Box>
                                
                                {currentAudioUrl && (
                                    <Box mt={4} pt={4} borderTop="1px solid rgba(255,255,255,0.1)">
                                        <HStack spacing={4} alignItems="center">
                                            <Heading size="xs" color={highlightColor}>
                                                <Icon as={FaMicrophone} mr={2} />
                                                Your Recording
                                            </Heading>
                                            
                                            <Box flex="1">
                                                <audio 
                                                    src={currentAudioUrl} 
                                                    controls 
                                                    style={{ 
                                                        width: '100%', 
                                                        height: '36px', 
                                                        filter: 'invert(0.8) hue-rotate(180deg)' 
                                                    }} 
                                                />
                                            </Box>
                                            <Button
                                                size="sm"
                                                leftIcon={<Icon as={FaDownload} />}
                                                colorScheme="blue"
                                                variant="ghost"
                                                onClick={() => downloadAudioAsMp3(
                                                    currentAudioBlob, 
                                                    `procomm-recording-${new Date().toISOString().slice(0,10)}.mp3`
                                                )}
                                            >
                                                Download
                                            </Button>
                                        </HStack>
                                    </Box>
                                )}
                                
                                {/* Decorative element */}
                                <Box
                                    position="absolute"
                                    bottom="15px"
                                    right="15px"
                                    width="40px"
                                    height="40px"
                                    opacity="0.2"
                                    bgGradient={`radial-gradient(circle, ${accentColor} 0%, transparent 70%)`}
                                    zIndex="0"
                                />
                            </Box>
                        </VStack>
                    </Box>

                    {analysis && (
                        <>  
                            <Box
                                bg={cardBg}
                                p={4}
                                width="800px"
                                borderRadius ="lg"
                                border="1px solid rgba(255, 255, 255, 0.1)"
                                boxShadow="0 8px 16px -2px rgba(0, 0, 0, 0.2)"
                                transition="all 0.3s ease"
                                _hover= {{
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 12px 20px -2px rgba(0, 0, 0, 0.3)"
                                }}
                                position="relative"
                                overflow="hidden"
                                mt={4}
                                
                            >
                                <Heading
                                    size = "md"
                                    color = {accentColor}
                                    mb = {3}
                                >
                                    Volume n Pauses!
                                </Heading>
                                <AudioWaveform 
                                    key={currentAudioUrl || "no-audio"}
                                    audioBlob={currentAudioBlob}
                                    pauseAnalysis={pauseAnalysis}
                                    height={120}
                                    waveColor={highlightColor}
                                    progressColor="#fc6900ff"
                                    pauseColor="rgba(252, 105, 0, 0.3)"
                                />
                            </Box>

                            {pitchData && (
                                <Box
                                    bg={cardBg}
                                    p={4}
                                    width="800px"
                                    borderRadius="lg"
                                    border="1px solid rgba(255, 255, 255, 0.1)"
                                    boxShadow="0 8px 16px -2px rgba(0, 0, 0, 0.2)"
                                    transition="all 0.3s ease"
                                    _hover={{
                                        transform: "translateY(-2px)",
                                        boxShadow: "0 12px 20px -2px rgba(0, 0, 0, 0.3)"
                                    }}
                                    position="relative"
                                    overflow="hidden"
                                    mt={4}
                                    mb={4}
                                >
                                    <Heading
                                        size="lg" 
                                        color={accentColor}
                                        mb={2}
                                    >
                                        Pitch Analysis
                                    </Heading>
                                    <Text
                                        color={textColor}
                                        fontSize="18px"
                                        mb={2}
                                    >
                                        {(() => {
                                            if (pitchData){
                                                console.log("Pitch Analysis Debug:",
                                                "mean_pitch:", pitchData.mean_pitch,
                                                "std_pitch:", pitchData.std_pitch,
                                                "expressiveness:", pitchData.expressiveness
                                                );
                                            }
                                            if (pitchData.mean_pitch < 50){
                                                return "Try recording in a peaceful environment"
                                            }
                                            
                                            if(pitchData.expressiveness <= 0.03){
                                                return "Too monotonous! Implement more voice variation in your speech to make it more expressive.";
                                            }
                                            else if (pitchData.expressiveness > 0.08){
                                                return "Alright you're trying too hard with your voice variation, relax and find a natural flow.";
                                            }
                                            else {
                                                return "Pitch is well-balanced, keep up the good work!";
                                            }
                                        })()}
                                    </Text>
                                </Box>
                            )}

                            {/* im gonna update the speech rate analysis here :3 */}
                            <Box
                                width="100%"
                                maxW="800px"
                                mt={4}
                                p={6}
                                bg={cardBg}
                                borderRadius="xl"
                                border="1px solid rgba(255, 255, 255, 0.1)"
                                boxShadow= "0 15px 25px -5px rgba(0, 0, 0, 0.2)"
                                backdropFilter="blur(16px)"
                                transition="all 0.3s ease"
                                _hover={{
                                    boxShadow: "0 20px 30px -5px rgba(37, 99, 235, 0.25)"
                                }}
                                position="relative"
                                overflow="hidden"
                            >
                                <Heading
                                    size="lg"
                                    color="accentColor" 
                                    mb={1}
                                >
                                    How fast are you?
                                </Heading>
                                <Text
                                    color={accentColor}
                                    fontSize="xl"
                                    fontWeight="bold"
                                    mb={2}
                                >
                                    {Math.round(analysis.raw_rate)}
                                </Text>
                                <Text
                                    color={textColor}
                                    fontSize="lg"
                                    mb={2}
                                >
                                    {(() => {
                                        const wpm = Math.round(analysis.raw_rate);
                                        if (wpm === 0){
                                            return "I don't think I can hear you, there might be an issue with your microphone"
                                        }
                                        if (wpm < 110){
                                            return "Hurry up! The world's spinning and life goes on. You have to talk a bit faster if you want to keep up!"
                                        }
                                        else if (wpm >=110 && wpm <= 150){
                                            return "Your speech pacing is solid and clear, word of warning: speaking like this could end up making people engage more with you ;)"
                                        }
                                        else if (wpm > 150 && wpm <= 180){
                                            return "Hey do you've a flight to catch? You seem to be rushing your speech way beyond the ideal pacing. Let's slow down a bit for the next one yeah?"
                                        }
                                        else{
                                            return "Enthusiasm 100, pacing 1000, engagement well... keep the enthusiasm but try to speak slower this time yeah? Amazing energy though"
                                        }
                                    })()}
                                </Text>
                            </Box>

                            <SimpleGrid 
                                columns={{ base: 1, md: 2, lg:  3 }} 
                                spacing={6} 
                                width="100%"
                                maxW="800px"
                            >
                                <Stat
                                    bg={cardBg}
                                    p={4}
                                    borderRadius="lg"
                                    border="1px solid rgba(255,255,255,0.1)"
                                    boxShadow="0 8px 16px -2px rgba(0, 0, 0, 0.2)"
                                    transition="all 0.3s ease"
                                    _hover={{
                                        transform: "translateY(-2px)",
                                        boxShadow: "0 12px 20px -2px rgba(0, 0, 0, 0.3)"
                                    }}
                                    position="relative"
                                    overflow="hidden"
                                >
                                    <StatLabel>Speech Rate</StatLabel>
                                    <StatNumber color={accentColor}>{analysis.speech_rate}</StatNumber>
                                    <StatHelpText display="flex" alignItems="center" justifyContent="space-between">
                                        <Badge colorScheme={analysis.rate_color || "blue"}>{analysis.rate_quality}</Badge>
                                        <Text fontSize="xs">
                                            Percentile: {analysis.rate_percentile}%
                                        </Text>
                                    </StatHelpText>
                                </Stat>
                                
                                {pauseAnalysis && (
                                    <Stat
                                        bg={cardBg}
                                        p={4}
                                        borderRadius="lg"
                                        border="1px solid rgba(255,255,255,0.1)"
                                        boxShadow="0 8px 16px -2px rgba(0, 0, 0, 0.2)"
                                        transition="all 0.3s ease"
                                        _hover={{
                                            transform: "translateY(-2px)",
                                            boxShadow: "0 12px 20px -2px rgba(0, 0, 0, 0.3)"
                                        }}
                                        position="relative"
                                        overflow="hidden"
                                    >
                                        <StatLabel>Speech Pauses</StatLabel>
                                        <StatNumber color={tertiaryAccent}>
                                            {pauseAnalysis.total || 0}
                                        </StatNumber>
                                        <StatHelpText display="flex" alignItems="center" justifyContent="space-between">
                                            <Badge colorScheme="purple">Total Pauses</Badge>
                                            <Tooltip label="Total number of pauses detected in your speech">
                                                <Icon as={FaInfoCircle} boxSize="0.7em" />
                                            </Tooltip>
                                        </StatHelpText>
                                        <Text mt={2} fontSize="sm">
                                            {pauseAnalysis.total > 8 ?
                                                "Your speech contains many pauses." :
                                                pauseAnalysis.total > 3 ?
                                                "Your speech has a moderate number of pauses." :
                                                "Your speech has very few pauses."
                                            }
                                        </Text>
                                        <Flex justify="space-between" mt={2} alignItems="center">
                                            <Text fontSize="xs" color={`${textColor}80`}>
                                                {Math.round(pauseAnalysis.speakingTime) || 0}s speaking
                                            </Text>
                                            <Text fontSize="xs" color={`${textColor}80`}>
                                                {Math.round(pauseAnalysis.silenceTime) || 0}s silent
                                            </Text>
                                        </Flex>
                                    </Stat>
                                )}                                
                                <Stat
                                    bg={cardBg}
                                    p={4}
                                    borderRadius="lg"
                                    border="1px solid rgba(255,255,255,0.1)"
                                    boxShadow="0 8px 16px -2px rgba(0, 0, 0, 0.2)"
                                    transition="all 0.3s ease"
                                    _hover={{
                                        transform: "translateY(-2px)",
                                        boxShadow: "0 12px 20px -2px rgba(0, 0, 0, 0.3)"
                                    }}
                                    position="relative"
                                    overflow="hidden"
                                >
                                    <StatLabel>Recording Duration</StatLabel>
                                    <StatNumber color={accentColor}>{analysis.recording_duration}</StatNumber>
                                    <StatHelpText display="flex" alignItems="center" justifyContent="space-between">
                                        <Icon as={FaInfoCircle} mr={2} />
                                        <Badge size="sm" colorScheme="purple">{analysis.duration_source}</Badge>
                                    </StatHelpText>
                                </Stat>                                
                                <Stat
                                    bg={cardBg}
                                    p={4}
                                    borderRadius="lg"
                                    border="1px solid rgba(255,255,255,0.1)"
                                    boxShadow="0 8px 16px -2px rgba(0, 0, 0, 0.2)"
                                    transition="all 0.3s ease"
                                    _hover={{
                                        transform: "translateY(-2px)",
                                        boxShadow: "0 12px 20px -2px rgba(0, 0, 0, 0.3)"
                                    }}
                                    position="relative"
                                    overflow="hidden"
                                >
                                    <StatLabel>Vocabulary Richness</StatLabel>
                                    <StatNumber color={accentColor}>{analysis.vocabulary_richness}</StatNumber>
                                    <StatHelpText>
                                        <Icon as={FaInfoCircle} mr={2} />
                                        Higher is better
                                    </StatHelpText>
                                </Stat>                                
                                <Stat
                                    bg={cardBg}
                                    p={4}
                                    borderRadius="lg"
                                    border="1px solid rgba(255,255,255,0.1)"
                                    boxShadow="0 8px 16px -2px rgba(0, 0, 0, 0.2)"
                                    transition="all 0.3s ease"
                                    _hover={{
                                        transform: "translateY(-2px)",
                                        boxShadow: "0 12px 20px -2px rgba(0, 0, 0, 0.3)"
                                    }}
                                    position="relative"
                                    overflow="hidden"
                                >
                                    <StatLabel>Word Count</StatLabel>
                                    <StatNumber color={accentColor}>{analysis.total_words} words</StatNumber>
                                    <StatHelpText>
                                        <Icon as={FaInfoCircle} mr={2} />
                                        Total spoken words
                                    </StatHelpText>
                                </Stat>                                
                                <Stat
                                    bg={cardBg}
                                    p={4}
                                    borderRadius="lg"
                                    border="1px solid rgba(255,255,255,0.1)"
                                    boxShadow="0 8px 16px -2px rgba(0, 0, 0, 0.2)"
                                    transition="all 0.3s ease"
                                    _hover={{
                                        transform: "translateY(-2px)",
                                        boxShadow: "0 12px 20px -2px rgba(0, 0, 0, 0.3)"
                                    }}
                                    position="relative"
                                    overflow="hidden"
                                >
                                    <StatLabel>Confidence Score</StatLabel>
                                    <StatNumber color={accentColor}>{analysis.confidence_score}%</StatNumber>
                                    <StatHelpText>
                                        <Icon as={FaInfoCircle} mr={2} />
                                        Speech clarity
                                    </StatHelpText>
                                </Stat>                                
                                {emotion && (
                                    <Stat
                                        bg={cardBg}
                                        p={4}
                                        borderRadius="lg"
                                        border="1px solid rgba(255,255,255,0.1)"
                                        boxShadow="0 8px 16px -2px rgba(0, 0, 0, 0.2)"
                                        transition="all 0.3s ease"
                                        _hover={{
                                            transform: "translateY(-2px)",
                                            boxShadow: "0 12px 20px -2px rgba(0, 0, 0, 0.3)"
                                        }}
                                        position="relative"
                                        overflow="hidden"
                                    >
                                        <StatLabel>Emotion</StatLabel>
                                        <StatNumber color={accentColor}>{emotion}</StatNumber>
                                        <StatHelpText>
                                            <Icon as={FaInfoCircle} mr={2} />
                                            Score: {(emotionScore * 100).toFixed(2)}%
                                        </StatHelpText>
                                    </Stat>
                                )}
                                  {fillerWords && (
                                    <Stat
                                        bg={cardBg}
                                        p={4}
                                        borderRadius="lg"
                                        border="1px solid rgba(255,255,255,0.1)"
                                        boxShadow="0 8px 16px -2px rgba(0, 0, 0, 0.2)"
                                        transition="all 0.3s ease"
                                        _hover={{
                                            transform: "translateY(-2px)",
                                            boxShadow: "0 12px 20px -2px rgba(0, 0, 0, 0.3)"
                                        }}
                                        position="relative"
                                        overflow="hidden"
                                    >
                                        <StatLabel>Filler Words</StatLabel>
                                        <StatNumber color={accentColor}>{fillerWords.total_count}</StatNumber>
                                        <StatHelpText>
                                            <Icon as={FaInfoCircle} mr={2} />
                                            {fillerWords.frequency_per_minute.toFixed(1)} per minute
                                        </StatHelpText>
                                    </Stat>
                                )}
                            </SimpleGrid>

                            {/* Pitch Analysis*/}
                            
                                                        
                            
                            {/* Filler Word Analysis */}
                            {fillerWords && fillerWords.total_count > 0 && (
                                <Box 
                                    width="100%" 
                                    maxW="800px"
                                    mt={8}
                                    p={6}
                                    bg={cardBg}
                                    borderRadius="xl"
                                    border="1px solid rgba(255,255,255,0.1)"
                                    boxShadow="0 15px 25px -5px rgba(0, 0, 0, 0.2)"
                                    backdropFilter="blur(16px)"
                                    transition="all 0.3s ease"
                                    _hover={{
                                        boxShadow: "0 20px 30px -5px rgba(0, 0, 0, 0.3)",
                                        transform: "translateY(-2px)"
                                    }}
                                    position="relative"
                                    overflow="hidden"
                                >
                                    {/* Background accent */}
                                    <Box 
                                        position="absolute" 
                                        top="0" 
                                        right="0" 
                                        width="200px" 
                                        height="200px" 
                                        opacity="0.1" 
                                        bgGradient={`radial-gradient(circle, ${tertiaryAccent} 0%, transparent 70%)`}
                                        zIndex="0"
                                    />
                                
                                    <HStack alignItems="center" mb={3}>
                                        <Icon as={FaInfoCircle} color={accentColor} boxSize={5} />
                                        <Text fontWeight="bold" color={textColor}>Filler Word Analysis</Text>                                        <Tooltip 
                                            hasArrow
                                            label="Filler words are sounds, words, or phrases that don't add meaning to your speech but fill pauses. Common examples include 'um', 'uh', 'like', and 'you know'."
                                            bg="gray.700"
                                            color="white"
                                            placement="top"
                                            p={3}
                                        >
                                            <Icon as={FaQuestionCircle} color={`${textColor}80`} cursor="pointer" ml={2} />
                                        </Tooltip>
                                    </HStack>

                                    {/* Filler Word Categories */}
                                    {Object.keys(fillerWords.categories).length > 0 && (
                                        <Box mb={4}>
                                            <Text color={textColor} fontSize="sm" mb={2}>Filler Word Categories:</Text>
                                            <HStack flexWrap="wrap" spacing={2}>
                                                {Object.entries(fillerWords.categories).map(([category, count]) => (
                                                    <Badge 
                                                        key={category}
                                                        colorScheme={
                                                            category === 'hesitation' ? 'red' : 
                                                            category === 'verbal crutch' ? 'orange' : 
                                                            category === 'hedging' ? 'yellow' : 
                                                            'blue'
                                                        }
                                                        py={1}
                                                        px={2}
                                                        borderRadius="md"
                                                    >
                                                        {category}: {count}
                                                    </Badge>
                                                ))}
                                            </HStack>
                                        </Box>
                                    )}                                    
                                    
                                    {/* Filler Word Instances */}
                                    {fillerWords.instances.length > 0 && (
                                        <Box>
                                            <Text color={textColor} fontSize="sm" mb={2}>Examples:</Text>
                                            <VStack align="start" spacing={2} maxHeight="200px" overflowY="auto" p={2}
                                                sx={{
                                                    '&::-webkit-scrollbar': {
                                                        width: '6px',
                                                        background: 'rgba(0, 0, 0, 0.1)',
                                                        borderRadius: '4px',
                                                    },
                                                    '&::-webkit-scrollbar-thumb': {
                                                        background: `rgba(56, 189, 248, 0.5)`,
                                                        borderRadius: '4px',
                                                    },
                                                }}
                                            >
                                                {fillerWords.instances.slice(0, 5).map((instance, index) => (
                                                    <Box 
                                                        key={index}
                                                        p={3}
                                                        borderRadius="md"
                                                        bg="rgba(0,0,0,0.2)"
                                                        width="100%"
                                                        border="1px solid rgba(255,255,255,0.05)"
                                                    >
                                                        <Text fontSize="sm" color={textColor}>
                                                            "...{instance.context}..."
                                                        </Text>
                                                        <Badge 
                                                            size="sm" 
                                                            colorScheme={
                                                                instance.category === 'hesitation' ? 'red' : 
                                                                instance.category === 'verbal crutch' ? 'orange' : 
                                                                instance.category === 'hedging' ? 'yellow' : 
                                                                'blue'
                                                            }
                                                            mt={1}
                                                        >
                                                            {instance.word} ({instance.category})
                                                        </Badge>
                                                    </Box>
                                                ))}
                                            </VStack>

                                            {/* Tips for improvement */}
                                            <Box mt={4} p={4} bg={`rgba(56, 189, 248, 0.1)`} borderRadius="md" borderLeft={`3px solid ${accentColor}`}>
                                                <Text color={textColor} fontSize="sm" fontWeight="bold">
                                                    Tips to reduce fillers:
                                                </Text>
                                                <Text color={textColor} fontSize="sm" mt={2}>
                                                    • Practice pausing instead of using fillers
                                                </Text>
                                                <Text color={textColor} fontSize="sm">
                                                    • Record yourself to become aware of your patterns
                                                </Text>
                                                <Text color={textColor} fontSize="sm">
                                                    • Slow down your speech slightly
                                                </Text>
                                                <Text color={textColor} fontSize="sm">
                                                    • Prepare key points before speaking
                                                </Text>
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            )}                            
                        </>
                    )}                    
                    {recordingHistory.length > 0 && (
                        <Box 
                            width="100%" 
                            maxW="800px"
                            mt={10}
                            p={6}
                            bg={cardBg}
                            borderRadius="xl"
                            border="1px solid rgba(255,255,255,0.1)"
                            boxShadow="0 15px 25px -5px rgba(0, 0, 0, 0.2)"
                            maxHeight="600px"
                            overflowY="auto"
                            sx={{
                                '&::-webkit-scrollbar': {
                                    width: '8px',
                                    background: 'rgba(0, 0, 0, 0.1)',
                                    borderRadius: '4px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    background: `rgba(56, 189, 248, 0.5)`,
                                    borderRadius: '4px',
                                },
                            }}
                            position="relative"
                        >
                            {/* Background accent */}
                            <Box 
                                position="absolute" 
                                bottom="0" 
                                right="0" 
                                width="200px" 
                                height="200px" 
                                opacity="0.05" 
                                bgGradient={`radial-gradient(circle, ${highlightColor} 0%, transparent 70%)`}
                                zIndex="0"
                            />
                            
                            <Heading 
                                size="md" 
                                mb={5} 
                                bgGradient={`linear-gradient(90deg, ${accentColor}, ${tertiaryAccent})`}
                                bgClip="text"
                                display="inline-block"
                            >
                                Recording History
                            </Heading>

                            <VStack spacing={4} align="stretch">
                                {recordingHistory.slice(-3).map((record, index) => (
                                    <Box 
                                        key={index}
                                        p={5}
                                        bg="rgba(0,0,0,0.2)"
                                        borderRadius="lg"
                                        border="1px solid rgba(255,255,255,0.05)"
                                        transition="all 0.3s ease"
                                        _hover={{
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                                            transform: "translateY(-2px)",
                                            borderColor: `rgba(${accentColor.replace('#', '')}, 0.3)`
                                        }}
                                    >
                                        <Text fontSize="sm" color={`${textColor}60`} mb={2}>
                                            {record.timestamp.toLocaleTimeString()} | Duration: {formatDuration(record.duration || 180)}
                                        </Text>
                                        <Text noOfLines={2} mb={3} color={textColor}>{record.transcription}</Text>
                                        
                                        {record.audioBlob && record.audioUrl && (
                                            <Box mb={3}>
                                                <HStack>
                                                    <Box flex="1">
                                                        <audio 
                                                            src={record.audioUrl} 
                                                            controls 
                                                            style={{ 
                                                                width: '100%', 
                                                                height: '30px', 
                                                                filter: 'invert(0.8) hue-rotate(180deg)' 
                                                            }} 
                                                        />
                                                    </Box>
                                                    <Button
                                                        size="sm"
                                                        leftIcon={<Icon as={FaDownload} />}
                                                        colorScheme="blue"
                                                        variant="ghost"
                                                        onClick={() => downloadAudioAsMp3(
                                                            record.audioBlob, 
                                                            `procomm-recording-${record.timestamp.toISOString().slice(0,10)}.mp3`
                                                        )}
                                                    >
                                                        MP3
                                                    </Button>
                                                </HStack>
                                            </Box>
                                        )}
                                        
                                        <HStack spacing={4}>
                                            <Badge 
                                                colorScheme={record.analysis.rate_color || "blue"}
                                                px={3}
                                                py={1}
                                                borderRadius="md"
                                            >
                                                {record.analysis.speech_rate}
                                            </Badge>
                                            <Badge 
                                                bg={`${secondaryAccent}30`}
                                                color={secondaryAccent}
                                                px={3}
                                                py={1}
                                                borderRadius="md"
                                                border={`1px solid ${secondaryAccent}50`}
                                            >
                                                Score: {record.analysis.confidence_score}%
                                            </Badge>
                                        </HStack>
                                    </Box>
                                ))}
                            </VStack>
                        </Box>
                    )}
                </VStack>
            </Container>
                ) : activeTab === "recordings" ? (
                    <Container maxW="container.xl" py={6}>
                        <RecordingsTab 
                            recordingHistory={recordingHistory}
                            handleClearHistory={handleClearHistory}
                            handleExportRecordings={handleExportRecordings}
                            handleImportRecordings={handleImportRecordings}
                            fileInputRef={fileInputRef}
                            storagePreference={storagePreference}
                            isLocalStorageAvailable={isLocalStorageAvailable}
                            storageUsage={storageUsage}
                            storagePercentage={storagePercentage}
                            accentColor={accentColor}
                            secondaryAccent={secondaryAccent}
                            tertiaryAccent={tertiaryAccent}
                            textColor={textColor}
                            formatDuration={formatDuration}
                            downloadAudioAsMp3={downloadAudioAsMp3}
                            cardBg={cardBg}
                        />
                    </Container>
                ) : activeTab === "about" ? (
                    <Container maxW="container.xl" py={6}>
                        <AboutTab 
                            accentColor={accentColor}
                            tertiaryAccent={tertiaryAccent}
                            cardBg={cardBg}
                            textColor={textColor}
                            highlightColor={highlightColor}
                        />
                    </Container>
                ) : activeTab === "settings" ? (
                    <Container maxW="container.xl" py={6}>
                        <SettingsTab 
                            durationValue={durationValue}
                            durationUnit={durationUnit}
                            handleDurationChange={handleDurationChange}
                            handleDurationUnitChange={handleDurationUnitChange}
                            enableVAD={enableVAD}
                            setEnableVAD={setEnableVAD}
                            vadThreshold={vadThreshold}
                            setVadThreshold={setVadThreshold}
                            silenceThreshold={silenceThreshold}
                            setSilenceThreshold={setSilenceThreshold}
                            storagePreference={storagePreference}
                            handleStoragePreferenceChange={handleStoragePreferenceChange}
                            isLocalStorageAvailable={isLocalStorageAvailable}
                            storageUsage={storageUsage}
                            storagePercentage={storagePercentage}
                            ESTIMATED_MAX_STORAGE_MB={ESTIMATED_MAX_STORAGE_MB}
                            fileInputRef={fileInputRef}
                            handleImportRecordings={handleImportRecordings}
                            handleClearHistory={handleClearHistory}
                            handleExportRecordings={handleExportRecordings}
                            recordingHistory={recordingHistory}
                            accentColor={accentColor}
                            secondaryAccent={secondaryAccent}
                            tertiaryAccent={tertiaryAccent}
                            cardBg={cardBg}
                            textColor={textColor}
                            highlightColor={highlightColor}
                        />
                    </Container>
                ) : activeTab === "profile" ? (
                    <Container maxW="container.xl" py={6}>
                        <ProfileTab 
                            recordingHistory={recordingHistory}
                            accentColor={accentColor}
                            secondaryAccent={secondaryAccent}
                            tertiaryAccent={tertiaryAccent}
                            cardBg={cardBg}
                            textColor={textColor}
                            highlightColor={highlightColor}
                            setActiveTab={setActiveTab}
                        />
                    </Container>
                ) : (
                    <Container maxW="container.xl" py={6}>
                        <AboutTab />
                    </Container>
                )}
            </Box>
        </Flex>
    );
}