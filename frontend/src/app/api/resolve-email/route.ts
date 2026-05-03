import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

const privy = new PrivyClient(
  PRIVY_APP_ID || '',
  PRIVY_APP_SECRET || ''
);

export async function GET(request: Request) {
  try {
    if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
      console.error("Missing Privy App ID or Secret");
      return NextResponse.json(
        { error: 'Privy credentials are not fully configured on the server.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required.' },
        { status: 400 }
      );
    }

    // Lookup user by email
    let user;
    try {
      user = await privy.getUserByEmail(email);
    } catch (err: any) {
      // Privy SDK throws if user is not found
      return NextResponse.json(
        { error: 'No user found with that email address.' },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No user found with that email address.' },
        { status: 404 }
      );
    }

    // Find Solana wallet
    const solanaAccount = user.linkedAccounts.find(
      (account: any) => account.type === 'wallet' && account.chainType === 'solana'
    );

    if (!solanaAccount) {
      return NextResponse.json(
        { error: 'User found, but they do not have a linked Solana wallet.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      walletAddress: (solanaAccount as any).address
    });
  } catch (error) {
    console.error('Resolve Email API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while resolving email.' },
      { status: 500 }
    );
  }
}
