export interface Settings {
  id: number;
  websiteName: string;
  logoUrl: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  firebaseStorageBucket: string | null;
  allowedIps: string[];
  defaultTheme: "light" | "dark";
  updatedAt: string;
}

export interface UpdateSettingsInput {
  websiteName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  firebaseStorageBucket?: string;
  allowedIps?: string[];
  defaultTheme?: "light" | "dark";
}
