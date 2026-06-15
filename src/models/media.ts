export type MediaStorageType = "FILESYSTEM" | "DATABASE" | "MINIO" | "S3";

export interface Media {
  id: number;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  description?: string;
  storageType: MediaStorageType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
