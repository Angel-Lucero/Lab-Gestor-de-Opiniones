import { findUserById, updateUserProfile } from './user-db.js';
import { buildUserResponse } from '../utils/user-helpers.js';
import { verifyPassword, hashPassword } from '../utils/password-utils.js';
import { uploadImage } from './cloudinary-service.js';
import path from 'path';
import crypto from 'crypto';
import { config } from '../configs/config.js';

export const getUserProfileHelper = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return buildUserResponse(user);
};

export const updateUserProfileHelper = async (userId, updateData, file) => {
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }

  const { name, surname, username, phone, currentPassword, newPassword } = updateData;

  if (username && username !== user.username) {
    const { User } = await import('../src/users/user.model.js');
    const exists = await User.findOne({ username });
    if (exists) {
      const err = new Error('El nombre de usuario ya está en uso');
      err.status = 409;
      throw err;
    }
  }

  let hashedNewPassword;
  if (newPassword) {
    if (!currentPassword) {
      const err = new Error('Debes proporcionar la contraseña actual para cambiarla');
      err.status = 400;
      throw err;
    }
    const isValid = await verifyPassword(user.password, currentPassword);
    if (!isValid) {
      const err = new Error('La contraseña actual es incorrecta');
      err.status = 401;
      throw err;
    }
    hashedNewPassword = await hashPassword(newPassword);
  }

  let profilePictureToStore = undefined;
  if (file) {
    try {
      const ext = path.extname(file.path);
      const randomHex = crypto.randomBytes(6).toString('hex');
      const cloudinaryFileName = `profile-${randomHex}${ext}`;
      profilePictureToStore = await uploadImage(file.path, cloudinaryFileName);
    } catch (err) {
      console.error('Error subiendo imagen a Cloudinary:', err);
    }
  }

  const fieldsToUpdate = {};
  if (name) fieldsToUpdate.name = name;
  if (surname) fieldsToUpdate.surname = surname;
  if (username) fieldsToUpdate.username = username;
  if (phone) fieldsToUpdate.phone = phone;
  if (hashedNewPassword) fieldsToUpdate.password = hashedNewPassword;
  if (profilePictureToStore !== undefined) fieldsToUpdate.profilePicture = profilePictureToStore;

  const updatedUser = await updateUserProfile(userId, fieldsToUpdate);
  return buildUserResponse(updatedUser);
};
