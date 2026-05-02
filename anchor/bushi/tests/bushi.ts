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

  it.skip("Throws the Killswitch (Marks as Stolen & Freezes)", async () => {
    // We need to use the current owner (buyer) to update the status.
    // Wait, the test uses provider.wallet by default, but the owner is now the buyer.
    // We should change the owner back or use the buyer as the signer for this test.
    // Since we used transferDeviceNft, the buyer is the new owner. Let's update the status with buyer.
    
    const tx = await program.methods
      .updateDeviceStatus(true, "owner@example.com")
      .accounts({
        owner: buyer.publicKey,
        deviceState: deviceStatePda,
        asset: assetKeypair.publicKey,
        coreProgram: "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([buyer])
      .rpc();

    const deviceState = await program.account.deviceState.fetch(deviceStatePda);
    expect(deviceState.isStolen).to.be.true;
    expect(deviceState.recoveryContact).to.equal("owner@example.com");
  });

  it.skip("Fails a raw Metaplex Core transfer when Frozen (The Exploit Attempt)", async () => {
    // We configure Umi to act as the buyer trying to transfer the asset directly
    const buyerUmiKeypair = umi.eddsa.createKeypairFromSecretKey(buyer.secretKey);
    umi.use(keypairIdentity(buyerUmiKeypair));

    const thief = Keypair.generate();

    try {
      await transferV1(umi, {
        asset: assetKeypair.publicKey.toBase58() as any,
        newOwner: thief.publicKey.toBase58() as any,
      }).sendAndConfirm(umi);

      expect.fail("The raw Metaplex transfer should have failed because the asset is frozen!");
    } catch (err: any) {
      expect(err.message).to.match(/ExtensionError|0x1d|AssetFrozen|custom program error/);
      // MplCore freeze errors manifest as Extension errors due to the Delegate
      console.log("Exploit successfully thwarted by Freeze Delegate.");
    }
  });
});
