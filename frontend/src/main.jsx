import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app.jsx';

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App />);