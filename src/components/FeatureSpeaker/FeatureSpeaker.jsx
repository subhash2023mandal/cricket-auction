import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Volume2, VolumeX } from 'lucide-react';
import './FeatureSpeaker.css';

// High-energy, commentator-style walk-through of the dashboard. We keep the
// narration as PLAIN text only — `SpeechSynthesisUtterance` (the local
// fallback) ignores SSML, so it needs a tag-free version. For the cloud Polly
// path we chunk this plain script on sentence boundaries and then wrap each
// chunk in a tiny SSML envelope at fetch time (see `wrapChunkAsSsml`).
// Wrapping per-chunk keeps the energetic <prosody> baseline applied without
// ever splitting SSML tags across chunk boundaries.
const FEATURE_SCRIPT_PLAIN = [
  "Paddles up, folks — welcome to the Volt Premier League auction floor, powered by VoltMoney!",
  "Six franchises. One trophy. Endless drama!",
  "On the left, meet the contenders — Voltage Vipers, Thunder Titans, Surge Strikers, Plasma Panthers, Circuit Spartans, and Neon Knights — each loaded with a one hundred crore war chest and a twelve-player squad limit!",
  "Center stage — that's where the magic happens! The player on the block, their role, their base price, and live Hinglish reactions firing off as the bids fly!",
  "On the right, the bidding panel is your weapon — tap, raise, dominate! The bid history and top bids cards track every twist, every counter, every record-breaking number!",
  "Just below, the upcoming queue gives you the inside scoop — who's stepping up next!",
  "Up top in the navbar, you've got total control — browse every team and squad, dive into player stats, mark anyone sold or unsold, reshuffle the pool, add a fresh player on the fly, or hit reset to start over!",
  "Did a player go unsold? No problem — they roll straight into a second round for one more shot at glory!",
  "And when the auction dust settles, the real war begins — head to Tournaments for the full group stage, fiery semi-finals, and a blockbuster final! Ball-by-ball scoring, toss controls, live standings — every run, every wicket, right here!",
  "Once a day, smash that Go Live button to launch the auction with a full-blown celebration!",
  "This is your VoltMoney auction dashboard. Lock in. Let the bidding war begin!",
].join(' ');

// ── Cloud TTS (guaranteed Indian accent) ────────────────────────────────────
// StreamElements proxies Amazon Polly voices for free with CORS enabled. We
// use "Raveena" — Polly's Indian English (en-IN) female voice — so the tour
// always sounds Indian regardless of which voices the user's OS has installed.
const TTS_ENDPOINT = 'https://api.streamelements.com/kappa/v2/speech';
const TTS_VOICE = 'Raveena';
// Polly accepts up to ~3000 chars but the proxy is happier with shorter
// requests. We chunk on sentence boundaries so each audio segment starts
// cleanly with an intonation reset.
const TTS_CHUNK_LIMIT = 280;

function chunkScript(text, limit = TTS_CHUNK_LIMIT) {
  // Split on the Hindi danda (।), full stop, exclamation, or question mark,
  // keeping the delimiter attached to the preceding clause.
  const sentences = text.match(/[^।.!?]+[।.!?]+\s*/g) ?? [text];
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    if ((current + sentence).length > limit && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// Defensive XML escape — our script doesn't contain any of these characters,
// but if anyone ever adds an ampersand or angle bracket to FEATURE_SCRIPT_PLAIN
// we don't want it to corrupt the SSML envelope sent to Polly.
function escapeForSsml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Wrap a single plain-text chunk in a minimal SSML envelope. Polly via
// StreamElements accepts SSML when wrapped in <speak>. The <prosody> bump
// gives Raveena a brisker, more commentator-like delivery. We deliberately
// keep the envelope tight (no inline <emphasis>/<break> tags) so chunking
// remains a pure sentence-level split and there's zero risk of splitting an
// SSML tag across requests.
function wrapChunkAsSsml(chunk) {
  return `<speak><prosody rate="108%" pitch="+4%">${escapeForSsml(chunk)}</prosody></speak>`;
}

async function fetchChunkAudio(chunk, signal) {
  const url = `${TTS_ENDPOINT}?voice=${encodeURIComponent(
    TTS_VOICE,
  )}&text=${encodeURIComponent(wrapChunkAsSsml(chunk))}`;
  const resp = await fetch(url, { signal });
  if (!resp.ok) throw new Error(`TTS request failed: ${resp.status}`);
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}

// ── Local Web Speech fallback ───────────────────────────────────────────────
function hasSpeechSynthesis() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

// Prefer an Indian-English voice for the English script, falling back to
// Hindi voices (which still carry an Indian accent when reading English) and
// finally to any English voice. We match by both known voice names (across
// macOS / iOS / Windows / Chrome) and BCP-47 language codes, so the picker
// still works even on platforms whose voice lists contain unexpected branding.
function pickIndianVoice(voices) {
  if (!voices?.length) return null;
  const preferences = [
    // macOS / iOS — Veena is en-IN female, Rishi is en-IN male.
    (v) => /^Veena$/i.test(v.name),
    (v) => /^Rishi$/i.test(v.name),
    // Windows Indian English
    (v) => /Microsoft Heera/i.test(v.name),
    (v) => /Microsoft Ravi/i.test(v.name),
    (v) => /Microsoft Prabhat/i.test(v.name),
    // Chrome's bundled Google Indian English voice
    (v) => /Google.*Indian English/i.test(v.name),
    // Any remaining en-IN voice
    (v) => v.lang === 'en-IN',
    // Hindi fallbacks — still an Indian accent when reading English.
    (v) => /^Lekha$/i.test(v.name),
    // Windows Hindi
    (v) => /Microsoft Madhur/i.test(v.name),
    (v) => /Microsoft Kalpana/i.test(v.name),
    (v) => /Microsoft Swara/i.test(v.name),
    (v) => /Microsoft Hemant/i.test(v.name),
    // Chrome's bundled Google Hindi voices
    (v) => /Google.*हिन्दी/i.test(v.name),
    (v) => /Google.*Hindi/i.test(v.name),
    (v) => v.lang === 'hi-IN',
    (v) => v.lang?.toLowerCase().startsWith('hi'),
    // Last resort — any English voice so we at least produce sound.
    (v) => v.lang?.toLowerCase().startsWith('en'),
  ];
  for (const match of preferences) {
    const found = voices.find(match);
    if (found) return found;
  }
  return voices[0];
}

// ── Component ───────────────────────────────────────────────────────────────
export default function FeatureSpeaker() {
  const supported = hasSpeechSynthesis();
  // 'idle' → button enabled, ready to start
  // 'loading' → cloud TTS audio is being fetched
  // 'speaking' → narration is currently playing
  const [status, setStatus] = useState('idle');

  // Cache of audio object-URLs (per chunk) so replaying the tour doesn't
  // re-fetch from the network. Lives for the lifetime of the component.
  const audioUrlsRef = useRef(null);
  const currentAudioRef = useRef(null);
  const abortRef = useRef(null);
  const voicesRef = useRef([]);
  // Marker used to abort an in-flight cloud playback when the user hits stop
  // (or when the component unmounts mid-tour).
  const playbackTokenRef = useRef(0);

  useEffect(() => {
    if (!supported) return undefined;
    const synth = window.speechSynthesis;
    const refresh = () => {
      voicesRef.current = synth.getVoices();
    };
    refresh();
    synth.addEventListener?.('voiceschanged', refresh);
    return () => synth.removeEventListener?.('voiceschanged', refresh);
  }, [supported]);

  // Cleanup on unmount — pause any audio, cancel any speech, revoke blob URLs.
  useEffect(() => {
    return () => {
      playbackTokenRef.current += 1;
      abortRef.current?.abort();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
      }
      if (audioUrlsRef.current) {
        audioUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        audioUrlsRef.current = null;
      }
      if (supported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          /* ignore */
        }
      }
    };
  }, [supported]);

  const stop = useCallback(() => {
    playbackTokenRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (supported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
    setStatus('idle');
  }, [supported]);

  // Play a pre-fetched queue of audio URLs sequentially. Uses a token captured
  // at start time so a stale audio.onended firing after the user stopped (or
  // restarted) playback can't push us back into the 'speaking' state.
  const playAudioQueue = useCallback((urls) => {
    const token = ++playbackTokenRef.current;
    let idx = 0;
    setStatus('speaking');

    const playNext = () => {
      if (token !== playbackTokenRef.current) return;
      if (idx >= urls.length) {
        currentAudioRef.current = null;
        setStatus('idle');
        return;
      }
      const audio = new Audio(urls[idx++]);
      currentAudioRef.current = audio;
      audio.onended = playNext;
      audio.onerror = () => {
        if (token !== playbackTokenRef.current) return;
        currentAudioRef.current = null;
        setStatus('idle');
      };
      const playPromise = audio.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          if (token !== playbackTokenRef.current) return;
          currentAudioRef.current = null;
          setStatus('idle');
        });
      }
    };

    playNext();
  }, []);

  // Last-resort fallback that uses whatever voice the browser ships. Still
  // tries hard to land on an Indian voice via pickIndianVoice.
  const playLocalFallback = useCallback(() => {
    if (!supported) {
      setStatus('idle');
      window.alert(
        'Speech synthesis is not supported in this browser. Try Chrome, Edge, or Safari.',
      );
      return;
    }
    const synth = window.speechSynthesis;
    try {
      synth.cancel();
    } catch {
      /* ignore */
    }
    const utterance = new window.SpeechSynthesisUtterance(FEATURE_SCRIPT_PLAIN);
    const voice = pickIndianVoice(voicesRef.current);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'en-IN';
    }
    // Nudge rate/pitch up a touch to match the commentator-style script —
    // SpeechSynthesisUtterance can't render the SSML prosody we send to Polly,
    // so we approximate the same energy boost here.
    utterance.rate = 1.08;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    const token = ++playbackTokenRef.current;
    utterance.onend = () => {
      if (token === playbackTokenRef.current) setStatus('idle');
    };
    utterance.onerror = () => {
      if (token === playbackTokenRef.current) setStatus('idle');
    };
    setStatus('speaking');
    synth.speak(utterance);
  }, [supported]);

  const start = useCallback(async () => {
    // Cached cloud audio from a previous run — play instantly.
    if (audioUrlsRef.current) {
      playAudioQueue(audioUrlsRef.current);
      return;
    }

    setStatus('loading');
    const controller = new AbortController();
    abortRef.current = controller;
    const token = ++playbackTokenRef.current;

    try {
      // Chunk the PLAIN script (not the SSML-wrapped form) so the regex never
      // splits inside an SSML tag — fetchChunkAudio adds the per-chunk envelope.
      const chunks = chunkScript(FEATURE_SCRIPT_PLAIN);
      // Fetch all chunks in parallel — total latency is ~one round-trip
      // rather than O(chunks).
      const urls = await Promise.all(
        chunks.map((chunk) => fetchChunkAudio(chunk, controller.signal)),
      );

      // If the user hit stop while we were waiting, throw the audio away.
      if (token !== playbackTokenRef.current) {
        urls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }

      audioUrlsRef.current = urls;
      playAudioQueue(urls);
    } catch (err) {
      if (err?.name === 'AbortError' || token !== playbackTokenRef.current) {
        return; // user-initiated cancel — nothing to do
      }
      // Cloud TTS unavailable (offline, blocked, rate-limited, etc.).
      // Quietly fall back to the local Web Speech voice so the tour still
      // plays — just without the guaranteed Indian-accent voice.
      // eslint-disable-next-line no-console
      console.warn(
        '[tour] cloud TTS unavailable, falling back to local Web Speech voice',
        err,
      );
      playLocalFallback();
    } finally {
      abortRef.current = null;
    }
  }, [playAudioQueue, playLocalFallback]);

  const toggle = useCallback(() => {
    if (status === 'idle') start();
    else stop();
  }, [status, start, stop]);

  const isLoading = status === 'loading';
  const isSpeaking = status === 'speaking';

  const ariaLabel = isLoading
    ? 'Loading dashboard tour audio'
    : isSpeaking
      ? 'Stop the dashboard tour'
      : 'Hear a quick Indian-English tour of the dashboard';

  return (
    <button
      type="button"
      className={`feature-speaker-btn ${isSpeaking ? 'is-speaking' : ''} ${
        isLoading ? 'is-loading' : ''
      }`}
      onClick={toggle}
      // While loading, swallow extra clicks rather than queueing a fetch+stop.
      // Stopping is allowed though, which is why we don't `disabled` here —
      // we let the toggle handler decide.
      aria-pressed={isSpeaking}
      aria-busy={isLoading}
      aria-label={ariaLabel}
      title={
        isLoading
          ? 'Loading voice…'
          : isSpeaking
            ? 'Stop the tour'
            : 'Hear a quick tour of the dashboard — Indian English voice'
      }
    >
      {isLoading ? (
        <Loader2 size={16} className="feature-speaker-btn__spinner" />
      ) : isSpeaking ? (
        <VolumeX size={16} />
      ) : (
        <Volume2 size={16} />
      )}
      <span className="feature-speaker-btn__label">
        {isLoading ? 'Loading…' : isSpeaking ? 'Stop' : 'Tour'}
      </span>
      {isSpeaking && (
        <span className="feature-speaker-btn__bars" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
      )}
    </button>
  );
}
