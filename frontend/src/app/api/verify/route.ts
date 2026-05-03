import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import bushiIdl from '@/lib/idl/bushi.json';
import { hashImei } from '@/lib/bushiClient';

// Simple in-memory rate limiter (IP -> timestamp array)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

export async function GET(request: Request) {
  try {
    // 1. Rate Limiting Check
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    const timestamps = rateLimitMap.get(ip) || [];
    
    // Clean up old timestamps
    const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    
    if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    validTimestamps.push(now);
    rateLimitMap.set(ip, validTimestamps);

    // 2. Parse request
    const { searchParams } = new URL(request.url);
    const imei = searchParams.get('imei');

    if (!imei || imei.length !== 15 || !/^\d+$/.test(imei)) {
      return NextResponse.json(
        { error: 'Invalid IMEI. Must be exactly 15 digits.' },
        { status: 400 }
      );
    }

    // 3. Query Solana (Stateless RPC connection)
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    
    // We only need read access, so dummy wallet is fine
    const dummyPubkey = new PublicKey('11111111111111111111111111111112');
    const dummyWallet = {
      publicKey: dummyPubkey,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any) => txs,
    };
    
    const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' });
    const program = new Program(bushiIdl as Idl, provider);

    const hashedImei = hashImei(imei);
    const [deviceStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("device"), Buffer.from(hashedImei)],
      program.programId
    );

    try {
      const deviceState = await (program.account as any).deviceState.fetch(deviceStatePda);
      
      // Return public data
      return NextResponse.json({
        exists: true,
        pda: deviceStatePda.toBase58(),
        status: deviceState.isStolen ? 'stolen' : 'clean',
        owner: deviceState.owner.toBase58(),
        recoveryContact: deviceState.isStolen ? deviceState.recoveryContact : null, // Only expose contact if stolen
        bountyLamports: deviceState.bountyLamports ? deviceState.bountyLamports.toNumber() : 0,
      });
    } catch {
      // Account not found = not registered
      return NextResponse.json({
        exists: false,
        status: 'unregistered'
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while communicating with Solana.' },
      { status: 500 }
    );
  }
}
