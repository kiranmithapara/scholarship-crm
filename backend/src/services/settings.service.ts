import { Setting } from "@/models";
import { encrypt } from "@/helpers/crypto.helper";

interface UpdateSettingsInput {
  websiteName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  firebaseStorageBucket?: string;
  allowedIps?: string[];
  defaultTheme?: "light" | "dark";
  logoUrl?: string;
}

export const settingsService = {
  /** Returns the singleton settings row, creating it with defaults if it somehow doesn't exist yet. */
  get: async (): Promise<Setting> => {
    const [settings] = await Setting.findOrCreate({ where: { id: 1 }, defaults: { id: 1 } });
    return settings;
  },

  update: async (updates: UpdateSettingsInput): Promise<Setting> => {
    const [settings] = await Setting.findOrCreate({ where: { id: 1 }, defaults: { id: 1 } });

    const { smtpPassword, ...rest } = updates;
    await settings.update({
      ...rest,
      ...(smtpPassword && { smtpPasswordEncrypted: encrypt(smtpPassword) }),
    });

    return settings;
  },
};
