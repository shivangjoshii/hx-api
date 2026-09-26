import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { generateOTP } from '../utils/otpGenerator.js';
import { generateTokens } from '../middleware/auth.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../config/mailer.js';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && !existingUser.isGuest) {
      throw ApiError.conflict('User with this email already exists');
    }

    const otp = generateOTP(6);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    let user;
    if (existingUser && existingUser.isGuest) {
      existingUser.name = name;
      existingUser.password = password;
      existingUser.isGuest = false;
      existingUser.isEmailVerified = false;
      existingUser.verificationOtp = otp;
      existingUser.verificationOtpExpiresAt = otpExpires;
      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        verificationOtp: otp,
        verificationOtpExpiresAt: otpExpires,
        isEmailVerified: false
      });
    }

    await sendVerificationEmail(user.email, otp, user.name);

    const { accessToken, refreshToken } = generateTokens(user._id);

    return ApiResponse.created(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          isGuest: user.isGuest,
          totalXp: user.totalXp,
          level: user.level,
          streakCurrent: user.streakCurrent
        },
        tokens: {
          accessToken,
          refreshToken
        }
      },
      'Registration successful. Verification OTP sent to your email.'
    );
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.isEmailVerified) {
      return ApiResponse.success(res, { isEmailVerified: true }, 'Email already verified');
    }

    if (!user.verificationOtp || user.verificationOtp !== otp) {
      throw ApiError.badRequest('Invalid verification code');
    }

    if (user.verificationOtpExpiresAt && user.verificationOtpExpiresAt < new Date()) {
      throw ApiError.badRequest('Verification code has expired. Please request a new one.');
    }

    user.isEmailVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpiresAt = null;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    return ApiResponse.success(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: true,
          totalXp: user.totalXp,
          level: user.level,
          streakCurrent: user.streakCurrent
        },
        tokens: {
          accessToken,
          refreshToken
        }
      },
      'Email verified successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const resendVerificationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.isEmailVerified) {
      return ApiResponse.success(res, null, 'Email is already verified');
    }

    const otp = generateOTP(6);
    user.verificationOtp = otp;
    user.verificationOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, otp, user.name);

    return ApiResponse.success(res, null, 'Verification code sent to your email');
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.isGuest) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    return ApiResponse.success(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          isGuest: user.isGuest,
          totalXp: user.totalXp,
          level: user.level,
          streakCurrent: user.streakCurrent,
          streakLongest: user.streakLongest,
          preferences: user.preferences,
          onboarding: user.onboarding,
          isPro: user.isPro
        },
        tokens: {
          accessToken,
          refreshToken
        }
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

export const guestLogin = async (req, res, next) => {
  try {
    const guestId = `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const guestEmail = `${guestId}@habitx.local`;

    const user = await User.create({
      name: 'Focus Guest',
      email: guestEmail,
      isGuest: true,
      isEmailVerified: true
    });

    const { accessToken, refreshToken } = generateTokens(user._id);

    return ApiResponse.created(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isGuest: true,
          isEmailVerified: false,
          totalXp: user.totalXp,
          level: user.level,
          streakCurrent: user.streakCurrent,
          preferences: user.preferences
        },
        tokens: {
          accessToken,
          refreshToken
        }
      },
      'Guest session created'
    );
  } catch (error) {
    next(error);
  }
};

export const oauthLogin = async (req, res, next) => {
  try {
    const { provider, token, name, email, providerId } = req.body;

    if (!email) {
      throw ApiError.badRequest('Email is required for social login');
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name: name || 'Focus Champion',
        email: email.toLowerCase(),
        avatar: '',
        googleId: provider === 'google' ? providerId : undefined,
        appleId: provider === 'apple' ? providerId : undefined,
        isEmailVerified: true
      });
    } else {
      if (provider === 'google' && !user.googleId) user.googleId = providerId;
      if (provider === 'apple' && !user.appleId) user.appleId = providerId;
      user.isEmailVerified = true;
      await user.save();
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    return ApiResponse.success(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          isGuest: user.isGuest,
          totalXp: user.totalXp,
          level: user.level,
          streakCurrent: user.streakCurrent,
          preferences: user.preferences
        },
        tokens: {
          accessToken,
          refreshToken
        }
      },
      'OAuth login successful'
    );
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return ApiResponse.success(res, null, 'If that email is registered, a reset code was sent.');
    }

    const otp = generateOTP(6);
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(user.email, otp, user.name);

    return ApiResponse.success(res, null, 'Password reset code sent to your email');
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
      throw ApiError.badRequest('Invalid reset code');
    }

    if (user.resetPasswordOtpExpiresAt && user.resetPasswordOtpExpiresAt < new Date()) {
      throw ApiError.badRequest('Reset code has expired');
    }

    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpiresAt = null;
    await user.save();

    return ApiResponse.success(res, null, 'Password reset successful. You can now login.');
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: incomingToken } = req.body;

    if (!incomingToken) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    const decoded = jwt.verify(incomingToken, ENV.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const tokens = generateTokens(user._id);

    return ApiResponse.success(res, { tokens }, 'Tokens refreshed successfully');
  } catch (error) {
    next(ApiError.unauthorized('Invalid or expired refresh token'));
  }
};
