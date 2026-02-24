'use strict';

import { Post } from './post.model.js';
import { Comment } from '../comments/comment.model.js';
import { asyncHandler } from '../../middlewares/server-genericError-handler.js';

export const createPost = asyncHandler(async (req, res) => {
  const { title, category, content } = req.body;
  const author = req.userId;

  const post = new Post({ title, category, content, author });
  await post.save();
  await post.populate('author', 'username name surname profilePicture');

  return res.status(201).json({
    success: true,
    message: 'Publicación creada exitosamente',
    data: post,
  });
});

export const getAllPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category } = req.query;
  const filter = {};
  if (category) filter.category = category;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Post.countDocuments(filter);

  const posts = await Post.find(filter)
    .populate('author', 'username name surname profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return res.status(200).json({
    success: true,
    data: posts,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

export const getPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await Post.findById(id).populate(
    'author',
    'username name surname profilePicture'
  );

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Publicación no encontrada',
    });
  }

  return res.status(200).json({
    success: true,
    data: post,
  });
});

export const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, category, content } = req.body;

  const post = await Post.findById(id);
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Publicación no encontrada',
    });
  }

  if (post.author.toString() !== req.userId) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para editar esta publicación',
    });
  }

  if (title !== undefined) post.title = title;
  if (category !== undefined) post.category = category;
  if (content !== undefined) post.content = content;

  await post.save();
  await post.populate('author', 'username name surname profilePicture');

  return res.status(200).json({
    success: true,
    message: 'Publicación actualizada exitosamente',
    data: post,
  });
});

export const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await Post.findById(id);
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Publicación no encontrada',
    });
  }

  if (post.author.toString() !== req.userId) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para eliminar esta publicación',
    });
  }

  await Comment.deleteMany({ post: id });

  await post.deleteOne();

  return res.status(200).json({
    success: true,
    message: 'Publicación eliminada exitosamente',
  });
});
