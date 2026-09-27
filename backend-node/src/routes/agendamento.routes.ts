import { Router } from 'express';
import { AgendamentoController } from '../controllers/AgendamentoController';

const router = Router();
const ctrl = new AgendamentoController();

router.get('/', ctrl.listarTodos);
router.get('/:id', ctrl.buscarPorId);
router.post('/', ctrl.salvar);
router.put('/:id', ctrl.atualizar);
router.patch('/:id/status', ctrl.atualizarStatus);
router.delete('/:id', ctrl.deletar);

export default router;
