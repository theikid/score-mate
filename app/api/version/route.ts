import { NextResponse } from 'next/server';
import packageJson from '../../../package.json';

export async function GET() {
  return NextResponse.json(
    {
      version: packageJson.version,
      timestamp: Date.now(),
    },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
