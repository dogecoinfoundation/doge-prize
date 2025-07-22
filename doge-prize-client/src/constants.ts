// Server configuration constants
export const SERVER_PORT = 3644;

// Helper function to construct server URL
export const getServerUrl = (ip: string): string => {
  return ip.startsWith('http') ? ip : `http://${ip}:${SERVER_PORT}`;
}; 