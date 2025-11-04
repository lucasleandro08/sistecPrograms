/**
 * @swagger
 * /api/users/perfis:
 *   get:
 *     summary: Listar todos os perfis de usuário
 *     tags: [Usuários]
 *     responses:
 *       200:
 *         description: Lista de perfis
 *
 * /api/users:
 *   get:
 *     summary: Listar todos os usuários
 *     tags: [Usuários]
 *     responses:
 *       200:
 *         description: Lista de usuários
 *   post:
 *     summary: Criar novo usuário
 *     tags: [Usuários - Gestão]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['nome_usuario', 'email', 'password', 'id_perfil_usuario']
 *             properties:
 *               nome_usuario: 
 *                 type: string 
 *                 example: Maria Santos
 *               setor_usuario: 
 *                 type: string 
 *                 example: RH
 *               cargo_usuario: 
 *                 type: string 
 *                 example: Analista de RH
 *               email: 
 *                 type: string 
 *                 example: maria.santos@sistec.com
 *               password: 
 *                 type: string 
 *                 example: senha123
 *               tel_usuarios: 
 *                 type: string 
 *                 example: '11987654321'
 *               id_perfil_usuario: 
 *                 type: integer 
 *                 example: 1
 *                 description: '1=Usuário, 2=Analista, 3=Gestor, 4=Admin'
 *               matricula_aprovador: 
 *                 type: integer 
 *                 example: 5
 *                 description: Matrícula do gestor aprovador (opcional)
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Sem permissão
 *
 * /api/users/deleted:
 *   get:
 *     summary: Listar usuários deletados
 *     tags: [Usuários - Gestão]
 *     responses:
 *       200:
 *         description: Lista de usuários deletados
 *       403:
 *         description: Sem permissão
 *
 * /api/users/{id}:
 *   get:
 *     summary: Buscar usuário por ID
 *     tags: [Usuários]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       404:
 *         description: Usuário não encontrado
 *   put:
 *     summary: Atualizar usuário
 *     tags: [Usuários - Gestão]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome_usuario:
 *                 type: string
 *               setor_usuario:
 *                 type: string
 *               cargo_usuario:
 *                 type: string
 *               email:
 *                 type: string
 *               tel_usuarios:
 *                 type: string
 *               id_perfil_usuario:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *   delete:
 *     summary: Deletar usuário
 *     tags: [Usuários - Gestão]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['motivo']
 *             properties:
 *               motivo:
 *                 type: string
 *                 example: Usuário desligado da empresa
 *                 description: Motivo da deleção (mínimo 10 caracteres)
 *     responses:
 *       200:
 *         description: Usuário deletado com sucesso
 *       400:
 *         description: Motivo obrigatório
 *       403:
 *         description: Sem permissão
 *
 * /api/users/restore/{id_backup}:
 *   post:
 *     summary: Restaurar usuário deletado
 *     tags: [Usuários - Gestão]
 *     parameters:
 *       - in: path
 *         name: id_backup
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuário restaurado com sucesso
 *       404:
 *         description: Backup não encontrado
 *       403:
 *         description: Sem permissão
 */

export default {};
