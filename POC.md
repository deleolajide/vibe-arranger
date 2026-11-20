# vibe-arranger
*Proof of Concept for a Web based Audio Styles Arranger*


## operation
The application will ask you for various permissions. If you are unsure, then terminate immediately.

Connect the folder or mounted drive containing `USER_MODELING` and `USER_STYLE` in **Style library**. Select a KST file from the list and choose **Load selected style** to extract its audio style folders and load the loops. The extracted paths and native tempo are available under **KSHP assignments**, and loading errors appear in the **Output log**. Use **Scan Root for SoundFonts** in **SoundFont synth** to find `.sf2` files recursively and select one by its relative path. You can also select a SoundFont elsewhere from your PC directly. The most recently selected file replaces the current SoundFont. Initialize **MIDI input** to use a connected controller, or use the on-screen keyboard.

The **Mixer** controls the drum, bass, chord, and synth levels independently, plus the master output. Muting preserves the slider setting. **Synth effects & EQ** applies one insertion effect at a time to the SoundFont synth (not the audio style loops), with GS low and high EQ controls. Symphonic uses the synth's XG processor, so GS EQ is unavailable while it is selected; switching between GS and XG resets sounding synth notes. Effect and mixer settings are retained when changing SoundFonts during the session.

While the arranger is playing, use the FILA–FILD and BRKA–BRKD buttons to play the remainder of a drum fill or break in the current bar. The current drum loop resumes at the next bar while bass and chords continue. Variation changes take effect at the next bar; enable AutoFill to play the fill corresponding to the selected variation before the change. The arrangement start/stop button plays END3 at the next bar, while STOP stops immediately. Bar timing assumes four beats per bar. Missing loops are reported in the system log.


