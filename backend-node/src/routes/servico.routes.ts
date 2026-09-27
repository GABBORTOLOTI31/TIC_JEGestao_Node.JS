import { Router } from 'express';
import { ServicoController } from '../controllers/ServicoController';

const router = Router();
const ctrl = new ServicoController();

router.get('/', ctrl.listarTodos);
router.get('/ativos', ctrl.listarAtivos);
router.get('/busca', ctrl.buscarPorNome);
router.get('/:id', ctrl.buscarPorId);
router.post('/', ctrl.salvar);
router.put('/:id', ctrl.atualizar);
router.patch('/:id/status', ctrl.ativarDesativar);
router.delete('/:id', ctrl.deletar);

export default router;
