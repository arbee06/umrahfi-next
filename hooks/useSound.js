import { useCallback } from 'react';
import soundManager from '@/utils/soundUtils';

/**
 * Custom hook for playing sounds in React components
 * @returns {Object} Sound playing functions
 */
export const useSound = () => {
  // Play action sound with optional volume
  const playAction = useCallback((volume = null) => {
    soundManager.playAction(volume);
  }, []);

  // Play success sound (same as action for now, can be extended)
  const playSuccess = useCallback((volume = null) => {
    soundManager.playAction(volume);
  }, []);

  // Play error sound (lower volume by default)
  const playError = useCallback((volume = 0.4) => {
    soundManager.playAction(volume);
  }, []);

  // Play warning sound (medium volume)
  const playWarning = useCallback((volume = 0.6) => {
    soundManager.playAction(volume);
  }, []);

  // Play subtle sound for less important actions
  const playSubtle = useCallback((volume = 0.3) => {
    soundManager.playAction(volume);
  }, []);

  // Toggle sound on/off
  const toggleSound = useCallback(() => {
    soundManager.setEnabled(!soundManager.isEnabled());
    return soundManager.isEnabled();
  }, []);

  // Check if sound is enabled
  const isSoundEnabled = useCallback(() => {
    return soundManager.isEnabled();
  }, []);

  // Set volume
  const setVolume = useCallback((volume) => {
    soundManager.setVolume(volume);
  }, []);

  return {
    playAction,
    playSuccess,
    playError,
    playWarning,
    playSubtle,
    toggleSound,
    isSoundEnabled,
    setVolume
  };
};