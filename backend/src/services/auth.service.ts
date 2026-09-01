import { Op } from "sequelize";
import { User, Otp } from "@/models";
import { ApiError } from "@/utils/apiError";
import { hashPassword, comparePassword } from "@/helpers/password.helper";
import { generateOtp, getOtpExpiry } from "@/helpers/otp.helper";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/helpers/jwt.helper";
import { mailService } from "./mail.service";
import type { UserRole } from "@/models/User";

interface RegisterInput {
  fullName: string;
  mobile: string;
  email: string;
  username: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function buildTokens(user: User, rememberMe = false): AuthTokens {
  const payload = { id: user.id, role: user.role as UserRole, email: user.email };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload, rememberMe),
  };
}

export const authService = {
  /**
   * Step 1 of registration - creates an inactive-until-verified account and fires off an OTP.
   * Every new registration becomes a Referral Admin (Super Admins are only created via seeder/
   * by another Super Admin - never through public self-registration).
   */
  register: async (input: RegisterInput): Promise<{ email: string }> => {
    const existing = await User.findOne({
      where: { [Op.or]: [{ email: input.email }, { username: input.username }, { mobile: input.mobile }] },
    });

    if (existing) {
      if (existing.email === input.email) throw ApiError.conflict("Email is already registered");
      if (existing.username === input.username) throw ApiError.conflict("Username is already taken");
      throw ApiError.conflict("Mobile number is already registered");
    }

    const hashedPassword = await hashPassword(input.password);

    await User.create({
      fullName: input.fullName,
      mobile: input.mobile,
      email: input.email,
      username: input.username,
      password: hashedPassword,
      role: "referral_admin",
      isActive: true,
      isEmailVerified: false,
    });

    const otp = generateOtp();
    await Otp.create({ email: input.email, code: otp, purpose: "email_verification", expiresAt: getOtpExpiry() });
    await mailService.sendOtpEmail(input.email, otp, "email_verification");

    return { email: input.email };
  },

  /** Step 2 of registration - verifies the OTP, marks email verified, and logs the user straight in. */
  verifyOtp: async (email: string, code: string): Promise<{ user: User } & AuthTokens> => {
    const otpRecord = await Otp.findOne({
      where: { email, code, purpose: "email_verification", isUsed: false, expiresAt: { [Op.gt]: new Date() } },
      order: [["createdAt", "DESC"]],
    });

    if (!otpRecord) throw ApiError.badRequest("OTP is invalid or has expired");

    const user = await User.findOne({ where: { email } });
    if (!user) throw ApiError.notFound("Account not found");

    await Promise.all([user.update({ isEmailVerified: true }), otpRecord.update({ isUsed: true })]);

    const tokens = buildTokens(user);
    return { user, ...tokens };
  },

  /** Resends a fresh OTP for email verification - old unused OTPs are simply superseded (expiresAt check handles it). */
  resendOtp: async (email: string): Promise<void> => {
    const user = await User.findOne({ where: { email } });
    if (!user) throw ApiError.notFound("Account not found");
    if (user.isEmailVerified) throw ApiError.badRequest("Email is already verified");

    const otp = generateOtp();
    await Otp.create({ email, code: otp, purpose: "email_verification", expiresAt: getOtpExpiry() });
    await mailService.sendOtpEmail(email, otp, "email_verification");
  },

  /**
   * Login - returns tokens + user on success.
   * Throws ApiError on any failure; the CONTROLLER is responsible for logging the attempt
   * (success or failure) to login_logs, since only it has access to the Request object.
   */
  login: async (email: string, password: string, rememberMe: boolean): Promise<{ user: User } & AuthTokens> => {
    const user = await User.findOne({ where: { email } });
    if (!user) throw ApiError.unauthorized("Invalid email or password");

    if (!user.isActive) throw ApiError.forbidden("Your account has been blocked. Please contact the administrator.");

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) throw ApiError.unauthorized("Invalid email or password");

    if (!user.isEmailVerified) throw ApiError.forbidden("Please verify your email before logging in");

    await user.update({ lastLoginAt: new Date() });

    const tokens = buildTokens(user, rememberMe);
    return { user, ...tokens };
  },

  /** Step 1 of password reset - always responds the same way whether or not the email exists (prevents user enumeration). */
  forgotPassword: async (email: string): Promise<void> => {
    const user = await User.findOne({ where: { email } });
    if (!user) return; // silent no-op - controller always returns a generic success message

    const otp = generateOtp();
    await Otp.create({ email, code: otp, purpose: "forgot_password", expiresAt: getOtpExpiry() });
    await mailService.sendOtpEmail(email, otp, "forgot_password");
  },

  /** Step 2 of password reset - verifies OTP and sets the new password. */
  resetPassword: async (email: string, code: string, newPassword: string): Promise<void> => {
    const otpRecord = await Otp.findOne({
      where: { email, code, purpose: "forgot_password", isUsed: false, expiresAt: { [Op.gt]: new Date() } },
      order: [["createdAt", "DESC"]],
    });
    if (!otpRecord) throw ApiError.badRequest("OTP is invalid or has expired");

    const user = await User.findOne({ where: { email } });
    if (!user) throw ApiError.notFound("Account not found");

    const hashedPassword = await hashPassword(newPassword);
    await Promise.all([user.update({ password: hashedPassword }), otpRecord.update({ isUsed: true })]);
  },

  /** Issues a new access token from a valid, non-expired refresh token. */
  refreshAccessToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Refresh token is invalid or has expired");
    }

    const user = await User.findByPk(payload.id);
    if (!user || !user.isActive) throw ApiError.unauthorized("Account is no longer valid");

    const accessToken = signAccessToken({ id: user.id, role: user.role as UserRole, email: user.email });
    return { accessToken };
  },

  getById: async (id: string): Promise<User> => {
    const user = await User.findByPk(id);
    if (!user) throw ApiError.notFound("User not found");
    return user;
  },

  changePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    const user = await User.findByPk(userId);
    if (!user) throw ApiError.notFound("User not found");

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) throw ApiError.badRequest("Current password is incorrect");

    const hashedPassword = await hashPassword(newPassword);
    await user.update({ password: hashedPassword });
  },
};
