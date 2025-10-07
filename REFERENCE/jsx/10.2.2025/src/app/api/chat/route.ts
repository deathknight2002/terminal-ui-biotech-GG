import { NextResponse } from 'next/server';
import type { ChatRequestBody } from '@/lib/chatTypes';
export async function POST(req: Request) { const body = (await req.json()) as ChatRequestBody; const last = body.messages[body.messages.length-1]; const reply = last ? `Echo (${body.model}): ${last.content.split('').reverse().join('')}` : 'Hello.'; return NextResponse.json({ reply }); }