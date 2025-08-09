import React, {useRef, useEffect, useState} from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions.min.js";
import {Box, Text, Flex} from "@chakra-ui/react";

const AudioWaveForm = ({
    audioBlob,
    pauseAnalysis,
    accentColor="#fc6900ff",
    height = 100,
    waveColor = "#8884d8",
    progressColor = "#fc6900ff",
    pauseColor = "rgba(237, 100, 166, 0.3)"
}) => {
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (!audioblog || !waveformRef.current) return;

        if (wavesurferRef.current){
            wavesurferRef.current.destroy();
        }

        const audioUrl = URL.createObjectURL(audioBlob);

        const wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: waveColor,
            progressColor: progressColor,
            cursorColor: 'transparent',
            height: height,
            normalize: true,
            responsive: true,
            plugins: [
                RegionsPlugin.create()
            ]
        });

        wavesurferRef.current = wavesurfer;
        wavesurfer.load(audioUrl);

        wavesurfer.on('ready', () => {
            setIsReady(true);
            setDuration(wavesurfer.getDuration());

            if (pauseAnalysis.pause_segments){
                pauseAnalysis.pause_segments.forEach((pause, index) => {
                    if (pause.start < pause.end && pause.duration > 0.3){
                        wavesurfer.addRegion({
                            id: 'pause-' + index,
                            start: pause.start,
                            end: pause.end,
                            color: pauseColor,
                            drag: false,
                            resize: false
                        });
                    }
                });
            }
        });

        return() => {
            wavesurfer.destroy();
            URL.revokeObjectURL(audioUrl);
        };
    }, [audioBlob, pauseAnalysis, height, waveColor, progressColor, pauseColor]);

    return (
        <Box width = "100%">
            <Box
                ref={waveformRef}
                width="100%"
                bg="rgba(0,0,0,0.2)"
                borderRadius="lg"
                p={2}
            />

            {isReady && pauseAnalysis.total_pauses > 0 && (
                <Flex
                    justifyContent="space-between" 
                    mt={1}
                    fontSize="xs"
                >
                    <Text color="gray.400">
                        Total Pauses: {pauseAnalysis.total_pauses}
                    </Text>
                    <Text color="gray.400">
                        Speaking Duration: {Math.round(pauseAnalysis.speaking_time)}
                    </Text>
                    <Text color="gray.400">
                        Silence Duration: {Math.round(pauseAnalysis.silence_time)}s
                    </Text>
                </Flex>
            )}

            {isReady && duration > 0 && (
                <Flex
                    justifyContent="space-between"
                    mt={1}
                >
                

                </Flex>
            )}

        </Box>
    )
}