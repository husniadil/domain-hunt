/**
 * Type guard utilities for safe type checking and validation.
 * These utilities help ensure data integrity and provide type safety.
 */

export const isValidStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');

export const isValidBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

export const isValidNumber = (value: unknown): value is number =>
  typeof value === 'number' && !isNaN(value);

export const isValidString = (value: unknown): value is string =>
  typeof value === 'string';

export const isValidObject = (
  value: unknown
): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
