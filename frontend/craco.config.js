module.exports = {
  devServer: {
    port: 3001,
    allowedHosts: 'all',
    client: {
      webSocketURL: 'ws://localhost:3001/ws',
    },
  },
};
