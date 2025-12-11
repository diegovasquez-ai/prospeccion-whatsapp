#!/usr/bin/env node

/**
 * Auto Port Detection for Next.js Development Server
 * Finds available port in range 3000-3006 and starts dev server
 */

const { spawn } = require('child_process');
const net = require('net');

const PORT_RANGE_START = 3000;
const PORT_RANGE_END = 3006;

/**
 * Check if a port is available
 */
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port, '0.0.0.0');
  });
}

/**
 * Find first available port in range
 */
async function findAvailablePort() {
  for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  return null;
}

/**
 * Start Next.js dev server on available port
 */
async function startDevServer() {
  console.log('🔍 Searching for available port...');

  const port = await findAvailablePort();

  if (!port) {
    console.error('❌ No available ports in range 3000-3006');
    console.error('Please free up a port or kill existing processes:');
    console.error('  lsof -i :3000');
    console.error('  kill -9 <PID>');
    process.exit(1);
  }

  console.log(`✅ Found available port: ${port}`);
  console.log(`🚀 Starting Next.js dev server on http://localhost:${port}\n`);

  const devServer = spawn('next', ['dev', '-p', port.toString()], {
    stdio: 'inherit',
    shell: true,
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down dev server...');
    devServer.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    devServer.kill('SIGTERM');
    process.exit(0);
  });

  devServer.on('error', (error) => {
    console.error('❌ Failed to start dev server:', error);
    process.exit(1);
  });
}

// Run the dev server
startDevServer();
