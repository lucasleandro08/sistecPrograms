import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

console.log('DATABASE_URL configurada:', process.env.DATABASE_URL ? 'Sim' : 'Não');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Erro ao conectar:', err);
    } else {
        console.log('Conectado ao Supabase:', res.rows[0]);
    }
});
export default pool;
