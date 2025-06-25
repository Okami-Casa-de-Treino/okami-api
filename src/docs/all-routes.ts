/**
 * @swagger
 * tags:
 *   - name: Teachers
 *     description: Gerenciamento de professores
 *   - name: Classes
 *     description: Gerenciamento de aulas
 *   - name: Checkins
 *     description: Sistema de check-in
 *   - name: Payments
 *     description: Sistema financeiro
 *   - name: Reports
 *     description: Relatórios e dashboard
 */

/**
 * @swagger
 * /api/teachers:
 *   get:
 *     summary: Listar todos os professores
 *     tags: [Teachers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Lista de professores
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Teacher'
 *   post:
 *     summary: Criar novo professor
 *     tags: [Teachers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeacherRequest'
 *     responses:
 *       201:
 *         description: Professor criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Teacher'
 */

/**
 * @swagger
 * /api/teachers/{id}:
 *   get:
 *     summary: Buscar professor por ID
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dados do professor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Teacher'
 *   put:
 *     summary: Atualizar professor
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeacherRequest'
 *     responses:
 *       200:
 *         description: Professor atualizado com sucesso
 *   delete:
 *     summary: Deletar professor
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Professor deletado com sucesso
 */

/**
 * @swagger
 * /api/teachers/{id}/classes:
 *   get:
 *     summary: Obter aulas do professor
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de aulas do professor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
 */

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Listar todas as aulas
 *     tags: [Classes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: teacher_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: day_of_week
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 6
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Lista de aulas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Class'
 *   post:
 *     summary: Criar nova aula
 *     tags: [Classes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClassRequest'
 *     responses:
 *       201:
 *         description: Aula criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 */

/**
 * @swagger
 * /api/classes/schedule:
 *   get:
 *     summary: Obter grade de horários
 *     tags: [Classes]
 *     responses:
 *       200:
 *         description: Grade de horários semanal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Class'
 */

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Buscar aula por ID
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dados da aula
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *   put:
 *     summary: Atualizar aula
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClassRequest'
 *     responses:
 *       200:
 *         description: Aula atualizada com sucesso
 *   delete:
 *     summary: Deletar aula
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Aula deletada com sucesso
 */

/**
 * @swagger
 * /api/classes/{id}/students:
 *   get:
 *     summary: Obter alunos matriculados na aula
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de alunos matriculados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
 */

/**
 * @swagger
 * /api/classes/{id}/checkins:
 *   get:
 *     summary: Obter check-ins da aula
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de check-ins da aula
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Checkin'
 */

/**
 * @swagger
 * /api/checkins:
 *   get:
 *     summary: Listar check-ins
 *     tags: [Checkins]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de check-ins
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Checkin'
 *   post:
 *     summary: Registrar check-in
 *     tags: [Checkins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCheckinRequest'
 *     responses:
 *       201:
 *         description: Check-in registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Checkin'
 */

/**
 * @swagger
 * /api/checkins/today:
 *   get:
 *     summary: Check-ins de hoje
 *     tags: [Checkins]
 *     responses:
 *       200:
 *         description: Lista de check-ins de hoje
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Checkin'
 */

/**
 * @swagger
 * /api/checkins/student/{id}:
 *   get:
 *     summary: Check-ins de um aluno específico
 *     tags: [Checkins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de check-ins do aluno
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Checkin'
 */

/**
 * @swagger
 * /api/checkins/class/{id}:
 *   get:
 *     summary: Check-ins de uma aula específica
 *     tags: [Checkins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de check-ins da aula
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Checkin'
 */

/**
 * @swagger
 * /api/checkins/{id}:
 *   delete:
 *     summary: Deletar check-in
 *     tags: [Checkins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Check-in deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Check-in deletado com sucesso"
 *       404:
 *         description: Check-in não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Acesso negado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Listar pagamentos
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, overdue, cancelled]
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de pagamentos
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *   post:
 *     summary: Criar cobrança
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentRequest'
 *     responses:
 *       201:
 *         description: Cobrança criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 */

/**
 * @swagger
 * /api/payments/overdue:
 *   get:
 *     summary: Pagamentos em atraso
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Lista de pagamentos em atraso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 */

/**
 * @swagger
 * /api/payments/generate-monthly:
 *   post:
 *     summary: Gerar cobranças mensais
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reference_month]
 *             properties:
 *               reference_month:
 *                 type: string
 *                 format: date
 *                 example: "2024-02-01"
 *                 description: Mês de referência (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Cobranças mensais geradas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cobranças mensais geradas com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     generated:
 *                       type: integer
 *                       example: 150
 */

/**
 * @swagger
 * /api/payments/student/{id}:
 *   get:
 *     summary: Obter pagamentos de um aluno específico
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, overdue, cancelled]
 *     responses:
 *       200:
 *         description: Lista de pagamentos do aluno
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 */

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Buscar pagamento por ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dados do pagamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *   put:
 *     summary: Atualizar pagamento
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_date:
 *                 type: string
 *                 format: date
 *               payment_method:
 *                 type: string
 *                 enum: [cash, card, pix, bank_transfer]
 *               status:
 *                 type: string
 *                 enum: [pending, paid, overdue, cancelled]
 *               discount:
 *                 type: number
 *                 format: decimal
 *               late_fee:
 *                 type: number
 *                 format: decimal
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pagamento atualizado com sucesso
 *   delete:
 *     summary: Deletar pagamento
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pagamento deletado com sucesso
 */

/**
 * @swagger
 * /api/payments/{id}/pay:
 *   post:
 *     summary: Marcar pagamento como pago
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [payment_method]
 *             properties:
 *               payment_method:
 *                 type: string
 *                 enum: [cash, card, pix, bank_transfer]
 *               payment_date:
 *                 type: string
 *                 format: date
 *                 description: Data do pagamento (padrão: hoje)
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pagamento marcado como pago
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *                 message:
 *                   type: string
 *                   example: "Pagamento registrado com sucesso"
 */

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Dados do dashboard
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Dados estatísticos do dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DashboardData'
 */

/**
 * @swagger
 * /api/reports/attendance:
 *   get:
 *     summary: Relatório de frequência
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Relatório de frequência
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         start_date:
 *                           type: string
 *                           format: date
 *                         end_date:
 *                           type: string
 *                           format: date
 *                     total_checkins:
 *                       type: integer
 *                       example: 450
 *                     by_student:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           student_id:
 *                             type: string
 *                             format: uuid
 *                           student_name:
 *                             type: string
 *                           checkins_count:
 *                             type: integer
 *                     by_class:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           class_id:
 *                             type: string
 *                             format: uuid
 *                           class_name:
 *                             type: string
 *                           checkins_count:
 *                             type: integer
 */

/**
 * @swagger
 * /api/reports/financial:
 *   get:
 *     summary: Relatório financeiro
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Relatório financeiro
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         start_date:
 *                           type: string
 *                           format: date
 *                         end_date:
 *                           type: string
 *                           format: date
 *                     total_revenue:
 *                       type: number
 *                       format: decimal
 *                       example: 25000.00
 *                     pending_amount:
 *                       type: number
 *                       format: decimal
 *                       example: 3500.00
 *                     overdue_amount:
 *                       type: number
 *                       format: decimal
 *                       example: 1200.00
 *                     payments_by_method:
 *                       type: object
 *                       properties:
 *                         cash:
 *                           type: number
 *                           format: decimal
 *                         card:
 *                           type: number
 *                           format: decimal
 *                         pix:
 *                           type: number
 *                           format: decimal
 *                         bank_transfer:
 *                           type: number
 *                           format: decimal
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check da aplicação
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: Sistema funcionando corretamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Sistema com problemas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: "unhealthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */ 