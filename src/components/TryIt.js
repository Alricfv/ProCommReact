import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, VStack, Text, Heading, Container, SimpleGrid, useToast, Progress, Badge, HStack, Icon, Stat, StatLabel, StatNumber, StatHelpText, 
    NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, FormControl, FormLabel, Select,
    Tooltip } from '@chakra-ui/react';
import { FaMicrophone, FaInfoCircle, FaChartLine, FaClock, FaQuestionCircle } from 'react-icons/fa';

export default function TryIt() {
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [recordingHistory, setRecordingHistory] = useState([]);
    const [durationValue, setDurationValue] = useState(3); // Default to 3
    const [durationUnit, setDurationUnit] = useState('minutes'); // 'seconds' or 'minutes'
    const [timer, setTimer] = useState(180); // 3 minutes in seconds
    const [sentiment, setSentiment] = useState('');
    const [sentimentScore, setSentimentScore] = useState(null);
    const [emotion, setEmotion] = useState('');
    const [emotionScore, setEmotionScore] = useState(null);
    const [recordingStartTime, setRecordingStartTime] = useState(null); // Track when recording starts
    const [actualRecordingDuration, setActualRecordingDuration] = useState(0); // Store actual duration
    const [durationSource, setDurationSource] = useState('timer-based'); // Track source of duration measurement
    const toast = useToast();

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    useEffect(() => {
        return () => {
            // Clean up MediaRecorder on component unmount
            if (mediaRecorderRef.current) {
                try {
                    if (mediaRecorderRef.current.state === 'recording') {
                        mediaRecorderRef.current.stop();
                    }
                    // Release any media stream tracks
                    const tracks = mediaRecorderRef.current.stream?.getTracks();
                    if (tracks && tracks.length) {
                        tracks.forEach(track => track.stop());
                    }
                } catch (error) {
                    console.error("Error cleaning up MediaRecorder:", error);
                }
            }
            // Reset recording state
            setIsRecording(false);
        };
    }, []);

    // Update timer when duration settings change
    useEffect(() => {
        // Convert to seconds based on the unit
        const durationInSeconds = durationUnit === 'minutes' 
            ? durationValue * 60 
            : durationValue;
        
        // Only update timer if not currently recording
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
            // Stop recording when timer reaches zero
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

    // More accurate audio duration measurement using AudioContext
    const getAudioDurationWithAudioContext = async (audioBlob) => {
        return new Promise((resolve, reject) => {
            try {
                // Create audio context
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const audioContext = new AudioContext();
                
                // Convert blob to ArrayBuffer
                const fileReader = new FileReader();
                
                fileReader.onload = async (event) => {
                    try {
                        // Decode the audio data
                        const audioBuffer = await audioContext.decodeAudioData(event.target.result);
                        
                        // Get duration in seconds
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
                
                // Read the blob as ArrayBuffer
                fileReader.readAsArrayBuffer(audioBlob);
                
            } catch (error) {
                console.error("Audio context error:", error);
                reject(error);
            }
        });
    };

    // Function to get audio duration from blob
    const getAudioDurationFromBlob = async (audioBlob) => {
        return new Promise((resolve, reject) => {
            try {
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                
                audio.addEventListener('loadedmetadata', () => {
                    // Get duration in seconds
                    const duration = audio.duration;
                    // Clean up
                    URL.revokeObjectURL(audioUrl);
                    resolve(Math.round(duration));
                });
                
                audio.addEventListener('error', (err) => {
                    URL.revokeObjectURL(audioUrl);
                    reject(new Error('Error loading audio metadata'));
                });
                
                // Load the audio to get metadata
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
        // Parse the input value
        let numValue = parseInt(value) || 1;
        
        // Apply min/max constraints based on the unit
        if (durationUnit === 'minutes') {
            numValue = Math.min(Math.max(numValue, 1), 30); // 1-30 minutes
        } else {
            numValue = Math.min(Math.max(numValue, 5), 1800); // 5-1800 seconds
        }
        
        setDurationValue(numValue);
    };

    const handleDurationUnitChange = (e) => {
        const newUnit = e.target.value;
        setDurationUnit(newUnit);
        
        // Adjust the value if needed when changing units
        if (newUnit === 'minutes' && durationValue > 30) {
            setDurationValue(30); // Max 30 minutes
        } else if (newUnit === 'seconds' && durationValue < 5) {
            setDurationValue(5); // Min 5 seconds
        }
    };

    // Implementation of the error function (erf) in case it's not available
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
        
        // Calculate z-score
        const zScore = (wpm - mean) / stdDev;
        
        // Convert z-score to percentile using cumulative distribution function approximation
        // This is an approximation of the CDF of the standard normal distribution
        // Use our own erf implementation instead of Math.erf which might not be available in all browsers
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
        
        // Get percentile for additional context
        const percentile = calculateSpeechPercentile(wpm);
        
        // Add percentile information to the feedback
        const percentileFeedback = ` Your speech rate is faster than approximately ${percentile}% of average speakers.`;
        
        return baseFeedback + percentileFeedback;
    };

    const calculateSpeechRate = (wordCount, durationInSeconds) => {
        // Handle edge cases
        if (durationInSeconds <= 0) {
            console.warn("Invalid duration for speech rate calculation:", durationInSeconds);
            return 0; // Avoid division by zero
        }
        
        if (wordCount <= 0) {
            console.warn("No words detected for speech rate calculation");
            return 0; // No words detected
        }
        
        // Apply a minimum threshold for meaningful measurements
        if (durationInSeconds < 3) {
            console.warn("Recording too short for accurate speech rate calculation");
            return 0; // Too short for meaningful measurement
        }
        
        // Convert duration to minutes for WPM calculation
        const durationInMinutes = durationInSeconds / 60;
        
        // Calculate words per minute and round to nearest integer
        const wpm = Math.round(wordCount / durationInMinutes);
        
        // Log for debugging purposes
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
    
    // Calculate a deterministic confidence score based on audio quality metrics
    // This function will first use the server's confidence score if available,
    // otherwise calculate a client-side confidence score
    const calculateConfidenceScore = (text, recordingDuration, durationSource, wordCount, vocabularyRichness) => {
        // First check if we have a server-generated confidence score
        const serverConfidenceScore = sessionStorage.getItem('serverConfidenceScore');
        if (serverConfidenceScore) {
            // Clear it so it's only used once for the current analysis
            sessionStorage.removeItem('serverConfidenceScore');
            return parseInt(serverConfidenceScore);
        }
        
        // If no server score is available, calculate client-side score
        // Base score starts at 85 (minimum confidence)
        let score = 85;
        
        // 1. Add points based on recording duration source reliability
        // Audio context decoded is most accurate, timer-based least accurate
        switch(durationSource) {
            case 'audio-decoded':
                score += 5;
                break;
            case 'audio-metadata':
                score += 4;
                break;
            case 'timestamp':
                score += 2;
                break;
            case 'timer-based':
                score += 0;
                break;
        }
        
        // 2. Add points based on recording duration (longer recordings are more reliable)
        if (recordingDuration >= 30) {
            score += 3;
        } else if (recordingDuration >= 15) {
            score += 2;
        } else if (recordingDuration >= 5) {
            score += 1;
        }
        
        // 3. Add points based on word count (more words = more reliable analysis)
        if (wordCount >= 100) {
            score += 4;
        } else if (wordCount >= 50) {
            score += 3;
        } else if (wordCount >= 20) {
            score += 2;
        } else if (wordCount >= 10) {
            score += 1;
        }
        
        // 4. Add points based on vocabulary richness (higher richness suggests better quality speech)
        const richness = parseFloat(vocabularyRichness);
        if (richness >= 70) {
            score += 3;
        } else if (richness >= 50) {
            score += 2;
        } else if (richness >= 30) {
            score += 1;
        }
        
        // Ensure score doesn't exceed 100
        return Math.min(score, 100);
    };

    const analyzeSpeech = (text, recordingDuration, durationSource = 'timer-based') => {
        const words = text.trim().split(/\s+/);
        const sentences = text.split(/[.!?]+/).filter(Boolean);
        
        // Use the improved speech rate calculation
        const wordsPerMinute = calculateSpeechRate(words.length, recordingDuration);
        
        // Get speech rate quality assessment
        const rateQuality = getSpeechRateQuality(wordsPerMinute);
        
        // Generate tailored feedback on speech rate
        const rateFeedback = generateSpeechRateFeedback(wordsPerMinute);
        
        // Calculate percentile compared to average speakers
        const percentile = calculateSpeechPercentile(wordsPerMinute);

        // Determine the source of the duration measurement for transparency
        let source = "audio-metadata";
        if (recordingDuration === actualRecordingDuration && !actualRecordingDuration) {
            source = "timer-based";
        } else if (recordingDuration === Math.round((Date.now() - recordingStartTime) / 1000)) {
            source = "timestamp";
        }
        
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        const avgSentenceLength = words.length / sentences.length;
        const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
        const vocabularyRichness = ((uniqueWords / words.length) * 100).toFixed(1);
        const adjustedRichness = Math.min(vocabularyRichness, 100); // Cap richness at 100%

        // Adjust vocabulary richness based on word count thresholds
        let finalRichness;
        if (words.length < 50) {
            finalRichness = adjustedRichness * 0.8; // Penalize for low word count
        } else if (words.length > 200) {
            finalRichness = adjustedRichness * 1.1; // Slight boost for high word count
        } else {
            finalRichness = adjustedRichness;
        }

        return {
            speech_rate: `${wordsPerMinute} words per minute`,
            raw_rate: wordsPerMinute, // Store the raw value for potential comparison
            rate_quality: rateQuality.quality,
            rate_color: rateQuality.color,
            rate_feedback: rateFeedback, // Add detailed speech rate feedback
            rate_percentile: percentile, // Add percentile compared to average speakers
            avg_word_length: `${avgWordLength.toFixed(1)} characters`,
            avg_sentence_length: `${avgSentenceLength.toFixed(1)} words`,
            vocabulary_richness: `${Math.min(finalRichness, 100).toFixed(1)}%`, // Adjusted vocabulary richness
            total_words: words.length,
            unique_words: uniqueWords,
            recording_duration: `${formatDuration(recordingDuration)}`, // Include the recording duration
            duration_seconds: recordingDuration, // Raw seconds for calculations
            duration_source: durationSource, // Add the source of duration measurement
            // Calculate a deterministic confidence score based on multiple quality factors
            confidence_score: calculateConfidenceScore(
                text,                   // Transcribed text
                recordingDuration,      // Duration in seconds
                durationSource,         // Source of duration measurement (affects accuracy)
                words.length,           // Word count (more words = more reliable analysis)
                vocabularyRichness      // Vocabulary richness (indicator of speech quality)
            )
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

        if (isRecording) {
            // Only stop if it's actually recording and in valid state
            if (mediaRecorderRef.current && 
                mediaRecorderRef.current.state === 'recording') {
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
            
            toast({
                title: "Recording Stopped",
                description: "Your recording has been stopped manually.",
                status: "info",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        // Validate duration before starting
        const durationInSeconds = durationUnit === 'minutes' 
            ? durationValue * 60 
            : durationValue;
            
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
        
        // Reset timer based on current duration settings
        setTimer(durationInSeconds);
        
        // Reset duration tracking state
        setActualRecordingDuration(0);
        setDurationSource('timer-based');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            chunksRef.current = [];
            const mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                console.warn(`${mimeType} is not supported, falling back to default`);
            }

            // Configure MediaRecorder with timeslice to get data more frequently
            mediaRecorderRef.current = new MediaRecorder(stream, { 
                mimeType,
                audioBitsPerSecond: 128000 // Set consistent audio quality
            });

            // Set recording state BEFORE starting the MediaRecorder
            setIsRecording(true);
            // Set timestamp right before recording starts
            setRecordingStartTime(Date.now());

            // Request data every second for more accurate duration tracking
            mediaRecorderRef.current.start(1000); // 1000ms = 1 second timeslice

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
                    console.log("AudioContext duration:", recordingDuration);
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
                
                // Ensure we have a positive duration
                recordingDuration = Math.max(1, recordingDuration);
                
                // Store the duration and source for later use
                setActualRecordingDuration(recordingDuration);
                setDurationSource(durationSource);
                
                // Store duration source in a custom property on the audioBlob for reference
                audioBlob.durationSource = durationSource;

                try {
                    setIsAnalyzing(true);

                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'audio.webm');
                    // Add recording duration to form data for server-side calculations if needed
                    formData.append('duration', recordingDuration.toString());

                    // Use environment variable for the API URL
                    let API_URL = process.env.REACT_APP_API_URL 
                        ? process.env.REACT_APP_API_URL
                        : 'http://127.0.0.1:5000/transcribe';
                    
                    // Log that we're using the API (without revealing the full URL)
                    console.log('Using API endpoint from environment variables');
                        
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json',
                        },
                    });

                    if (!response.ok) {
                        throw new Error('Failed to transcribe audio');
                    }

                    const data = await response.json();
                    if (data.error) {
                        throw new Error(data.error);
                    }

                    // Clean up transcription text if it still contains JSON
                    let cleanedTranscription = data.transcription;
                    
                    // Check if the transcription appears to contain JSON
                    if (cleanedTranscription.includes('{"text"') || cleanedTranscription.includes('{ "text"')) {
                        try {
                            // Extract text from JSON objects
                            const textParts = [];
                            const jsonParts = cleanedTranscription.split(/(?=\{)/g);
                            
                            jsonParts.forEach(part => {
                                try {
                                    // Try parsing as JSON
                                    const jsonObj = JSON.parse(part.trim());
                                    if (jsonObj.text !== undefined) {
                                        textParts.push(jsonObj.text);
                                    }
                                } catch (e) {
                                    // If not valid JSON, try regex extraction
                                    const match = /\"text\"\s*:\s*\"([^\"]*)\"/g.exec(part);
                                    if (match && match[1]) {
                                        textParts.push(match[1]);
                                    }
                                }
                            });
                            
                            if (textParts.length > 0) {
                                cleanedTranscription = textParts.join(' ').trim();
                            }
                        } catch (e) {
                            console.warn("Failed to clean up JSON in transcription:", e);
                        }
                    }
                    
                    setTranscription(cleanedTranscription);
                    setSentiment(data.sentiment);
                    setSentimentScore(data.sentiment_score);
                    setEmotion(data.emotion);
                    setEmotionScore(data.emotion_score);
                    
                    // Store the server's confidence score for consistent results
                    if (data.confidence_score) {
                        sessionStorage.setItem('serverConfidenceScore', data.confidence_score.toString());
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

            // No need to start here as it's already started with timeslice earlier
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

        setIsAnalyzing(true);
        try {
            // Use the actual recorded duration instead of timer-based calculation
            // If actualRecordingDuration is set, use it; otherwise fall back to timer calculation
            let recordingDuration;
            let sourceMeasurement = "timer-based";
            
            if (actualRecordingDuration > 0) {
                // Use the measured duration from audio decoding or timestamps
                recordingDuration = actualRecordingDuration;
                // Use the duration source from state
                sourceMeasurement = durationSource;
            } else {
                // Fallback to timer-based calculation
                const initialDuration = durationUnit === 'minutes' ? durationValue * 60 : durationValue;
                const timerBasedDuration = initialDuration - timer;
                recordingDuration = timerBasedDuration > 0 ? timerBasedDuration : initialDuration;
                sourceMeasurement = "timer-based";
            }
            
            // Pass actual duration and source to analyzeSpeech
            const results = analyzeSpeech(transcription, recordingDuration, sourceMeasurement);
            setAnalysis(results);
            
            setRecordingHistory([
                ...recordingHistory, 
                { 
                    transcription, 
                    analysis: results, 
                    timestamp: new Date(),
                    duration: recordingDuration
                }
            ]);
            
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

    return (
        <Box 
            minHeight="100vh" 
            background="linear-gradient(135deg, #000000, #ffffff)" 
            backgroundSize="200% 200%" 
            animation="gradientShift 8s ease-in-out infinite" 
            position="relative"
        >
            {/* Add a subtle black-and-white gradient animation */}
            <style>
                {`
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                `}
            </style>
            <Container maxW="container.xl" py={10}>
                <VStack spacing={8} align="center">
                    <Box textAlign="center" mb={8}>
                        <Heading 
                            size="2xl" 
                            bgGradient="linear(to-r, #00a6ff, #0074e4)" 
                            bgClip="text"
                            mb={4}
                        >
                            Speech Analyzer
                        </Heading>
                        <Text fontSize="xl" color="#e0e0e0" maxW="800px">
                            Enhance your speaking skills with real-time analysis. Simply record your voice
                            and get instant feedback on your speech patterns.
                        </Text>
                        <Text fontSize="md" color="#aaaaaa" mt={2} maxW="800px" mx="auto">
                            Speech rate is calculated using actual recording time for accuracy.
                        </Text>
                        {!isRecording && (
                            <HStack justifyContent="center" mt={2}>
                                <Badge 
                                    colorScheme="blue" 
                                    fontSize="sm" 
                                    p={2} 
                                    borderRadius="md"
                                >
                                    <Icon as={FaClock} mr={1} />
                                    Recording Time: {durationValue} {durationUnit} ({durationUnit === 'minutes' ? durationValue * 60 : durationValue} seconds)
                                </Badge>
                            </HStack>
                        )}
                    </Box>

                    <Box 
                        p={6} 
                        borderRadius="xl" 
                        bg="rgba(255,255,255,0.05)"
                        backdropFilter="blur(10px)"
                        width="full"
                        maxW="800px"
                        border="1px solid rgba(255,255,255,0.1)"
                    >
                        <VStack spacing={6}>
                            {/* Duration Selection */}
                            <HStack width="100%" spacing={4} alignItems="flex-end" justifyContent="space-between">
                                <FormControl w="60%">
                                    <FormLabel color="#e0e0e0">
                                        <HStack>
                                            <Icon as={FaClock} color="#00a6ff" />
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
                                        >
                                            <NumberInputField textColor="#e0e0e0" />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper borderColor="rgba(255,255,255,0.1)" color="#e0e0e0" />
                                                <NumberDecrementStepper borderColor="rgba(255,255,255,0.1)" color="#e0e0e0" />
                                            </NumberInputStepper>
                                        </NumberInput>
                                        <Select 
                                            value={durationUnit} 
                                            onChange={handleDurationUnitChange}
                                            w="120px"
                                            isDisabled={isRecording}
                                            bg="rgba(0,0,0,0.2)"
                                            borderColor="rgba(255,255,255,0.1)"
                                            textColor="#e0e0e0"
                                        >
                                            <option value="seconds">Seconds</option>
                                            <option value="minutes">Minutes</option>
                                        </Select>
                                    </HStack>
                                    <Text fontSize="xs" color="#999" mt={1}>
                                        Total: {durationUnit === 'minutes' ? durationValue * 60 : durationValue} seconds
                                    </Text>
                                </FormControl>
                                
                                <HStack spacing={4}>
                                    <Button
                                        size="lg"
                                        colorScheme={isRecording ? "red" : "blue"}
                                        onClick={handleRecord}
                                        leftIcon={<FaMicrophone />}
                                        w="200px"
                                        h="60px"
                                        fontSize="lg"
                                        boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
                                        _hover={{
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 6px 8px rgba(0, 0, 0, 0.2)',
                                        }}
                                    >
                                        {isRecording ? `Stop (${formatDuration(timer)})` : "Start Recording"}
                                    </Button>

                                    <Button
                                        onClick={handleAnalyze}
                                        isDisabled={!transcription}
                                        isLoading={isAnalyzing}
                                        colorScheme="green"
                                        size="lg"
                                        leftIcon={<FaChartLine />}
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
                                borderRadius="lg" 
                                width="100%"
                                minHeight="150px"
                                border="1px solid rgba(255,255,255,0.05)"
                            >
                                <Text color="#e0e0e0">
                                    {transcription || "Your transcription will appear here..."}
                                </Text>
                            </Box>
                        </VStack>
                    </Box>

                    {analysis && (
                        <>
                            <SimpleGrid 
                                columns={{ base: 1, md: 2, lg: 3 }} 
                                spacing={6} 
                                width="100%"
                                maxW="800px"
                            >
                                <Stat
                                    bg="rgba(255,255,255,0.05)"
                                    p={4}
                                    borderRadius="lg"
                                    border="1px solid rgba(255,255,255,0.1)"
                                >
                                    <StatLabel>Speech Rate</StatLabel>
                                    <StatNumber color="#00a6ff">{analysis.speech_rate}</StatNumber>
                                    <StatHelpText display="flex" alignItems="center" justifyContent="space-between">
                                        <Badge colorScheme={analysis.rate_color}>{analysis.rate_quality}</Badge>
                                        <Text fontSize="xs">
                                            Percentile: {analysis.rate_percentile}%
                                        </Text>
                                    </StatHelpText>
                                </Stat>

                                <Stat
                                    bg="rgba(255,255,255,0.05)"
                                    p={4}
                                    borderRadius="lg"
                                    border="1px solid rgba(255,255,255,0.1)"
                                >
                                    <StatLabel>Recording Duration</StatLabel>
                                    <StatNumber color="#00a6ff">{analysis.recording_duration}</StatNumber>
                                    <StatHelpText display="flex" alignItems="center" justifyContent="space-between">
                                        <Icon as={FaInfoCircle} mr={2} />
                                        <Badge size="sm" colorScheme="purple">{analysis.duration_source}</Badge>
                                    </StatHelpText>
                                </Stat>

                                <Stat
                                    bg="rgba(255,255,255,0.05)"
                                    p={4}
                                    borderRadius="lg"
                                    border="1px solid rgba(255,255,255,0.1)"
                                >
                                    <StatLabel>Vocabulary Richness</StatLabel>
                                    <StatNumber color="#00a6ff">{analysis.vocabulary_richness}</StatNumber>
                                    <StatHelpText>
                                        <Icon as={FaInfoCircle} mr={2} />
                                        Higher is better
                                    </StatHelpText>
                                </Stat>

                                <Stat
                                    bg="rgba(255,255,255,0.05)"
                                    p={4}
                                    borderRadius="lg"
                                    border="1px solid rgba(255,255,255,0.1)"
                                >
                                    <StatLabel>Word Count</StatLabel>
                                    <StatNumber color="#00a6ff">{analysis.total_words} words</StatNumber>
                                    <StatHelpText>
                                        <Icon as={FaInfoCircle} mr={2} />
                                        Total spoken words
                                    </StatHelpText>
                                </Stat>

                                <Stat
                                    bg="rgba(255,255,255,0.05)"
                                    p={4}
                                    borderRadius="lg"
                                    border="1px solid rgba(255,255,255,0.1)"
                                >
                                    <StatLabel>Confidence Score</StatLabel>
                                    <StatNumber color="#00a6ff">{analysis.confidence_score}%</StatNumber>
                                    <StatHelpText>
                                        <Icon as={FaInfoCircle} mr={2} />
                                        Speech clarity
                                    </StatHelpText>
                                </Stat>

                                {emotion && (
                                    <Stat
                                        bg="rgba(255,255,255,0.05)"
                                        p={4}
                                        borderRadius="lg"
                                        border="1px solid rgba(255,255,255,0.1)"
                                    >
                                        <StatLabel>Emotion</StatLabel>
                                        <StatNumber color="#00a6ff">{emotion}</StatNumber>
                                        <StatHelpText>
                                            <Icon as={FaInfoCircle} mr={2} />
                                            Score: {(emotionScore * 100).toFixed(2)}%
                                        </StatHelpText>
                                    </Stat>
                                )}
                            </SimpleGrid>

                            {/* Speech Rate Feedback */}
                            <Box 
                                width="100%" 
                                maxW="800px"
                                mt={4}
                                p={4}
                                bg="rgba(255,255,255,0.05)"
                                borderRadius="xl"
                                border="1px solid rgba(255,255,255,0.1)"
                            >
                                <HStack alignItems="center" mb={2}>
                                    <Icon as={FaInfoCircle} color="#00a6ff" boxSize={5} />
                                    <Text fontWeight="bold" color="#e0e0e0">Speech Rate Analysis</Text>
                                    <Tooltip 
                                        hasArrow
                                        label="Speech rate is calculated by dividing total spoken words by the actual recording duration in minutes. The accuracy depends on the duration measurement method used."
                                        bg="gray.700"
                                        color="white"
                                        placement="top"
                                        p={3}
                                    >
                                        <Icon as={FaQuestionCircle} color="#aaaaaa" cursor="pointer" ml={2} />
                                    </Tooltip>
                                </HStack>
                                
                                {/* Speech Rate Gauge */}
                                <Box my={3}>
                                    <Text color="#e0e0e0" fontSize="sm" mb={1}>Speech Rate Range:</Text>
                                    <HStack width="100%" height="30px" position="relative" mb={3}>
                                        {/* Gauge Background */}
                                        <Box flex={1} height="100%" bg="rgba(0,0,0,0.3)" borderRadius="full" position="relative" overflow="hidden">
                                            {/* Rate Range Zones */}
                                            <HStack height="100%" width="100%" spacing={0}>
                                                <Box width="25%" bg="yellow.500" opacity={0.6} height="100%" />
                                                <Box width="25%" bg="green.500" opacity={0.6} height="100%" />
                                                <Box width="25%" bg="blue.500" opacity={0.6} height="100%" />
                                                <Box width="25%" bg="red.500" opacity={0.6} height="100%" />
                                            </HStack>
                                            
                                            {/* Position Indicator */}
                                            <Box 
                                                position="absolute" 
                                                left={`${Math.min(Math.max(analysis.raw_rate / 2.5, 0), 100)}%`} 
                                                top="0" 
                                                height="100%" 
                                                width="4px" 
                                                bg="white" 
                                                transform="translateX(-50%)"
                                                borderRadius="full"
                                            />
                                        </Box>
                                    </HStack>
                                    
                                    {/* Legend */}
                                    <HStack justifyContent="space-between" width="100%" px={1}>
                                        <Text fontSize="xs" color="#e0e0e0">0</Text>
                                        <Text fontSize="xs" color="#e0e0e0">100</Text>
                                        <Text fontSize="xs" color="#e0e0e0">150</Text>
                                        <Text fontSize="xs" color="#e0e0e0">200</Text>
                                        <Text fontSize="xs" color="#e0e0e0">250</Text>
                                    </HStack>
                                </Box>
                                
                                <Text color="#e0e0e0">{analysis.rate_feedback}</Text>
                                
                                {/* Show calculation details */}
                                <Box mt={3} p={2} bg="rgba(0,0,0,0.2)" borderRadius="md">
                                    <Text fontSize="sm" color="#e0e0e0" fontFamily="monospace">
                                        Formula: {analysis.total_words} words ÷ {(analysis.duration_seconds / 60).toFixed(2)} minutes = {analysis.raw_rate} WPM
                                    </Text>
                                </Box>
                                
                                {/* Show accuracy note about duration measurement */}
                                <Text fontSize="xs" color="#aaaaaa" mt={2}>
                                    Note: Speech rate calculated using {
                                        analysis.duration_source === "audio-decoded" 
                                            ? "audio waveform decoding (highest accuracy)" 
                                            : analysis.duration_source === "audio-metadata" 
                                                ? "audio file metadata (high accuracy)" 
                                                : analysis.duration_source === "timestamp" 
                                                    ? "recording timestamps (medium accuracy)"
                                                    : "timer estimation (lower accuracy)"
                                    }
                                </Text>
                            </Box>
                        </>
                    )}

                    {recordingHistory.length > 0 && (
                        <Box 
                            width="100%" 
                            maxW="800px"
                            mt={8}
                            p={6}
                            bg="rgba(255,255,255,0.05)"
                            borderRadius="xl"
                            border="1px solid rgba(255,255,255,0.1)"
                            maxHeight="600px" // Set a maximum height
                            overflowY="auto" // Enable vertical scrolling
                        >
                            <Heading size="md" mb={4}>Recording History</Heading>
                            <VStack spacing={4} align="stretch">
                                {recordingHistory.slice(-3).map((record, index) => (
                                    <Box 
                                        key={index}
                                        p={4}
                                        bg="rgba(0,0,0,0.3)"
                                        borderRadius="lg"
                                        border="1px solid rgba(255,255,255,0.05)"
                                    >
                                        <Text fontSize="sm" color="#888" mb={2}>
                                            {record.timestamp.toLocaleTimeString()} | Duration: {formatDuration(record.duration || 180)}
                                        </Text>
                                        <Text noOfLines={2} mb={2}>{record.transcription}</Text>
                                        <HStack spacing={4}>
                                            <Badge colorScheme={record.analysis.rate_color || "blue"}>
                                                {record.analysis.speech_rate}
                                            </Badge>
                                            <Badge colorScheme="green">
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
        </Box>
    );
}