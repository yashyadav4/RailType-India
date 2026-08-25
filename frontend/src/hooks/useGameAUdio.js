import { useEffect, useRef, useCallback } from "react";

export function useGameAudio() {
  const typeSound = useRef(null);
  const errorSound = useRef(null);
  const successSound = useRef(null);

  // Load the audio files once when the game starts
  useEffect(() => {
    typeSound.current = new Audio("/type.mp3");
    errorSound.current = new Audio("/error.mp3");
    successSound.current = new Audio("/success.mp3");
  }, []);

  const playType = useCallback(() => {
    if (!typeSound.current) return;
    typeSound.current.currentTime = 0; // <-- THE MAGIC FIX: Cuts off the echo!
    typeSound.current.volume = 0.4;
    typeSound.current.play().catch(() => {}); // Catch prevents browser auto-play errors
  }, []);

  const playError = useCallback(() => {
    if (!errorSound.current) return;
    errorSound.current.currentTime = 0;
    errorSound.current.volume = 0.5;
    errorSound.current.play().catch(() => {});
  }, []);

  const playSuccess = useCallback(() => {
    if (!successSound.current) return;
    successSound.current.currentTime = 0;
    successSound.current.volume = 0.7;
    successSound.current.play().catch(() => {});
  }, []);

  return { playType, playError, playSuccess };
}