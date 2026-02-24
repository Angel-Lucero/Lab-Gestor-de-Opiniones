'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requestLimit } from '../../middlewares/request-limit.js';
import {
  validateCreatePost,
  validateUpdatePost,
} from '../../middlewares/validation.js';
import * as postController from './post.controller.js';

const router = Router();

router.use(validateJWT);

router.get('/', requestLimit, postController.getAllPosts);

router.get('/:id', requestLimit, postController.getPostById);

router.post('/', validateCreatePost, postController.createPost);

router.put('/:id', validateUpdatePost, postController.updatePost);

router.delete('/:id', requestLimit, postController.deletePost);

export default router;
