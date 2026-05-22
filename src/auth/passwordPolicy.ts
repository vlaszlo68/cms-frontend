import type { AuthConfig, PasswordPolicyConfig } from "../api/authApi";

export type PasswordValidationCode =
  | "TOO_SHORT"
  | "MISSING_UPPERCASE"
  | "MISSING_LOWERCASE"
  | "MISSING_DIGIT"
  | "MISSING_SPECIAL";

export type NormalizedPasswordPolicy = {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecial: boolean;
};

export type PasswordRequirement = {
  code: PasswordValidationCode;
  labelKey:
    | "passwordMinLengthRequirement"
    | "passwordUppercaseRequirement"
    | "passwordLowercaseRequirement"
    | "passwordDigitRequirement"
    | "passwordSpecialRequirement";
  isApplied: (policy: NormalizedPasswordPolicy) => boolean;
  isMet: (password: string, policy: NormalizedPasswordPolicy) => boolean;
};

export const fallbackPasswordPolicy: NormalizedPasswordPolicy = {
  minLength: 0,
  requireUppercase: false,
  requireLowercase: false,
  requireDigit: false,
  requireSpecial: false,
};

export const passwordRequirements: PasswordRequirement[] = [
  {
    code: "TOO_SHORT",
    labelKey: "passwordMinLengthRequirement",
    isApplied: (policy) => policy.minLength > 0,
    isMet: (password, policy) => password.length >= policy.minLength,
  },
  {
    code: "MISSING_UPPERCASE",
    labelKey: "passwordUppercaseRequirement",
    isApplied: (policy) => policy.requireUppercase,
    isMet: (password) => /\p{Lu}/u.test(password),
  },
  {
    code: "MISSING_LOWERCASE",
    labelKey: "passwordLowercaseRequirement",
    isApplied: (policy) => policy.requireLowercase,
    isMet: (password) => /\p{Ll}/u.test(password),
  },
  {
    code: "MISSING_DIGIT",
    labelKey: "passwordDigitRequirement",
    isApplied: (policy) => policy.requireDigit,
    isMet: (password) => /\p{N}/u.test(password),
  },
  {
    code: "MISSING_SPECIAL",
    labelKey: "passwordSpecialRequirement",
    isApplied: (policy) => policy.requireSpecial,
    isMet: (password) => /[^\p{L}\p{N}\s]/u.test(password),
  },
];

export function isPasswordValidationCode(value: string): value is PasswordValidationCode {
  return passwordRequirements.some((requirement) => requirement.code === value);
}

export function normalizePasswordPolicy(
  configOrPolicy: AuthConfig | PasswordPolicyConfig | null,
): NormalizedPasswordPolicy {
  if (!configOrPolicy) {
    return fallbackPasswordPolicy;
  }

  const policy =
    "passwordPolicy" in configOrPolicy
      ? configOrPolicy.passwordPolicy
      : configOrPolicy;

  return {
    minLength: policy?.minLength ?? fallbackPasswordPolicy.minLength,
    requireUppercase: policy?.requireUppercase ?? fallbackPasswordPolicy.requireUppercase,
    requireLowercase: policy?.requireLowercase ?? fallbackPasswordPolicy.requireLowercase,
    requireDigit: policy?.requireDigit ?? fallbackPasswordPolicy.requireDigit,
    requireSpecial: policy?.requireSpecial ?? fallbackPasswordPolicy.requireSpecial,
  };
}

export function getPasswordValidationErrors(
  password: string,
  policy: NormalizedPasswordPolicy,
) {
  return passwordRequirements
    .filter((requirement) => requirement.isApplied(policy))
    .filter((requirement) => !requirement.isMet(password, policy))
    .map((requirement) => requirement.code);
}
