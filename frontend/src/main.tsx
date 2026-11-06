import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Importação do Bootstrap 5 (obrigatório da disciplina PP2)
import 'bootstrap/dist/css/bootstrap.min.css';

// Importação dos estilos próprios e ajustes da marca JE Gestão
import './index.css';

import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
