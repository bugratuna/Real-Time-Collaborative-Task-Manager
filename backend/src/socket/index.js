const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = { registerSocketHandlers };
