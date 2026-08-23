import { mkdirSync } from "node:fs";
import { UPLOAD_PATH } from "./config/uploads.js";
import { logger } from "./config/logger.js";
import { config } from "./config/env.js";
import { createApp } from "./create-app.js";
import { registerPresentationRealtime } from "./realtime/presentation-realtime.js";
import { registerGracefulShutdown } from "./shutdown.js";

mkdirSync(UPLOAD_PATH, { recursive: true });

const app = createApp();
const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, "HTTP server started");
});

registerPresentationRealtime(server);
registerGracefulShutdown(server);

export default app;
