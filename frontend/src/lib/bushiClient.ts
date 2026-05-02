import { AnchorProvider, Program, Idl, setProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram, Keypair, Transaction } from '@solana/web3.js';
import bushiIdl from './idl/bushi.json';
import { createHash } from 'crypto';

export const PROGRAM_ID = new PublicKey(bushiIdl.address);
export const CORE_PROGRAM_ID = new PublicKey('CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d');

// Helper to hash IMEI consistently
export function hashImei(imei: string): number[] {
  const hash = createHash('sha256').update(imei).digest();
  return Array.from(hash);
}

export function getBushiProgram(provider: AnchorProvider) {
  setProvider(provider);
  return new Program(bushiIdl as Idl, provider);
}

export async function fetchDevicesForOwner(program: Program, ownerPubkey: PublicKey) {
  try {
    const devices = await (program.account as any).deviceState.all([
      {
        memcmp: {
          offset: 8, // Discriminator offset
          bytes: ownerPubkey.toBase58(),
        },
      },
    ]);
    return devices;
  } catch (error) {
    console.error("Error fetching devices:", error);
    return [];
  }
}

export async function fetchAllDevices(program: Program) {
  try {
    const devices = await (program.account as any).deviceState.all();
    return devices;
  } catch (error) {
    console.error("Error fetching all devices:", error);
    return [];
  }
}

// Build the register transaction (unsigned) and return it + the asset keypair
export async function buildRegisterDeviceTx(
  program: Program,
  connection: Connection,
  imei: string,
  walletPubkey: PublicKey
): Promise<{ transaction: Transaction; assetKeypair: Keypair }> {
  const hashedImei = hashImei(imei);
  
  const [deviceStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("device"), Buffer.from(hashedImei)],
    program.programId
  );

  const assetKeypair = Keypair.generate();

  const tx = await program.methods
    .mintDeviceNft(hashedImei)
    .accounts({
      signer: walletPubkey,
      deviceState: deviceStatePda,
      asset: assetKeypair.publicKey,
      coreProgram: CORE_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    } as any)
    .transaction();

  // Set fee payer and recent blockhash
  tx.feePayer = walletPubkey;
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;

  // Partial sign with asset keypair (required signer)
  tx.partialSign(assetKeypair);

  return { transaction: tx, assetKeypair };
}

// Build the mark-stolen transaction (unsigned)
export async function buildMarkStolenTx(
  program: Program,
  connection: Connection,
  imei: string,
  walletPubkey: PublicKey,
  recoveryContact: string
): Promise<Transaction> {
  const hashedImei = hashImei(imei);
  
  const [deviceStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("device"), Buffer.from(hashedImei)],
    program.programId
  );

  const deviceState = await (program.account as any).deviceState.fetch(deviceStatePda);

  const tx = await program.methods
    .updateDeviceStatus(true, recoveryContact)
    .accounts({
      owner: walletPubkey,
      deviceState: deviceStatePda,
      asset: deviceState.assetId,
      coreProgram: CORE_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    } as any)
    .transaction();

  tx.feePayer = walletPubkey;
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;

  return tx;
}

// Build transfer device transaction
export async function buildTransferDeviceTx(
  program: Program,
  connection: Connection,
  imei: string,
  ownerPubkey: PublicKey,
  newOwnerPubkey: PublicKey
): Promise<Transaction> {
  const hashedImei = hashImei(imei);

  const [deviceStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("device"), Buffer.from(hashedImei)],
    program.programId
  );

  const deviceState = await (program.account as any).deviceState.fetch(deviceStatePda);

  const tx = await program.methods
    .transferDeviceNft()
    .accounts({
      owner: ownerPubkey,
      newOwner: newOwnerPubkey,
      deviceState: deviceStatePda,
      asset: deviceState.assetId,
      coreProgram: CORE_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    } as any)
    .transaction();

  tx.feePayer = ownerPubkey;
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;

  return tx;
}

// Fetch device state by IMEI (for vendor verification)
export async function fetchDeviceByImei(program: Program, imei: string) {
  const hashedImei = hashImei(imei);

  const [deviceStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("device"), Buffer.from(hashedImei)],
    program.programId
  );

  try {
    const deviceState = await (program.account as any).deviceState.fetch(deviceStatePda);
    return { exists: true, data: deviceState, pda: deviceStatePda.toBase58() };
  } catch {
    return { exists: false, data: null, pda: null };
  }
}
