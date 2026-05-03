import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bushi } from "../target/types/bushi";
import { expect } from "chai";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { sha256 } from "js-sha256";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity } from "@metaplex-foundation/umi";
import {
  fetchAsset,
  transferV1,
} from "@metaplex-foundation/mpl-core";

describe("bushi", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Bushi as Program<Bushi>;

  // Umi setup
  const umi = createUmi(provider.connection);
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(
    (provider.wallet as anchor.Wallet).payer.secretKey
  );
  umi.use(keypairIdentity(umiKeypair));

  // Test data
  const rawImei = "123456789012345";
  const salt = "my_secure_env_salt";
  const hashedImeiArray = Array.from(sha256.array(rawImei + salt));

  const assetKeypair = Keypair.generate();
  let deviceStatePda: anchor.web3.PublicKey;
  let bump: number;

  before(async () => {
    [deviceStatePda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("device"), Buffer.from(hashedImeiArray)],
      program.programId
    );
  });

  it("Mints a new device NFT", async () => {
    const tx = await program.methods
      .mintDeviceNft(hashedImeiArray)
      .accounts({
        signer: provider.wallet.publicKey,
        deviceState: deviceStatePda,
        asset: assetKeypair.publicKey,
        coreProgram: "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([assetKeypair])
      .rpc();

    console.log("Mint transaction signature", tx);

    const deviceState = await program.account.deviceState.fetch(deviceStatePda);
    expect(deviceState.owner.toBase58()).to.equal(provider.wallet.publicKey.toBase58());
    expect(deviceState.assetId.toBase58()).to.equal(assetKeypair.publicKey.toBase58());
    expect(deviceState.isStolen).to.be.false;

    // Verify Metaplex Asset
    const asset = await fetchAsset(umi, assetKeypair.publicKey.toBase58() as any);
    console.dir(asset, { depth: null });
    expect(asset.owner).to.equal(provider.wallet.publicKey.toBase58());
  });

  const buyer = Keypair.generate();

  it("Transfers a clean device", async () => {
    // Airdrop some SOL to buyer just in case
    const airdropSig = await provider.connection.requestAirdrop(buyer.publicKey, 1000000000);
    await provider.connection.confirmTransaction(airdropSig);

    const tx = await program.methods
      .transferDeviceNft()
      .accounts({
        owner: provider.wallet.publicKey,
        newOwner: buyer.publicKey,
        deviceState: deviceStatePda,
        asset: assetKeypair.publicKey,
        coreProgram: "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();

    console.log("Transfer transaction signature", tx);

    const deviceState = await program.account.deviceState.fetch(deviceStatePda);
    expect(deviceState.owner.toBase58()).to.equal(buyer.publicKey.toBase58());

    const asset = await fetchAsset(umi, assetKeypair.publicKey.toBase58() as any);
    expect(asset.owner).to.equal(buyer.publicKey.toBase58());
  });

  it("Throws the Killswitch (Marks as Stolen & Freezes)", async () => {
    // We need to use the current owner (buyer) to update the status.
    const bountyLamports = new anchor.BN(50000000); // 0.05 SOL
    const tx = await program.methods
      .updateDeviceStatus(true, "owner@example.com", bountyLamports)
      .accounts({
        owner: buyer.publicKey,
        deviceState: deviceStatePda,
        asset: assetKeypair.publicKey,
        coreProgram: "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
        finder: null,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([buyer])
      .rpc();

    const deviceState = await program.account.deviceState.fetch(deviceStatePda);
    expect(deviceState.isStolen).to.be.true;
    expect(deviceState.recoveryContact).to.equal("owner@example.com");
    expect(deviceState.bountyLamports.toNumber()).to.equal(50000000);
    
    // Check balance of PDA
    const balance = await provider.connection.getBalance(deviceStatePda);
    expect(balance).to.be.greaterThanOrEqual(50000000);
  });

  it("Marks as Found and Releases Bounty", async () => {
    const finder = Keypair.generate();
    const balanceBefore = await provider.connection.getBalance(finder.publicKey);
    
    const tx = await program.methods
      .updateDeviceStatus(false, null, new anchor.BN(0))
      .accounts({
        owner: buyer.publicKey,
        deviceState: deviceStatePda,
        asset: assetKeypair.publicKey,
        coreProgram: "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
        finder: finder.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([buyer])
      .rpc();
      
    const deviceState = await program.account.deviceState.fetch(deviceStatePda);
    expect(deviceState.isStolen).to.be.false;
    expect(deviceState.bountyLamports.toNumber()).to.equal(0);
    
    const balanceAfter = await provider.connection.getBalance(finder.publicKey);
    expect(balanceAfter - balanceBefore).to.equal(50000000);
  });
});
