const { z } = require('zod');

const idSchema = z.string().trim().min(1, 'Invalid identifier');

const createColumnSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(60, 'Title is too long')
  })
});

const updateColumnSchema = z.object({
  params: z.object({
    columnId: idSchema
  }),
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(60, 'Title is too long')
  })
});

const createTaskSchema = z.object({
  params: z.object({
    columnId: idSchema
  }),
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(120, 'Title is too long'),
    description: z.string().trim().max(500, 'Description is too long').optional()
  })
});

const updateTaskSchema = z.object({
  params: z.object({
    columnId: idSchema,
    taskId: idSchema
  }),
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(120, 'Title is too long'),
    description: z.string().trim().max(500, 'Description is too long').optional()
  })
});

const moveTaskSchema = z.object({
  body: z.object({
    taskId: idSchema,
    sourceColumnId: idSchema,
    destinationColumnId: idSchema,
    destinationIndex: z.number().int().nonnegative()
  })
});

const reorderColumnsSchema = z.object({
  body: z.object({
    columnOrder: z.array(idSchema).nonempty('Column order is required')
  })
});

module.exports = {
  createColumnSchema,
  updateColumnSchema,
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  reorderColumnsSchema
};
