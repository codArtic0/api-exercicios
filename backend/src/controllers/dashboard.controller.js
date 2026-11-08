import * as dashboardService from '../services/dashboard.service.js';

export async function get(req, res) {
  // req.query é somente leitura no Express 5 e não passa pelo validate: o fuso é lido aqui.
  res.json(await dashboardService.get(req.user.id, { timeZone: req.query.tz }));
}
