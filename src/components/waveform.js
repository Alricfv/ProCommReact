import {useRef, useEffect, useState} from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";
import {Box, Text, Flex, IconButton} from "@chakra-ui/react";
import {FaPlay, FaPause} from "react-icons/fa"

const AudioWaveform = ({
    audioBlob,
    pauseAnalysis,
    height = 100,
    waveColor = "#8884d8",
    progressColor = "#fc6900ff",
    pauseColor = "rgba(237, 100, 166, 0.3)"
}) => {
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (!audioBlob || !waveformRef.current) return;

        if (wavesurferRef.current){
            wavesurferRef.current.destroy();
        }

        //the creation, initialization and load events are all here
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

        //waveform handler
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

        wavesurfer.on('play', () => setIsPlaying(true));
        wavesurfer.on('pause', () => setIsPlaying(false));
        wavesurfer.on('finish', () => setIsPlaying(false));
        //Cleaning up the stuff
        return() => {
            if(wavesurferRef.current){
                try{
                    wavesurferRef.current.destroy();
                }catch(e){
                    if (e.name !== "AbortError"){
                        console.error("WaveSurfer destroy error (known issue):, e");
                    }
                }
                wavesurferRef.current = null;
            }
            URL.revokeObjectURL(audioUrl);
        };
    }, [audioBlob, pauseAnalysis, height, waveColor, progressColor, pauseColor]);

    const handlePlayPause = () => {
        if (wavesurferRef.current){
            wavesurferRef.current.playPause();
        }
    };

    //UI
    return (
        <Box width = "100%">
            <Box
                ref={waveformRef}
                width="100%"
                bg="rgba(0,0,0,0.2)"
                borderRadius="lg"
                p={2}
                cursor="pointer"
                onClick={handlePlayPause}
            />
            <Flex alignItems="center" mt={2} mb={1}>
                <IconButton 
                aria-label={isPlaying ? "Pause" : "Play"}
                icon = {isPlaying ? <FaPause /> : <FaPlay />}
                onClick={handlePlayPause}
                size="sm"
                mr={2}
                colorScheme="orange"
                isDisabled={!isReady}
                />
                {isReady && (
                    <Text fontSize="sm" color="gray.400">
                        {isPlaying ? "Playing..." : "Paused"}
                    </Text>
                )}
            </Flex>

            {isReady && pauseAnalysis.total > 0 && (
                <Flex
                    justifyContent="space-between" 
                    mt={1}
                    fontSize="xs"
                >
                    <Text color="gray.400">
                        Total Pauses: {pauseAnalysis.total}
                    </Text>
                    <Text color="gray.400">
                        Speaking Duration: {Math.round(pauseAnalysis.speakingTime)}s
                    </Text>
                    <Text color="gray.400">
                        Silence Duration: {Math.round(pauseAnalysis.silenceTime)}s
                    </Text>
                </Flex>
            )}

            {isReady && duration > 0 && (
                <Flex
                    justifyContent="space-between"
                    mt={1}
                >
                    <Text fontSize ="xs" color="gray.500">
                        0:00
                    </Text>
                    <Text fontSize ="xs" color="gray.500">
                        {Math.floor(duration/60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
                    </Text>
                </Flex>
            )}
        </Box>
    );
};

export default AudioWaveform;