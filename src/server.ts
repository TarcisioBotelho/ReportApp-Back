import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import router from './routes';

dotenv.config();

const server = express();

server.use(helmet());
server.use(cors());
server.use(express.json()); // Adicione esta linha para processar dados JSON
server.use(express.urlencoded({ extended: true }));
server.use(express.static(path.join(__dirname, '../public')));

server.use('/', router);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '192.168.1.110';

server.listen(PORT, HOST, () => {
    console.log(`Server is Running on: http://${HOST}:${PORT}`);
});