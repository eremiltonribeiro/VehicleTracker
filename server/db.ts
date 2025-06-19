import * as schema from "@shared/schema";

console.log("🔧 Usando mock de banco de dados para debug");

// Mock do banco de dados
export const db = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: () => [],
        offset: () => []
      }),
      limit: () => [],
      offset: () => []
    }),
    where: () => ({
      limit: () => [],
      offset: () => []
    }),
    limit: () => [],
    offset: () => []
  }),
  insert: () => ({
    into: () => ({
      values: () => ({
        returning: () => []
      }),
      returning: () => []
    }),
    values: () => ({
      returning: () => []
    }),
    returning: () => []
  }),
  update: () => ({
    set: () => ({
      where: () => ({
        returning: () => []
      }),
      returning: () => []
    }),
    where: () => ({
      returning: () => []
    }),
    returning: () => []
  }),
  delete: () => ({
    from: () => ({
      where: () => ({
        returning: () => []
      }),
      returning: () => []
    }),
    where: () => ({
      returning: () => []
    }),
    returning: () => []
  }),
  query: {
    vehicles: {
      findMany: () => [],
      findFirst: () => null
    },
    drivers: {
      findMany: () => [],
      findFirst: () => null
    },
    registrations: {
      findMany: () => [],
      findFirst: () => null
    }
  }
};

// Mock pool para compatibilidade
export const pool = {
  query: async (sql: string, params?: any[]) => {
    console.log("Mock query:", sql);
    return { rows: [] };
  }
};