import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const ctrl = new AuthController();

// Rotas públicas de autenticação
router.post('/login', ctrl.login);
router.post('/registrar', ctrl.registrar);

export default router;
