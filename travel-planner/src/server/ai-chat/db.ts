import { Store, schema } from 'modelence/server';

export const dbChats = new Store('chats', {
  schema: {
    userId: schema.userId(),
    title: schema.string(),
    createdAt: schema.date(),
  },
  indexes: [{ key: { userId: 1 } }],
});

export const dbMessages = new Store('messages', {
  schema: {
    userId: schema.userId(),
    chatId: schema.ref('chats'),
    role: schema.enum(['user', 'assistant']),
    content: schema.string(),
    createdAt: schema.date(),
  },
  indexes: [
    { key: { userId: 1, chatId: 1 }},
  ]
});
