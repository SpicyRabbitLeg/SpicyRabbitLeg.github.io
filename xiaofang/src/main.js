import { App } from './core/App.js';

const canvas = document.getElementById('canvas');
const app = new App(canvas);

app.init().then(() => app.run());
