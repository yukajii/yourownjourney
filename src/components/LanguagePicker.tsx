import { useI18n } from "../i18n";
import { LOCALES, LOCALE_NAMES, type Locale } from "../i18n/types";

/**
 * Language override.
 *
 * The app follows the device by default, which is right for almost everyone —
 * but a device set to one language and a person who reads another is common
 * enough, especially among people who moved. "Match my device" is the default
 * rather than a fifth language, so clearing the choice is possible.
 */
const LanguagePicker = () => {
  const { override, setOverride, locale } = useI18n();
  const { t } = useI18n();

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="section-title">{t("common.language")}</span>
      <select
        value={override ?? "auto"}
        onChange={(e) =>
          setOverride(e.target.value === "auto" ? null : (e.target.value as Locale))
        }
        className="rounded border border-white/10 bg-[color:var(--surface-alt)] p-2 text-gray-100 focus:outline-none"
      >
        <option value="auto">
          {t("common.languageAuto")} — {LOCALE_NAMES[locale]}
        </option>
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguagePicker;
