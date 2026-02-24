'use strict';

import { Comment } from './comment.model.js';
import { Post } from '../posts/post.model.js';
import { asyncHandler } from '../../middlewares/server-genericError-handler.js';

export const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const author = req.userId;

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Publicación no encontrada',
    });
  }

  const comment = new Comment({ content, author, post: postId });
  await comment.save();
  await comment.populate('author', 'username name surname profilePicture');

  return res.status(201).json({
    success: true,
    message: 'Comentario creado exitosamente',
    data: comment,
  });
});

export const getCommentsByPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Publicación no encontrada',
    });
  }

  const comments = await Comment.find({ post: postId })
    .populate('author', 'username name surname profilePicture')
    .sort({ createdAt: 1 });

  return res.status(200).json({
    success: true,
    data: comments,
    total: comments.length,
  });
});

export const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const comment = await Comment.findById(id);
  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comentario no encontrado',
    });
  }

  if (comment.author.toString() !== req.userId) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para editar este comentario',
    });
  }

  comment.content = content;
  await comment.save();
  await comment.populate('author', 'username name surname profilePicture');

  return res.status(200).json({
    success: true,
    message: 'Comentario actualizado exitosamente',
    data: comment,
  });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comment = await Comment.findById(id);
  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comentario no encontrado',
    });
  }

  if (comment.author.toString() !== req.userId) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para eliminar este comentario',
    });
  }

  await comment.deleteOne();

  return res.status(200).json({
    success: true,
    message: 'Comentario eliminado exitosamente',
  });
});

export const getCommentsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const comments = await Comment.find({ author: userId })
    .populate('author', 'username name surname profilePicture')
    .populate('post', 'title category')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: comments,
    total: comments.length,
  });
});
