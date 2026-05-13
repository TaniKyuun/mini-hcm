import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../../dist')));

app.get('/', (_req, res) => {
	res.send('Server Root End Point');
});

app.get('/api', (_req, res) => {
	res.json({ message: 'Hello from the server side!' });
});

if (process.env.NODE_ENV === 'production') {
	app.get(/(.*)/, (_req, res) => {
		res.sendFile(path.join(__dirname, '../../dist/client/index.html'));
	});
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});

export default app;
