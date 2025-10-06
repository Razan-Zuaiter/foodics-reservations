module.exports = {
    devServer: {
      proxy: {
        '/v5': {
          target: 'https://api.foodics.dev',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
  