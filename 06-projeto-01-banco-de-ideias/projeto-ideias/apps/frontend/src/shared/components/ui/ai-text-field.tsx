'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { Check, Loader2, Mic, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { AUTH_COOKIE_NAME } from '@/modules/auth';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { AiApiError, generateAiText, transcribeAiAudio } from '@/shared/api/ai.api';
import { getMessage } from '@/shared/i18n';
import { cn } from '@/shared/lib/class-name.util';

export interface AiContextField {
  label: string;
  value: string;
  required?: boolean;
}

export interface AiTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  prompt: string;
  contextFields?: AiContextField[];
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  onAfterGenerate?: (value: string) => void;
}

const REFINE_INSTRUCTION =
  'Refine o conteúdo atual fornecido como contexto principal, preservando a ' +
  'intenção e as informações do autor. Não descarte o texto nem comece do ' +
  'zero — apenas melhore clareza, coesão e correção.';

const WAVE_BARS = 14;
const IDLE_LEVELS = Array.from({ length: WAVE_BARS }, () => 0.12);

function pickAudioExtension(mimeType: string): string {
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4') || mimeType.includes('mpeg')) return 'mp4';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

function appendTranscription(current: string, addition: string): string {
  const trimmedAddition = addition.trim();
  if (!trimmedAddition) return current;
  const base = current.replace(/\s+$/, '');
  return base.length > 0 ? `${base} ${trimmedAddition}` : trimmedAddition;
}

export default function AiTextField({
  value,
  onChange,
  prompt,
  contextFields = [],
  multiline = false,
  rows = 4,
  placeholder,
  id,
  name,
  disabled = false,
  className,
  onAfterGenerate,
}: AiTextFieldProps) {
  const [open, setOpen] = useState(false);
  const [userInstruction, setUserInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [levels, setLevels] = useState<number[]>(IDLE_LEVELS);

  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);

  const isRefine = value.trim().length > 0;
  const actionLabel = isRefine ? 'Refinar' : 'Gerar';

  const pendingRequired = contextFields
    .filter((field) => field.required && !field.value.trim())
    .map((field) => field.label);
  const hasPending = pendingRequired.length > 0;

  const busy = disabled || loading || transcribing;

  const releaseMedia = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setLevels(IDLE_LEVELS);
  }, []);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch {
          /* ignore */
        }
      }
      releaseMedia();
    };
  }, [releaseMedia]);

  function buildContext(): string | undefined {
    const blocks: string[] = [];
    const current = value.trim();
    if (current) {
      blocks.push(
        `Conteúdo atual (refine este texto, preservando a intenção do autor):\n"""\n${current}\n"""`,
      );
    }
    for (const field of contextFields) {
      const fieldValue = field.value.trim();
      if (fieldValue) {
        blocks.push(`${field.label}: ${fieldValue}`);
      }
    }
    return blocks.length > 0 ? blocks.join('\n\n') : undefined;
  }

  function buildInstruction(): string | undefined {
    const parts: string[] = [];
    if (isRefine) parts.push(REFINE_INSTRUCTION);
    const typed = userInstruction.trim();
    if (typed) parts.push(typed);
    return parts.length > 0 ? parts.join('\n\n') : undefined;
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      const token = Cookies.get(AUTH_COOKIE_NAME) ?? '';
      const text = await generateAiText(token, {
        prompt,
        context: buildContext(),
        instruction: buildInstruction(),
      });
      onChange(text);
      onAfterGenerate?.(text);
      setUserInstruction('');
      setOpen(false);
    } catch (error) {
      if (error instanceof AiApiError) {
        error.codes.forEach((code) => toast.error(getMessage(code)));
      } else {
        toast.error(getMessage('ai.generate.failed'));
      }
    } finally {
      setLoading(false);
    }
  }

  function startVisualizer(stream: MediaStream) {
    try {
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const context = new AudioCtx();
      audioContextRef.current = context;
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const step = Math.max(1, Math.floor(data.length / WAVE_BARS));
      const tick = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(data);
        const next: number[] = [];
        for (let i = 0; i < WAVE_BARS; i += 1) {
          const raw = data[i * step] ?? 0;
          next.push(Math.max(0.12, Math.min(1, raw / 220)));
        }
        setLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      /* visualizer is optional */
    }
  }

  async function applyTranscription(blob: Blob, mimeType: string) {
    setTranscribing(true);
    try {
      const token = Cookies.get(AUTH_COOKIE_NAME) ?? '';
      const fileName = `audio.${pickAudioExtension(mimeType)}`;
      const text = await transcribeAiAudio(token, blob, fileName);
      const next = appendTranscription(valueRef.current, text);
      if (next !== valueRef.current) {
        onChangeRef.current(next);
      }
      toast.success('Áudio transcrito.');
    } catch (error) {
      if (error instanceof AiApiError) {
        error.codes.forEach((code) => toast.error(getMessage(code)));
      } else {
        toast.error(getMessage('ai.transcribe.failed'));
      }
    } finally {
      setTranscribing(false);
    }
  }

  async function handleStartRecording() {
    if (busy || recording) return;
    const supported =
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined';
    if (!supported) {
      toast.error('Gravação de áudio não é suportada neste navegador.');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error('Não foi possível acessar o microfone.');
      return;
    }

    streamRef.current = stream;
    cancelledRef.current = false;
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const wasCancelled = cancelledRef.current;
      const chunks = chunksRef.current;
      chunksRef.current = [];
      const mimeType = recorder.mimeType || 'audio/webm';
      releaseMedia();
      setRecording(false);
      if (wasCancelled || chunks.length === 0) return;
      const blob = new Blob(chunks, { type: mimeType });
      void applyTranscription(blob, mimeType);
    };

    recorder.start();
    setRecording(true);
    startVisualizer(stream);
  }

  function stopRecorder(cancelled: boolean) {
    cancelledRef.current = cancelled;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      releaseMedia();
      setRecording(false);
    }
  }

  const fieldClassName = 'pr-20';
  const fieldDisabled = disabled || loading || recording || transcribing;
  const overlayVisible = recording || transcribing;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="relative">
        {multiline ? (
          <Textarea
            id={id}
            name={name}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={rows}
            placeholder={placeholder}
            disabled={fieldDisabled}
            className={fieldClassName}
          />
        ) : (
          <Input
            id={id}
            name={name}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={fieldDisabled}
            className={fieldClassName}
          />
        )}

        {overlayVisible && (
          <div
            className={cn(
              'absolute inset-0 flex items-center gap-3 rounded-md border border-sky-200 bg-sky-50/95 px-3',
              multiline ? 'items-start py-2' : '',
            )}
          >
            <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center">
              {transcribing ? (
                <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
              ) : (
                <>
                  <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-sky-300/60" />
                  <Mic className="relative h-5 w-5 text-sky-600" />
                </>
              )}
            </span>

            <div className="flex h-8 flex-1 items-center gap-[3px] overflow-hidden">
              {transcribing ? (
                <span className="text-xs text-sky-700">
                  Transcrevendo áudio…
                </span>
              ) : (
                levels.map((level, index) => (
                  <span
                    key={index}
                    className="w-[3px] rounded-full bg-sky-400 transition-[height] duration-100"
                    style={{ height: `${Math.round(level * 100)}%` }}
                  />
                ))
              )}
            </div>

            {!transcribing && (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-sky-700 hover:bg-sky-100 hover:text-sky-900"
                  onClick={() => stopRecorder(true)}
                  aria-label="Cancelar gravação"
                  title="Cancelar"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-sky-700 hover:bg-sky-100 hover:text-sky-900"
                  onClick={() => stopRecorder(false)}
                  aria-label="Confirmar gravação"
                  title="Confirmar"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {!overlayVisible && (
          <div className="absolute right-2 top-2 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sky-600 hover:bg-sky-50 hover:text-sky-700"
              disabled={busy}
              onClick={handleStartRecording}
              aria-label="Gravar áudio"
              title="Gravar áudio"
            >
              <Mic className="h-4 w-4" />
            </Button>

            {hasPending ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-flex">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        disabled
                        aria-label={`${actionLabel} com IA`}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Preencha antes: {pendingRequired.join(', ')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    disabled={busy}
                    aria-label={`${actionLabel} com IA`}
                    title={`${actionLabel} com IA`}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`${id ?? name ?? 'ai'}-instruction`}>
                        Instrução adicional (opcional)
                      </Label>
                      <Textarea
                        id={`${id ?? name ?? 'ai'}-instruction`}
                        value={userInstruction}
                        onChange={(event) =>
                          setUserInstruction(event.target.value)
                        }
                        rows={3}
                        placeholder="Ex.: foque no público iniciante"
                        disabled={loading}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleGenerate}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Gerando…
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          {actionLabel}
                        </>
                      )}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}
      </div>

      {loading && <p className="text-xs text-muted-foreground">Gerando…</p>}
    </div>
  );
}

export { AiTextField };
