'use strict';

import { v2 as cloudinary } from 'cloudinary';
import { config } from '../configs/config.js';
import fs from 'fs/promises';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const uploadImage = async (filePath, fileName) => {
  try {
    const options = {
      public_id: fileName,
      resource_type: 'image',
      overwrite: true,
    };

    if (config.cloudinary.folder) {
      options.folder = config.cloudinary.folder;
    }

    const result = await cloudinary.uploader.upload(filePath, options);

    try {
      await fs.unlink(filePath);
    } catch {
      console.warn('Warning: Could not delete local file:', filePath);
    }

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error?.message || error);

    try {
      await fs.unlink(filePath);
    } catch {
      console.warn('Warning: Could not delete local file after upload error');
    }

    throw new Error(
      `Failed to upload image to Cloudinary: ${error?.message || ''}`
    );
  }
};

export const deleteImage = async (imagePath) => {
  try {
    if (!imagePath || imagePath === config.cloudinary.defaultAvatarPath) {
      return true;
    }

    let publicId;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      const uploadMarker = '/upload/';
      const uploadIndex = imagePath.indexOf(uploadMarker);
      if (uploadIndex === -1) return false;
      let afterUpload = imagePath.slice(uploadIndex + uploadMarker.length);
      if (/^v\d+\//.test(afterUpload)) {
        afterUpload = afterUpload.replace(/^v\d+\//, '');
      }
      const lastDot = afterUpload.lastIndexOf('.');
      publicId = lastDot !== -1 ? afterUpload.slice(0, lastDot) : afterUpload;
    } else {
      const folder = config.cloudinary.folder;
      publicId = imagePath.includes('/') ? imagePath : `${folder}/${imagePath}`;
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result.result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

export const getFullImageUrl = (imagePath) => {
  if (!imagePath) {
    return getDefaultAvatarUrl();
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const baseUrl = config.cloudinary.baseUrl;
  const folder = config.cloudinary.folder;
  const pathToUse = imagePath.includes('/') ? imagePath : `${folder}/${imagePath}`;

  return `${baseUrl}${pathToUse}`;
};

export const getDefaultAvatarUrl = () => {
  const defaultPath = config.cloudinary.defaultAvatarPath;
  if (!defaultPath) return '';
  if (defaultPath.startsWith('http://') || defaultPath.startsWith('https://')) {
    return defaultPath;
  }
  return getFullImageUrl(defaultPath);
};

export const getDefaultAvatarPath = () => {
  return config.cloudinary.defaultAvatarPath;
};

export default {
  uploadImage,
  deleteImage,
  getFullImageUrl,
  getDefaultAvatarUrl,
  getDefaultAvatarPath,
};
