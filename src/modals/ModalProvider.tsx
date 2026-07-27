import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export interface PromptOptions {
  title: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  /** Render a textarea instead of a single-line input. */
  multiline?: boolean;
  /** Allow submitting an empty value (notes are optional, goal names are not). */
  allowEmpty?: boolean;
}

export interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ModalCtx {
  show: (content: React.ReactNode) => void;
  hide: () => void;
  /** Resolves with the entered text, or null if dismissed. */
  prompt: (options: PromptOptions) => Promise<string | null>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /**
   * Opens an arbitrary form and resolves with whatever it passes to `done`,
   * or with `cancelValue` if the user dismisses it. Backdrop click and Escape
   * settle it like any other dialog.
   */
  custom: <T>(
    render: (done: (value: T) => void) => React.ReactNode,
    cancelValue: T
  ) => Promise<T>;
}

const Ctx = createContext<ModalCtx | null>(null);

export const ModalProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [content, setContent] = useState<React.ReactNode>(null);
  /** What an outstanding prompt/confirm should settle with if dismissed. */
  const pending = useRef<{ resolve: (value: never) => void; cancelValue: unknown } | null>(null);

  const settle = (value: unknown) => {
    const open = pending.current;
    pending.current = null;
    setContent(null);
    open?.resolve(value as never);
  };

  const hide = () => settle(pending.current?.cancelValue);

  /* Escape closes whatever is open, matching the backdrop click. */
  useEffect(() => {
    if (!content) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(pending.current?.cancelValue);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [content]);

  function openDialog<T>(
    render: (done: (value: T) => void) => React.ReactNode,
    cancelValue: T
  ): Promise<T> {
    return new Promise<T>((resolve) => {
      pending.current = { resolve: resolve as (value: never) => void, cancelValue };
      setContent(render((value) => settle(value)));
    });
  }

  const value: ModalCtx = {
    show: (c) => {
      pending.current = null;
      setContent(c);
    },
    hide,
    prompt: (options) =>
      openDialog<string | null>((done) => <PromptDialog options={options} done={done} />, null),
    confirm: (options) =>
      openDialog<boolean>((done) => <ConfirmDialog options={options} done={done} />, false),
    custom: openDialog,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      {content && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onMouseDown={hide}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="card w-full max-w-md space-y-4"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {content}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
};

const PromptDialog: React.FC<{
  options: PromptOptions;
  done: (value: string | null) => void;
}> = ({ options, done }) => {
  const [value, setValue] = useState(options.defaultValue ?? '');
  const field = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    field.current?.focus();
    field.current?.select();
  }, []);

  const trimmed = value.trim();
  const canSubmit = options.allowEmpty || trimmed.length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) done(trimmed);
  };

  const fieldClass =
    'w-full rounded-md border border-white/10 bg-[color:var(--surface-alt)] p-2 ' +
    'text-gray-100 placeholder:text-gray-500 focus:border-[color:var(--accent)] focus:outline-none';

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-semibold">{options.title}</h2>
      {options.label && <p className="text-sm text-gray-400">{options.label}</p>}

      {options.multiline ? (
        <textarea
          ref={field as React.Ref<HTMLTextAreaElement>}
          rows={3}
          value={value}
          placeholder={options.placeholder}
          onChange={(e) => setValue(e.target.value)}
          className={fieldClass}
        />
      ) : (
        <input
          ref={field as React.Ref<HTMLInputElement>}
          value={value}
          placeholder={options.placeholder}
          onChange={(e) => setValue(e.target.value)}
          className={fieldClass}
        />
      )}

      <div className="flex gap-2">
        <button type="button" onClick={() => done(null)} className="btn btn-outline flex-1">
          Cancel
        </button>
        <button type="submit" disabled={!canSubmit} className="btn btn-green flex-1">
          {options.confirmLabel ?? 'Save'}
        </button>
      </div>
    </form>
  );
};

const ConfirmDialog: React.FC<{
  options: ConfirmOptions;
  done: (value: boolean) => void;
}> = ({ options, done }) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold">{options.title}</h2>
    {options.body && <p className="text-sm text-gray-400">{options.body}</p>}

    <div className="flex gap-2">
      <button onClick={() => done(false)} className="btn btn-outline flex-1">
        Cancel
      </button>
      <button
        autoFocus
        onClick={() => done(true)}
        className={`btn flex-1 ${options.danger ? 'btn-red' : 'btn-green'}`}
      >
        {options.confirmLabel ?? 'OK'}
      </button>
    </div>
  </div>
);

export const useModal = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useModal must be inside ModalProvider');
  return ctx;
};
