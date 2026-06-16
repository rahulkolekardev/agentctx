import { Router } from 'express';
import { listUsers } from '../services/users';

export const userRouter = Router();
userRouter.get('/', (_req, res) => res.json(listUsers()));
