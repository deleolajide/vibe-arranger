const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createHarness() {
    const html = fs.readFileSync('index.html', 'utf8');
    const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1]
        .replace(/import \{ WorkletSynthesizer \}[^;]+;/, '');
    const elements = new Map();
    const buttons = Array.from({ length: 8 }, () => element());

    function element() {
        return {
            value: '0', checked: false, style: {}, innerHTML: '', innerText: '',
            children: [], listeners: {},
            classList: { add() {}, remove() {}, toggle() {} },
            addEventListener(name, callback) { this.listeners[name] = callback; },
            appendChild(child) { this.children.push(child); }
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
    const audio = {
        currentTime: 10, state: 'running', destination: {},
        createGain() {
            return {
                gain: {
                    value: 1, setValueAtTime() {}, linearRampToValueAtTime() {},
                    cancelScheduledValues() {}
                },
                connect() {}
            };
        },
        createBufferSource() {
            const source = {
                playbackRate: { setValueAtTime(value) { source.rate = value; } },
                connect() {},
                start(time, offset) { this.started = time; this.offset = offset; },
                stop(time) { this.stopped = time; this.stopCalls = (this.stopCalls || 0) + 1; }
            };
            sources.push(source);
            return source;
        }
    };
    const context = vm.createContext({
        document, window: {}, navigator: {}, performance: {}, console, setTimeout, clearTimeout
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
    return { html, context, document, audio, sources, run: code => vm.runInContext(code, context) };
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
