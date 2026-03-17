# Bookmark Manager Project

## Development Guidelines

### Port Configuration

- **Default port**: 3000 (Next.js dev server)
- When starting the local development server, check if port 3000 is already in use
- If port 3000 is occupied, Next.js will automatically try the next available port (3001, 3002, etc.)
- To avoid conflicts, you can:
  - Check for running processes: `lsof -i :3000`
  - Kill conflicting process: `kill -9 <PID>`
  - Or let Next.js auto-select an available port
