import type { NormalizedPasswordPolicy, PasswordValidationCode } from "../../auth/passwordPolicy";
import { passwordRequirements } from "../../auth/passwordPolicy";
import { usePreferences } from "../../preferences/PreferencesContext";

type PasswordRequirementsProps = {
  password: string;
  passwordPolicy: NormalizedPasswordPolicy;
  passwordErrors: PasswordValidationCode[];
};

export default function PasswordRequirements({
  password,
  passwordErrors,
  passwordPolicy,
}: PasswordRequirementsProps) {
  const { t } = usePreferences();
  const passwordErrorSet = new Set(passwordErrors);
  const visibleRequirements = passwordRequirements.filter(
    (requirement) =>
      requirement.isApplied(passwordPolicy) || passwordErrorSet.has(requirement.code),
  );

  if (visibleRequirements.length === 0) {
    return null;
  }

  return (
    <div className="password-requirements" aria-label={t("passwordRequirements")}>
      {visibleRequirements.map((requirement) => {
        const isMet = requirement.isMet(password, passwordPolicy);
        const hasBackendError = passwordErrorSet.has(requirement.code);
        const label =
          requirement.code === "TOO_SHORT"
            ? t(requirement.labelKey).replace("8", String(passwordPolicy.minLength))
            : t(requirement.labelKey);

        return (
          <span
            className={
              isMet && !hasBackendError
                ? "password-requirement password-requirement--met"
                : "password-requirement"
            }
            key={requirement.code}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
