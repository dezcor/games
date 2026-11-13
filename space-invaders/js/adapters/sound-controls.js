/**
 * SoundControlsAdapter — wires the SFX / music mute buttons and the volume slider
 * in the ♪ popover to SoundManager and MusicPlayer, with persisted settings.
 */
const SoundControlsAdapter = {
    init(repository) {
        const muteBtn = document.getElementById('mute-btn');
        const volumeSlider = document.getElementById('volume-slider');
        const bgmMuteBtn = document.getElementById('bgm-mute-btn');

        const updateMuteIcon = () => {
            if (muteBtn) {
                if (SoundManager.getMuteState() || SoundManager.getVolume() === 0) {
                    muteBtn.textContent = '\u{1F507}';
                } else {
                    muteBtn.textContent = '\u{1F50A}';
                }
            }
        };

        const updateBgmIcon = () => {
            if (bgmMuteBtn) {
                bgmMuteBtn.textContent = MusicPlayer.getMuteState() ? '\u{1F507}' : '\u{1F3B5}';
            }
        };

        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                SoundManager.toggleMute();
                updateMuteIcon();
            });
        }

        if (volumeSlider) {
            volumeSlider.value = repository.getSavedAudioVolume();
            volumeSlider.addEventListener('input', (e) => {
                const vol = parseFloat(e.target.value);
                SoundManager.setVolume(vol);
                repository.saveAudioVolume(vol);
                updateMuteIcon();
            });
        }

        SoundManager.setVolume(repository.getSavedAudioVolume());
        updateMuteIcon();

        if (bgmMuteBtn) {
            MusicPlayer.setVolume(repository.getSavedBgmVolume());
            MusicPlayer.setMute(repository.getSavedBgmMuted());
            bgmMuteBtn.addEventListener('click', () => {
                MusicPlayer.toggleMute();
                updateBgmIcon();
            });
            updateBgmIcon();
        }
    },
};
