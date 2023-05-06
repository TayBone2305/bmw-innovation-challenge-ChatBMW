const express = require('express');
const { join } = require('path');
const fs = require('fs');
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();
const PORT = 3000;

app.use(express.static(join(__dirname, 'static')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, process.env.SPEECH_REGION);
speechConfig.speechRecognitionLanguage = "de-DE";

const storage = multer.diskStorage(
    {
        destination: __dirname + '/static/uploads/',
        filename: function ( req, file, cb ) {
            cb( null, 'recordedAudio.wav');
        }
    }
);
const upload = multer( { storage: storage } );
const type = upload.single('upl');

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '/static/index.html'));
});


app.post('/convertAudio', type, (req, res) => {
    console.log("called convertAudio endpoint");

    let audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync("./static/uploads/test2.wav"));
    let speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    console.log("start recognizing");

    speechRecognizer.recognizeOnceAsync(result => {
        let successful = false;
        switch (result.reason) {
            case sdk.ResultReason.RecognizedSpeech:
                console.log(`RECOGNIZED: Text=${result.text}`);
                successful = true;
                break;
            case sdk.ResultReason.NoMatch:
                console.log("NOMATCH: Speech could not be recognized.");
                break;
            case sdk.ResultReason.Canceled:
                const cancellation = sdk.CancellationDetails.fromResult(result);
                console.log(`CANCELED: Reason=${cancellation.reason}`);

                if (cancellation.reason === sdk.CancellationReason.Error) {
                    console.log(`CANCELED: ErrorCode=${cancellation.ErrorCode}`);
                    console.log(`CANCELED: ErrorDetails=${cancellation.errorDetails}`);
                    console.log("CANCELED: Did you set the speech resource key and region values?");
                }
                break;
        }
        speechRecognizer.close();
        if (successful) {
            readText(result.text, res)/*.then(r => {
                console.log("sending success message");
                res.status(200).send({ message: result.text });
            });*/
        } else {
            res.status(500).send({ message: "error: failed to recognize text" });
        }
    });
});

async function readText(text, res) {
    console.log("reading text");
    const audioFile = "static/result.wav";
    // This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
    const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, process.env.SPEECH_REGION);
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);
    console.log("config");

    // The language of the voice that speaks.
    speechConfig.speechSynthesisVoiceName = "de-DE-AmalaNeural";

    // Create the speech synthesizer.
    let synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    // Start the synthesizer and wait for a result.
    synthesizer.speakTextAsync(text,
        function (result) {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                console.log("synthesis finished.");
            } else {
                console.error("Speech synthesis canceled, " + result.errorDetails +
                    "\nDid you set the speech resource key and region values?");
            }
            synthesizer.close();
            synthesizer = null;
            console.log("sending success message");
            res.status(200).send({ message: text });
        },
        function (err) {
            console.trace("err - " + err);
            synthesizer.close();
            synthesizer = null;
        });
    console.log("Now synthesizing to: " + audioFile);
}

app.listen(PORT);
console.log(`Server listening on port ${PORT}`);