import { Router } from 'express';
import { parseOrThrow } from '../../lib/validate';
import { currentUser, requireAuth } from '../../middleware/auth';
import { loginSchema, registerSchema } from './auth.schemas';
import * as authService from './auth.service';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const input = parseOrThrow(registerSchema, req.body);
  const result = await authService.register(input);
  res.status(201).json(result);
});

authRouter.post('/login', async (req, res) => {
  const input = parseOrThrow(loginSchema, req.body);
  const result = await authService.login(input);
  res.status(200).json(result);
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.status(200).json({ user: authService.toPublicUser(currentUser(req)) });
});
