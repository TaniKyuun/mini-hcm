import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverSrcDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(serverSrcDir, '../../..');

export const paths = {
	clientDist: path.join(workspaceRoot, 'client/dist'),
	clientIndexHtml: path.join(workspaceRoot, 'client/dist/index.html'),
};
