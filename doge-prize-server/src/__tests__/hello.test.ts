import { GET } from '@/app/api/hello/route';
import { jest, describe, it, expect } from '@jest/globals';

describe('Hello Endpoint', () => {
  it('should return hello message', async () => {
    const response = await GET();
    const text = await response.text();
    
    expect(response.status).toBe(200);
    expect(text).toBe('hello');
    expect(response.headers.get('Content-Type')).toBe('text/plain');
  });
}); 