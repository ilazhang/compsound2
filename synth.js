document.addEventListener("DOMContentLoaded", function(event) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const keyboardFrequencyMap = {
        '90': 261.63,  //Z - C
        '83': 277.18, //S - C#
        '88': 293.66,  //X - D
        '68': 311.13, //D - D#
        '67': 329.63,  //C - E
        '86': 349.23,  //V - F
        '71': 369.99, //G - F#
        '66': 392.00,  //B - G
        '72': 415.30, //H - G#
        '78': 440.00,  //N - A
        '74': 466.16, //J - A#
        '77': 493.88,  //M - B
        //next octave, goes to next line on keyboard
        '81': 523.25,  //Q - C
        '50': 554.37, //2 - C#
        '87': 587.33,  //W - D
        '51': 622.25, //3 - D#
        '69': 659.25,  //E - E
        '82': 698.46,  //R - F
        '53': 739.99, //5 - F#
        '84': 783.99,  //T - G
        '54': 830.61, //6 - G#
        '89': 880.00,  //Y - A
        '55': 932.33, //7 - A#
        '85': 987.77,  //U - B
    };
  
    const waveformChoice = document.getElementById('waveformChoice');
    const additiveCheckbox = document.getElementById('additiveCheckbox');
    const numPartialsSlider = document.getElementById('numPartialsSlider');
  
    const globalGain = audioCtx.createGain(); //this will control the volume of all notes
    globalGain.gain.value = 0.8;
    globalGain.connect(audioCtx.destination);
  
    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);
  
    activeOscillators = {};
    activeOscillatorsP = {};
  
    function keyDown(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            playNote(key);
        }
        if(additiveCheckbox.checked){
            playAdditive(key, numPartialsSlider.value);
        }
        if(amCheckBox.checked){
            startAMSynthesis();
        }
        if(fmCheckBox.checked){
            startFMSynthesis();
        }
        if(lfoCheckBox.checked){
            startLFO();
        }
    }
    
    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            activeOscillators[key].stop();
            delete activeOscillators[key];
        }
        if (keyboardFrequencyMap[key] && activeOscillatorsP[key]) {
            activeOscillatorsP[key].forEach(oscillator => oscillator.stop());
            delete activeOscillatorsP[key];
        }
        if(amCheckBox.checked){
            stopAMSynthesis();
        }
        if(fmCheckBox.checked){
            stopFMSynthesis();
        }
        if(lfoCheckBox.checked){
            stopLFO();
        }
    }
    
    function playAdditive(key, numPartials) {
        gainNode2 = audioCtx.createGain();
        gainNode2.gain.value = 1 / (Object.keys(activeOscillatorsP).length + 1);
        gainNode2.connect(globalGain);
        const partials = [];
        for (let i = 1; i <= numPartials; i++) {
            const osc2 = audioCtx.createOscillator();
            osc2.frequency.setValueAtTime(keyboardFrequencyMap[key] * i, audioCtx.currentTime);
            osc2.type = waveformChoice.value;
            osc2.connect(gainNode2);
            osc2.start();
            partials.push(osc2);
        }
        activeOscillatorsP[key] = partials;
    }
    function playNote(key) {
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 1 / (Object.keys(activeOscillators).length + 1);
        gainNode.connect(globalGain);
  
        const osc = audioCtx.createOscillator();
        osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime);
        osc.type = waveformChoice.value;
  
        osc.connect(gainNode);
        osc.start();
        activeOscillators[key] = osc;
    }
    

    const amCheckBox = document.getElementById('amCheckBox');
    const fmCheckBox = document.getElementById('fmCheckBox');
    let carrier, modulatorFreq, modulationIndex, lfo, lfoGain;

    const amFrequencySlider = document.getElementById('amFrequencySlider');
    const fmFrequencySlider = document.getElementById('fmFrequencySlider');

    function startAMSynthesis() {
        carrier = audioCtx.createOscillator();
        modulatorFreq = audioCtx.createOscillator();
        //modulatorFreq.frequency.value = 100;
        modulatorFreq.frequency.value = amFrequencySlider.value;
        carrier.frequency.value = 440;
    
        modulatedAM = audioCtx.createGain();
        depthAM = audioCtx.createGain();
        depthAM.gain.value = 0.5;
        modulatedAM.gain.value = 1.0 - depthAM.gain.value;
    
        modulatorFreq.connect(depthAM).connect(modulatedAM.gain);
        carrier.connect(modulatedAM);
        modulatedAM.connect(audioCtx.destination);
    
        carrier.start();
        modulatorFreq.start();
        
    }

    function stopAMSynthesis() {
        if (carrier && modulatorFreq && modulatedAM && depthAM) {
            carrier.stop();
            modulatorFreq.stop();
            carrier.disconnect();
            modulatorFreq.disconnect();
            modulatedAM.disconnect();
            depthAM.disconnect();
            carrier = null;
            modulatorFreq = null;
            modulatedAM = null;
            depthAM = null;
        }
    }


    function startFMSynthesis() {
        carrier = audioCtx.createOscillator();
        modulatorFreq = audioCtx.createOscillator();
        modulationIndex = audioCtx.createGain();
        modulationIndex.gain.value = 400;
        modulatorFreq.frequency.value = fmFrequencySlider.value;

        modulatorFreq.connect(modulationIndex);
        modulationIndex.connect(carrier.frequency);
        carrier.connect(audioCtx.destination);

        carrier.start();
        modulatorFreq.start();
    }

    function stopFMSynthesis() {
        if (carrier && modulatorFreq && modulationIndex) {
            carrier.stop();
            modulatorFreq.stop();
            carrier.disconnect();
            modulatorFreq.disconnect();
            modulationIndex.disconnect();
            carrier = null;
            modulatorFreq = null;
            modulationIndex = null;
        }
    }

    amFrequencySlider.addEventListener('input', function() {
        if (modulatorFreq) {
            modulatorFreq.frequency.value = parseFloat(this.value);
        }
    });

    fmFrequencySlider.addEventListener('input', function() {
        if (modulatorFreq) {
            modulatorFreq.frequency.value = parseFloat(this.value);
        }
    });

    const lfoCheckBox = document.getElementById('lfoCheckBox');


    function startLFO() {
        carrier = audioCtx.createOscillator();
        modulatorFreq = audioCtx.createOscillator();

        modulationIndex = audioCtx.createGain();
        modulationIndex.gain.value = 100;
        modulatorFreq.frequency.value = 500;

        modulatorFreq.connect(modulationIndex);
        modulationIndex.connect(carrier.frequency)
        
        carrier.connect(audioCtx.destination);

        carrier.start();
        modulatorFreq.start();

        lfo = audioCtx.createOscillator();
        lfo.frequency.value = 2;
        lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 300;
        lfo.connect(lfoGain).connect(modulatorFreq.frequency);
        lfo.start();
    }

    function stopLFO() {
        carrier.stop();
            carrier.disconnect();
            carrier = null;
        modulatorFreq.stop();
            modulatorFreq.disconnect();
            modulatorFreq = null;
        lfo.stop();
            lfo.disconnect();
            lfo = null;
    }
  });