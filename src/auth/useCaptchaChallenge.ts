import { useCallback, useEffect, useRef, useState } from "react";
import * as authApi from "../api/authApi";

export function useCaptchaChallenge(errorMessage: string) {
  const [captchaId, setCaptchaId] = useState("");
  const [captchaImageUrl, setCaptchaImageUrl] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false);
  const captchaImageUrlRef = useRef("");

  const replaceCaptchaImageUrl = useCallback((nextImageUrl: string) => {
    if (captchaImageUrlRef.current) {
      URL.revokeObjectURL(captchaImageUrlRef.current);
    }

    captchaImageUrlRef.current = nextImageUrl;
    setCaptchaImageUrl(nextImageUrl);
  }, []);

  const clearCaptcha = useCallback(() => {
    setCaptchaId("");
    setCaptchaError("");
    replaceCaptchaImageUrl("");
  }, [replaceCaptchaImageUrl]);

  const loadCaptcha = useCallback(async () => {
    setIsCaptchaLoading(true);
    setCaptchaError("");

    try {
      const captcha = await authApi.getCaptcha();
      const blob = new Blob([captcha.svgText], { type: "image/svg+xml" });
      const nextImageUrl = URL.createObjectURL(blob);

      setCaptchaId(captcha.captchaId);
      replaceCaptchaImageUrl(nextImageUrl);
    } catch {
      setCaptchaId("");
      setCaptchaError(errorMessage);
    } finally {
      setIsCaptchaLoading(false);
    }
  }, [errorMessage, replaceCaptchaImageUrl]);

  useEffect(() => {
    return () => {
      if (captchaImageUrlRef.current) {
        URL.revokeObjectURL(captchaImageUrlRef.current);
        captchaImageUrlRef.current = "";
      }
    };
  }, []);

  return {
    captchaError,
    captchaId,
    captchaImageUrl,
    clearCaptcha,
    isCaptchaLoading,
    loadCaptcha,
  };
}
