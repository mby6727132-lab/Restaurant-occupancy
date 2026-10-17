import { z } from 'zod';

export const MAX_TABLE_GROUPS = 50;
export const MAX_CAPACITY = 100;
export const MAX_TABLES_PER_GROUP = 1000;

/** Trims; turns "" into null so optional fields can be cleared. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const requiredText = (label: string, max: number) =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} must be a string` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

const phone = z
  .string()
  .trim()
  .max(20)
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\+?[0-9\s\-()]{7,20}$/.test(v), 'Invalid phone number');

const imageUrl = z
  .string()
  .trim()
  .max(2048)
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https?:\/\/\S+$/i.test(v), 'imageUrl must be an http(s) URL');

export const restaurantTypeSchema = z.enum(['MEAT', 'DAIRY'], {
  errorMap: () => ({ message: 'type must be MEAT or DAIRY' }),
});

const restaurantFields = {
  name: requiredText('Restaurant name', 100),
  ownerName: requiredText('Owner name', 100),
  ownerPhone: phone,
  street: requiredText('Street', 200),
  city: requiredText('City', 100),
  location: optionalText(100),
  description: requiredText('Description', 2000),
  type: restaurantTypeSchema,
  imageUrl,
};

const int = (label: string) =>
  z.number({ required_error: `${label} is required`, invalid_type_error: `${label} must be a number` }).int(`${label} must be a whole number`);

const capacity = int('capacity').min(1, 'capacity must be positive').max(MAX_CAPACITY);
const totalTables = int('totalTables').min(0, 'totalTables cannot be negative').max(MAX_TABLES_PER_GROUP);
const occupiedTables = int('occupiedTables').min(0, 'occupiedTables cannot be negative').max(MAX_TABLES_PER_GROUP);

export const tableGroupInputSchema = z.object({
  capacity,
  totalTables,
  occupiedTables: occupiedTables.optional(),
});

const tableGroupsList = z
  .array(tableGroupInputSchema, { required_error: 'tableGroups is required' })
  .min(1, 'At least one table group is required')
  .max(MAX_TABLE_GROUPS);

export const createRestaurantSchema = z.object({ ...restaurantFields, tableGroups: tableGroupsList }).strict();

export const updateRestaurantSchema = z
  .object({
    name: restaurantFields.name.optional(),
    ownerName: restaurantFields.ownerName.optional(),
    ownerPhone: phone.optional(),
    street: restaurantFields.street.optional(),
    city: restaurantFields.city.optional(),
    location: optionalText(100).optional(),
    description: restaurantFields.description.optional(),
    type: restaurantTypeSchema.optional(),
    imageUrl: imageUrl.optional(),
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, 'At least one field must be provided');

export const replaceTableGroupsSchema = z.object({ tableGroups: tableGroupsList }).strict();

export const updateTableGroupSchema = z
  .object({ capacity: capacity.optional(), totalTables: totalTables.optional(), occupiedTables: occupiedTables.optional() })
  .strict()
  .refine((o) => Object.keys(o).length > 0, 'At least one of capacity, totalTables, occupiedTables is required');

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

export const SORT_OPTIONS = [
  'name',
  '-name',
  'freeSeats',
  '-freeSeats',
  'occupancy',
  '-occupancy',
  'createdAt',
  '-createdAt',
] as const;

export const listRestaurantsQuerySchema = z.object({
  q: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  location: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  city: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  type: z.preprocess(
    (v) => (typeof v === 'string' ? emptyToUndefined(v.toUpperCase()) : v),
    restaurantTypeSchema.optional(),
  ),
  minFreeSeats: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(100_000).optional()),
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(SORT_OPTIONS, { errorMap: () => ({ message: `sort must be one of: ${SORT_OPTIONS.join(', ')}` }) }).default('name'),
  ),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type TableGroupInput = z.infer<typeof tableGroupInputSchema>;
export type UpdateTableGroupInput = z.infer<typeof updateTableGroupSchema>;
export type ListRestaurantsQuery = z.infer<typeof listRestaurantsQuerySchema>;
