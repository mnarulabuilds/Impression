import { useRef } from "react";
const INTRO_AUDIO_FILE = "/assets/anewbeginning.mp3";

export const useSiteAudio = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handlePlayAudio = async () => {
        if (typeof window === "undefined") return;
        try {
            audioRef.current ??= new Audio(INTRO_AUDIO_FILE);
            const audio = audioRef.current;
            audio.loop = true;  // Enable looping
            await audio.play();
        } catch (audioError) {
            console.error("Audio Play Error", audioError);
        }
    };

    const handleStopAudio = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
    }

    return { handlePlayAudio, handleStopAudio }
}