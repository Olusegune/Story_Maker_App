// Electron loads the production renderer from file://, not an HTTP server.
// Relative URLs are therefore essential for both the portable and installed builds.
module.exports = {
  base: "./",
  build: { outDir: "dist", emptyOutDir: true }
};
