'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertTriangle, Info, PencilLine } from 'lucide-react';

export type ShowAlertOptions = {
  title?: string;
  message: string;
  okLabel?: string;
};

export type ShowConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
};

export type ShowPromptOptions = {
  title?: string;
  message?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export type AppDialogsApi = {
  showAlert: (opts: ShowAlertOptions) => Promise<void>;
  showConfirm: (opts: ShowConfirmOptions) => Promise<boolean>;
  showPrompt: (opts: ShowPromptOptions) => Promise<string | null>;
};

type DialogState =
  | { kind: 'idle' }
  | { kind: 'alert'; title?: string; message: string; okLabel: string; resolve: () => void }
  | {
      kind: 'confirm';
      title?: string;
      message: string;
      confirmLabel: string;
      cancelLabel: string;
      variant: 'default' | 'danger';
      resolve: (v: boolean) => void;
    }
  | {
      kind: 'prompt';
      title?: string;
      message?: string;
      defaultValue: string;
      confirmLabel: string;
      cancelLabel: string;
      resolve: (v: string | null) => void;
    };

const noop = async () => {};
const noopConfirm = async () => false;
const noopPrompt = async () => null;

const apiRef: { current: AppDialogsApi } = {
  current: {
    showAlert: noop,
    showConfirm: noopConfirm,
    showPrompt: noopPrompt,
  },
};

export function showAppAlert(opts: ShowAlertOptions) {
  return apiRef.current.showAlert(opts);
}

export function showAppConfirm(opts: ShowConfirmOptions) {
  return apiRef.current.showConfirm(opts);
}

export function showAppPrompt(opts: ShowPromptOptions) {
  return apiRef.current.showPrompt(opts);
}

const DialogsContext = createContext<AppDialogsApi | null>(null);

export function useAppDialogs(): AppDialogsApi {
  const ctx = useContext(DialogsContext);
  return ctx ?? apiRef.current;
}

export default function AppDialogsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>({ kind: 'idle' });
  const [promptDraft, setPromptDraft] = useState('');
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);

  const close = useCallback(() => {
    setState({ kind: 'idle' });
  }, []);

  const showAlert = useCallback((opts: ShowAlertOptions) => {
    return new Promise<void>((resolve) => {
      setState({
        kind: 'alert',
        title: opts.title,
        message: opts.message,
        okLabel: opts.okLabel ?? 'Got it',
        resolve,
      });
    });
  }, []);

  const showConfirm = useCallback((opts: ShowConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        kind: 'confirm',
        title: opts.title,
        message: opts.message,
        confirmLabel: opts.confirmLabel ?? 'Confirm',
        cancelLabel: opts.cancelLabel ?? 'Cancel',
        variant: opts.variant ?? 'default',
        resolve,
      });
    });
  }, []);

  const showPrompt = useCallback((opts: ShowPromptOptions) => {
    return new Promise<string | null>((resolve) => {
      const dv = opts.defaultValue ?? '';
      setPromptDraft(dv);
      setState({
        kind: 'prompt',
        title: opts.title,
        message: opts.message,
        defaultValue: dv,
        confirmLabel: opts.confirmLabel ?? 'Save',
        cancelLabel: opts.cancelLabel ?? 'Cancel',
        resolve,
      });
    });
  }, []);

  const api = useMemo<AppDialogsApi>(
    () => ({ showAlert, showConfirm, showPrompt }),
    [showAlert, showConfirm, showPrompt]
  );

  useEffect(() => {
    apiRef.current = api;
    return () => {
      apiRef.current = {
        showAlert: noop,
        showConfirm: noopConfirm,
        showPrompt: noopPrompt,
      };
    };
  }, [api]);

  useEffect(() => {
    if (state.kind !== 'prompt') return;
    const t = requestAnimationFrame(() => promptInputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [state]);

  useEffect(() => {
    if (state.kind === 'idle') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (state.kind === 'alert') {
          state.resolve();
          close();
        } else if (state.kind === 'confirm') {
          state.resolve(false);
          close();
        } else if (state.kind === 'prompt') {
          state.resolve(null);
          close();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state, close]);

  const finishAlert = () => {
    if (state.kind === 'alert') {
      state.resolve();
      close();
    }
  };

  const finishConfirm = (v: boolean) => {
    if (state.kind === 'confirm') {
      state.resolve(v);
      close();
    }
  };

  const finishPrompt = (v: string | null) => {
    if (state.kind === 'prompt') {
      state.resolve(v);
      close();
    }
  };

  if (state.kind === 'idle') {
    return (
      <DialogsContext.Provider value={api}>
        {children}
      </DialogsContext.Provider>
    );
  }

  const isDanger = state.kind === 'confirm' && state.variant === 'danger';
  const iconWrap =
    state.kind === 'alert'
      ? 'bg-sky-50 text-sky-600 ring-1 ring-sky-100'
      : state.kind === 'prompt'
        ? 'bg-violet-50 text-violet-600 ring-1 ring-violet-100'
        : isDanger
          ? 'bg-red-50 text-red-600 ring-1 ring-red-100'
          : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100';

  const confirmPrimary =
    state.kind === 'confirm' && isDanger
      ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'
      : 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600';

  return (
    <DialogsContext.Provider value={api}>
      {children}
      <div
        className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/45 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:pb-4"
        role="presentation"
      >
        <button
          type="button"
          className="absolute inset-0 cursor-default"
          aria-label="Close"
          onClick={() => {
            if (state.kind === 'alert') finishAlert();
            else if (state.kind === 'confirm') finishConfirm(false);
            else if (state.kind === 'prompt') finishPrompt(null);
          }}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-dialog-title"
          className="relative z-10 w-full max-w-md animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="overflow-hidden rounded-t-3xl border border-slate-200/90 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/[0.04] sm:rounded-2xl">
            <div className="flex gap-4 p-5 sm:p-6">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconWrap}`}
                aria-hidden
              >
                {state.kind === 'alert' ? (
                  <Info className="h-6 w-6" strokeWidth={2} />
                ) : state.kind === 'prompt' ? (
                  <PencilLine className="h-6 w-6" strokeWidth={2} />
                ) : (
                  <AlertTriangle className="h-6 w-6" strokeWidth={2} />
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2
                  id="app-dialog-title"
                  className="text-base font-semibold leading-snug tracking-tight text-slate-900 sm:text-lg"
                >
                  {state.kind === 'alert'
                    ? state.title ?? 'Notice'
                    : state.kind === 'prompt'
                      ? state.title ?? 'Edit'
                      : state.title ?? 'Please confirm'}
                </h2>
                {state.kind === 'prompt' && state.message ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{state.message}</p>
                ) : state.kind !== 'prompt' ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
                    {state.kind === 'alert' || state.kind === 'confirm' ? state.message : null}
                  </p>
                ) : null}
                {state.kind === 'prompt' ? (
                  <textarea
                    ref={promptInputRef}
                    value={promptDraft}
                    onChange={(e) => setPromptDraft(e.target.value)}
                    rows={4}
                    className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 shadow-inner outline-none ring-emerald-500/30 transition focus:border-emerald-400 focus:bg-white focus:ring-2"
                  />
                ) : null}
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/90 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              {state.kind === 'alert' ? (
                <button
                  type="button"
                  onClick={finishAlert}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto sm:px-6 sm:py-2.5"
                >
                  {state.okLabel}
                </button>
              ) : state.kind === 'confirm' ? (
                <>
                  <button
                    type="button"
                    onClick={() => finishConfirm(false)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto sm:px-5 sm:py-2.5"
                  >
                    {state.cancelLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => finishConfirm(true)}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-sm sm:w-auto sm:px-5 sm:py-2.5 ${confirmPrimary}`}
                  >
                    {state.confirmLabel}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => finishPrompt(null)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto sm:px-5 sm:py-2.5"
                  >
                    {state.cancelLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => finishPrompt(promptDraft)}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 sm:w-auto sm:px-5 sm:py-2.5"
                  >
                    {state.confirmLabel}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DialogsContext.Provider>
  );
}
