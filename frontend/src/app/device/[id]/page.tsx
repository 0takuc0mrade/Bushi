'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth/solana';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { getBushiProgram, fetchDevicesForOwner, buildTransferDeviceTx, buildMarkFoundTx, hashImei } from '@/lib/bushiClient';
import { useRouter, useParams } from 'next/navigation';
import ThemeToggle from '../../components/ThemeToggle';

export default function DeviceDetails() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();
  const params = useParams();
  const deviceIndex = Number(params.id);

  const [device, setDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [buyerAddress, setBuyerAddress] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [allDevices, setAllDevices] = useState<any[]>([]);

  // Mark as Found state
  const [showFoundModal, setShowFoundModal] = useState(false);
  const [finderAddress, setFinderAddress] = useState('');
  const [foundMyself, setFoundMyself] = useState(false);
  const [markingFound, setMarkingFound] = useState(false);
  const [foundStage, setFoundStage] = useState('');
  const [bountyData, setBountyData] = useState<{ amount: number; currency: string } | null>(null);

  const solanaWalletAddress = useMemo(() => {
    if (!user?.linkedAccounts) return null;
    const solanaAccount = user.linkedAccounts.find(
      (account: any) => account.type === 'wallet' && account.chainType === 'solana'
    );
    return (solanaAccount as any)?.address ?? null;
  }, [user]);

  const signingWallet = useMemo(() => {
    if (!solanaWalletAddress || !wallets.length) return null;
    return wallets.find((w: any) => w.address === solanaWalletAddress)
      || wallets.find((w: any) => w.walletClientType === 'privy')
      || wallets[0]
      || null;
  }, [wallets, solanaWalletAddress]);

  useEffect(() => {
    async function loadDevice() {
      if (solanaWalletAddress) {
        try {
          const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
          const pubkey = new PublicKey(solanaWalletAddress);
          const walletAdapter = {
            publicKey: pubkey,
            signTransaction: async (tx: any) => tx,
            signAllTransactions: async (txs: any) => txs,
          };
          const provider = new AnchorProvider(connection, walletAdapter as any, { commitment: 'confirmed' });
          const program = getBushiProgram(provider);
          const devices = await fetchDevicesForOwner(program, pubkey);
          setAllDevices(devices);
          if (devices[deviceIndex]) {
            setDevice(devices[deviceIndex]);
            // Load bounty from localStorage
            const hash = devices[deviceIndex].account.hashedImei;
            const bountyKey = `bounty_${Array.from(hash.slice(0, 8) as number[]).join('')}`;
            const stored = localStorage.getItem(bountyKey);
            if (stored) {
              try { setBountyData(JSON.parse(stored)); } catch {}
            }
          }
        } catch (error) {
          console.error('Failed to load device:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    loadDevice();
  }, [solanaWalletAddress, deviceIndex]);

  const handleMarkFound = async () => {
    if (!signingWallet || !solanaWalletAddress || !device) return;
    setMarkingFound(true);

    try {
      setFoundStage('Unfreezing device on Solana...');
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const ownerPubkey = new PublicKey(solanaWalletAddress);
      const dummyWallet = {
        publicKey: ownerPubkey,
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any) => txs,
      };
      const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' });
      const program = getBushiProgram(provider);

      const hashedImei = Array.from(device.account.hashedImei as number[]);
      const tx = await buildMarkFoundTx(program, connection, hashedImei, ownerPubkey);
      const serializedTx = tx.serialize({ requireAllSignatures: false });

      setFoundStage('Awaiting wallet signature...');
      const { signedTransaction } = await (signingWallet as any).signTransaction({
        transaction: serializedTx,
        chain: 'solana:devnet',
      });

      setFoundStage('Broadcasting to Solana...');
      const txSig = await connection.sendRawTransaction(signedTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });
      await connection.confirmTransaction(txSig, 'confirmed');

      // Release bounty (simulated)
      if (bountyData && !foundMyself && finderAddress) {
        setFoundStage('Releasing bounty to finder...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log(`Bounty of ${bountyData.amount} USDC released to ${finderAddress} (simulated)`);
      }

      // Clear bounty from localStorage
      const hash = device.account.hashedImei;
      const bountyKey = `bounty_${Array.from(hash.slice(0, 8) as number[]).join('')}`;
      localStorage.removeItem(bountyKey);

      setFoundStage('Device recovered successfully!');
      await new Promise(resolve => setTimeout(resolve, 800));
      router.push('/');
    } catch (error) {
      console.error('Mark as found failed:', error);
      alert('Failed to mark device as found. Check console for details.');
    } finally {
      setMarkingFound(false);
      setFoundStage('');
    }
  };


  const handleTransfer = async () => {
    if (!buyerAddress || !signingWallet || !solanaWalletAddress || !device) return;
    setTransferring(true);

    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const ownerPubkey = new PublicKey(solanaWalletAddress);
      const newOwnerPubkey = new PublicKey(buyerAddress);

      const dummyWallet = {
        publicKey: ownerPubkey,
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any) => txs,
      };
      const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' });
      const program = getBushiProgram(provider);

      // We need the IMEI hash to find the PDA — reconstruct from device data
      const hashedImei = device.account.hashedImei;
      const [deviceStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("device"), Buffer.from(hashedImei)],
        program.programId
      );

      // Build the transfer transaction directly (we already have the PDA)
      const tx = await program.methods
        .transferDeviceNft()
        .accounts({
          owner: ownerPubkey,
          newOwner: newOwnerPubkey,
          deviceState: deviceStatePda,
          asset: device.account.assetId,
          coreProgram: new PublicKey('CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d'),
          systemProgram: new PublicKey('11111111111111111111111111111111'),
        } as any)
        .transaction();

      tx.feePayer = ownerPubkey;
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;

      const serializedTx = tx.serialize({ requireAllSignatures: false });
      const { signedTransaction } = await (signingWallet as any).signTransaction({
        transaction: serializedTx,
        chain: 'solana:devnet',
      });

      const txSig = await connection.sendRawTransaction(signedTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      await connection.confirmTransaction(txSig, 'confirmed');
      console.log('Transfer successful:', txSig);
      alert('Device transferred successfully!');
      router.push('/');
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Transfer failed. Check console for details.');
    } finally {
      setTransferring(false);
    }
  };

  const getBushiId = () => {
    if (!device) return '';
    const hash = device.account.hashedImei;
    const hex = Array.from(hash.slice(0, 4) as number[]).map((b: number) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    return `BSH-***-${hex.slice(0, 4)}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-stone-500 dark:text-stone-400 bg-[#FDFCFB] dark:bg-stone-950 transition-colors">Loading device details...</div>;
  }

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFCFB] dark:bg-stone-950 text-stone-500 dark:text-stone-400 gap-4 transition-colors">
        <span className="material-symbols-outlined text-5xl text-stone-300 dark:text-stone-600">device_unknown</span>
        <p>Device not found.</p>
        <Link href="/" className="text-[#48A9A6] dark:text-[#5BC4C1] font-semibold hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col">
        {/* ===== MOBILE HEADER ===== */}
        <header className="md:hidden bg-[#FDFCFB] dark:bg-stone-900 border-b border-stone-200/60 dark:border-stone-800 shadow-sm dark:shadow-none sticky top-0 z-50 transition-colors">
          <div className="flex justify-between items-center w-full px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors p-2 rounded-full active:scale-95">
                <span className="material-symbols-outlined text-[#48A9A6] dark:text-[#5BC4C1]">arrow_back</span>
              </Link>
              <h1 className="font-semibold tracking-tight text-[#1e1b17] dark:text-stone-100">Device Details</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="text-xl font-bold text-[#48A9A6] dark:text-[#5BC4C1]">VaultID</div>
            </div>
          </div>
        </header>

        {/* ===== CONTENT ===== */}
        <div className="flex-grow px-6 md:px-10 lg:px-16 py-6 md:py-10 max-w-5xl mx-auto w-full">
          {/* Device Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${device.account.isStolen ? 'bg-[#ffdad6] dark:bg-[#ba1a1a]/20 text-[#ba1a1a] dark:text-[#ffb4ab]' : 'bg-[#48A9A6]/10 dark:bg-[#5BC4C1]/10 text-[#48A9A6] dark:text-[#5BC4C1]'}`}>
                <span className="material-symbols-outlined text-[32px]">smartphone</span>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-[32px] font-bold text-[#1e1b17] dark:text-stone-100">VaultID Device</h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    device.account.isStolen ? 'bg-[#FCE8E6] dark:bg-[#ba1a1a] text-[#C5221F] dark:text-white' : 'bg-[#E6F4EA] dark:bg-[#137333] text-[#137333] dark:text-white'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    {device.account.isStolen ? 'Stolen' : 'Active'}
                  </span>
                </div>
                <p className="text-stone-500 dark:text-stone-400 font-mono text-sm">{getBushiId()}</p>
              </div>
            </div>
            <div className="flex gap-3">
              {device.account.isStolen ? (
                <button
                  onClick={() => setShowFoundModal(true)}
                  className="px-4 py-2 bg-[#137333] hover:bg-[#0d5a27] text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Mark as Found
                </button>
              ) : (
                <>
                  <Link href="/report" className="px-4 py-2 border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-semibold rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm">
                    Report Stolen
                  </Link>
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="px-4 py-2 bg-[#48A9A6] hover:bg-[#3a8a87] text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                    Transfer Ownership
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Device Info Card */}
            <div className="bg-white dark:bg-stone-900 rounded-xl border border-[#e8e1d9] dark:border-stone-800 shadow-sm p-6 transition-colors">
              <h3 className="font-semibold text-[#1e1b17] dark:text-stone-100 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#48A9A6] dark:text-[#5BC4C1]">info</span>
                Device Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400 text-sm">Status</span>
                  <span className={`font-semibold text-sm ${device.account.isStolen ? 'text-[#ba1a1a] dark:text-[#ffb4ab]' : 'text-[#137333] dark:text-[#81c995]'}`}>
                    {device.account.isStolen ? 'Reported Stolen' : 'Active & Protected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400 text-sm">Owner Wallet</span>
                  <span className="font-mono text-sm text-[#1e1b17] dark:text-stone-200">{device.account.owner.toBase58().slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400 text-sm">Asset ID</span>
                  <span className="font-mono text-sm text-[#006a68] dark:text-[#5BC4C1]">{device.account.assetId.toBase58().slice(0, 8)}...</span>
                </div>
                {device.account.recoveryContact && (
                  <div className="flex justify-between">
                    <span className="text-stone-500 dark:text-stone-400 text-sm">Recovery Contact</span>
                    <span className="text-sm text-[#1e1b17] dark:text-stone-200">{device.account.recoveryContact}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-white dark:bg-stone-900 rounded-xl border border-[#e8e1d9] dark:border-stone-800 shadow-sm p-6 transition-colors">
              <h3 className="font-semibold text-[#1e1b17] dark:text-stone-100 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#48A9A6] dark:text-[#5BC4C1]">shield</span>
                Security
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-[#E6F4EA] dark:bg-[#137333]/20 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-[#137333] dark:text-[#81c995]">check_circle</span>
                  <span className="text-sm text-[#137333] dark:text-[#81c995] font-semibold">IMEI hash verified on-chain</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#E6F4EA] dark:bg-[#137333]/20 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-[#137333] dark:text-[#81c995]">check_circle</span>
                  <span className="text-sm text-[#137333] dark:text-[#81c995] font-semibold">Metaplex Core NFT minted</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#E6F4EA] dark:bg-[#137333]/20 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-[#137333] dark:text-[#81c995]">check_circle</span>
                  <span className="text-sm text-[#137333] dark:text-[#81c995] font-semibold">Solana Devnet protection active</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== BOUNTY CARD (stolen devices only) ===== */}
          {device.account.isStolen && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30 shadow-sm p-6 mt-6 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[28px]">monetization_on</span>
                  <h3 className="font-semibold text-[#1e1b17] dark:text-stone-100">Recovery Bounty</h3>
                </div>
                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Escrow</span>
              </div>
              {bountyData ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-[#1e1b17] dark:text-stone-100">${bountyData.amount} <span className="text-lg font-normal text-stone-400">USDC</span></p>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Locked in escrow • Released to finder on recovery</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">lock</span>
                  </div>
                </div>
              ) : (
                <p className="text-stone-500 dark:text-stone-400 text-sm">No bounty was set for this device. You can report it stolen again with a bounty to incentivize recovery.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== TRANSFER OWNERSHIP MODAL ===== */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm" onClick={() => setShowTransferModal(false)}></div>
          <div className="relative bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-transparent dark:border-stone-800 w-full max-w-lg p-8 animate-in fade-in zoom-in-95 duration-200 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#48A9A6] dark:text-[#5BC4C1]">swap_horiz</span>
                <h2 className="text-xl font-bold text-[#1e1b17] dark:text-stone-100">Transfer Ownership</h2>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
              You are about to transfer the device <strong className="text-[#1e1b17] dark:text-stone-200">VaultID Device ({getBushiId()})</strong>. This action will permanently remove it from your account.
            </p>

            <div className="space-y-2 mb-6">
              <label className="font-semibold text-sm text-stone-600 dark:text-stone-300 block">Buyer&apos;s Solana Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500">account_balance_wallet</span>
                <input
                  className="block w-full pl-12 pr-4 py-3 bg-[#faf2ea] dark:bg-stone-950 border-transparent rounded-xl focus:ring-2 focus:ring-[#48a9a6] focus:border-[#48a9a6] focus:bg-white dark:focus:bg-stone-800 text-[#1e1b17] dark:text-stone-100 placeholder:text-stone-400 dark:placeholder-stone-500 transition-all font-mono text-sm outline-none"
                  placeholder="e.g. AjNXABj8D2GHZY8Bf..."
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                />
              </div>
              <p className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                The NFT and device ownership will be transferred to this address.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#e8e1d9] dark:border-stone-800">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-6 py-3 text-stone-600 dark:text-stone-300 font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={!buyerAddress || transferring}
                className="px-6 py-3 bg-[#48A9A6] hover:bg-[#3a8a87] text-white font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {transferring ? 'Transferring...' : 'Send Transfer Invite'}
                {!transferring && <span className="material-symbols-outlined text-[18px]">send</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MARK AS FOUND MODAL ===== */}
      {showFoundModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm" onClick={() => setShowFoundModal(false)}></div>
          <div className="relative bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-transparent dark:border-stone-800 w-full max-w-lg p-8 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#137333] dark:text-[#81c995]">check_circle</span>
                <h2 className="text-xl font-bold text-[#1e1b17] dark:text-stone-100">Mark Device as Found</h2>
              </div>
              <button onClick={() => setShowFoundModal(false)} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
              This will unfreeze the device NFT and restore full transferability. The device status will return to <strong className="text-[#137333] dark:text-[#81c995]">Active</strong>.
            </p>

            {bountyData && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Bounty to Release</span>
                  <span className="text-lg font-bold text-[#1e1b17] dark:text-stone-100">${bountyData.amount} USDC</span>
                </div>

                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={foundMyself}
                    onChange={(e) => setFoundMyself(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-[#48A9A6] focus:ring-[#48A9A6]"
                  />
                  <span className="text-sm text-stone-600 dark:text-stone-300">I found it myself — no payout needed</span>
                </label>

                {!foundMyself && (
                  <div className="space-y-1">
                    <label className="font-semibold text-sm text-stone-600 dark:text-stone-300 block">Finder&apos;s Solana Address</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500">account_balance_wallet</span>
                      <input
                        className="block w-full pl-12 pr-4 py-3 bg-[#faf2ea] dark:bg-stone-950 border-transparent rounded-xl focus:ring-2 focus:ring-[#48a9a6] focus:border-[#48a9a6] focus:bg-white dark:focus:bg-stone-800 text-[#1e1b17] dark:text-stone-100 placeholder:text-stone-400 dark:placeholder-stone-500 transition-all font-mono text-sm outline-none"
                        placeholder="e.g. AjNXABj8D2GHZY8Bf..."
                        value={finderAddress}
                        onChange={(e) => setFinderAddress(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[#e8e1d9] dark:border-stone-800">
              <button
                onClick={() => setShowFoundModal(false)}
                className="px-6 py-3 text-stone-600 dark:text-stone-300 font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkFound}
                disabled={markingFound || (!foundMyself && !!bountyData && !finderAddress)}
                className="px-6 py-3 bg-[#137333] hover:bg-[#0d5a27] text-white font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {markingFound ? foundStage || 'Processing...' : 'Confirm Recovery'}
                {!markingFound && <span className="material-symbols-outlined text-[18px]">check</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
