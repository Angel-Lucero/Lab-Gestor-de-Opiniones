'use strict';

import mongoose from 'mongoose';
import { ADMIN_ROLE, USER_ROLE } from '../../helpers/role-constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [25, 'El nombre no puede tener más de 25 caracteres'],
    },
    surname: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true,
      maxlength: [25, 'El apellido no puede tener más de 25 caracteres'],
    },
    username: {
      type: String,
      required: [true, 'El nombre de usuario es obligatorio'],
      unique: true,
      trim: true,
      maxlength: [50, 'El nombre de usuario no puede tener más de 50 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [150, 'El correo electrónico no puede tener más de 150 caracteres'],
      match: [/^\S+@\S+\.\S+$/, 'El correo electrónico no tiene un formato válido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
    },
    phone: {
      type: String,
      required: [true, 'El número de teléfono es obligatorio'],
      match: [/^\d{8}$/, 'El número de teléfono debe tener exactamente 8 dígitos'],
    },
    profilePicture: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: [ADMIN_ROLE, USER_ROLE],
      default: USER_ROLE,
    },
    status: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationTokenExpiry: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
