import {
  getFullImageUrl,
  getDefaultAvatarPath,
} from '../helpers/cloudinary-service.js';

export const buildUserResponse = (user) => {
  const profilePictureUrl = user.profilePicture
    ? getFullImageUrl(user.profilePicture)
    : getFullImageUrl(getDefaultAvatarPath());

  return {
    id: user._id,
    name: user.name,
    surname: user.surname,
    username: user.username,
    email: user.email,
    phone: user.phone || '',
    profilePicture: profilePictureUrl,
    role: user.role || 'USER_ROLE',
    status: user.status,
    isEmailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
