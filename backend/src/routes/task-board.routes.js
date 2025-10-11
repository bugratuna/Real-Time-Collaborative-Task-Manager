const { Router } = require('express');

const {
  getBoard,
  createColumn,
  updateColumn,
  createTask,
  updateTask,
  moveTask,
  reorderColumns
} = require('../controllers/task-board.controller');
const { authenticate } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const {
  createColumnSchema,
  updateColumnSchema,
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  reorderColumnsSchema
} = require('../validation/task-board.validation');

const router = Router();

router.use(authenticate);

router.get('/', getBoard);
router.post('/columns', validate(createColumnSchema), createColumn);
router.patch('/columns/:columnId', validate(updateColumnSchema), updateColumn);
router.post('/columns/:columnId/tasks', validate(createTaskSchema), createTask);
router.patch('/columns/:columnId/tasks/:taskId', validate(updateTaskSchema), updateTask);
router.post('/tasks/move', validate(moveTaskSchema), moveTask);
router.post('/columns/reorder', validate(reorderColumnsSchema), reorderColumns);

module.exports = router;
