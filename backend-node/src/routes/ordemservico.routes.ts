import { Router } from 'express';
import { OrdemDeServicoController } from '../controllers/OrdemDeServicoController';

const router = Router();
const ctrl = new OrdemDeServicoController();

router.get('/', ctrl.listarTodas);
router.get('/:id', ctrl.buscarPorId);
router.post('/', ctrl.criar);
router.patch('/:id/status', ctrl.atualizarStatus);
router.post('/:id/materiais', ctrl.adicionarMaterial);
router.post('/:id/checklist', ctrl.definirChecklist);
router.delete('/:id', ctrl.deletar);

export default router;
