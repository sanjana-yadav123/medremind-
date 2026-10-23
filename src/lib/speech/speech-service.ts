import { SupportedLocale, SUPPORTED_LANGUAGES } from '@/lib/i18n';

export interface SpeechRecognitionResult {
  transcript: string;
  matchedIntent?: 'next_dose' | 'today_schedule' | 'confirm_dose' | 'emergency_help' | 'unknown';
  confidence: number;
}

export class WebSpeechService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static audioCtx: AudioContext | null = null;

  /**
   * Play an offline soothing auditory chime (using Web Audio API)
   * Gives instant audible confirmation to elderly users without needing visual inspection
   */
  static playChime(type: 'start' | 'success' | 'alert' = 'start') {
    if (typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioContextClass();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';

      if (type === 'start') {
        // Gentle ascending two-tone chime (G4 -> C5)
        osc.frequency.setValueAtTime(392.0, now); // G4
        osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.15); // C5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'success') {
        // Melodic happy confirmation triad (C5 -> E5 -> G5)
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      } else {
        // Soft alert
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // Audio context policy safe fail
    }
  }

  static isSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  static isRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }

  /**
   * Speaks text in the user's active regional language with elderly-tuned rate and pitch
   */
  static speak(text: string, locale: SupportedLocale = 'hi'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      this.synth.cancel(); // Stop pending speech

      const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === locale) || SUPPORTED_LANGUAGES[0];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langMeta.voiceLang;
      utterance.rate = 0.88; // Comfortably paced for elderly comprehension
      utterance.pitch = 1.0;

      // Select regional voice if installed on OS
      const voices = this.synth.getVoices();
      const targetPrefix = langMeta.voiceLang.split('-')[0];
      const regionalVoice = voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));
      if (regionalVoice) {
        utterance.voice = regionalVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.synth.speak(utterance);
    });
  }

  /**
   * Listen to user's speech via microphone in their chosen regional language
   */
  static listen(locale: SupportedLocale = 'hi'): Promise<SpeechRecognitionResult> {
    return new Promise((resolve, reject) => {
      if (!this.isRecognitionSupported()) {
        reject(new Error('माइक्रोफ़ोन आवाज़ पहचान इस ब्राउज़र में समर्थित नहीं है'));
        return;
      }

      this.playChime('start');

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === locale) || SUPPORTED_LANGUAGES[0];
      recognition.lang = langMeta.voiceLang;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const result = event.results[0][0];
        const transcript = result.transcript.trim();
        const confidence = result.confidence;

        // Multilingual Conversational Intent Matching (Hindi, Bengali, Marathi, Tamil, Telugu, Gujarati, English)
        let matchedIntent: SpeechRecognitionResult['matchedIntent'] = 'unknown';

        if (
          /अगली\s*दवा|कब\s*है|next\s*medicine|next\s*dose|পরবর্তী\s*ওষুধ|पुढील\s*औषध|அடுத்த\s*மருந்து|తదుపరి\s*మందు|આગામી\s*દવા/i.test(
            transcript
          )
        ) {
          matchedIntent = 'next_dose';
        } else if (
          /आज\s*की\s*दवा|दवाइयाँ|today.*medicine|schedule|আজকের\s*ওষুধ|आजची\s*औषधे|இன்றைய\s*மருந்து|నేటి\s*మందులు|આજની\s*દવા/i.test(
            transcript
          )
        ) {
          matchedIntent = 'today_schedule';
        } else if (
          /दवा\s*ले\s*ली|खा\s*ली|took.*medicine|taken|ওষুধ\s*খেয়েছি|औषध\s*घेतले|மருந்து\s*எடுத்தேன்|మందు\s*వేశాను|દવા\s*લીધી/i.test(
            transcript
          )
        ) {
          matchedIntent = 'confirm_dose';
        } else if (
          /मदद|आपातकालीन|doctor|help|emergency|জরুরি|मदत|உதவி|సహాయం|મદદ/i.test(
            transcript
          )
        ) {
          matchedIntent = 'emergency_help';
        }

        resolve({ transcript, matchedIntent, confidence });
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          reject(new Error('माइक्रोफ़ोन की अनुमति नहीं मिली (Microphone permission denied)'));
        } else if (event.error === 'no-speech') {
          reject(new Error('कोई आवाज़ नहीं सुनाई दी (No speech detected)'));
        } else {
          reject(new Error(`आवाज़ पहचान में समस्या: ${event.error}`));
        }
      };

      recognition.start();
    });
  }
}
