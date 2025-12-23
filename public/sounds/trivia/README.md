# Trivia Mode Sound Files

This directory contains sound effects for the TRIVIA game mode.

## Required Sound Files

The following sound files need to be added to this directory:

### 1. countdown.mp3
- **Description**: Subtle tick-tock sound during the countdown timer
- **Duration**: ~1 second
- **Usage**: Plays during the countdown (optional)
- **Recommendation**: Use a subtle clock tick or soft metronome sound

### 2. countdown_urgent.mp3
- **Description**: Urgent/tense sound for the last 5 seconds
- **Duration**: ~1 second
- **Usage**: Plays when 5 seconds remain
- **Recommendation**: Use a faster tick, heartbeat, or tension-building sound

### 3. time_up.mp3
- **Description**: Sound played when time runs out
- **Duration**: 1-2 seconds
- **Usage**: Plays when the timer reaches 0
- **Recommendation**: Use a buzzer, alarm, or "time's up" sound effect

### 4. reveal.mp3
- **Description**: Sound for revealing the correct answer
- **Duration**: 1-2 seconds
- **Usage**: Plays when results are displayed
- **Recommendation**: Use a "ta-da" or reveal sound effect

### 5. next_question.mp3
- **Description**: Transition sound to the next question
- **Duration**: 1-2 seconds
- **Usage**: Plays between questions
- **Recommendation**: Use a positive transition sound or chime

## Notes

- **correct.mp3** and **wrong.mp3** are already available in `/public/sounds/`
- All files should be MP3 format
- Recommended volume: moderate (will be adjusted by the SoundManager)
- Keep file sizes small for fast loading (< 100KB per file)

## Sound Sources

You can find free sound effects from:
- [Freesound.org](https://freesound.org/)
- [Zapsplat](https://www.zapsplat.com/)
- [Mixkit](https://mixkit.co/free-sound-effects/)
- [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/)

## Testing

To test the sounds:
1. Add the MP3 files to this directory
2. Start the game in TRIVIA mode
3. The sounds will play automatically during gameplay
4. Adjust volume using the SoundManager if needed
