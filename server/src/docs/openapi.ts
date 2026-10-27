/**
 * OpenAPI 3.0 description of the API. Served at /api-docs (Swagger UI) and /api-docs/openapi.json,
 * and exported to ./openapi.json with `npm run openapi:export`.
 */

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object) => ({ 'application/json': { schema } });
const errorResponse = (description: string) => ({ description, content: json(ref('ErrorResponse')) });

const uuidParam = (name: string, description: string) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'string', format: 'uuid' },
});

const commonAuthErrors = {
  401: errorResponse('Missing, invalid or expired token (codes: UNAUTHORIZED, INVALID_TOKEN, TOKEN_EXPIRED)'),
  500: errorResponse('Unexpected error (no stack trace is returned)'),
};

const restaurantFieldProps = {
  name: { type: 'string', minLength: 1, maxLength: 100, example: 'פסטה בסטה' },
  ownerName: { type: 'string', minLength: 1, maxLength: 100, example: 'דנה לוי' },
  ownerPhone: {
    type: 'string',
    nullable: true,
    maxLength: 20,
    pattern: '^\\+?[0-9\\s\\-()]{7,20}$',
    description: 'Optional. Stored but NEVER returned to non-owners.',
    example: '050-1234567',
  },
  street: { type: 'string', minLength: 1, maxLength: 200, example: 'דיזנגוף 100' },
  city: { type: 'string', minLength: 1, maxLength: 100, example: 'תל אביב' },
  location: {
    type: 'string',
    nullable: true,
    maxLength: 100,
    description: 'Optional free-text area / neighbourhood used by the location filter (e.g. "מרכז", "צפון").',
    example: 'מרכז',
  },
  description: { type: 'string', minLength: 1, maxLength: 2000, example: 'מסעדה איטלקית חלבית' },
  type: ref('RestaurantType'),
  imageUrl: {
    type: 'string',
    nullable: true,
    format: 'uri',
    maxLength: 2048,
    description: 'Optional http(s) URL. When null the client shows a default image.',
  },
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Restaurant Occupancy API',
    version: '1.0.0',
    description:
      'Backend of the restaurant occupancy management system.\n\n' +
      '* All routes are under `/api`.\n' +
      '* Protected routes require `Authorization: Bearer <JWT>` (get the token from `POST /api/auth/login`).\n' +
      '* Errors always have the shape `{ "error": { "code", "message", "details?" } }`.\n' +
      '* Occupancy (percent, free seats, free tables) is always computed by the server.',
  },
  servers: [{ url: '/', description: 'This server' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth', description: 'Registration, login and current user' },
    { name: 'Restaurants', description: 'Viewing, searching and managing restaurants' },
    { name: 'Table groups', description: 'Table groups and occupancy (owner only)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: {
                type: 'string',
                enum: [
                  'VALIDATION_ERROR',
                  'INVALID_JSON',
                  'UNAUTHORIZED',
                  'INVALID_TOKEN',
                  'TOKEN_EXPIRED',
                  'INVALID_CREDENTIALS',
                  'FORBIDDEN',
                  'NOT_FOUND',
                  'RESTAURANT_NOT_FOUND',
                  'TABLE_GROUP_NOT_FOUND',
                  'EMAIL_EXISTS',
                  'RESTAURANT_EXISTS',
                  'DUPLICATE_CAPACITY',
                  'CONFLICT',
                  'INTERNAL_ERROR',
                ],
              },
              message: { type: 'string' },
              details: {
                description:
                  'For VALIDATION_ERROR: array of { path, message }. For EMAIL_EXISTS: { suggestion: "login" }.',
                oneOf: [
                  {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: { path: { type: 'string' }, message: { type: 'string' } },
                    },
                  },
                  { type: 'object' },
                ],
              },
            },
          },
        },
        example: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: [{ path: 'email', message: 'Invalid email address' }],
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['USER', 'MANAGER'], description: 'MANAGER once the user owns a restaurant' },
          isManager: { type: 'boolean' },
          restaurantId: { type: 'string', format: 'uuid', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password'],
        properties: {
          fullName: { type: 'string', minLength: 1, maxLength: 100, example: 'ישראל ישראלי' },
          email: { type: 'string', format: 'email', description: 'Stored lower-cased', example: 'israel@example.com' },
          password: { type: 'string', minLength: 8, maxLength: 72, example: 'Password123!' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'israel@example.com' },
          password: { type: 'string', example: 'Password123!' },
        },
      },
      AuthResponse: {
        type: 'object',
        description: 'Returned by both register and login. Send the token as `Authorization: Bearer <token>`.',
        required: ['user', 'token'],
        properties: { user: ref('User'), token: { type: 'string', description: 'JWT with limited lifetime' } },
      },
      RestaurantType: { type: 'string', enum: ['MEAT', 'DAIRY'], description: 'MEAT = בשרי, DAIRY = חלבי' },
      TableGroupInput: {
        type: 'object',
        required: ['capacity', 'totalTables'],
        properties: {
          capacity: { type: 'integer', minimum: 1, maximum: 100, description: 'Seats per table', example: 4 },
          totalTables: { type: 'integer', minimum: 0, maximum: 1000, example: 10 },
          occupiedTables: {
            type: 'integer',
            minimum: 0,
            description:
              'Optional (default: current value, or 0 for a new group). Must be ≤ totalTables, except when the ' +
              'stored value is re-sent while totalTables is lowered – then the server lowers it and reports an adjustment.',
            example: 3,
          },
        },
      },
      TableGroup: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          capacity: { type: 'integer' },
          totalTables: { type: 'integer' },
          occupiedTables: { type: 'integer' },
          freeTables: { type: 'integer' },
        },
      },
      Occupancy: {
        type: 'object',
        description: 'Computed by the server from the table groups.',
        properties: {
          totalSeats: { type: 'integer', description: 'Σ totalTables × capacity' },
          occupiedSeats: { type: 'integer', description: 'Σ occupiedTables × capacity' },
          freeSeats: { type: 'integer', description: 'Σ freeTables × capacity' },
          occupancyPercent: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            description: 'occupiedSeats ÷ totalSeats × 100, rounded; 0 when there are no seats',
          },
          totalTables: { type: 'integer' },
          occupiedTables: { type: 'integer' },
          freeTables: { type: 'integer' },
          freeTablesByCapacity: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                capacity: { type: 'integer' },
                totalTables: { type: 'integer' },
                occupiedTables: { type: 'integer' },
                freeTables: { type: 'integer' },
                freeSeats: { type: 'integer' },
              },
            },
          },
        },
        example: {
          totalSeats: 50,
          occupiedSeats: 40,
          freeSeats: 10,
          occupancyPercent: 80,
          totalTables: 15,
          occupiedTables: 12,
          freeTables: 3,
          freeTablesByCapacity: [
            { capacity: 2, totalTables: 5, occupiedTables: 4, freeTables: 1, freeSeats: 2 },
            { capacity: 4, totalTables: 10, occupiedTables: 8, freeTables: 2, freeSeats: 8 },
          ],
        },
      },
      Restaurant: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          ...restaurantFieldProps,
          ownerPhone: {
            ...restaurantFieldProps.ownerPhone,
            description: 'Included ONLY when the requester is the owner (isOwner = true).',
          },
          isOwner: { type: 'boolean', description: 'True when the logged-in user owns this restaurant' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          occupancy: ref('Occupancy'),
          tableGroups: { type: 'array', items: ref('TableGroup') },
        },
      },
      CreateRestaurantRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'ownerName', 'street', 'city', 'description', 'type', 'tableGroups'],
        properties: {
          ...restaurantFieldProps,
          tableGroups: {
            type: 'array',
            minItems: 1,
            maxItems: 50,
            items: ref('TableGroupInput'),
            description: 'At least one group and at least one table in total. Duplicate capacities are merged.',
            example: [
              { capacity: 2, totalTables: 5 },
              { capacity: 4, totalTables: 10 },
            ],
          },
        },
      },
      UpdateRestaurantRequest: {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        description: 'Any subset of the restaurant fields. Send null or "" to clear ownerPhone / location / imageUrl.',
        properties: restaurantFieldProps,
      },
      ReplaceTableGroupsRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['tableGroups'],
        properties: {
          tableGroups: {
            type: 'array',
            minItems: 1,
            maxItems: 50,
            items: ref('TableGroupInput'),
            description:
              'The complete new set. Groups are matched by capacity (ids are kept); capacities not listed are removed; ' +
              'duplicate capacities are merged.',
          },
        },
      },
      UpdateTableGroupRequest: {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        properties: {
          capacity: { type: 'integer', minimum: 1, maximum: 100 },
          totalTables: { type: 'integer', minimum: 0, maximum: 1000 },
          occupiedTables: { type: 'integer', minimum: 0 },
        },
        example: { occupiedTables: 6 },
      },
      Adjustment: {
        type: 'object',
        description: 'A correction made automatically by the server – show `message` to the manager.',
        properties: {
          capacity: { type: 'integer' },
          requestedOccupiedTables: { type: 'integer' },
          occupiedTables: { type: 'integer' },
          message: { type: 'string' },
        },
      },
      TableGroupsResponse: {
        type: 'object',
        properties: {
          restaurantId: { type: 'string', format: 'uuid' },
          tableGroups: { type: 'array', items: ref('TableGroup') },
          occupancy: ref('Occupancy'),
          adjustments: { type: 'array', items: ref('Adjustment') },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        security: [],
        responses: {
          200: {
            description: 'Server is up',
            content: json({ type: 'object', properties: { status: { type: 'string', example: 'ok' } } }),
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new (regular) user and log them in',
        description: 'Returns the same `{ user, token }` shape as login, so the client is logged in right after registering.',
        security: [],
        requestBody: { required: true, content: json(ref('RegisterRequest')) },
        responses: {
          201: { description: 'User created and logged in', content: json(ref('AuthResponse')) },
          400: errorResponse('Invalid data'),
          409: errorResponse('Email already registered (code EMAIL_EXISTS, details.suggestion = "login")'),
          500: errorResponse('Unexpected error'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with email and password',
        security: [],
        requestBody: { required: true, content: json(ref('LoginRequest')) },
        responses: {
          200: { description: 'Logged in', content: json(ref('AuthResponse')) },
          400: errorResponse('Invalid data'),
          401: errorResponse('Wrong email or password (code INVALID_CREDENTIALS)'),
          500: errorResponse('Unexpected error'),
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user, including role / manager status',
        responses: {
          200: { description: 'Current user', content: json({ type: 'object', properties: { user: ref('User') } }) },
          ...commonAuthErrors,
        },
      },
    },
    '/api/restaurants': {
      get: {
        tags: ['Restaurants'],
        summary: 'List / search / filter restaurants',
        description: 'Returns complete restaurants with computed occupancy. ownerPhone is never included for non-owners.',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Restaurant name contains (case-insensitive)' },
          {
            name: 'location',
            in: 'query',
            schema: { type: 'string' },
            description: 'Matches the location field OR the city (contains, case-insensitive)',
          },
          { name: 'city', in: 'query', schema: { type: 'string' }, description: 'City contains (case-insensitive)' },
          { name: 'type', in: 'query', schema: ref('RestaurantType') },
          { name: 'minFreeSeats', in: 'query', schema: { type: 'integer', minimum: 0 }, description: 'Minimum free seats' },
          {
            name: 'sort',
            in: 'query',
            schema: {
              type: 'string',
              default: 'name',
              enum: ['name', '-name', 'freeSeats', '-freeSeats', 'occupancy', '-occupancy', 'createdAt', '-createdAt'],
            },
            description: 'Prefix with "-" for descending order',
          },
        ],
        responses: {
          200: {
            description: 'Matching restaurants',
            content: json({
              type: 'object',
              properties: { items: { type: 'array', items: ref('Restaurant') }, total: { type: 'integer' } },
            }),
          },
          400: errorResponse('Invalid query parameters'),
          ...commonAuthErrors,
        },
      },
      post: {
        tags: ['Restaurants'],
        summary: 'Create my restaurant (activates manager mode)',
        description: 'Allowed only for a logged-in user that has no restaurant yet. Saved atomically with its table groups.',
        requestBody: { required: true, content: json(ref('CreateRestaurantRequest')) },
        responses: {
          201: {
            description: 'Restaurant created',
            content: json({ type: 'object', properties: { restaurant: ref('Restaurant') } }),
          },
          400: errorResponse('Invalid data'),
          409: errorResponse('This account already has a restaurant (code RESTAURANT_EXISTS)'),
          ...commonAuthErrors,
        },
      },
    },
    '/api/restaurants/{id}': {
      parameters: [uuidParam('id', 'Restaurant id')],
      get: {
        tags: ['Restaurants'],
        summary: 'Restaurant details, table groups and occupancy summary',
        responses: {
          200: {
            description: 'Restaurant',
            content: json({ type: 'object', properties: { restaurant: ref('Restaurant') } }),
          },
          404: errorResponse('Restaurant not found'),
          ...commonAuthErrors,
        },
      },
      patch: {
        tags: ['Restaurants'],
        summary: 'Edit my restaurant details (owner only)',
        requestBody: { required: true, content: json(ref('UpdateRestaurantRequest')) },
        responses: {
          200: {
            description: 'Updated restaurant',
            content: json({ type: 'object', properties: { restaurant: ref('Restaurant') } }),
          },
          400: errorResponse('Invalid data'),
          403: errorResponse('Not the owner of this restaurant'),
          404: errorResponse('Restaurant not found'),
          ...commonAuthErrors,
        },
      },
    },
    '/api/restaurants/{id}/table-groups': {
      parameters: [uuidParam('id', 'Restaurant id')],
      put: {
        tags: ['Table groups'],
        summary: 'Replace all table groups (owner only)',
        requestBody: { required: true, content: json(ref('ReplaceTableGroupsRequest')) },
        responses: {
          200: { description: 'Updated groups and occupancy', content: json(ref('TableGroupsResponse')) },
          400: errorResponse('Invalid data (e.g. occupiedTables > totalTables, no tables at all)'),
          403: errorResponse('Not the owner of this restaurant'),
          404: errorResponse('Restaurant not found'),
          ...commonAuthErrors,
        },
      },
    },
    '/api/restaurants/{id}/table-groups/{groupId}': {
      parameters: [uuidParam('id', 'Restaurant id'), uuidParam('groupId', 'Table group id')],
      patch: {
        tags: ['Table groups'],
        summary: 'Update one table group – capacity, total tables or occupied tables (owner only)',
        requestBody: { required: true, content: json(ref('UpdateTableGroupRequest')) },
        responses: {
          200: {
            description: 'Updated group, all groups and occupancy',
            content: json({
              allOf: [ref('TableGroupsResponse'), { type: 'object', properties: { tableGroup: ref('TableGroup') } }],
            }),
          },
          400: errorResponse('Invalid data'),
          403: errorResponse('Not the owner of this restaurant'),
          404: errorResponse('Restaurant or table group not found'),
          409: errorResponse('Another group already has this capacity (code DUPLICATE_CAPACITY)'),
          ...commonAuthErrors,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};
