import { useState } from "react";
import { ApiError } from "../../api/httpClient";
import * as mediaApi from "../../api/mediaApi";
import ButtonLabel from "../ui/ButtonLabel";
import type { Media } from "../../models/media";
import { usePreferences } from "../../preferences/PreferencesContext";

type MediaUploadDialogProps = {
  onClose: () => void;
  onUploadSuccess: (media: Media) => void;
};

export default function MediaUploadDialog({ onClose, onUploadSuccess }: MediaUploadDialogProps) {
  const { t } = usePreferences();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!file) {
      setError(t("uploadFileRequired"));
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const uploadedMedia = await mediaApi.uploadMedia(file, description);
      onUploadSuccess(uploadedMedia);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : t("mediaCouldNotBeUploaded"),
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-dialog">
        <div>
          <h3>{t("uploadMedia")}</h3>
          <p>{t("uploadMediaDescription")}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="user-form">
          <label>
            {t("uploadFile")}
            <input
              accept="*/*"
              disabled={isUploading}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              type="file"
            />
          </label>

          <label>
            {t("uploadDescription")}
            <textarea
              disabled={isUploading}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
        </div>

        <div className="confirm-dialog__actions">
          <button className="secondary-button" disabled={isUploading} onClick={onClose} type="button">
            <ButtonLabel icon="cancel">{t("cancel")}</ButtonLabel>
          </button>
          <button className="button-link" disabled={isUploading} onClick={handleSubmit} type="button">
            <ButtonLabel icon="create">
              {isUploading ? t("saving") : t("uploadMedia")}
            </ButtonLabel>
          </button>
        </div>
      </div>
    </div>
  );
}
