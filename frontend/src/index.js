// src/index.js
import { render } from 'preact';
import './index.css';
import app from './app.jsx';  // Default import

render(<app />, document.getElementById('app'));
