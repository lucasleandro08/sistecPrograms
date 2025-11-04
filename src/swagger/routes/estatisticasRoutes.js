/**
 * @swagger
 * /api/estatisticas/dashboard-stats:
 *   get:
 *     summary: Estatísticas gerais do dashboard
 *     tags: [Estatísticas]
 *     responses:
 *       200:
 *         description: Estatísticas do dashboard
 *
 * /api/estatisticas/dashboard-stats-detalhadas:
 *   get:
 *     summary: Estatísticas detalhadas do dashboard
 *     tags: [Estatísticas]
 *     responses:
 *       200:
 *         description: Estatísticas detalhadas
 *
 * /api/estatisticas/chamados-mensais:
 *   get:
 *     summary: Chamados por mês
 *     tags: [Estatísticas]
 *     responses:
 *       200:
 *         description: Dados mensais de chamados
 *
 * /api/estatisticas/chamados-categoria:
 *   get:
 *     summary: Chamados por categoria
 *     tags: [Estatísticas]
 *     responses:
 *       200:
 *         description: Distribuição por categoria
 *
 * /api/estatisticas/chamados-anuais:
 *   get:
 *     summary: Chamados por ano
 *     tags: [Estatísticas]
 *     responses:
 *       200:
 *         description: Dados anuais
 *
 * /api/estatisticas/chamados-analistas:
 *   get:
 *     summary: Performance dos analistas
 *     tags: [Estatísticas]
 *     responses:
 *       200:
 *         description: Performance dos analistas
 *
 * /api/estatisticas/relatorio-completo:
 *   get:
 *     summary: Relatório completo
 *     tags: [Estatísticas]
 *     responses:
 *       200:
 *         description: Relatório completo gerado com sucesso
 *       403:
 *         description: Sem permissão
 */

export default {};
