/**
 * Coerces the string form of a query-string boolean (`?flag=true`) into a real
 * boolean for `class-transformer`. Non-boolean-looking values are passed through
 * unchanged so `@IsBoolean` can still reject them with a 400.
 */
export const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
};
