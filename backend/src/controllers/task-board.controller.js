const TaskBoard = require('../models/task-board.model');

const ensureBoard = async (userId) => {
  let board = await TaskBoard.findOne({ user: userId });

  if (!board) {
    board = await TaskBoard.create({ user: userId, columns: [] });
  }

  return board;
};

const emitBoardUpdate = (app, userId, board) => {
  const io = app.get('io');

  if (io) {
    io.to(`user:${userId}`).emit('board:updated', board);
  }
};

const getBoard = async (req, res, next) => {
  try {
    const board = await ensureBoard(req.user.id);

    res.json({ board: board.toJSON() });
  } catch (error) {
    next(error);
  }
};

const createColumn = async (req, res, next) => {
  try {
    const board = await ensureBoard(req.user.id);

    board.columns.push({ title: req.body.title });
    await board.save();

    const payload = board.toJSON();
    emitBoardUpdate(req.app, req.user.id, payload);

    res.status(201).json({ board: payload });
  } catch (error) {
    next(error);
  }
};

const updateColumn = async (req, res, next) => {
  try {
    const board = await ensureBoard(req.user.id);
    const column = board.columns.id(req.params.columnId);

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    column.title = req.body.title;
    await board.save();

    const payload = board.toJSON();
    emitBoardUpdate(req.app, req.user.id, payload);

    res.json({ board: payload });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const board = await ensureBoard(req.user.id);
    const column = board.columns.id(req.params.columnId);

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    column.tasks.push({
      title: req.body.title,
      description: req.body.description || ''
    });

    await board.save();

    const payload = board.toJSON();
    emitBoardUpdate(req.app, req.user.id, payload);

    res.status(201).json({ board: payload });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const board = await ensureBoard(req.user.id);
    const column = board.columns.id(req.params.columnId);

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    const task = column.tasks.id(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.title = req.body.title;
    if (typeof req.body.description === 'string') {
      task.description = req.body.description;
    }

    await board.save();

    const payload = board.toJSON();
    emitBoardUpdate(req.app, req.user.id, payload);

    res.json({ board: payload });
  } catch (error) {
    next(error);
  }
};

const moveTask = async (req, res, next) => {
  try {
    const { taskId, sourceColumnId, destinationColumnId, destinationIndex } = req.body;
    const board = await ensureBoard(req.user.id);

    const sourceColumn = board.columns.id(sourceColumnId);
    const destinationColumn = board.columns.id(destinationColumnId);

    if (!sourceColumn || !destinationColumn) {
      return res.status(404).json({ message: 'Column not found' });
    }

    const taskIndex = sourceColumn.tasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const [task] = sourceColumn.tasks.splice(taskIndex, 1);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const insertIndex = Math.min(destinationIndex, destinationColumn.tasks.length);
    destinationColumn.tasks.splice(insertIndex, 0, task);

    await board.save();

    const payload = board.toJSON();
    emitBoardUpdate(req.app, req.user.id, payload);

    res.json({ board: payload });
  } catch (error) {
    next(error);
  }
};

const reorderColumns = async (req, res, next) => {
  try {
    const { columnOrder } = req.body;
    const board = await ensureBoard(req.user.id);

    if (columnOrder.length !== board.columns.length) {
      return res.status(400).json({ message: 'Column order is invalid' });
    }

    const columnsMap = new Map(board.columns.map((column) => [column.id, column]));
    const reordered = [];

    for (const columnId of columnOrder) {
      const column = columnsMap.get(columnId);
      if (!column) {
        return res.status(404).json({ message: 'Column not found' });
      }
      reordered.push(column);
    }

    board.columns = reordered;
    board.markModified('columns');

    await board.save();

    const payload = board.toJSON();
    emitBoardUpdate(req.app, req.user.id, payload);

    res.json({ board: payload });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBoard,
  createColumn,
  updateColumn,
  createTask,
  updateTask,
  moveTask,
  reorderColumns
};
