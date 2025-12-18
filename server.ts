import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeSocketIO } from '@/lib/workflow/socket';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize Socket.io
  const io = initializeSocketIO(server);
  console.log('[Socket.io] Server initialized');

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });

  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    if (io) {
      io.close();
    }
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
});
