import * as muscleGroupService from '../services/muscleGroup.service.js';

const toResponse = ({ id, name }) => ({ id, name });

export async function list(req, res) {
  const groups = await muscleGroupService.list();
  res.json(groups.map(toResponse));
}

export async function create(req, res) {
  const { group, created } = await muscleGroupService.createOrGet(req.body.name);
  res.status(created ? 201 : 200).json(toResponse(group));
}
