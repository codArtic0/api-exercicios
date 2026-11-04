import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../repositories/exercise.repository.js', () => ({ findVisibleById: vi.fn() }));
vi.mock('../repositories/entry.repository.js', () => ({
  create: vi.fn(),
  listByUserAndExercise: vi.fn(),
}));

const exerciseRepository = await import('../repositories/exercise.repository.js');
const entryRepository = await import('../repositories/entry.repository.js');
const entryService = await import('./entry.service.js');

beforeEach(() => vi.resetAllMocks());

describe('entry.service.create', () => {
  it('grava com o userId e o exerciseId recebidos, ignorando os do body', async () => {
    exerciseRepository.findVisibleById.mockResolvedValue({ id: 'ex-1' });
    entryRepository.create.mockResolvedValue({ id: 'e-1' });

    await entryService.create('user-1', 'ex-1', {
      sets: 3,
      reps: 12,
      weightKg: 90,
      userId: 'invasor',
      exerciseId: 'outro',
    });

    expect(exerciseRepository.findVisibleById).toHaveBeenCalledWith('ex-1', 'user-1');
    expect(entryRepository.create).toHaveBeenCalledWith({
      sets: 3,
      reps: 12,
      weightKg: 90,
      userId: 'user-1',
      exerciseId: 'ex-1',
    });
  });

  it('exercício invisível ao usuário → 404 e nada é gravado', async () => {
    exerciseRepository.findVisibleById.mockResolvedValue(null);

    await expect(
      entryService.create('user-1', 'ex-1', { sets: 1, reps: 1, weightKg: 1 }),
    ).rejects.toMatchObject({ status: 404, code: 'EXERCISE_NOT_FOUND' });
    expect(entryRepository.create).not.toHaveBeenCalled();
  });
});

describe('entry.service.listByExercise', () => {
  it('lista só os registros do usuário', async () => {
    exerciseRepository.findVisibleById.mockResolvedValue({ id: 'ex-1' });
    entryRepository.listByUserAndExercise.mockResolvedValue([{ id: 'e-1' }]);

    const result = await entryService.listByExercise('user-1', 'ex-1');

    expect(entryRepository.listByUserAndExercise).toHaveBeenCalledWith('user-1', 'ex-1');
    expect(result).toEqual([{ id: 'e-1' }]);
  });

  it('exercício invisível → 404 e não consulta o histórico', async () => {
    exerciseRepository.findVisibleById.mockResolvedValue(null);

    await expect(entryService.listByExercise('user-1', 'ex-1')).rejects.toMatchObject({
      status: 404,
      code: 'EXERCISE_NOT_FOUND',
    });
    expect(entryRepository.listByUserAndExercise).not.toHaveBeenCalled();
  });
});
