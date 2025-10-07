import { describe, it, expect } from 'vitest';
import { POST } from '../src/app/api/chat/route';

// Chat API route handler test (echo logic)

describe('chat API', () => {
  it('echoes reversed last user message with model name', async () => {
    const body = { model: 'test-model', messages: [{ role: 'user', content: 'Hello' }] };
    const req = new Request('http://localhost/api/chat', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req as any);
    const json: any = await res.json();
    expect(json.reply).toContain('Echo (test-model):');
    expect(json.reply).toContain('olleH');
  });
});
