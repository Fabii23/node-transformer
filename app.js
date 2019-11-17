const app = require("express")();
const PORT = process.env.PORT || 3000;

async function startServer() {
  //Use a loader to decrease the file size of you app entry
  await require("./loaders")();

  // Turn on that server!
  app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
  });
}

startServer();
