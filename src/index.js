import { ApolloServer } from '@apollo/server';
import express from 'express';
import { expressMiddleware } from '@apollo/server/express4';
import http from 'http';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './db.js';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const typeDefs = readFileSync(join(__dirname, './schema.graphql'), 'utf8');
import resolvers from './resolvers.js';

const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    playground: true,
    plugins: [
        {
            async serverWillStart() {
                return {
                    async drainServer() {
                        await httpServer.close();
                    },
                };
            },
        },
    ],
});

await server.start();

app.use(
    '/graphql',
    cors({
        origin: ['https://studio.apollographql.com', 'http://localhost:4000'],
        credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
        context: async ({ req }) => ({ token: req.headers.token }),
    }),
);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

const PORT = process.env.PORT || 4000;
const serverUrl = `http://localhost:${PORT}`;

httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at ${serverUrl}`);
    console.log(`🚀 GraphQL endpoint: ${serverUrl}/graphql`);
    console.log(`🚀 Health check endpoint: ${serverUrl}/health`);
});