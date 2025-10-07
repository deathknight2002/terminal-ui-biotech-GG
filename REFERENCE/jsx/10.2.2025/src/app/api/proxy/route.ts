import { NextRequest, NextResponse } from 'next/server';
import { backendRequest } from '@/lib/backend';
const ALLOW_PREFIXES = ['/models','/health'];
export async function GET(req: NextRequest) { const path = req.nextUrl.searchParams.get('path') || '/'; if(!ALLOW_PREFIXES.some(p=>path.startsWith(p))) return NextResponse.json({ error: 'Path not allowed' }, { status: 400 }); try { const data = await backendRequest({ path }); return NextResponse.json(data); } catch(e:any){ return NextResponse.json({ error: e.message }, { status: 502 }); } }