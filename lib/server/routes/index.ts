import type { FastifyInstance } from 'fastify';

import metadataRoute from './metadata.js';

export default async function routes(app: FastifyInstance) {
	await app.register(metadataRoute);
}
