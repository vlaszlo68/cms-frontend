export interface SiteSettings {
  siteName: string;
  logoMediaId?: number;
  footerText?: string;
  contactEmail?: string;
  phone?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
}

export type SaveSiteSettingsRequest = {
  siteName: string;
  logoMediaId: number | null;
  footerText: string | null;
  contactEmail: string | null;
  phone: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
};
