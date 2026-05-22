import ButtonLabel from "../ui/ButtonLabel";
import { usePreferences } from "../../preferences/PreferencesContext";

type CaptchaFieldProps = {
  captchaError: string;
  captchaImageUrl: string;
  isCaptchaLoading: boolean;
  onAnswerChange: (value: string) => void;
  onRefresh: () => void;
  value: string;
};

export default function CaptchaField({
  captchaError,
  captchaImageUrl,
  isCaptchaLoading,
  onAnswerChange,
  onRefresh,
  value,
}: CaptchaFieldProps) {
  const { t } = usePreferences();

  return (
    <div className="captcha-field">
      <div className="captcha-field__heading">
        <span>{t("captchaAnswer")}</span>
        <button
          className="secondary-button captcha-refresh"
          disabled={isCaptchaLoading}
          onClick={onRefresh}
          type="button"
        >
          <ButtonLabel icon="refresh">{t("refreshCaptcha")}</ButtonLabel>
        </button>
      </div>
      <div className="captcha-row">
        <div className="captcha-image">
          {captchaImageUrl ? (
            <img alt={t("captchaImageAlt")} src={captchaImageUrl} />
          ) : (
            <span>{isCaptchaLoading ? t("loading") : t("captchaUnavailable")}</span>
          )}
        </div>
        <input
          autoComplete="off"
          inputMode="numeric"
          name="captchaAnswer"
          onChange={(event) => onAnswerChange(event.target.value)}
          required
          type="text"
          value={value}
        />
      </div>
      {captchaError && <div className="field-error">{captchaError}</div>}
    </div>
  );
}
