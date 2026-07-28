/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  /**
   * URL of the reflection Worker. Public by design — it is only an address.
   * The OpenAI key is never exposed here: anything prefixed VITE_ is compiled
   * into the bundle and served to every visitor.
   */
  readonly VITE_REFLECTION_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Fired by Chromium browsers when the app meets the installability criteria. */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
  appinstalled: Event;
}
