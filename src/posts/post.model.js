'use strict';

import mongoose from 'mongoose';

const CATEGORIAS = [
  'Tecnología',
  'Deportes',
  'Política',
  'Entretenimiento',
  'Educación',
  'Salud',
  'General',
];

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: [200, 'El título no puede tener más de 200 caracteres'],
    },
    category: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      enum: {
        values: CATEGORIAS,
        message: 'La categoría {VALUE} no es válida',
      },
    },
    content: {
      type: String,
      required: [true, 'El contenido es obligatorio'],
      trim: true,
      maxlength: [5000, 'El contenido no puede tener más de 5000 caracteres'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El autor es obligatorio'],
    },
  },
  {
    timestamps: true,
  }
);

export const Post = mongoose.model('Post', postSchema);
export { CATEGORIAS };
