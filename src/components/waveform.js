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
    })
}