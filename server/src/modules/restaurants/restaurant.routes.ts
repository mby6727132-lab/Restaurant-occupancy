import { Router } from 'express';
import { parseOrThrow } from '../../lib/validate';
import { currentUser, requireAuth } from '../../middleware/auth';
import {
  createRestaurantSchema,
  listRestaurantsQuerySchema,
  replaceTableGroupsSchema,
  updateRestaurantSchema,
  updateTableGroupSchema,
} from './restaurant.schemas';
import * as service from './restaurant.service';

export const restaurantRouter = Router();

// Every restaurant route requires a logged-in user (spec section 2).
restaurantRouter.use(requireAuth);

restaurantRouter.get('/', async (req, res) => {
  const query = parseOrThrow(listRestaurantsQuerySchema, req.query);
  const items = await service.listRestaurants(query, currentUser(req));
  res.json({ items, total: items.length });
});

restaurantRouter.get('/:id', async (req, res) => {
  const restaurant = await service.getRestaurant(req.params.id, currentUser(req));
  res.json({ restaurant });
});

restaurantRouter.post('/', async (req, res) => {
  const input = parseOrThrow(createRestaurantSchema, req.body);
  const restaurant = await service.createRestaurant(input, currentUser(req));
  res.status(201).json({ restaurant });
});

restaurantRouter.patch('/:id', async (req, res) => {
  const input = parseOrThrow(updateRestaurantSchema, req.body);
  const restaurant = await service.updateRestaurant(req.params.id, input, currentUser(req));
  res.json({ restaurant });
});

restaurantRouter.put('/:id/table-groups', async (req, res) => {
  const input = parseOrThrow(replaceTableGroupsSchema, req.body);
  const result = await service.replaceTableGroups(req.params.id, input.tableGroups, currentUser(req));
  res.json(result);
});

restaurantRouter.patch('/:id/table-groups/:groupId', async (req, res) => {
  const input = parseOrThrow(updateTableGroupSchema, req.body);
  const result = await service.updateTableGroup(req.params.id, req.params.groupId, input, currentUser(req));
  res.json(result);
});
