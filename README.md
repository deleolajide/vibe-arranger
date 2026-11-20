# Vibe Arranger

A browser-based audio-loop arranger with two SoundFont voices and live Web MIDI input to be used as a portable alternative to the Ketron Event Module (EVM) .

<img width="1646" height="936" alt="image" src="https://github.com/user-attachments/assets/01d3ba68-0789-4334-91fb-fd2936abf247" />

## motive
I  wanted a Ketron EVM to carry to church and back every Sunday, but I could not afford one as I had spent all my savings on a Ketron Event 76 keyboard when it first came out. 

I tried Giglad, a software arranger but transferring audio styles between Giglad and Ketron is painful and time consuming. I looked at Audio Phrase mapper, but I was unable to confirm if it would really solve that problem.

In the end I decided to use my knowledge of web audio and developer skills to see if I could create my own arranger that would use my collection of Ketron audio styles and SF2 sound fonts. Here is my proof of concept web application after a few days of vibe coding with Google AI. I have called it (tongue-in-cheek) *Vibe Arranger*. 

Please note that this is not a full emulation of all EVM functions. 

## requirements
You need a Chrome or Edge web browser to use this. I have no idea if it will work with FF or Safari.

You would need a midi controller, a folder/directory or drive on your PC that contains the Ketron USER_MODELING and USER_STYLE folders. Make sure the Ketron KST files are 100% audio style files like the ones that Ben Gotink produces at SC-MULTIMEDIA.

You also need a good quality SF2 sound font file with a piano sound. (program change 0). The web application will ignore all midi data in the KST file and only extract the audio style folder names. Make sure they exist in the USER_MODELING folder.

If you don't have access to a Ketron Event keyboard, I have provided a custom style from my collection called "Afro Beats" that includes a public free SF2 sound font file to use and test with instead. Go to [Release 1.00](https://github.com/deleolajide/vibe-arranger/releases/tag/v1.0.0) for more details on how to download the zipped file, install and operate from your PC.

## operation
The application will ask you for various permissions. If you are unsure, then terminate immediately.

Access directly from https://deleolajide.github.io/vibe-arranger/ or download and serve locally over `localhost` or HTTPS (for example, `python -m http.server`). Open it in a Chromium browser with Web MIDI and the File System Access API. Choose **Root folder** and grant access to the Ketron root. The app scans recursively for `.kst` styles and `.sf2` SoundFonts. Select a style and a patch in each voice column, connect a MIDI keyboard with **MIDI**, and use the bottom controls to start, stop, change variations, fills and breaks. Click the Style, Voice 1 or Voice 2 header to show its list in the large display under columns 2-4. Lists are two levels deep: pick a style category (folder) or SoundFont file first, then a style or patch; use the back row to return. `ARR A-D` choose the variation, `VAR 1-4` toggles the `VAR 5-8` alternate of the current variation, and `FILL` / `BREAK` play the fill or break matching the current variation.

Registrations: the dropdown in the Global column selects slots 1-20 (● marks used slots). **Save reg** writes style, voices (SoundFont, patch, octave, transpose, effects, EQ), mixer, key, tempo shift, AutoFill, intro/ending and variation to `REGISTRATIONS/REG_nn.json` in the root folder (the folder picker requests write access); without a root folder it uses browser storage. **Recall** restores the slot; items missing from the scanned folder are reported. Playing state is not restored unless the arranger is running.

Both voices play incoming notes; the selected voice's octave, transpose, insertion effect and EQ are independent. Mixer levels and mute controls affect drums, bass, chords, each voice and master separately. The arranger detects chords from three or more held notes across the keyboard.

The KST file reader is a fixed-offset parser, not a complete Ketron format implementation. It expects `USER_MODELING/LiveDrum`, `RealBass` and `RealChord` folders and matching WAV loop names referenced by the style. Unsupported styles or missing assets are reported; no Ketron assets are included. Tempo shift changes loop playback rate and uses the existing pitch-compensation asset mapping, not independent time stretching. Intro and ending controls choose the corresponding drum loops; the existing engine loops the intro until a variation is selected. 

## advanced stuff
This code has two novel features that I added for my playing needs. The loops are synched to the tempo (beats per minute) and when triggered by chord detection, will start at the same point being played in the current loop. This ensures that you will hear the complete loop across chord changes. The longer your loops are (8 bars for example), the more variety you will get from playing your chord progression. I play right hand chords and chord detection is full keyboard also known as pianist mode.

The second feature is that the code I wrote does not do any time stretching that degrades the audio quality. Instead, it gives 12 tempo steps from half the the original playback speed to double the playback speed. The novelty is calculating which loop to play that compensates the increased/decreased pitch with a drop/rise in the chromatic music scale. I had forgotten all the maths I learnt in school and AI came to the rescue.

## credits
- [Ben Gotink at SC-MULTIMEDIA](https://sc-multimedia.nl/) for showing how to make 100% useable custom styles for the Ketron Event.
- [Afro Producers](https://afrobeatproducers.com/pages/free-download) for the drum loops in the [free Ketron style](https://github.com/deleolajide/vibe-arranger/releases/tag/v1.0.0)  I have provided for testing.
- [Band in a Box by PG Music](https://www.pgmusic.com/) that I used to create the real bass and chord loops in that same style


## disclaimer and liability
It is open source, free and available for anyone to clone, extend and do whatever they like with it. It is fully functional, proves the concept and answers my question about creating a cheaper Ketron EVM alternative. 

I have decide to share what I have done so far for anyone else who wants to use it as a template for their own vibe coding session with AI to create an arranger for their own specific needs like mine. The software is experimental, use it at your own risk. The code for the proof of concept version can be found in poc.html if you want to create a different operational UI.

Source code can be found at here https://github.com/deleolajide/vibe-arranger.
