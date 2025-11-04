/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Realizar login no sistema
 *     description: |
 *       Autentica o usuário e cria uma sessão ativa. 
 *       Após o login bem-sucedido, o usuário pode acessar todas as rotas protegidas.
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['email', 'password']
 *             properties:
 *               email: 
 *                 type: string 
 *                 example: admin@sistec.com
 *                 description: Email corporativo do usuário
 *               password: 
 *                 type: string 
 *                 example: admin123
 *                 description: Senha do usuário
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         description: Credenciais inválidas
 *       400:
 *         description: Email e senha são obrigatórios
 *
 * /api/auth/logout:
 *   post:
 *     summary: Realizar logout do sistema
 *     description: Encerra a sessão ativa do usuário
 *     tags: [Autenticação]
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *       401:
 *         description: Usuário não autenticado
 */

export default {};
