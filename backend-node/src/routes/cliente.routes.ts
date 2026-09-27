import { Router } from 'express';
import { ClienteController } from '../controllers/ClienteController';

const router = Router();
const clienteController = new ClienteController();

router.get('/', clienteController.listarTodos);
router.get('/busca', clienteController.buscarPorNome);
router.get('/:id', clienteController.buscarPorId);
router.post('/', clienteController.salvar);
router.put('/:id', clienteController.atualizar);
router.patch('/:id', clienteController.atualizarParcial);
router.delete('/:id', clienteController.deletar);

export default router;
