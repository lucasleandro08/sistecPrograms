import bcrypt from 'bcrypt';
import pool from '../src/config/db.js';

// so usar se o modo automatico dar algum erro
//

const hashPasswords = async () => {
  try {
    console.log('Iniciando criptografia das senhas...');
    
    const users = await pool.query('SELECT * FROM usuarios WHERE LENGTH(senha) < 20');
    console.log(`Encontrados ${users.rows.length} usuários com senhas não criptografadas`);
    
    for (const user of users.rows) { 
      console.log(`Criptografando senha do usuário: ${user.nome_usuario}`);
      
      const hashedPassword = await bcrypt.hash(user.senha, 10);
      
      await pool.query(
        'UPDATE usuarios SET senha = $1 WHERE id_usuario = $2',
        [hashedPassword, user.id_usuario]
      );
      
      console.log(` Senha do usuário ${user.nome_usuario} foi criptografada`);
    }
    
    console.log('Todas as senhas foram criptografadas com sucesso!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error(' Erro ao criptografar senhas:', error);
    process.exit(1);
  }
};

hashPasswords();
//node scripts/hashPasswords.js