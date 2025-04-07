
import React, { useState } from 'react';
import { Box, Button, VStack, Text, Heading, Container, SimpleGrid, Spinner } from '@chakra-ui/react';

export default function TryIt() {
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [analysis, setAnalysis] = useState(null);

    const handleRecord = async () => {
        setIsRecording(true);
        try {
            await fetch('/record/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'duration=10'
            });
        } catch (error) {
            console.error('Recording failed:', error);
        }
        setIsRecording(false);
    };

    const handleTranscribe = async () => {
        setIsAnalyzing(true);
        try {
            const response = await fetch('/transcribe/', { method: 'POST' });
            const data = await response.json();
            setTranscription(data.transcription);
        } catch (error) {
            console.error('Transcription failed:', error);
        }
    };

    const handleAnalyze = async () => {
        try {
            const response = await fetch('/analyze/', { method: 'POST' });
            const data = await response.json();
            setAnalysis(data.analysis_results);
        } catch (error) {
            console.error('Analysis failed:', error);
        }
        setIsAnalyzing(false);
    };

    return (
        <Box 
            minHeight="100vh" 
            background="linear-gradient(135deg, #121212, #1d1d1f)"
            paddingTop="90px"
            color="#f5f5f7"
        >
            <Container maxW="container.xl" py={10}>
                <VStack spacing={8} align="center">
                    <Heading size="2xl">Try PROCOMM</Heading>
                    <Text fontSize="xl" textAlign="center" color="#cccccc">
                        Record your speech, get instant transcription and detailed analysis
                    </Text>
                    
                    <Button
                        size="lg"
                        colorScheme={isRecording ? "red" : "blue"}
                        onClick={handleRecord}
                        isLoading={isRecording}
                        loadingText="Recording..."
                    >
                        {isRecording ? "Recording..." : "Start Recording (10s)"}
                    </Button>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} width="100%">
                        <Box 
                            p={6} 
                            borderRadius="lg" 
                            bg="rgba(255,255,255,0.05)"
                            height="100%"
                        >
                            <VStack spacing={4}>
                                <Heading size="md">Transcription</Heading>
                                <Button 
                                    onClick={handleTranscribe} 
                                    isDisabled={isRecording}
                                >
                                    Get Transcription
                                </Button>
                                <Box 
                                    p={4} 
                                    bg="rgba(0,0,0,0.2)" 
                                    borderRadius="md" 
                                    width="100%"
                                    minHeight="200px"
                                >
                                    <Text>{transcription || "Your transcription will appear here..."}</Text>
                                </Box>
                            </VStack>
                        </Box>

                        <Box 
                            p={6} 
                            borderRadius="lg" 
                            bg="rgba(255,255,255,0.05)"
                            height="100%"
                        >
                            <VStack spacing={4}>
                                <Heading size="md">Speech Analysis</Heading>
                                <Button 
                                    onClick={handleAnalyze} 
                                    isDisabled={isRecording}
                                    isLoading={isAnalyzing}
                                >
                                    Analyze Speech
                                </Button>
                                <Box 
                                    p={4} 
                                    bg="rgba(0,0,0,0.2)" 
                                    borderRadius="md" 
                                    width="100%"
                                    minHeight="200px"
                                >
                                    {analysis ? (
                                        <VStack align="start" spacing={2}>
                                            <Text>Speech Rate: {analysis.speech_rate}</Text>
                                            <Text>Pauses: {analysis.pauses}</Text>
                                            <Text>Syllables: {analysis.syllables}</Text>
                                            <Text>Speaking Time: {analysis.speaking_time}</Text>
                                            <Text>Original Duration: {analysis.original_duration}</Text>
                                            <Text>Balance: {analysis.balance}</Text>
                                            <Text>Pronunciation Score: {analysis.pronunciation_score}</Text>
                                            <Text>Gender Prediction: {analysis.gender_prediction}</Text>
                                        </VStack>
                                    ) : (
                                        <Text>Your speech analysis will appear here...</Text>
                                    )}
                                </Box>
                            </VStack>
                        </Box>
                    </SimpleGrid>
                </VStack>
            </Container>
        </Box>
    );
}
