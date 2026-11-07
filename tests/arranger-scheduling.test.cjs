const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createHarness() {
    const html = fs.readFileSync('index.html', 'utf8');
    const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1]
        .replace(/import \{ (?:WorkletSynthesizer|MIDIUtils) \}[^;]+;/g, '');
    const elements = new Map();
    const buttons = Array.from({ length: 8 }, () => element());

    function element() {
        return {
            value: '0', checked: false, style: {}, innerHTML: '', innerText: '', textContent: '', disabled: false,
            children: [], listeners: {},
            classList: { add() {}, remove() {}, toggle() {} },
            setAttribute(name, value) { this[name] = value; },
            addEventListener(name, callback) { this.listeners[name] = callback; },
            appendChild(child) { this.children.push(child); },
            replaceChildren() { this.children = []; this.value = ''; }
        };
    }

    const document = {
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, element());
            return elements.get(id);
        },
        querySelector(selector) { return this.getElementById(selector.slice(1)); },
        querySelectorAll() { return buttons; },
        createElement() { return element(); }
    };
    document.getElementById('ctrl-key').value = 'C';
    const sources = [];
    const gains = [];
    const audio = {
        currentTime: 10, state: 'running', destination: {},
        audioWorklet: { async addModule() {} },
        createGain() {
            const node = {
                gain: {
                    value: 1, setValueAtTime(value) { this.value = value; }, linearRampToValueAtTime() {},
                    cancelScheduledValues() {}
                },
                connect(target) { this.target = target; }
            };
            gains.push(node);
            return node;
        },
        createBufferSource() {
            const source = {
                playbackRate: { setValueAtTime(value) { source.rate = value; } },
                connect(target) { this.target = target; },
                start(time, offset) { this.started = time; this.offset = offset; },
                stop(time) { this.stopped = time; this.stopCalls = (this.stopCalls || 0) + 1; }
            };
            sources.push(source);
            return source;
        }
    };
    const synths = [];
    class WorkletSynthesizer {
        constructor() {
            this.messages = [];
            this.banks = [];
            this.isReady = Promise.resolve();
            this.soundBankManager = {
                addSoundBank: async (buffer, id) => {
                    if (buffer.invalid) throw new Error('Invalid SoundFont');
                    this.banks.push({ buffer, id });
                }
            };
            synths.push(this);
        }
        connect(node) { this.target = node; }
        systemExclusive(message) { this.messages.push(message); }
        destroy() { this.destroyed = true; }
        programChange() {}
        noteOn() {}
        noteOff() {}
    }
    const MIDIUtils = {
        gs: (...args) => ['gs', ...args],
        xg: (...args) => ['xg', ...args]
    };
    const context = vm.createContext({
        document, window: {}, navigator: {}, performance: {}, console, setTimeout, clearTimeout,
        WorkletSynthesizer, MIDIUtils
    });
    vm.runInContext(script, context);
    context.audio = audio;
    vm.runInContext(`
        audioCtx = audio;
        for (const key of [...variations, ...fills, ...breaks, ...intros, ...endings]) {
            loopAudioBuffers.drums[key] = { key, duration: 2 };
        }
        for (const key of ['0_BIN_MAJ_C', '0_BEN_MAJ_C', '0_BMAJ_C', '0_BIN_MAJ_F#', '0_BEN_MAJ_F#']) {
            loopAudioBuffers.bass[key] = { key, duration: 2 };
        }
        for (const key of ['0_IN_MAJ_C', '0_EN_MAJ_C', '0_MAJ_C', '0_IN_MAJ_F#', '0_EN_MAJ_F#']) {
            loopAudioBuffers.chords[key] = { key, duration: 2 };
        }
        isPlaying = true;
        runArrangerPlaybackChannels();
    `, context);
    return { html, context, document, audio, sources, gains, synths, run: code => vm.runInContext(code, context) };
}

function near(actual, expected) {
    assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
}

test('fill and break controls play the matching loop at the remaining-bar offset', () => {
    const h = createHarness();
    for (const key of ['FILA', 'FILB', 'FILC', 'FILD', 'BRKA', 'BRKB', 'BRKC', 'BRKD']) {
        assert.match(h.html, new RegExp(`playDrumFill\\('${key}'\\)`));
        h.audio.currentTime = 10.53;
        const bass = h.sources[1];
        const chords = h.sources[2];
        h.context.window.playDrumFill(key);
        const fill = h.sources.at(-2);
        const next = h.sources.at(-1);
        assert.equal(fill.buffer.key, key);
        near(fill.offset, 0.5);
        near(fill.stopped, 12.03);
        near(next.started, 12.03);
        assert.equal(next.buffer.key, 'INT3');
        assert.equal(bass.stopped, undefined);
        assert.equal(chords.stopped, undefined);
    }
});

test('autofill precedes the selected variation and later requests replace pending drums', () => {
    const h = createHarness();
    h.audio.currentTime = 10.53;
    h.document.getElementById('auto-fill').checked = true;
    h.context.window.setVariation(5);
    const fill = h.sources.at(-2);
    const pending = h.sources.at(-1);
    assert.equal(fill.buffer.key, 'FILB');
    assert.equal(pending.buffer.key, 'ARRB_1');
    near(pending.started, 12.03);
    h.document.getElementById('auto-fill').checked = false;
    h.context.window.setVariation(2);
    near(pending.stopped, 10.53);
    assert.equal(h.sources.at(-1).buffer.key, 'ARRC');
    near(h.sources.at(-1).started, 12.03);
});

test('bar timing and ending duration account for playback rate', () => {
    const h = createHarness();
    h.document.getElementById('ctrl-tempo').value = '6';
    h.run('restartArrangerEngine()');
    h.audio.currentTime = 10.28;
    h.context.window.playDrumFill('FILA');
    const rate = Math.sqrt(2);
    const boundary = 10.03 + 2 / rate;
    near(h.sources.at(-2).offset, 0.25 * rate);
    near(h.sources.at(-1).started, boundary);
    h.run('stopArrangerPlaybackChannels()');
    const ending = h.sources.at(-3);
    assert.equal(ending.buffer.key, 'END3');
    assert.equal(ending.loop, false);
    near(ending.started, boundary);
    near(h.sources.at(-2).stopped, boundary + 2 / rate);
    near(h.sources.at(-1).stopped, boundary + 2 / rate);
    const count = h.sources.length;
    h.run('stopArrangerPlaybackChannels()');
    assert.equal(h.sources.length, count);
    ending.onended();
    assert.equal(h.run('isPlaying'), false);
});

test('immediate stop cancels a scheduled ending and missing assets leave playback intact', () => {
    const h = createHarness();
    h.audio.currentTime = 11;
    h.run("delete loopAudioBuffers.drums.FILA");
    const count = h.sources.length;
    h.context.window.playDrumFill('FILA');
    assert.equal(h.sources.length, count);
    assert.match(h.document.getElementById('log-window').innerHTML, /drums\/FILA/);
    h.run('stopArrangerPlaybackChannels()');
    const ending = h.sources.at(-3);
    h.run('stopArranger()');
    ending.onended();
    assert.equal(h.run('isPlaying'), false);
    assert.equal(ending.stopCalls, 1);
});

test('a cancelled ending cannot stop a later arrangement', () => {
    const h = createHarness();
    h.run('stopArrangerPlaybackChannels()');
    const oldEnding = h.sources.at(-3);
    h.run('stopArranger(); isPlaying = true; runArrangerPlaybackChannels(); stopArrangerPlaybackChannels()');
    oldEnding.onended();
    assert.equal(h.run('isPlaying'), true);
    assert.equal(h.run('endingScheduled'), true);
});

test('chord changes preserve the drum transition and align accompaniment to the bar clock', () => {
    const h = createHarness();
    h.audio.currentTime = 10.53;
    h.context.window.playDrumFill('FILA');
    const fill = h.sources.at(-2);
    const next = h.sources.at(-1);
    h.run("changeStyleChord('Maj', 0, 0)");
    assert.equal(fill.stopped, 12.03);
    assert.equal(next.stopped, undefined);
    assert.equal(h.sources.at(-2).buffer.key, '0_BMAJ_C');
    near(h.sources.at(-2).offset, 0.5);
    near(h.sources.at(-1).offset, 0.5);
});

test('mixer controls shared track and master gains without altering crossfade gains', () => {
    const h = createHarness();
    const mixer = h.run('mixer');
    assert.equal(h.sources[0].gainNode.target, mixer.drums);
    assert.equal(h.sources[1].gainNode.target, mixer.bass);
    assert.equal(h.sources[2].gainNode.target, mixer.chords);
    assert.equal(mixer.drums.target, mixer.master);
    assert.equal(mixer.synth.target, mixer.master);
    assert.equal(mixer.master.target, h.audio.destination);
    const slider = h.document.getElementById('volume-drums');
    slider.value = '35';
    slider.listeners.input();
    assert.equal(mixer.drums.gain.value, 0.35);
    const mute = h.document.getElementById('mute-drums');
    mute.listeners.click();
    assert.equal(mixer.drums.gain.value, 0);
    slider.value = '70';
    slider.listeners.input();
    assert.equal(mixer.drums.gain.value, 0);
    mute.listeners.click();
    assert.equal(mixer.drums.gain.value, 0.7);
    h.document.getElementById('mute-master').listeners.click();
    assert.equal(mixer.master.gain.value, 0);
    assert.equal(h.sources[0].gainNode.gain.value, 0);
});

test('root scan finds nested case-insensitive SF2 files and picker loads the selected bank', async () => {
    const h = createHarness();
    const file = (name) => ({ kind: 'file', name, async getFile() { return { name, async arrayBuffer() { return new ArrayBuffer(4); } }; } });
    const folder = (name, entries) => ({ kind: 'directory', name, async *values() { yield* entries; } });
    h.context.root = folder('root', [file('ignore.txt'), folder('nested', [file('PIANO.SF2')]), file('other.sf2')]);
    h.run('rootDirHandle = root');
    await h.document.getElementById('btn-scan-sf2').listeners.click();
    const picker = h.document.getElementById('sf2-picker');
    assert.deepEqual(picker.children.map(option => option.textContent), ['Select a SoundFont', 'nested/PIANO.SF2', 'other.sf2']);
    picker.value = '0';
    picker.listeners.change({ target: picker });
    await h.run('soundFontQueue');
    assert.equal(h.synths.length, 1);
    assert.equal(h.synths[0].target, h.run('mixer.synth'));
    assert.equal(h.synths[0].banks[0].id, 'selected-soundfont');
    assert.match(h.document.getElementById('status').innerText, /PIANO.SF2/);
    picker.value = '1';
    picker.listeners.change({ target: picker });
    await h.run('soundFontQueue');
    assert.equal(h.synths.length, 1);
    assert.equal(h.synths[0].banks.length, 2);
    assert.match(h.document.getElementById('status').innerText, /other.sf2/);
    assert.equal(h.synths[0].messages.filter(message => message[0] === 'gs' && message[2] === 3 && message[3] === 0).length, 2);
});

test('scan errors are reported and stale scans cannot replace the current root results', async () => {
    const h = createHarness();
    let finish;
    const wait = new Promise(resolve => { finish = resolve; });
    h.context.oldRoot = { async *values() { await wait; yield { kind: 'file', name: 'old.sf2' }; } };
    h.context.newRoot = { async *values() { yield { kind: 'file', name: 'new.sf2' }; } };
    h.run('rootDirHandle = oldRoot');
    const scan = h.document.getElementById('btn-scan-sf2').listeners.click;
    const oldScan = scan();
    h.run('rootDirHandle = newRoot');
    await scan();
    finish();
    await oldScan;
    assert.deepEqual(h.document.getElementById('sf2-picker').children.map(option => option.textContent), ['Select a SoundFont', 'new.sf2']);
    h.context.failedRoot = { async *values() { throw new Error('Permission denied'); } };
    h.run('rootDirHandle = failedRoot');
    await scan();
    assert.match(h.document.getElementById('sf2-scan-status').textContent, /Permission denied/);
    assert.equal(h.document.getElementById('sf2-picker').disabled, true);
});

test('failed SoundFont replacement retains the previous synth and reports the error', async () => {
    const h = createHarness();
    h.context.goodFile = { name: 'good.sf2', async arrayBuffer() { return new ArrayBuffer(4); } };
    h.context.badFile = { name: 'bad.sf2', async arrayBuffer() { return { invalid: true }; } };
    await h.run('loadSoundFont(() => Promise.resolve(goodFile))');
    await h.run('loadSoundFont(() => Promise.resolve(badFile))');
    assert.equal(h.synths.length, 1);
    assert.equal(h.synths[0].banks.length, 1);
    assert.equal(h.document.getElementById('sf2-play-btn').disabled, false);
    assert.match(h.document.getElementById('status').innerText, /Invalid SoundFont/);
});

test('effect selector routes GS insertion and equalizer, and XG Symphonic disables GS EQ', () => {
    const h = createHarness();
    const messages = [];
    h.context.target = { systemExclusive(message) { messages.push(message); } };
    h.document.getElementById('effect-type').value = '293';
    h.document.getElementById('eq-low-gain').value = '-6';
    h.run('applySynthEffects(target)');
    assert.deepEqual(Array.from(messages[1].slice(0, 4)), ['gs', 64, 3, 0]);
    assert.deepEqual(Array.from(messages[1][4]), [1, 37]);
    assert.deepEqual(Array.from(messages[2].slice(0, 4)), ['gs', 64, 65, 34]);
    assert.deepEqual(Array.from(messages[5][4]), [58]);
    h.document.getElementById('effect-type').value = 'symphonic';
    h.run('applySynthEffects(target)');
    assert.equal(h.document.getElementById('gs-eq').disabled, true);
    assert.deepEqual(Array.from(messages.at(-2).slice(0, 4)), ['xg', 3, 0, 0]);
    assert.deepEqual(Array.from(messages.at(-2)[4]), [68, 0]);
    assert.deepEqual(Array.from(messages.at(-1)[4]), [0]);
    h.document.getElementById('effect-type').value = '0';
    h.run('applySynthEffects(target)');
    assert.equal(h.document.getElementById('gs-eq').disabled, false);
    assert.deepEqual(Array.from(messages.at(-6)[4]), [0]);
});
