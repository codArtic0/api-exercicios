import { describe, it, expect } from 'vitest';
import { dayKey, lastSevenDayKeys, pickNextWorkout, safeTimeZone, weekSummary } from './week.service.js';

const session = (finishedAt, totalVolume, totalSets) => ({
  finishedAt: new Date(finishedAt),
  stats: { totalVolume, totalSets },
});

describe('fuso e dia civil', () => {
  it('o mesmo instante cai em dias diferentes conforme o fuso', () => {
    const instant = new Date('2026-11-04T01:30:00Z');

    expect(dayKey(instant, 'UTC')).toBe('2026-11-04');
    expect(dayKey(instant, 'America/Sao_Paulo')).toBe('2026-11-03');
  });

  it('fuso inválido ou ausente vira UTC', () => {
    expect(safeTimeZone('Nao/Existe')).toBe('UTC');
    expect(safeTimeZone(undefined)).toBe('UTC');
    expect(safeTimeZone('America/Sao_Paulo')).toBe('America/Sao_Paulo');
  });

  it('os 7 dias terminam hoje, do mais antigo para o mais novo', () => {
    const keys = lastSevenDayKeys(new Date('2026-11-04T15:00:00Z'), 'UTC');

    expect(keys).toEqual([
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
    ]);
  });
});

describe('weekSummary', () => {
  const now = new Date('2026-11-04T15:00:00Z');

  it('soma o volume por dia e nos totais', () => {
    const { days, totals } = weekSummary(
      [session('2026-11-04T12:00:00Z', 3000, 12), session('2026-11-04T09:00:00Z', 500, 3), session('2026-11-02T10:00:00Z', 2000, 9)],
      now,
      'UTC',
    );

    expect(days).toHaveLength(7);
    expect(days.at(-1)).toEqual({ date: '2026-11-04', volume: 3500, count: 2, isToday: true });
    expect(days.find((d) => d.date === '2026-11-02')).toMatchObject({ volume: 2000, count: 1, isToday: false });
    expect(days[0]).toMatchObject({ volume: 0, count: 0 });
    expect(totals).toEqual({ workouts: 3, volume: 5500, sets: 24 });
  });

  it('ignora o que está fora da janela de 7 dias', () => {
    const { totals } = weekSummary([session('2026-10-20T10:00:00Z', 9999, 99)], now, 'UTC');

    expect(totals).toEqual({ workouts: 0, volume: 0, sets: 0 });
  });

  it('usa o dia do usuário: treino da noite entra no dia local', () => {
    // 02:00 UTC de 04/11 ainda é 23:00 de 03/11 em São Paulo.
    const { days } = weekSummary([session('2026-11-04T02:00:00Z', 1000, 5)], now, 'America/Sao_Paulo');

    expect(days.find((d) => d.date === '2026-11-03')).toMatchObject({ volume: 1000, count: 1 });
  });
});

describe('pickNextWorkout', () => {
  const [a, b, c] = ['a', 'b', 'c'].map((id) => ({ id }));

  it('sem treinos, null', () => {
    expect(pickNextWorkout([], null)).toBeNull();
  });

  it('sem histórico, o primeiro', () => {
    expect(pickNextWorkout([a, b, c], null)).toBe(a);
  });

  it('segue a sequência e volta ao início', () => {
    expect(pickNextWorkout([a, b, c], 'a')).toBe(b);
    expect(pickNextWorkout([a, b, c], 'c')).toBe(a);
  });

  it('treino do histórico que já foi apagado: volta ao primeiro', () => {
    expect(pickNextWorkout([a, b, c], 'removido')).toBe(a);
  });
});
