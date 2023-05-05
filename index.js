const bmwButton = document.getElementById("bmw-button");
let recording = false;
let mediaRecorder = null;
const chunks = [];
const audioType = 'audio/wav';

navigator.mediaDevices.getUserMedia({audio: true})
    .then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = e => saveRecording(new Blob(chunks, {type: audioType}));
    })
    .catch(err => console.error('getUserMedia error:', err));

function saveRecording(audioBlob) {
    const fd = new FormData();
    fd.set('upl', audioBlob);

    console.log("sending audio");
    fetch('http://localhost:3000/convertAudio', {
        method: 'POST',
        body: fd
    }).then();
}

function toggleRecording() {
    recording = !recording;
    if (recording) {
        bmwButton.classList.remove("rotate");
        bmwButton.classList.remove("inactive");
        bmwButton.classList.add("pulse");
        chunks.length = 0;
        mediaRecorder.start();
    } else {
        bmwButton.classList.remove("pulse");
        bmwButton.classList.remove("inactive");
        bmwButton.classList.add("rotate");
        mediaRecorder.stop();
    }
}
