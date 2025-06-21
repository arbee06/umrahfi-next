/**
 * Sound utility functions for playing audio feedback
 */

class SoundManager {
  constructor() {
    this.sounds = {
      action: '/sounds/mixkit-software-interface-start-2574.wav',
      login: '/sounds/mixkit-positive-notification-951.wav'
    };
    this.volume = 0.5; // Default volume (0-1)
    this.enabled = true; // Can be toggled by user preference
  }

  /**
   * Play a sound by name
   * @param {string} soundName - Name of the sound to play
   * @param {number} volume - Volume level (0-1), optional
   */
  play(soundName, volume = null) {
    if (!this.enabled || typeof window === 'undefined') {
      return;
    }

    const soundPath = this.sounds[soundName];
    if (!soundPath) {
      console.warn(`Sound "${soundName}" not found`);
      return;
    }

    try {
      const audio = new Audio(soundPath);
      audio.volume = volume !== null ? volume : this.volume;
      
      // Play the sound with error handling
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Handle autoplay policy restrictions
          console.warn('Audio playback failed:', error.message);
        });
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  /**
   * Play action sound (default sound for user actions)
   * @param {number} volume - Volume level (0-1), optional
   */
  playAction(volume = null) {
    this.play('action', volume);
  }

  playLogin(volume = null) {
    this.play('login', volume);
  }

  /**
   * Set the default volume for all sounds
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Enable or disable sounds
   * @param {boolean} enabled - Whether sounds should be enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Check if sounds are enabled
   * @returns {boolean} Whether sounds are enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Preload all sounds for better performance
   */
  preloadSounds() {
    if (typeof window === 'undefined') return;

    Object.values(this.sounds).forEach(soundPath => {
      try {
        const audio = new Audio(soundPath);
        audio.preload = 'auto';
        audio.volume = 0; // Silent preload
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {
          // Ignore preload errors
        });
      } catch (error) {
        // Ignore preload errors
      }
    });
  }
}

// Create a singleton instance
const soundManager = new SoundManager();

// Preload sounds when the module is imported (client-side only)
if (typeof window !== 'undefined') {
  // Small delay to ensure the page is loaded
  setTimeout(() => {
    soundManager.preloadSounds();
  }, 1000);
}

export default soundManager;