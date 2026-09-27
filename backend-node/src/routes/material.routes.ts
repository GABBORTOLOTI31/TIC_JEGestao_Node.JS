import { Router } from 'express';
import { MaterialController } from '../controllers/MaterialController';

const router = Router();
const ctrl = new MaterialController();

router.get('/', ctrl.listarTodos);
router.get('/busca', ctrl.buscarPorDescricao);
router.get('/:id', ctrl.buscarPorId);
router.post('/', ctrl.salvar);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.deletar);

export default router;
