# vibe-arranger
*Proof of Concept for a Web based Audio Styles Arranger*

## motive
I  wanted a Ketron EVM to carry to church and back every Sunday, but I could not afford one as I had spent all my savings on a Ketron Event 76 keyboard when it first came out. 

I tried Giglad, but transferring audio styles between Giglad and Ketron is painful and time consuming. I looked at Audio Phrase mapper, but I was unable to confirm if it would really solve that problem.

In the end I decided to use my knowledge of web audio and developer skills to see if I could create my own arranger that would use my collection of Ketron audio styles and SF2 sound fonts. Here is my proof of concept web application after a few days of vibe coding with Google AI. I have called it (tongue-in-cheek) *Vibe Arranger*. 

For a demo, see https://deleolajide.github.io/vibe-arranger/

## requirements
You would need a midi controller, a folder/directory or drive on your PC that contains the Ketron USER_MODELING and USER_STYLES folders. make sure the Ketron KST files are 100% audio style files like the ones that Ben Gotink produces at SC-MULTIMEDIA.

You also need a good quality SF2 sound font file with a piano sound. (program change 0). The web application will ignore all midi data in the KST file and only extract the audio style folder names. Make sure they exist in the USER_MODELING folder.

## operation
The application will ask you for various permissions. If you are unsure, then terminate immediately.

Otherwise, start from section 1 and work your way down to section 8. Pick and select the folder or mounted drive on your PC that has the USER_MODELING and USER_STYLES folders as your root folder. After connecting the root folder, use section 2 to select a KST style file that will be scaned for audio style folders. Use **Scan Root for SoundFonts** in section 3 to find `.sf2` files recursively and select one by its relative path. You can also select a SoundFont elsewhere from your PC directly. The most recently selected file replaces the current SoundFont.

The mixer in section 7 controls the drum, bass, chord, and synth levels independently, plus the master output. Muting preserves the slider setting. Section 8 applies one insertion effect at a time to the SoundFont synth (not the audio style loops), with GS low and high EQ controls. Symphonic uses the synth's XG processor, so GS EQ is unavailable while it is selected; switching between GS and XG resets sounding synth notes. Effect and mixer settings are retained when changing SoundFonts during the session.

While the arranger is playing, use the FILA–FILD and BRKA–BRKD buttons to play the remainder of a drum fill or break in the current bar. The current drum loop resumes at the next bar while bass and chords continue. Variation changes take effect at the next bar; enable AutoFill to play the fill corresponding to the selected variation before the change. The arrangement start/stop button plays END3 at the next bar, while STOP stops immediately. Bar timing assumes four beats per bar. Missing loops are reported in the system log.

## disclaimer and liability
It is open source, free and available for anyone to clone, extend and do whatever they like with it. It is fully functional and proves the concept and answers my question about creating a cheaper Ketron EVM alternative. 

I have decide to share what I have done so far for anyone else who wants to use it as a template for their own vibe coding session with AI to create an arranger for their own specific needs like mine. The software is experimental, use it at your own risk.

Source code can be found at here https://github.com/deleolajide/vibe-arranger 
