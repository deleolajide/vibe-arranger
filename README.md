# vibe-arranger
*Proof of Concept for a Web based Audio Styles Arranger*

<img width="1280" height="1129" alt="image" src="https://github.com/user-attachments/assets/744262f6-2020-41ec-89c1-584af56f9630" />

## motive
I  wanted a Ketron EVM to carry to church and back every Sunday, but I could not afford one as I had spent all my savings on a Ketron Event 76 keyboard when it first came out. 

I tried Giglad, but transferring audio styles between Giglad and Ketron is painful and time consuming. I looked at Audio Phrase mapper, but I was unable to confirm if it would really solve that problem.

In the end I decided to use my knowledge of web audio and developer skills to see if I could create my own arranger that would use my collection of Ketron audio styles and SF2 sound fonts. Here is my proof of concept web application after a few days of vibe coding with Google AI. I have called it (tongue-in-cheek) *Vibe Arranger*. 

For a demo, see https://deleolajide.github.io/vibe-arranger/

## requirements
You need a Chrome or Edge web browser to use this. I have no idea if it will work with FF or Safari.

You would need a midi controller, a folder/directory or drive on your PC that contains the Ketron USER_MODELING and USER_STYLE folders. make sure the Ketron KST files are 100% audio style files like the ones that Ben Gotink produces at SC-MULTIMEDIA.

You also need a good quality SF2 sound font file with a piano sound. (program change 0). The web application will ignore all midi data in the KST file and only extract the audio style folder names. Make sure they exist in the USER_MODELING folder.

If you don't have access to a Ketron Event keyboard, I have provided a custom style from my collection called "Afro Beats" that includes a public free SF2 sound font file to use and test with instead. Go to [Release 1.00](https://github.com/deleolajide/vibe-arranger/releases/tag/v1.0.0) for more details on how to download the zipped file, install and operate from your PC.

## operation
The application will ask you for various permissions. If you are unsure, then terminate immediately.

Connect the folder or mounted drive containing `USER_MODELING` and `USER_STYLE` in **Style library**. Select a KST file from the list and choose **Load selected style** to extract its audio style folders and load the loops. The extracted paths and native tempo are available under **KSHP assignments**, and loading errors appear in the **Output log**. Use **Scan Root for SoundFonts** in **SoundFont synth** to find `.sf2` files recursively and select one by its relative path. You can also select a SoundFont elsewhere from your PC directly. The most recently selected file replaces the current SoundFont. Initialize **MIDI input** to use a connected controller, or use the on-screen keyboard.

The **Mixer** controls the drum, bass, chord, and synth levels independently, plus the master output. Muting preserves the slider setting. **Synth effects & EQ** applies one insertion effect at a time to the SoundFont synth (not the audio style loops), with GS low and high EQ controls. Symphonic uses the synth's XG processor, so GS EQ is unavailable while it is selected; switching between GS and XG resets sounding synth notes. Effect and mixer settings are retained when changing SoundFonts during the session.

While the arranger is playing, use the FILA–FILD and BRKA–BRKD buttons to play the remainder of a drum fill or break in the current bar. The current drum loop resumes at the next bar while bass and chords continue. Variation changes take effect at the next bar; enable AutoFill to play the fill corresponding to the selected variation before the change. The arrangement start/stop button plays END3 at the next bar, while STOP stops immediately. Bar timing assumes four beats per bar. Missing loops are reported in the system log.

## advanced stuff
This code has two novel features that I added for my playing needs. The loops are synched to the tempo (beats per minute) and when triggered by chord detection, will start at the same point being played in the current loop. This ensures that you will hear the complete loop across chord changes. The longer your loops are (8 bars for example), the more variety you will get from your playing your chord progression.

The second feature is that the code I wrote does not do any time stretching that degrades the audio quality. Instead, it gives 12 tempo steps from half the the original playback speed to double the playback speed. The novelty is calculating which loop to play that compensates the increased/decreased pitch with a drop/rise in the chromatic music scale. I had forgotten all the maths I learnt in school and AI came to the rescue.

## credits
- [Ben Gotink at SC-MULTIMEDIA](https://sc-multimedia.nl/) for showing how to make 100% useable custom styles for the Ketron Event.
- [Afro Producers](https://afrobeatproducers.com/pages/free-download) for the drum loops in the [free Ketron style](https://github.com/deleolajide/vibe-arranger/releases/tag/v1.0.0)  I have provided for testing.
- [Band in a Box by PG Music](https://www.pgmusic.com/) that I used to create the real bass and chord loops in that same style


## disclaimer and liability
It is open source, free and available for anyone to clone, extend and do whatever they like with it. It is fully functional and proves the concept and answers my question about creating a cheaper Ketron EVM alternative. 

I have decide to share what I have done so far for anyone else who wants to use it as a template for their own vibe coding session with AI to create an arranger for their own specific needs like mine. The software is experimental, use it at your own risk.

Source code can be found at here https://github.com/deleolajide/vibe-arranger 
