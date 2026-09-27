import { Router } from 'express';
import { SolicitacaoServicoController } from '../controllers/SolicitacaoServicoController';

const router = Router();
const ctrl = new SolicitacaoServicoController();

router.get('/', ctrl.listarTodas);
router.get('/status', ctrl.listarPorStatus);
router.get('/:id', ctrl.buscarPorId);
router.post('/', ctrl.salvar);
router.patch('/:id/status', ctrl.atualizarStatus);

export default router;
