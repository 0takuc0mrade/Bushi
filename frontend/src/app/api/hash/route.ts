import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imei } = body;

    if (!imei) {
      return NextResponse.json({ error: 'IMEI is required' }, { status: 400 });
    }

    const pepper = process.env.BUSHI_GLOBAL_PEPPER;
    if (!pepper) {
      console.error('BUSHI_GLOBAL_PEPPER is not set in environment variables');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const hash = crypto
      .createHash('sha256')
      .update(`${imei}${pepper}`)
      .digest('hex');

    return NextResponse.json({ hashed_imei: hash }, { status: 200 });
  } catch (error) {
    console.error('Error generating hash:', error);
    return NextResponse.json({ error: 'Failed to generate hash' }, { status: 500 });
  }
}
