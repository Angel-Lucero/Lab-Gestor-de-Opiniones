import crypto from 'crypto';
import {
  checkUserExists,
  createNewUser,
  findUserByEmailOrUsername,
  updateEmailVerificationToken,
  markEmailAsVerified,
  findUserByEmail,
  updatePasswordResetToken,
  updateUserPassword,
  findUserByEmailVerificationToken,
  findUserByPasswordResetToken,
} from './user-db.js';
import {
  generateEmailVerificationToken,
  generatePasswordResetToken,
} from '../utils/auth-helpers.js';
import { verifyPassword } from '../utils/password-utils.js';
import { buildUserResponse } from '../utils/user-helpers.js';
import { sendVerificationEmail } from './email-service.js';
import { generateJWT } from './generate-jwt.js';
import { uploadImage } from './cloudinary-service.js';
import { config } from '../configs/config.js';

const getExpirationTime = (timeString) => {
  const timeValue = parseInt(timeString);
  const timeUnit = timeString.replace(timeValue.toString(), '');
  switch (timeUnit) {
    case 's': return timeValue * 1000;
    case 'm': return timeValue * 60 * 1000;
    case 'h': return timeValue * 60 * 60 * 1000;
    case 'd': return timeValue * 24 * 60 * 60 * 1000;
    default:  return 30 * 60 * 1000;
  }
};

export const registerUserHelper = async (userData) => {
  try {
    const { email, username, password, name, surname, phone, profilePicture } = userData;

    const userExists = await checkUserExists(email, username);
    if (userExists) {
      throw new Error('Ya existe un usuario con este email o nombre de usuario');
    }

    let profilePictureToStore = profilePicture;
    if (profilePicture) {
      const uploadPath = config.upload.uploadPath;
      const normalizedPicture = profilePicture.replace(/\\/g, '/');
      const isLocalFile =
        normalizedPicture.includes('uploads/') ||
        (uploadPath && normalizedPicture.includes(uploadPath.replace(/\\/g, '/'))) ||
        normalizedPicture.startsWith('./');

      if (isLocalFile) {
        try {
          const randomHex = crypto.randomBytes(6).toString('hex');
          const cloudinaryFileName = `profile-${randomHex}`;
          profilePictureToStore = await uploadImage(normalizedPicture, cloudinaryFileName);
        } catch (err) {
          console.error('Error subiendo imagen a Cloudinary en registro:', err);
          profilePictureToStore = null;
        }
      } else {
        try {
          const baseUrl = config.cloudinary.baseUrl || '';
          const folder = config.cloudinary.folder || '';
          let normalized = profilePicture;
          if (normalized.startsWith(baseUrl)) normalized = normalized.slice(baseUrl.length);
          if (folder && normalized.startsWith(`${folder}/`)) normalized = normalized.slice(folder.length + 1);
          profilePictureToStore = normalized.split('/').pop();
        } catch (normErr) {
          console.warn('No se pudo normalizar la ruta de la imagen:', normErr);
          profilePictureToStore = null;
        }
      }
    }

    const newUser = await createNewUser({
      name, surname, username, email, password, phone,
      profilePicture: profilePictureToStore,
    });

    const verificationToken = await generateEmailVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await updateEmailVerificationToken(newUser._id, verificationToken, tokenExpiry);

    Promise.resolve()
      .then(() => sendVerificationEmail(email, name, verificationToken))
      .catch((err) => console.error('Error enviando email de verificación:', err));

    return {
      success: true,
      user: buildUserResponse(newUser),
      message: 'Usuario registrado exitosamente. Por favor, verifica tu email para activar la cuenta.',
      emailVerificationRequired: true,
    };
  } catch (error) {
    console.error('Error en registro:', error);
    throw error;
  }
};

export const loginUserHelper = async (emailOrUsername, password) => {
  try {
    const user = await findUserByEmailOrUsername(emailOrUsername);

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const isValidPassword = await verifyPassword(user.password, password);
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    if (!user.emailVerified) {
      throw new Error(
        'Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada o reenvía el email de verificación.'
      );
    }

    if (!user.status) {
      throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
    }

    const token = await generateJWT(user._id.toString(), { role: user.role });

    const expiresInMs = getExpirationTime(process.env.JWT_EXPIRES_IN || '30m');
    const expiresAt = new Date(Date.now() + expiresInMs);

    const fullUser = buildUserResponse(user);
    const userDetails = {
      id: fullUser.id,
      username: fullUser.username,
      profilePicture: fullUser.profilePicture,
      role: fullUser.role,
    };

    return {
      success: true,
      message: 'Login exitoso',
      token,
      userDetails,
      expiresAt,
    };
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
};

export const verifyEmailHelper = async (token) => {
  try {
    if (!token || typeof token !== 'string' || token.length < 40) {
      throw new Error('Token inválido para verificación de email');
    }

    const user = await findUserByEmailVerificationToken(token);
    if (!user) {
      throw new Error('Usuario no encontrado o token inválido');
    }

    if (user.emailVerified) {
      throw new Error('El email ya ha sido verificado');
    }

    await markEmailAsVerified(user._id);

    Promise.resolve()
      .then(async () => {
        const { sendWelcomeEmail } = await import('./email-service.js');
        return sendWelcomeEmail(user.email, user.name);
      })
      .catch((emailError) => console.error('Error enviando email de bienvenida:', emailError));

    return {
      success: true,
      message: 'Email verificado exitosamente. Ya puedes iniciar sesión.',
      data: { email: user.email, verified: true },
    };
  } catch (error) {
    console.error('Error verificando email:', error);
    throw error;
  }
};

export const resendVerificationEmailHelper = async (email) => {
  try {
    const user = await findUserByEmail(email.toLowerCase());

    if (!user) {
      return { success: false, message: 'Usuario no encontrado', data: { email, sent: false } };
    }

    if (user.emailVerified) {
      return { success: false, message: 'El email ya ha sido verificado', data: { email: user.email, verified: true } };
    }

    const verificationToken = await generateEmailVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await updateEmailVerificationToken(user._id, verificationToken, tokenExpiry);

    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
      return { success: true, message: 'Email de verificación enviado exitosamente', data: { email: user.email, sent: true } };
    } catch (emailError) {
      console.error('Error enviando email de verificación:', emailError);
      return { success: false, message: 'Error al enviar el email de verificación. Por favor, intenta nuevamente más tarde.', data: { email: user.email, sent: false } };
    }
  } catch (error) {
    console.error('Error en resendVerificationEmailHelper:', error);
    return { success: false, message: 'Error interno del servidor', data: { email, sent: false } };
  }
};

export const forgotPasswordHelper = async (email) => {
  try {
    const user = await findUserByEmail(email.toLowerCase());

    if (!user) {
      return { success: true, message: 'Si el email existe, se ha enviado un enlace de recuperación', data: { email, initiated: true } };
    }

    const resetToken = await generatePasswordResetToken();
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await updatePasswordResetToken(user._id, resetToken, tokenExpiry);

    const { sendPasswordResetEmail } = await import('./email-service.js');
    Promise.resolve()
      .then(() => sendPasswordResetEmail(user.email, user.name, resetToken))
      .catch((emailError) => console.error(`Error enviando email de reset a ${email}:`, emailError));

    return { success: true, message: 'Si el email existe, se ha enviado un enlace de recuperación', data: { email, initiated: true } };
  } catch (error) {
    console.error('Error en forgotPasswordHelper:', error);
    return { success: true, message: 'Si el email existe, se ha enviado un enlace de recuperación', data: { email, initiated: true } };
  }
};

export const resetPasswordHelper = async (token, newPassword) => {
  try {
    if (!token || typeof token !== 'string' || token.length < 40) {
      throw new Error('Token inválido para reset de contraseña');
    }

    const user = await findUserByPasswordResetToken(token);
    if (!user) {
      throw new Error('Usuario no encontrado o token inválido');
    }

    if (!user.passwordResetToken) {
      throw new Error('Token de reset inválido o ya utilizado');
    }

    const { hashPassword } = await import('../utils/password-utils.js');
    const hashedPassword = await hashPassword(newPassword);

    await updateUserPassword(user._id, hashedPassword);

    Promise.resolve()
      .then(async () => {
        const { sendPasswordChangedEmail } = await import('./email-service.js');
        return sendPasswordChangedEmail(user.email, user.name);
      })
      .catch((emailError) => console.error('Error enviando email de cambio de contraseña:', emailError));

    return { success: true, message: 'Contraseña actualizada exitosamente', data: { email: user.email, reset: true } };
  } catch (error) {
    console.error('Error en resetPasswordHelper:', error);
    throw error;
  }
};
