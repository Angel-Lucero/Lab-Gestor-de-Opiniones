'use strict';

import { User } from '../src/users/user.model.js';
import { hashPassword } from '../utils/password-utils.js';

export const findUserByEmailOrUsername = async (emailOrUsername) => {
  const query = emailOrUsername.includes('@')
    ? { email: emailOrUsername.toLowerCase() }
    : { username: emailOrUsername };
  return await User.findOne(query);
};

export const findUserById = async (userId) => {
  return await User.findById(userId);
};

export const checkUserExists = async (email, username) => {
  const user = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username }],
  });
  return !!user;
};

export const createNewUser = async (userData) => {
  const { name, surname, username, email, password, phone, profilePicture } =
    userData;

  const hashedPassword = await hashPassword(password);

  const user = new User({
    name,
    surname,
    username,
    email: email.toLowerCase(),
    password: hashedPassword,
    phone,
    profilePicture: profilePicture || null,
    role: 'USER_ROLE',
    status: false,
    emailVerified: false,
  });

  await user.save();
  return user;
};

export const findUserByEmail = async (email) => {
  return await User.findOne({ email: email.toLowerCase() });
};

export const updateEmailVerificationToken = async (userId, token, expiry) => {
  return await User.findByIdAndUpdate(
    userId,
    { emailVerificationToken: token, emailVerificationTokenExpiry: expiry },
    { new: true }
  );
};

export const markEmailAsVerified = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      emailVerified: true,
      status: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null,
    },
    { new: true }
  );
};

export const findUserByEmailVerificationToken = async (token) => {
  return await User.findOne({
    emailVerificationToken: token,
    emailVerificationTokenExpiry: { $gt: new Date() },
  });
};

export const updatePasswordResetToken = async (userId, token, expiry) => {
  return await User.findByIdAndUpdate(
    userId,
    { passwordResetToken: token, passwordResetTokenExpiry: expiry },
    { new: true }
  );
};

export const findUserByPasswordResetToken = async (token) => {
  return await User.findOne({
    passwordResetToken: token,
    passwordResetTokenExpiry: { $gt: new Date() },
  });
};

export const updateUserPassword = async (userId, hashedPassword) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
    },
    { new: true }
  );
};

export const updateUserProfile = async (userId, updateData) => {
  const allowedFields = ['name', 'surname', 'username', 'phone', 'profilePicture', 'password'];
  const filtered = {};
  for (const key of allowedFields) {
    if (updateData[key] !== undefined) {
      filtered[key] = updateData[key];
    }
  }

  return await User.findByIdAndUpdate(userId, filtered, {
    new: true,
    runValidators: true,
  });
};
