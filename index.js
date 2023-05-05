const bmwButton = document.getElementById("bmw-button");
let recording = false;

function toggleRecording() {
    recording = !recording;
    if (recording) {
        bmwButton.classList.remove("rotate");
        bmwButton.classList.add("pulse");
    } else {
        bmwButton.classList.remove("pulse");
        bmwButton.classList.add("rotate");
    }
}