import dotenv from 'dotenv';
import { Pool } from 'pg';
dotenv.config();


// Debug: verificar se as variáveis estão sendo lidas <- deixar também caso o env dê errado
console.log(' Configurações do banco:');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,

});

export default pool;