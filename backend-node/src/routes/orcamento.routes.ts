import { Router } from 'express';
import { OrcamentoController } from '../controllers/OrcamentoController';

const router = Router();
const ctrl = new OrcamentoController();

router.get('/', ctrl.listarTodos);
router.get('/status', ctrl.listarPorStatus);
router.get('/:id', ctrl.buscarPorId);
router.post('/', ctrl.salvar);
router.patch('/:id/status', ctrl.atualizarStatus);

export default router;
