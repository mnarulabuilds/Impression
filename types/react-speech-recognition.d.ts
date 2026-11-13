declare module "react-speech-recognition" {
  interface SpeechRecognitionOptions {
    continuous?: boolean;
    interimResults?: boolean;
    language?: string;
  }

  const SpeechRecognition: {
    startListening: (options?: SpeechRecognitionOptions) => Promise<void>;
    stopListening: () => void;
  };

  export function useSpeechRecognition(): {
    listening: boolean;
    finalTranscript: string;
    interimTranscript: string;
    isMicrophoneAvailable: boolean;
    browserSupportsSpeechRecognition: boolean;
    resetTranscript: () => void;
  };

  export default SpeechRecognition;
}
