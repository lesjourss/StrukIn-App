import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || '';

  return {
    plugins: [
      react(),
      {
        name: 'api-gemini-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && (req.url.startsWith('/api/gemini') || req.url.startsWith('/api/gemini/'))) {
              let body = '';
              req.on('data', chunk => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  req.body = body ? JSON.parse(body) : {};
                  
                  // Mock Vercel response object
                  const mockRes = {
                    get headersSent() {
                      return res.headersSent;
                    },
                    status(statusCode) {
                      res.statusCode = statusCode;
                      return this;
                    },
                    json(data) {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                    },
                    setHeader(name, value) {
                      res.setHeader(name, value);
                    },
                    end() {
                      res.end();
                    }
                  };

                  const apiPath = path.resolve(process.cwd(), './api/gemini.js');
                  const { default: handler } = await import(apiPath);
                  await handler(req, mockRes);
                } catch (err) {
                  console.error('Local API middleware error:', err);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: true, message: err.message }));
                }
              });
              return;
            }
            next();
          });
        }
      }
    ],
  }
})
