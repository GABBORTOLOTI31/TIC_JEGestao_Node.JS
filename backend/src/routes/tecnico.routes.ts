import { Router } from 'express';
import { TecnicoController } from '../controllers/TecnicoController';

const router = Router();
const tecnicoController = new TecnicoController();

router.get('/', tecnicoController.listarTodos);
router.get('/ativos', tecnicoController.listarAtivos);
router.get('/busca', tecnicoController.buscarPorNome);
router.get('/:id', tecnicoController.buscarPorId);
router.post('/', tecnicoController.salvar);
router.put('/:id', tecnicoController.atualizar);
router.patch('/:id/status', tecnicoController.ativarDesativar);
router.delete('/:id', tecnicoController.deletar);

export default router;
