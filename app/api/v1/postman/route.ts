import { NextResponse } from 'next/server';
import { postmanCollection } from '@/lib/openapi/postman-collection';

export async function GET() {
  return NextResponse.json(postmanCollection);
}
