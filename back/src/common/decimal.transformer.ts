import { ValueTransformer } from 'typeorm';

// MySQL (via mysql2) returns DECIMAL/NEWDECIMAL columns as strings unless the
// driver's decimalNumbers option is set globally — it isn't, since a global
// flip is a bigger blast radius than this codebase's money columns need.
// Every decimal column instead opts in here, so the entity's declared
// `number` type is what actually comes back from a real query, not just from
// a test's mocked repository.
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : Number(value),
};
