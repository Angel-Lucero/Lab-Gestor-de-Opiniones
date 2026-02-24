'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requestLimit } from '../../middlewares/request-limit.js';
import {
  validateCreateComment,
  validateUpdateComment,
} from '../../middlewares/validation.js';
import * as commentController from './comment.controller.js';

const router = Router();

router.use(validateJWT);

router.get('/user/:userId', requestLimit, commentController.getCommentsByUser);

router.post('/:postId', validateCreateComment, commentController.createComment);

router.get('/:postId', requestLimit, commentController.getCommentsByPost);

router.put('/:id', validateUpdateComment, commentController.updateComment);

router.delete('/:id', requestLimit, commentController.deleteComment);

export default router;
