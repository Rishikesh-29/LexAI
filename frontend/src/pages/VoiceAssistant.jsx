import { useEffect, useState } from "react";
import api from "../services/api";

function VoiceAssistant({ documentId }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [question, setQuestion] = useState("");

  const [answer, setAnswer] = useState("");
  const [translatedAnswer, setTranslatedAnswer] = useState("");

  const [targetLanguage, setTargetLanguage] = useState("tamil");

  const [loading, setLoading] = useState(false);
  const [translationLoading, setTranslationLoading] = useState(false);

  const [error, setError] = useState("");

  const [recognition, setRecognition] = useState(null);

  // =========================================================
  // SPEECH RECOGNITION SETUP
  // =========================================================

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    const speechRecognition = new SpeechRecognition();

    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.lang = "en-IN";

    speechRecognition.onstart = () => {
      console.log("Speech recognition started");

      setIsListening(true);
      setError("");
    };

    speechRecognition.onresult = (event) => {
      const text =
        event.results[0][0].transcript;

      console.log("Speech detected:", text);

      setTranscript(text);
      setQuestion(text);
      setError("");
    };

    speechRecognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      setIsListening(false);

      if (event.error === "no-speech") {
        setError(
          "No speech detected. Please click Start Speaking and speak clearly."
        );
      } else if (event.error === "not-allowed") {
        setError(
          "Microphone permission was denied. Please allow microphone access for localhost."
        );
      } else {
        setError(
          `Microphone error: ${event.error}`
        );
      }
    };

    speechRecognition.onend = () => {
      console.log("Speech recognition ended");

      setIsListening(false);
    };

    setRecognition(speechRecognition);

    return () => {
      try {
        speechRecognition.stop();
      } catch (err) {
        console.log("Speech recognition already stopped.");
      }
    };
  }, []);

  // =========================================================
  // START LISTENING
  // =========================================================

  const startListening = async () => {
    if (!recognition) {
      setError(
        "Speech recognition is not available in this browser."
      );
      return;
    }

    setTranscript("");
    setQuestion("");
    setAnswer("");
    setTranslatedAnswer("");
    setError("");

    try {
      console.log("Starting microphone...");

      recognition.start();
    } catch (err) {
      console.error(
        "Unable to start speech recognition:",
        err
      );
    }
  };

  // =========================================================
  // STOP LISTENING
  // =========================================================

  const stopListening = () => {
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // =========================================================
  // TEXT TO SPEECH
  // =========================================================

  const speakAnswer = (text, language = "en-IN") => {
    if (!text) {
      return;
    }

    if (!window.speechSynthesis) {
      setError(
        "Text-to-speech is not supported in this browser."
      );
      return;
    }

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(text);

    speech.lang = language;
    speech.rate = 0.9;
    speech.pitch = 1;

    speech.onstart = () => {
      console.log(
        "Text-to-speech started:",
        language
      );
    };

    speech.onend = () => {
      console.log(
        "Text-to-speech completed."
      );
    };

    speech.onerror = (event) => {
      console.error(
        "Text-to-speech error:",
        event.error
      );
    };

    window.speechSynthesis.speak(speech);
  };

  // =========================================================
  // ASK LEXAI
  // =========================================================

  const askLexAI = async () => {
    if (!question.trim()) {
      setError(
        "Please ask a legal question first."
      );
      return;
    }

    if (!documentId) {
      const message =
        "Please select and analyze a legal document first. Then I can answer questions based on your document.";

      setError(message);
      setAnswer(message);

      speakAnswer(message);

      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");
    setTranslatedAnswer("");

    try {
      console.log(
        "Sending question to LexAI:",
        question
      );

      const response = await api.post(
        "/voice/ask",
        {
          document_id: documentId,
          question: question.trim(),
        }
      );

      console.log(
        "Voice API response:",
        response.data
      );

      const generatedAnswer =
        response.data?.answer ||
        "LexAI could not generate an answer.";

      setAnswer(generatedAnswer);

      // Speak English answer
      speakAnswer(
        generatedAnswer,
        "en-IN"
      );

    } catch (err) {
      console.error(
        "Voice Assistant Error:",
        err
      );

      const message =
        err.response?.data?.detail ||
        "Unable to process your question.";

      setError(
        typeof message === "string"
          ? message
          : "Unable to process your question."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // TRANSLATE ANSWER
  // =========================================================

  const translateAnswer = async () => {
    if (!answer.trim()) {
      setError(
        "Please get a LexAI response before translating."
      );
      return;
    }

    if (targetLanguage === "english") {
      setTranslatedAnswer(answer);

      speakAnswer(
        answer,
        "en-IN"
      );

      return;
    }

    setTranslationLoading(true);
    setError("");
    setTranslatedAnswer("");

    try {
      console.log(
        "Translating answer to:",
        targetLanguage
      );

      const response = await api.post(
        "/voice/translate",
        {
          text: answer,
          target_language: targetLanguage,
        }
      );

      console.log(
        "Translation response:",
        response.data
      );

      const translatedText =
        response.data?.translated_text;

      if (!translatedText) {
        throw new Error(
          "Translation response is empty."
        );
      }

      setTranslatedAnswer(
        translatedText
      );

      // =====================================================
      // SPEAK TRANSLATED TEXT
      // =====================================================

      const speechLanguage =
        getSpeechLanguage(
          targetLanguage
        );

      speakAnswer(
        translatedText,
        speechLanguage
      );

    } catch (err) {
      console.error(
        "Translation Error:",
        err
      );

      const message =
        err.response?.data?.detail ||
        err.message ||
        "Unable to translate the answer.";

      setError(
        typeof message === "string"
          ? message
          : "Unable to translate the answer."
      );
    } finally {
      setTranslationLoading(false);
    }
  };

  // =========================================================
  // SPEECH LANGUAGE MAPPING
  // =========================================================

  const getSpeechLanguage = (
    language
  ) => {
    const languageMap = {
      english: "en-IN",
      tamil: "ta-IN",
      hindi: "hi-IN",
      telugu: "te-IN",
      kannada: "kn-IN",
      malayalam: "ml-IN",
      bengali: "bn-IN",
      marathi: "mr-IN",
      gujarati: "gu-IN",
      punjabi: "pa-IN",
      urdu: "ur-IN",
    };

    return (
      languageMap[language] ||
      "en-IN"
    );
  };

  // =========================================================
  // CLEAR
  // =========================================================

  const clearConversation = () => {
    setTranscript("");
    setQuestion("");
    setAnswer("");
    setTranslatedAnswer("");
    setError("");

    window.speechSynthesis?.cancel();

    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.log(
          "Recognition already stopped."
        );
      }
    }

    setIsListening(false);
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="voice-assistant-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="voice-header">
        <div>

          <span className="section-badge">
            🎙️ AI VOICE
          </span>

          <h1>
            LexAI Voice Assistant
          </h1>

          <p>
            Ask questions about your legal
            documents using your voice.
          </p>

        </div>
      </div>

      {/* =====================================================
          VOICE CARD
      ===================================================== */}

      <div className="voice-card">

        <div className="voice-icon-wrapper">

          <div
            className={`voice-mic ${
              isListening
                ? "listening"
                : ""
            }`}
          >
            🎙️
          </div>

        </div>

        <h2>
          {isListening
            ? "Listening..."
            : "Ask LexAI"}
        </h2>

        <p className="voice-status">

          {isListening
            ? "Speak your legal question clearly."
            : "Click the microphone and start speaking."}

        </p>

        <div className="voice-buttons">

          {!isListening ? (

            <button
              className="voice-primary-button"
              onClick={startListening}
            >
              🎤 Start Speaking
            </button>

          ) : (

            <button
              className="voice-stop-button"
              onClick={stopListening}
            >
              ⏹ Stop Listening
            </button>

          )}

          <button
            className="voice-secondary-button"
            onClick={clearConversation}
          >
            Clear
          </button>

        </div>

      </div>

      {/* =====================================================
          QUESTION
      ===================================================== */}

      <div className="voice-section">

        <h2>
          📝 Your Question
        </h2>

        <textarea
          value={question}
          onChange={(e) =>
            setQuestion(e.target.value)
          }
          placeholder="Your spoken question will appear here..."
          rows={4}
        />

        {transcript && (

          <p className="voice-transcript">
            🎤 Detected speech: {transcript}
          </p>

        )}

        <button
          className="ask-lexai-button"
          onClick={askLexAI}
          disabled={loading}
        >
          {loading
            ? "🤖 Processing..."
            : "🤖 Ask LexAI"}
        </button>

      </div>

      {/* =====================================================
          LEXAI ANSWER
      ===================================================== */}

      {answer && (

        <div className="voice-answer-section">

          <div className="answer-header">

            <h2>
              🤖 LexAI Response
            </h2>

            <button
              onClick={() =>
                speakAnswer(
                  answer,
                  "en-IN"
                )
              }
              className="speak-button"
            >
              🔊 Speak English
            </button>

          </div>

          <div className="voice-answer">
            {answer}
          </div>

          <p className="legal-disclaimer">
            ⚠️ LexAI provides AI-generated
            legal information for assistance
            and educational purposes only.
            It is not a substitute for advice
            from a qualified lawyer.
          </p>

        </div>

      )}

      {/* =====================================================
          TRANSLATION
      ===================================================== */}

      {answer && (

        <div className="voice-section">

          <h2>
            🌐 Translate Response
          </h2>

          <p>
            Translate the LexAI response
            into your preferred Indian language
            and listen to it.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: "15px",
            }}
          >

            <select
              value={targetLanguage}
              onChange={(e) => {
                setTargetLanguage(
                  e.target.value
                );

                setTranslatedAnswer("");
              }}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "15px",
                minWidth: "180px",
              }}
            >

              <option value="english">
                🇬🇧 English
              </option>

              <option value="tamil">
                🇮🇳 Tamil
              </option>

              <option value="hindi">
                🇮🇳 Hindi
              </option>

              <option value="telugu">
                🇮🇳 Telugu
              </option>

              <option value="kannada">
                🇮🇳 Kannada
              </option>

              <option value="malayalam">
                🇮🇳 Malayalam
              </option>

              <option value="bengali">
                🇮🇳 Bengali
              </option>

              <option value="marathi">
                🇮🇳 Marathi
              </option>

              <option value="gujarati">
                🇮🇳 Gujarati
              </option>

              <option value="punjabi">
                🇮🇳 Punjabi
              </option>

              <option value="urdu">
                🇮🇳 Urdu
              </option>

            </select>

            <button
              className="ask-lexai-button"
              onClick={translateAnswer}
              disabled={
                translationLoading
              }
            >

              {translationLoading
                ? "🌐 Translating..."
                : "🌐 Translate & Speak"}

            </button>

          </div>

        </div>

      )}

      {/* =====================================================
          TRANSLATED ANSWER
      ===================================================== */}

      {translatedAnswer && (

        <div className="voice-answer-section">

          <div className="answer-header">

            <h2>
              🌐 Translated Response
            </h2>

            <button
              onClick={() =>
                speakAnswer(
                  translatedAnswer,
                  getSpeechLanguage(
                    targetLanguage
                  )
                )
              }
              className="speak-button"
            >
              🔊 Speak Translation
            </button>

          </div>

          <div className="voice-answer">
            {translatedAnswer}
          </div>

        </div>

      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="voice-error">
          ⚠️ {error}
        </div>

      )}

      {/* =====================================================
          DOCUMENT STATUS
      ===================================================== */}

      <div className="voice-document-status">

        <span>
          📄 Current Document
        </span>

        <strong>
          {documentId
            ? `Document #${documentId}`
            : "No document selected"}
        </strong>

      </div>

    </div>
  );
}

export default VoiceAssistant;