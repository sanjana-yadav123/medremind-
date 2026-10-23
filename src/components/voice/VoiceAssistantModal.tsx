'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Mic, Volume2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { WebSpeechService } from '@/lib/speech/speech-service';
import { useTranslation } from '@/lib/i18n';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextMedicineName?: string;
  nextMedicineTime?: string;
  onConfirmDose?: () => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  nextMedicineName,
  nextMedicineTime,
  onConfirmDose,
}) => {
  const { locale, currentLanguage, t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [botReply, setBotReply] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const startListening = async () => {
    setErrorMessage('');
    setTranscript('');
    setBotReply('');
    setPendingAction(null);
    setIsListening(true);

    try {
      const result = await WebSpeechService.listen(locale);
      setIsListening(false);
      setTranscript(result.transcript);

      // Handle recognized conversational intent
      if (result.matchedIntent === 'next_dose') {
        let reply = '';
        if (nextMedicineName && nextMedicineTime) {
          reply =
            locale === 'en'
              ? `Your next medicine is ${nextMedicineName} scheduled for ${nextMedicineTime}.`
              : `आपकी अगली दवा ${nextMedicineName} है, जिसे ${nextMedicineTime} बजे लेना है।`;
        } else {
          reply =
            locale === 'en'
              ? 'You have no more medicines scheduled for today. Great job!'
              : 'आज के लिए आपकी कोई अगली निर्धारित दवा बाकी नहीं है। शाबाश!';
        }
        setBotReply(reply);
        await WebSpeechService.speak(reply, locale);
        WebSpeechService.playChime('success');
      } else if (result.matchedIntent === 'confirm_dose') {
        if (nextMedicineName) {
          setPendingAction('take_dose');
          const reply =
            locale === 'en'
              ? `Please confirm: Did you take ${nextMedicineName}?`
              : `क्या आप पुष्टि करते हैं कि आपने ${nextMedicineName} दवा ले ली है?`;
          setBotReply(reply);
          await WebSpeechService.speak(reply, locale);
        } else {
          setBotReply('अभी पुष्टि करने के लिए कोई आगामी दवा नहीं है।');
        }
      } else if (result.matchedIntent === 'today_schedule') {
        const reply = nextMedicineName
          ? `आज आपकी अगली दवा ${nextMedicineName} है।`
          : 'आज की सभी दवाइयाँ पूरी हो चुकी हैं।';
        setBotReply(reply);
        await WebSpeechService.speak(reply, locale);
        WebSpeechService.playChime('success');
      } else if (result.matchedIntent === 'emergency_help') {
        const reply = 'आपातकालीन सहायता के लिए 112 डायल करें या अपने संपर्क को कॉल करें।';
        setBotReply(reply);
        await WebSpeechService.speak(reply, locale);
        WebSpeechService.playChime('alert');
      } else {
        const reply = 'क्षमा करें, बात स्पष्ट नहीं हुई। कृपया दोबारा पूछें।';
        setBotReply(reply);
        await WebSpeechService.speak(reply, locale);
      }
    } catch (err: any) {
      setIsListening(false);
      setErrorMessage(err.message || 'आवाज़ पहचानने में समस्या आई');
    }
  };

  const handleExecuteConfirmedDose = () => {
    if (onConfirmDose) {
      onConfirmDose();
      setPendingAction(null);
      const msg = locale === 'en' ? 'Dose recorded successfully!' : 'दवा सफलतापूर्वक दर्ज कर ली गई है!';
      setBotReply(msg);
      WebSpeechService.speak(msg, locale);
      WebSpeechService.playChime('success');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${currentLanguage.nativeLabel} आवाज़ सहायक (Voice Assistant)`}
    >
      <div className="flex flex-col items-center text-center py-4 space-y-6">
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-full text-sm font-bold">
          <Sparkles className="w-4 h-4" />
          <span>भाषा: {currentLanguage.nativeLabel} ({currentLanguage.englishLabel})</span>
        </div>

        <p className="text-xl text-slate-700 dark:text-slate-300">
          माइक बटन दबाएँ और बोलें: <br />
          <strong className="text-emerald-800 dark:text-emerald-400">
            &ldquo;अगली दवा कब है?&rdquo;
          </strong>{' '}
          या{' '}
          <strong className="text-emerald-800 dark:text-emerald-400">
            &ldquo;दवा ले ली&rdquo;
          </strong>
        </p>

        {/* Animated Ripple Microphone Button */}
        <div className="relative flex items-center justify-center">
          {isListening && (
            <div className="absolute w-36 h-36 rounded-full bg-red-400/30 dark:bg-red-500/20 animate-ping" />
          )}
          <button
            onClick={startListening}
            disabled={isListening}
            className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-gradient-to-tr from-red-600 to-rose-500 shadow-2xl ring-8 ring-red-200 dark:ring-red-900/50 scale-105'
                : 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 active:scale-95 shadow-xl ring-6 ring-emerald-200 dark:ring-emerald-900/40'
            } text-white focus:outline-none`}
            aria-label={isListening ? 'सुन रहा हूँ...' : 'बोलने के लिए दबाएँ'}
          >
            <Mic className="w-14 h-14" />
          </button>
        </div>

        <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
          {isListening ? 'सुन रहा हूँ... बोलिए (Listening)' : 'बोलने के लिए ऊपर टैप करें'}
        </span>

        {/* User Transcript */}
        {transcript && (
          <div className="w-full p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 text-left border-2 border-emerald-300 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">आपने कहा:</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">&ldquo;{transcript}&rdquo;</p>
          </div>
        )}

        {/* Assistant Reply */}
        {botReply && (
          <div className="w-full p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/60 text-left border-2 border-emerald-500 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-sm font-bold">
              <Volume2 className="w-5 h-5" />
              <span>MedRemind सहायक:</span>
            </div>
            <p className="text-xl font-bold text-emerald-950 dark:text-emerald-100 mt-1">{botReply}</p>
          </div>
        )}

        {/* Dose Action Confirmation Card */}
        {pendingAction === 'take_dose' && (
          <div className="w-full p-5 bg-amber-50 dark:bg-amber-950/50 rounded-2xl border-2 border-amber-600 text-left space-y-3 shadow-md">
            <h4 className="text-xl font-bold text-amber-950 dark:text-amber-200">
              पुष्टि आवश्यक है: क्या आपने वास्तव में दवा ले ली है?
            </h4>
            <div className="flex gap-3">
              <Button variant="primary" size="large" onClick={handleExecuteConfirmedDose} className="flex-1">
                हाँ, ले ली (Confirm)
              </Button>
              <Button variant="secondary" size="large" onClick={() => setPendingAction(null)} className="flex-1">
                नहीं (Cancel)
              </Button>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-xl border border-red-300 text-left text-lg">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
