import { User } from "@/models";
import { ApiError } from "@/utils/apiError";

export const userService = {
  updateProfile: async (userId: string, updates: { fullName?: string; mobile?: string }): Promise<User> => {
    const user = await User.findByPk(userId);
    if (!user) throw ApiError.notFound("User not found");

    await user.update(updates);
    return user;
  },

  updatePhoto: async (userId: string, photoUrl: string): Promise<User> => {
    const user = await User.findByPk(userId);
    if (!user) throw ApiError.notFound("User not found");

    await user.update({ photoUrl });
    return user;
  },
};
