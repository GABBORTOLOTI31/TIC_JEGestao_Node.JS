import { Router } from 'express';
import { EquipamentoController } from '../controllers/EquipamentoController';

const router = Router();
const ctrl = new EquipamentoController();

router.get('/', ctrl.listarTodos);
router.get('/:id', ctrl.buscarPorId);
router.post('/', ctrl.salvar);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.deletar);

export default router;
