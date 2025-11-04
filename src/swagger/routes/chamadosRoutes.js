/**
 * @swagger
 * /api/chamados:
 *   post:
 *     summary: Criar novo chamado
 *     tags: [Chamados]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CriarChamado'
 *     responses:
 *       201:
 *         description: Chamado criado com sucesso
 *   get:
 *     summary: Listar todos os chamados
 *     tags: [Chamados]
 *     responses:
 *       200:
 *         description: Lista de chamados
 *
 * /api/chamados/{id}:
 *   get:
 *     summary: Buscar chamado por ID
 *     tags: [Chamados]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do chamado
 *       404:
 *         description: Chamado não encontrado
 *
 * /api/chamados/aprovacao:
 *   get:
 *     summary: Listar chamados pendentes de aprovação
 *     tags: [Chamados - Gestão]
 *     responses:
 *       200:
 *         description: Lista de chamados para aprovação
 *
 * /api/chamados/{id_chamado}/aprovar:
 *   post:
 *     summary: Aprovar um chamado
 *     tags: [Chamados - Gestão]
 *     parameters:
 *       - in: path
 *         name: id_chamado
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chamado aprovado com sucesso
 *
 * /api/chamados/{id_chamado}/rejeitar:
 *   post:
 *     summary: Rejeitar um chamado
 *     tags: [Chamados - Gestão]
 *     parameters:
 *       - in: path
 *         name: id_chamado
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RejeitarChamadoRequest'
 *     responses:
 *       200:
 *         description: Chamado rejeitado com sucesso
 *
 * /api/chamados/{id_chamado}/solucao-ia:
 *   get:
 *     summary: Obter solução gerada pela IA
 *     tags: [Chamados - IA]
 *     parameters:
 *       - in: path
 *         name: id_chamado
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Solução da IA
 *
 * /api/chamados/{id_chamado}/feedback-ia:
 *   post:
 *     summary: Enviar feedback sobre a solução da IA
 *     tags: [Chamados - IA]
 *     parameters:
 *       - in: path
 *         name: id_chamado
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['feedback']
 *             properties:
 *               feedback:
 *                 type: string
 *                 example: DEU_CERTO
 *                 enum: [DEU_CERTO, DEU_ERRADO]
 *                 description: DEU_CERTO se funcionou, DEU_ERRADO se não
 *     responses:
 *       200:
 *         description: Feedback registrado
 *
 * /api/chamados/escalados:
 *   get:
 *     summary: Listar chamados escalados
 *     tags: [Chamados - Analistas]
 *     responses:
 *       200:
 *         description: Lista de chamados escalados
 *
 * /api/chamados/com-analista:
 *   get:
 *     summary: Listar chamados com analistas
 *     tags: [Chamados - Analistas]
 *     responses:
 *       200:
 *         description: Lista de chamados com analistas
 *
 * /api/chamados/{id_chamado}/resolver:
 *   post:
 *     summary: Marcar chamado como resolvido
 *     tags: [Chamados - Analistas]
 *     parameters:
 *       - in: path
 *         name: id_chamado
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chamado resolvido com sucesso
 *
 * /api/chamados/{id_chamado}/escalar:
 *   post:
 *     summary: Escalar chamado para gerente
 *     tags: [Chamados - Analistas]
 *     parameters:
 *       - in: path
 *         name: id_chamado
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EscalarChamadoRequest'
 *     responses:
 *       200:
 *         description: Chamado escalado com sucesso
 *
 * /api/chamados/{id_chamado}/resolver-escalado:
 *   post:
 *     summary: Resolver chamado escalado
 *     tags: [Chamados - Gestão]
 *     parameters:
 *       - in: path
 *         name: id_chamado
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chamado escalado resolvido
 */

export default {};
