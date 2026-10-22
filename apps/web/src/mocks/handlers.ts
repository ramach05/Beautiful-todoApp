import { createTodoInputSchema, todoListSchema, updateTodoInputSchema } from '@bt/shared';
import { delay, http, HttpResponse } from 'msw';

import { db } from './db';

/** В тестах задержка не нужна, в dev имитируем сеть */
const networkDelay = () => (import.meta.env.MODE === 'test' ? delay(0) : delay('real'));

/** Мок REST API задач; контракт повторяет будущий @bt/api (PR-5) */
export const handlers = [
  http.get('/api/todos', async () => {
    await networkDelay();
    return HttpResponse.json(todoListSchema.parse(db.all()));
  }),

  http.post('/api/todos', async ({ request }) => {
    await networkDelay();
    const body = await request.json();
    const parsed = createTodoInputSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json({ error: 'invalid_input' }, { status: 400 });
    }
    return HttpResponse.json(db.create(parsed.data.title), { status: 201 });
  }),

  http.patch('/api/todos/:id', async ({ params, request }) => {
    await networkDelay();
    const parsed = updateTodoInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return HttpResponse.json({ error: 'invalid_input' }, { status: 400 });
    }
    const updated = db.update(String(params.id), parsed.data);
    if (!updated) return HttpResponse.json({ error: 'not_found' }, { status: 404 });
    return HttpResponse.json(updated);
  }),

  http.delete('/api/todos/:id', async ({ params }) => {
    await networkDelay();
    const removed = db.remove(String(params.id));
    if (!removed) return HttpResponse.json({ error: 'not_found' }, { status: 404 });
    return new HttpResponse(null, { status: 204 });
  }),
];
