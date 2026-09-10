import { Op } from "sequelize";
import { User } from "@/models";
import { ApiError } from "@/utils/apiError";
import { comparePassword } from "@/helpers/password.helper";

export const userService = {
  updateProfile: async (
    userId: string,
    updates: { fullName?: string; mobile?: string; email?: string; currentPassword?: string }
  ): Promise<User> => {
    const user = await User.findByPk(userId);
    if (!user) throw ApiError.notFound("User not found");

    if (updates.email && updates.email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const newEmail = updates.email.trim().toLowerCase();

      if (!updates.currentPassword) {
        throw ApiError.badRequest("Current password is required to change your email address");
      }

      const isValidPassword = await comparePassword(updates.currentPassword, user.password);
      if (!isValidPassword) {
        throw ApiError.badRequest("Incorrect current password. Email was not updated.");
      }

      const emailExists = await User.findOne({
        where: {
          email: newEmail,
          id: { [Op.ne]: userId },
        },
      });
      if (emailExists) {
        throw ApiError.conflict("Email address is already in use by another account");
      }

      user.email = newEmail;
    }

    if (updates.mobile && updates.mobile.trim() !== user.mobile) {
      const newMobile = updates.mobile.trim();
      const mobileExists = await User.findOne({
        where: {
          mobile: newMobile,
          id: { [Op.ne]: userId },
        },
      });
      if (mobileExists) {
        throw ApiError.conflict("Mobile number is already in use by another account");
      }
      user.mobile = newMobile;
    }

    if (updates.fullName && updates.fullName.trim()) {
      user.fullName = updates.fullName.trim();
    }

    await user.save();
    return user;
  },

  updatePhoto: async (userId: string, photoUrl: string): Promise<User> => {
    const user = await User.findByPk(userId);
    if (!user) throw ApiError.notFound("User not found");

    await user.update({ photoUrl });
    return user;
  },
};
