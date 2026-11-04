import * as muscleGroupRepository from '../repositories/muscleGroup.repository.js';

export const list = () => muscleGroupRepository.list();

// Grupos são compartilhados entre os usuários. Se o nome já existe (sem diferenciar
// maiúsculas), devolve o existente em vez de criar um duplicado.
export async function createOrGet(name) {
  const existing = await muscleGroupRepository.findByName(name);
  if (existing) return { group: existing, created: false };

  try {
    return { group: await muscleGroupRepository.create(name), created: true };
  } catch (err) {
    // Dois pedidos simultâneos com o mesmo nome: o banco recusa o segundo (unique).
    if (err.code === 'P2002') {
      return { group: await muscleGroupRepository.findByName(name), created: false };
    }
    throw err;
  }
}
