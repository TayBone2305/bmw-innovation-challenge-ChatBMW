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


app.post('/convertAudio', type, (req, res) => {
    console.log("called convertAudio endpoint");

    let audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync("./static/uploads/test2.wav"));
    let speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    console.log("start recognizing");

    speechRecognizer.recognizeOnceAsync(result => {
        switch (result.reason) {
            case sdk.ResultReason.RecognizedSpeech:
                console.log(`RECOGNIZED: Text=${result.text}`);
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
    });
});

app.listen(PORT);
console.log(`Server listening on port ${PORT}`);