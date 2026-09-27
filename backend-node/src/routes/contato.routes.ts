import { Router } from 'express';
import { ContatoController } from '../controllers/ContatoController';

const router = Router();
const ctrl = new ContatoController();

router.get('/', ctrl.listarTodos);
router.get('/:id', ctrl.buscarPorId);
router.post('/', ctrl.salvar);
router.delete('/:id', ctrl.deletar);

export default router;
