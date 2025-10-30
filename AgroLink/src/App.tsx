import React, { useEffect, useMemo, useState } from "react";
import NavBar from "./shared/components/NavBar";
import WithdrawModal from "./shared/components/WithdrawModal";

type Track = { id: number; title: string; length?: string };

type NftItem = {
  id: number;
  name: string;
  priceSOL: number;
  image: string;
  owned?: boolean;
  caption?: string;
  farmId?: number;
};

type AlbumItem = {
  id: number;
  title: string;
  cover: string;
  caption: string;
};

type Farm = {
  id: number;
  name: string;
  cover: string;
  description?: string;
};

type Payout = { date: string; amount: number };

type User = { username: string; role: "factory" | "investor"; farmId?: number };

type OfferStatus = "pending" | "counter" | "accepted" | "declined" | "shipped";
type Offer = {
  id: string;
  nftId: number;
  buyer: string;
  priceSOL: number;
  status: OfferStatus;
  counterPriceSOL?: number;
  ts: number;
};

type FiatWithdrawal = {
  id: string;
  amount: number;
  eta: string;
  status: "processing" | "paid";
  accountMasked: string;
  ts: number;
};
type Tab =
  | "landing"
  | "album"
  | "farms"
  | "dashboard"
  | "artist"
  | "factoryAnalytics";

type TransactionStatus = "idle" | "pending" | "success" | "error";

type BlockchainState = {
  connection: any;
  wallet: any;
  programId: string;
  nftCollection: string;
  royaltyToken: string;
};

const fmtSOL = (n: number) => `${n.toFixed(2)} SOL`;

const SOLANA_RPC_URL = "https://api.devnet.solana.com";
const PROGRAM_ID = "11111111111111111111111111111111";
const NFT_COLLECTION_ID = "22222222222222222222222222222222";
const ROYALTY_TOKEN_ID = "33333333333333333333333333333333";

const initializeBlockchain = async (): Promise<BlockchainState> => {
  return {
    connection: null,
    wallet: null,
    programId: PROGRAM_ID,
    nftCollection: NFT_COLLECTION_ID,
    royaltyToken: ROYALTY_TOKEN_ID,
  };
};

const connectPhantomWallet = async (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Phan...t0mKey...ABCD");
    }, 1000);
  });
};

const purchaseNft = async (
  nftId: number,
  buyerAddress: string,
  priceSOL: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) {
        resolve(`tx_${Date.now()}_${nftId}`);
      } else {
        reject(new Error("Transaction failed"));
      }
    }, 2000);
  });
};

const mintAlbumCollection = async (
  albumData: any,
  artistAddress: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) {
        resolve(`collection_${Date.now()}`);
      } else {
        reject(new Error("Minting failed"));
      }
    }, 3000);
  });
};

const distributeRoyalties = async (
  amount: number,
  fanAddresses: string[]
): Promise<string> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) {
        resolve(`royalty_${Date.now()}`);
      } else {
        reject(new Error("Distribution failed"));
      }
    }, 1500);
  });
};

export default function App() {
  const [tab, setTab] = useState<Tab>("landing");
  const [connected, setConnected] = useState(false);
  const [phantomPubkey, setPhantomPubkey] = useState<string | null>(null);
  const [showWallet, setShowWallet] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const [blockchainState, setBlockchainState] =
    useState<BlockchainState | null>(null);
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus>("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [showPhantomConfirm, setShowPhantomConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [walletSolBalance, setWalletSolBalance] = useState<number>(() => {
    const raw = localStorage.getItem("wallet:sol");
    return raw ? Number(raw) : 25;
  });
  const [offers, setOffers] = useState<Offer[]>(() => {
    try {
      const raw = localStorage.getItem("offers:data");
      return raw ? (JSON.parse(raw) as Offer[]) : [];
    } catch {
      return [];
    }
  });
  const [offerModal, setOfferModal] = useState<{
    open: boolean;
    nftId: number | null;
  }>({ open: false, nftId: null });
  const [offerPrice, setOfferPrice] = useState<number>(1);

  const [showFiatWithdraw, setShowFiatWithdraw] = useState(false);
  const [fiatAmount, setFiatAmount] = useState<number>(1);
  const [fiatName, setFiatName] = useState("");
  const [fiatIban, setFiatIban] = useState("");
  const [fiatSubmitting, setFiatSubmitting] = useState(false);
  const [pendingFiat, setPendingFiat] = useState<FiatWithdrawal[]>(() => {
    try {
      const raw = localStorage.getItem("fiat:pending");
      return raw ? (JSON.parse(raw) as FiatWithdrawal[]) : [];
    } catch {
      return [];
    }
  });

  const [fiatAmountDraft, setFiatAmountDraft] = useState<string>("1");
  const [fiatNameDraft, setFiatNameDraft] = useState<string>("");
  const [fiatIbanDraft, setFiatIbanDraft] = useState<string>("");
  const fiatAmountRef = React.useRef<HTMLInputElement | null>(null);
  const fiatNameRef = React.useRef<HTMLInputElement | null>(null);
  const fiatIbanRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("auth:user");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<User>;
        if (parsed?.username) {
          setUser({
            username: parsed.username,
            role: (parsed as any).role || "investor",
            farmId: (parsed as any).farmId,
          });
        }
      } catch {}
    }

    initializeBlockchain().then(setBlockchainState);
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem("auth:user", JSON.stringify(user));
    else localStorage.removeItem("auth:user");
  }, [user]);

  useEffect(() => {
    localStorage.setItem("offers:data", JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
    localStorage.setItem("fiat:pending", JSON.stringify(pendingFiat));
  }, [pendingFiat]);

  useEffect(() => {
    localStorage.setItem("wallet:sol", String(walletSolBalance));
  }, [walletSolBalance]);

  const [albumTitle, setAlbumTitle] = useState("Poultry Farm #1");
  const [albumCover, setAlbumCover] = useState("/main.jpg");

  const [tracks, setTracks] = useState<Track[]>([
    { id: 1, title: "Drumstick" },
    { id: 2, title: "Egg" },
    { id: 3, title: "Wings" },
    { id: 4, title: "Fillet" },
    { id: 5, title: "Whole chicken" },
    { id: 6, title: "Processing" },
  ]);

  const farms: Farm[] = useMemo(
    () => [
      {
        id: 1,
        name: "LLP 'Asa Agro'",
        cover: "/asa-agro-logo.jpeg",
        description: "High-quality products with full traceability of origin.",
      },
      {
        id: 2,
        name: "LLP 'Alel Agro' / JSC 'Alel Agro'",
        cover: "/alel-agro-logo.jpg",
        description: "Modern facilities and food safety standards.",
      },
      {
        id: 3,
        name: "LLP 'Aulie-Ata Phoenix'",
        cover: "/aulata-logo.jpg",
        description: "High quality and sustainable production practices.",
      },
      {
        id: 4,
        name: "LLP 'Zhambyl Kus'",
        cover: "/Zhambylkus-logo.png",
        description: "Verified origin and transparent logistics.",
      },
      {
        id: 5,
        name: "LLP 'Zhambyl Poultry Factory'",
        cover: "/zhambyl-logo.png",
        description:
          "The region’s largest producer with an innovative approach.",
      },
    ],
    []
  );

  const initialNfts: NftItem[] = useMemo(() => {
    const baseProducts = [
      "Drumstick",
      "Egg",
      "Wings",
      "Fillet",
      "Whole chicken",
      "Processing",
    ];
    const productImageMap: Record<string, string> = {
      Drumstick: "/golen.png",
      Egg: "/eggs.png",
      Wings: "/wings.jpeg",
      Fillet: "/fillet.png",
      "Whole chicken": "/tushka.png",
      Processing: "/pererabotka.webp",
    };
    let idCounter = 1;
    const items: NftItem[] = [];
    farms.forEach((farm) => {
      baseProducts.forEach((pName, idx) => {
        items.push({
          id: idCounter++,
          name: `${pName} — ${farm.name}`,
          priceSOL: 1,
          image: `${productImageMap[pName]}`,
          caption: `Batch #${idx + 1}`,
          owned: false,
          farmId: farm.id,
        });
      });
    });
    return items;
  }, [farms]);
  const [nfts, setNfts] = useState<NftItem[]>(initialNfts);

  const [royaltyBalance, setRoyaltyBalance] = useState(20);
  const [payouts, setPayouts] = useState<Payout[]>([
    { date: "2025-09-01", amount: 5 },
    { date: "2025-09-02", amount: 15 },
  ]);

  const soldCount = nfts.filter((n) => n.owned).length;
  const raisedSOL = soldCount * 1;
  const paidToFans = payouts.reduce((s, p) => s + p.amount, 0);

  const connectWallet = () => {
    setShowWallet(true);
  };

  const doConnectPhantom = async () => {
    setWalletConnecting(true);
    setTransactionError(null);

    try {
      const pubkey = await connectPhantomWallet();
      setConnected(true);
      setPhantomPubkey(pubkey);
      setShowWallet(false);
      setShowPhantomConfirm(false);
      setTransactionStatus("success");
      setTransactionHash("wallet_connected");
    } catch (error) {
      setTransactionError(
        error instanceof Error ? error.message : "Wallet connection failed"
      );
      setTransactionStatus("error");
    } finally {
      setWalletConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setConnected(false);
    setPhantomPubkey(null);
    setTransactionStatus("idle");
    setTransactionHash(null);
    setTransactionError(null);
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    const form = e.currentTarget as HTMLFormElement & {
      username: { value: string };
      password: { value: string };
      confirm?: { value: string };
      role?: { value: "factory" | "investor" };
      farmId?: { value: string };
    };
    const username = form.username.value.trim();
    const password = form.password.value.trim();
    const confirm = form.confirm?.value?.trim();
    const selectedRole =
      (form.role?.value as "factory" | "investor") || "investor";
    const selectedFarmId = form.farmId?.value
      ? Number(form.farmId.value)
      : undefined;

    setTimeout(() => {
      const usersRaw = localStorage.getItem("auth:users");
      const users = usersRaw
        ? (JSON.parse(usersRaw) as Record<
            string,
            | string
            | {
                password: string;
                role: "factory" | "investor";
                farmId?: number;
              }
          >)
        : {};

      if (!username) {
        setAuthError("Enter username");
        setAuthLoading(false);
        return;
      }
      if (password.length < 4) {
        setAuthError("Password must be at least 4 characters");
        setAuthLoading(false);
        return;
      }

      if (authMode === "signup") {
        if (users[username]) {
          setAuthError("User already exists");
          setAuthLoading(false);
          return;
        }
        if (confirm !== password) {
          setAuthError("Passwords do not match");
          setAuthLoading(false);
          return;
        }
        if (selectedRole === "factory" && !selectedFarmId) {
          setAuthError("Select a poultry factory");
          setAuthLoading(false);
          return;
        }
        users[username] = {
          password,
          role: selectedRole,
          farmId: selectedFarmId,
        };
        localStorage.setItem("auth:users", JSON.stringify(users));
        setUser({ username, role: selectedRole, farmId: selectedFarmId });
        setAuthLoading(false);
        return;
      }

      const userRecord = users[username];
      if (!userRecord) {
        setAuthError("Invalid username or password");
        setAuthLoading(false);
        return;
      }
      if (typeof userRecord === "string") {
        if (userRecord !== password) {
          setAuthError("Invalid username or password");
          setAuthLoading(false);
          return;
        }
        setUser({ username, role: "investor" });
      } else {
        if (userRecord.password !== password) {
          setAuthError("Invalid username or password");
          setAuthLoading(false);
          return;
        }
        setUser({
          username,
          role: userRecord.role || "investor",
          farmId: (userRecord as any).farmId,
        });
      }
      setAuthLoading(false);
    }, 500);
  };

  const logout = () => setUser(null);

  const AuthSignupOptions: React.FC = () => {
    const [signupRole, setSignupRole] = useState<"factory" | "investor">(
      "factory"
    );
    return (
      <>
        <div>
          <label className="text-sm text-white/70">Account type</label>
          <select
            name="role"
            className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
            defaultValue="factory"
            onChange={(e) =>
              setSignupRole(e.target.value as "factory" | "investor")
            }
          >
            <option value="factory">Poultry factory</option>
            <option value="investor">Investor/Retailer</option>
          </select>
        </div>
        {signupRole === "factory" && (
          <div>
            <label className="text-sm text-white/70">
              Select poultry factory
            </label>
            <select
              name="farmId"
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
              defaultValue={farms[0]?.id || ""}
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </>
    );
  };

  const [lastPurchase, setLastPurchase] = useState<{
    id: number;
    ts: number;
  } | null>(null);

  const buyNft = async (id: number) => {
    if (!connected || !phantomPubkey) {
      alert("Connect Phantom Wallet");
      return;
    }

    setTransactionStatus("pending");
    setTransactionError(null);

    try {
      const nft = nfts.find((n) => n.id === id);
      if (!nft) throw new Error("NFT not found");

      const txHash = await purchaseNft(id, phantomPubkey, nft.priceSOL);

      setNfts((prev) =>
        prev.map((n) => (n.id === id ? { ...n, owned: true } : n))
      );

      setTransactionStatus("success");
      setTransactionHash(txHash);
      setLastPurchase({ id, ts: Date.now() });

      alert(`Purchase successful: NFT #${id}\nTransaction: ${txHash}`);
    } catch (error) {
      setTransactionStatus("error");
      setTransactionError(
        error instanceof Error ? error.message : "Purchase failed"
      );
      alert(
        `Purchase error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const openOfferModal = (nftId: number) => {
    setOfferPrice(1);
    setOfferModal({ open: true, nftId });
  };

  const submitOffer = () => {
    if (!user) {
      alert("Sign in to send an offer");
      return;
    }
    if (!offerModal.nftId) return;
    const id = `offer_${Date.now()}_${offerModal.nftId}`;
    setOffers((prev) => [
      ...prev,
      {
        id,
        nftId: offerModal.nftId!,
        buyer: user.username,
        priceSOL: Math.max(0.1, Number(offerPrice) || 1),
        status: "pending",
        ts: Date.now(),
      },
    ]);
    setOfferModal({ open: false, nftId: null });
  };

  const declineOffer = (offerId: string) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: "declined" } : o))
    );
  };

  const acceptOffer = (offerId: string) => {
    const off = offers.find((o) => o.id === offerId);
    if (!off) return;
    setNfts((prev) =>
      prev.map((n) => (n.id === off.nftId ? { ...n, owned: true } : n))
    );
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: "accepted" } : o))
    );
  };

  const shipOffer = (offerId: string) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: "shipped" } : o))
    );
  };

  const confirmFiatWithdraw = () => {
    if (fiatSubmitting) return;
    const amount = Math.max(0.1, Number(fiatAmountDraft) || 0);
    if (!user) {
      alert("Sign in to withdraw funds");
      return;
    }
    if (!amount || amount <= 0 || amount > walletSolBalance) {
      alert("Invalid withdrawal amount");
      return;
    }
    if (!fiatNameDraft.trim() || !fiatIbanDraft.trim()) {
      alert("Fill in beneficiary details");
      return;
    }
    setFiatSubmitting(true);
    setTimeout(() => {
      const masked = `${fiatIbanDraft.slice(0, 4)}****${fiatIbanDraft.slice(
        -4
      )}`;
      const id = `wd_${Date.now()}`;
      const etaDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2)
        .toISOString()
        .slice(0, 10);
      setPendingFiat((prev) => [
        ...prev,
        {
          id,
          amount,
          eta: etaDate,
          status: "processing",
          accountMasked: masked,
          ts: Date.now(),
        },
      ]);
      setWalletSolBalance((b) => Number((b - amount).toFixed(2)));
      setFiatAmount(amount);
      setFiatName(fiatNameDraft);
      setFiatIban(fiatIbanDraft);
      setFiatSubmitting(false);
      setShowFiatWithdraw(false);
      alert(
        "Withdrawal request accepted. Funds will arrive within 2 business days (demo)."
      );
    }, 1000);
  };

  const withdrawRoyalty = async () => {
    if (!connected || !phantomPubkey) {
      alert("Connect Phantom Wallet");
      return;
    }

    if (royaltyBalance <= 0) {
      alert("Баланс ROYALTY пуст");
      return;
    }

    setTransactionStatus("pending");
    setTransactionError(null);

    try {
      const txHash = await distributeRoyalties(royaltyBalance, [phantomPubkey]);

      setRoyaltyBalance(0);
      setTransactionStatus("success");
      setTransactionHash(txHash);

      alert(`ROYALTY withdrawn\nTransaction: ${txHash}`);
    } catch (error) {
      setTransactionStatus("error");
      setTransactionError(
        error instanceof Error ? error.message : "Withdrawal failed"
      );
      alert(
        `Withdrawal error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const mintAlbumNfts = async () => {
    if (!connected || !phantomPubkey) {
      alert("Connect artist's Phantom Wallet");
      return;
    }

    setTransactionStatus("pending");
    setTransactionError(null);

    try {
      const albumData = {
        title: albumTitle,
        cover: albumCover,
        tracks: tracks,
        artistShare: 70,
        fansShare: 30,
      };

      const collectionId = await mintAlbumCollection(albumData, phantomPubkey);

      setTransactionStatus("success");
      setTransactionHash(collectionId);

      alert(`Collection created!\nCollection ID: ${collectionId}`);
    } catch (error) {
      setTransactionStatus("error");
      setTransactionError(
        error instanceof Error ? error.message : "Minting failed"
      );
      alert(
        `Mint error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const addPayout = async (amount: number) => {
    if (!connected || !phantomPubkey) {
      alert("Connect Phantom Wallet");
      return;
    }

    setTransactionStatus("pending");
    setTransactionError(null);

    try {
      const fanAddresses = nfts
        .filter((n) => n.owned)
        .map((n) => phantomPubkey);

      if (fanAddresses.length === 0) {
        alert("No NFT owners to distribute royalty");
        return;
      }

      const txHash = await distributeRoyalties(amount, fanAddresses);

      const today = new Date().toISOString().slice(0, 10);
      setPayouts((p) => [...p, { date: today, amount }]);
      setRoyaltyBalance((b) => b + amount);

      setTransactionStatus("success");
      setTransactionHash(txHash);

      alert(`Royalty distributed\nTransaction: ${txHash}`);
    } catch (error) {
      setTransactionStatus("error");
      setTransactionError(
        error instanceof Error ? error.message : "Distribution failed"
      );
      alert(
        `Distribution error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const AuthScreen = () => (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0b0014] via-[#170035] to-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-2xl overflow-hidden">
          <div className="px-6 pt-6">
            <div className="text-5xl font-black text-white">AgroLink</div>
            <div className="text-white/70 text-sm mt-1">
              {authMode === "login"
                ? "Sign in to continue"
                : "Sign up to continue"}
            </div>
          </div>
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {authError && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl p-2">
                {authError}
              </div>
            )}
            <div>
              <label className="text-sm text-white/70">Username</label>
              <input
                title="confirm"
                name="username"
                autoFocus
                className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">Password</label>
              <input
                title="confirm"
                name="password"
                type="password"
                className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
              />
            </div>
            {authMode === "signup" && <AuthSignupOptions />}
            {authMode === "signup" && (
              <div>
                <label className="text-sm text-white/70">
                  Confirm password
                </label>
                <input
                  title="confirm"
                  name="confirm"
                  type="password"
                  className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
                />
              </div>
            )}
            <button
              disabled={authLoading}
              type="submit"
              className="w-full px-4 py-3 rounded-xl font-semibold bg-lime-400 text-black disabled:opacity-60"
            >
              {authLoading
                ? authMode === "login"
                  ? "Signing in…"
                  : "Signing up…"
                : authMode === "login"
                ? "Sign in"
                : "Sign up"}
            </button>
            <div className="text-xs text-white/50 text-center">
              {authMode === "login" ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthError(null);
                  }}
                  className="underline underline-offset-4"
                >
                  No account? Sign up
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError(null);
                  }}
                  className="underline underline-offset-4"
                >
                  Already have an account? Sign in
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const TransactionStatusBar = () => {
    if (transactionStatus === "idle") return null;

    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <div
          className={`rounded-xl border p-4 backdrop-blur ${
            transactionStatus === "pending"
              ? "border-yellow-400/50 bg-yellow-400/10"
              : transactionStatus === "success"
              ? "border-green-400/50 bg-green-400/10"
              : "border-red-400/50 bg-red-400/10"
          }`}
        >
          <div className="flex items-center gap-3">
            {transactionStatus === "pending" && (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-400 border-t-transparent"></div>
            )}
            {transactionStatus === "success" && (
              <div className="text-green-400">✓</div>
            )}
            {transactionStatus === "error" && (
              <div className="text-red-400">✗</div>
            )}
            <div className="text-sm">
              {transactionStatus === "pending" && "Processing transaction..."}
              {transactionStatus === "success" && "Transaction successful!"}
              {transactionStatus === "error" && "Transaction error"}
            </div>
          </div>
          {transactionHash && transactionStatus === "success" && (
            <div className="mt-2 text-xs text-white/70 break-all">
              TX: {transactionHash}
            </div>
          )}
          {transactionError && (
            <div className="mt-2 text-xs text-red-400">{transactionError}</div>
          )}
          <button
            onClick={() => {
              setTransactionStatus("idle");
              setTransactionHash(null);
              setTransactionError(null);
            }}
            className="mt-2 text-xs underline text-white/70 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const Nav = () => {
    const tabs: Tab[] =
      user?.role === "factory"
        ? [
            "landing",
            "farms",
            "album",
            "dashboard",
            "artist",
            "factoryAnalytics",
          ]
        : ["landing", "farms", "album", "dashboard"];
    return (
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="text-xl font-semibold text-white">AgroLink</div>
        <div className="flex items-center gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-xl text-sm transition ${
                tab === t
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {t === "landing" && "Home"}
              {t === "farms" && "Poultry Farms"}
              {t === "album" && "Products"}
              {t === "dashboard" && "Dashboard"}
              {t === "artist" && "Poultry Farm"}
              {t === "factoryAnalytics" && "Analytics"}
            </button>
          ))}
          <button
            onClick={() => setShowHelp(true)}
            className="px-3 py-1 rounded-xl text-sm bg-white/10 hover:bg-white/20 text-white"
          >
            Help
          </button>
          {user && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-white/80 text-sm">{user.username}</span>
              <button
                onClick={() => {
                  setFiatAmount(Math.max(0.1, Math.min(walletSolBalance, 5)));
                  setShowFiatWithdraw(true);
                }}
                className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-sm"
              >
                Withdraw (demo)
              </button>
              <button
                onClick={logout}
                className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-sm"
              >
                Logout
              </button>
            </div>
          )}

          {!connected ? (
            <button
              onClick={connectWallet}
              disabled={walletConnecting}
              className="ml-2 px-4 py-2 rounded-xl bg-lime-400 text-black font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {walletConnecting ? "Подключение..." : "Подключить кошелёк"}
            </button>
          ) : (
            <button
              onClick={disconnectWallet}
              className="ml-2 px-4 py-2 rounded-xl bg-fuchsia-500 text-white font-semibold"
            >
              {phantomPubkey?.slice(0, 4)}…{phantomPubkey?.slice(-4)}{" "}
              (Disconnect)
              <span className="ml-2 text-white/80">
                {walletSolBalance.toFixed(2)} SOL
              </span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="relative min-h-screen bg-gradient-to-b from-[#00140f] via-[#001a12] to-[#00060a] text-white overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(0deg, rgba(16,185,129,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.1) 1px, transparent 1px)",
          backgroundSize: "36px 36px, 36px 36px",
        }}
      />
      <Nav />
      <TransactionStatusBar />
      <div className="mx-auto max-w-6xl p-6 fade-in">{children}</div>

      {showWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 modal-fade">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0014] p-6">
            <div className="text-lg font-semibold mb-2">Connect wallet</div>
            <div className="text-white/70 text-sm mb-4">Select provider</div>
            <div className="space-y-2">
              <button
                onClick={() => setShowPhantomConfirm(true)}
                disabled={walletConnecting}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white text-black font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {walletConnecting ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent"></div>
                ) : (
                  <img
                    alt="Phantom"
                    src="https://assets.phantom.app/phantom-logo.png"
                    className="h-6 w-6"
                  />
                )}
                {walletConnecting ? "Connecting..." : "Phantom Wallet"}
              </button>
              <a
                rel="noopener"
                href="https://phantom.app/"
                target="_blank"
                className="block text-center text-sm text-white/70 underline underline-offset-4"
              >
                I don't have Phantom — install
              </a>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowWallet(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0b0014] p-6">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">How to use AgroLink</div>
              <button
                onClick={() => setShowHelp(false)}
                className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-sm text-white/80">
              <div className="space-y-2">
                <div className="font-semibold text-white">For Buyers</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Register as an investor/retailer.</li>
                  <li>Open the “Products” tab and select a batch NFT.</li>
                  <li>
                    Buy at the listed price or click “Make an offer” to send an
                    offer.
                  </li>
                  <li>
                    Statuses and history are available in the “Dashboard” tab.
                  </li>
                </ol>
                <div className="mt-3 font-semibold text-white">Tips</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Check the factory description in the “Poultry Farms” tab.
                  </li>
                  <li>Use the Phantom wallet for real transactions.</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="font-semibold text-white">
                  For Poultry Farms
                </div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Register as a “Poultry Farm” and select your enterprise.
                  </li>
                  <li>
                    In the “Poultry Farm” tab, create a batch and issue an NFT.
                  </li>
                  <li>Track buyers’ offers and accept or reject them.</li>
                  <li>View analytics in the “Analytics” tab.</li>
                </ol>
                <div className="mt-3 font-semibold text-white">Hints</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Increase conversion with promotions and banners on the
                    homepage.
                  </li>
                  <li>
                    Experiment with pricing: +10–15% if conversion is high.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      {showFiatWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 modal-fade">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0014] p-6">
            <div className="text-lg font-semibold mb-2">
              Withdrawal to Bank Details
            </div>
            <div className="text-white/70 text-sm mb-4">
              The data is confidential and not saved (demo).
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-white/70">Amount (SOL)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={fiatAmountDraft}
                  onChange={(e) => {
                    const raw = e.target.value.replace(",", ".");
                    if (raw === "" || /^\d*\.?\d{0,2}$/.test(raw)) {
                      setFiatAmountDraft(raw);
                    }
                  }}
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                  onKeyDown={(e) => {
                    if (["e", "E", "+", "-"].includes(e.key))
                      e.preventDefault();
                  }}
                  className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
                />
                <div className="text-xs text-white/50 mt-1">
                  Available: {walletSolBalance.toFixed(2)} SOL
                </div>
              </div>
              <div>
                <label className="text-sm text-white/70">
                  Recipient (Full Name / Company)
                </label>
                <input
                  value={fiatNameDraft}
                  onChange={(e) => setFiatNameDraft(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-white/70">IBAN / Account</label>
                <input
                  value={fiatIbanDraft}
                  onChange={(e) => setFiatIbanDraft(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
                />
                {fiatIbanDraft && (
                  <div className="text-xs text-white/50 mt-1">
                    Will be sent to: {fiatIbanDraft.slice(0, 4)}****
                    {fiatIbanDraft.slice(-4)}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowFiatWithdraw(false)}
                disabled={fiatSubmitting}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={confirmFiatWithdraw}
                disabled={fiatSubmitting}
                className="px-4 py-2 rounded-xl bg-lime-400 text-black font-semibold disabled:opacity-60"
              >
                {fiatSubmitting ? "Verifying…" : "Confirm Withdrawal"}
              </button>
            </div>
            <div className="text-xs text-white/50 mt-2">
              After confirmation: "Request accepted. It will be processed within
              2 business days."
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const Landing = () => (
    <Shell>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-5xl md:text-6xl font-black leading-tight">
            Invest in agro-assets —{" "}
            <span className="text-lime-400">
              become a co-owner of the production
            </span>
          </h1>
          <p className="mt-4 text-white/80 max-w-prose">
            AgroLink on Solana: every product or batch is an NFT that confirms
            its origin, quantity, and quality. Investors earn income from sales,
            while retailers and agroholdings can trace the full path “from farm
            to shelf.”
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setTab("artist")}
              className="px-5 py-3 rounded-2xl bg-fuchsia-500 hover:bg-fuchsia-600 font-semibold btn-hover"
            >
              Create a Batch (for Poultry Farms)
            </button>
            <button
              onClick={() => setTab("album")}
              className="px-5 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-black font-semibold btn-hover"
            >
              Buy NFT Products (Investor / Retailer)
            </button>
            <button
              onClick={() => setTab("farms")}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold btn-hover"
            >
              Poultry Farms
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold btn-hover"
            >
              How It Works
            </button>
          </div>
        </div>
        <div className="relative">
          <img
            src={albumCover}
            alt="cover"
            className="rounded-3xl w-full shadow-2xl float-y"
          />
          <div className="absolute -bottom-6 left-6 right-6 bg-black/60 rounded-2xl p-4 backdrop-blur border border-white/10">
            <div className="font-semibold">{albumTitle}</div>
            <div className="text-white/70 text-sm">
              Exclusive collection of 10 NFT shares
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-lg font-semibold">What This Site Is</div>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">
            A platform for tokenizing agricultural products. Product batches are
            issued as NFTs on Solana. Buyers can invest, make offers, and earn
            revenue after sales, while factories can view analytics and manage
            demand.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-lg font-semibold">What You Can Do</div>
          <ul className="text-white/80 text-sm mt-2 space-y-1 list-disc list-inside">
            <li>Buy NFT shares of production batches.</li>
            <li>Send offers with your own price.</li>
            <li>Create batches (for factories) and issue NFTs.</li>
            <li>View sales analytics and offer funnels.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-lg font-semibold">Limitations</div>
          <ul className="text-white/70 text-sm mt-2 space-y-1 list-disc list-inside">
            <li>Demo version: transactions are simulated.</li>
            <li>Illegal products cannot be listed.</li>
            <li>Compliance with food safety standards is required.</li>
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Partners and Sponsors</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 items-center">
          {[
            "/Zhambylkus-logo.png",
            "/zhambyl-logo.png",
            "/alel-agro-logo.jpg",
            "/aulata-logo.jpg",
          ].map((src, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-center"
            >
              <img src={src} alt="partner" className="h-12 object-contain" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Poultry Farms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.slice(0, 5).map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setAlbumTitle(f.name);
                setAlbumCover(f.cover);
                setTab("album");
              }}
              className="relative text-left rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition card-hover"
            >
              <img
                src={f.cover}
                alt={f.name}
                className="h-48 w-full object-contain"
              />
              <div className="p-4">
                <div className="font-semibold">{f.name}</div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur p-3 border-t border-white/10">
                <div className="text-white/80 text-xs">From farm to shelf</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </Shell>
  );

  const Farms = () => (
    <Shell>
      <h2 className="text-2xl font-bold mb-6">Poultry Farms and Products</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {farms.map((farm) => {
          const farmNfts = nfts.filter((n) => n.farmId === farm.id);
          const farmSold = farmNfts.filter((n) => n.owned).length;
          const farmRaised = farmSold * 1;
          return (
            <div
              key={farm.id}
              className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden"
            >
              <div className="relative">
                <img
                  src={farm.cover}
                  alt={farm.name}
                  className="h-48 w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-xl font-semibold">{farm.name}</div>
                  <div className="text-white/70 text-sm">
                    {farm.description}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <div>
                    Batches sold: {farmSold}/{farmNfts.length}
                  </div>
                  <div>Raised: {fmtSOL(farmRaised)}</div>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {farmNfts.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden"
                    >
                      <img
                        src={n.image}
                        alt={n.name}
                        className="h-32 w-full object-cover"
                      />
                      <div className="p-3">
                        <div className="font-semibold text-sm">{n.name}</div>
                        <div className="text-xs text-white/70">{n.caption}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-sm">{fmtSOL(n.priceSOL)}</div>
                          {n.owned ? (
                            <span className="px-2 py-1 text-xs rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Purchased
                            </span>
                          ) : (
                            <button
                              onClick={() => buyNft(n.id)}
                              className="px-3 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-black text-sm font-semibold"
                            >
                              Buy
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
  const Album = () => (
    <Shell>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
        <div>
          <img
            src={albumCover}
            alt="cover"
            className="rounded-3xl w-full shadow-xl"
          />
          <h2 className="mt-4 text-2xl font-bold">{albumTitle}</h2>
          <div className="mt-2 text-white/70">Products</div>
          <ul className="mt-2 space-y-1 text-sm text-white/90">
            {tracks.map((tr) => (
              <li
                key={tr.id}
                className="flex items-center justify-between bg-white/5 rounded-xl p-2"
              >
                <span>{tr.title}</span>
                <span className="text-white/50">{tr.length ?? ""}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Product Batches (NFT)</h3>
            <div className="text-sm text-white/70">
              Sold: {soldCount}/{nfts.length} • Raised: {fmtSOL(raisedSOL)}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((n) => (
              <div
                key={n.id}
                className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
              >
                <img
                  src={n.image}
                  alt={n.name}
                  className="h-36 w-full object-cover"
                />
                <div className="p-4">
                  <div className="font-semibold">{n.name}</div>
                  <div className="text-white/60 text-xs mt-1">{n.caption}</div>
                  <div className="text-white/70 text-sm mt-1">
                    Price: {n.priceSOL} SOL
                  </div>
                  <button
                    disabled={n.owned || transactionStatus === "pending"}
                    onClick={() => buyNft(n.id)}
                    className={`mt-3 w-full px-4 py-2 rounded-xl font-semibold ${
                      n.owned
                        ? "bg-white/10 text-white/40 cursor-not-allowed"
                        : transactionStatus === "pending"
                        ? "bg-yellow-400 text-black cursor-not-allowed"
                        : "bg-lime-400 text-black hover:bg-lime-300"
                    }`}
                  >
                    {n.owned
                      ? "Purchased"
                      : transactionStatus === "pending"
                      ? "Purchasing..."
                      : "Buy"}
                  </button>
                  {!n.owned && (
                    <button
                      onClick={() => openOfferModal(n.id)}
                      className="mt-2 w-full px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm"
                    >
                      Make an Offer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {transactionStatus === "success" &&
            transactionHash &&
            lastPurchase && (
              <div className="mt-6 rounded-2xl border border-green-400/40 bg-green-400/10 p-4">
                <div className="font-semibold text-green-300">
                  Purchase Confirmed
                </div>
                <div className="text-xs text-white/70 mt-1">
                  NFT ID: {lastPurchase.id}
                </div>
                <div className="text-xs text-white/70 mt-1">
                  Buyer: {phantomPubkey}
                </div>
                <div className="text-xs text-white/70 mt-1 break-all">
                  TX: {transactionHash}
                </div>
              </div>
            )}
        </div>
        {offerModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 modal-fade">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0014] p-6">
              <div className="text-lg font-semibold mb-2">Make an Offer</div>
              <div className="text-white/70 text-sm mb-3">
                Enter your price for the NFT (in SOL)
              </div>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={offerPrice}
                onChange={(e) => setOfferPrice(Number(e.target.value))}
                className="w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
              />
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setOfferModal({ open: false, nftId: null })}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={submitOffer}
                  className="px-4 py-2 rounded-xl bg-lime-400 text-black font-semibold"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
  const Dashboard = () => {
    const owned = nfts.filter((n) => n.owned).map((n) => `#${n.id}`);
    const myOffers = user
      ? offers
          .filter((o) => o.buyer === user.username)
          .sort((a, b) => b.ts - a.ts)
      : [];
    return (
      <Shell>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/70 text-sm">Your NFT Products</div>
            <div className="mt-1 text-xl font-semibold">
              NFT {owned.length > 0 ? owned.join(", ") : "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/70 text-sm">Royalty Balance</div>
            <div className="mt-1 text-3xl font-black text-lime-400">
              {royaltyBalance}
            </div>
            <button
              onClick={withdrawRoyalty}
              disabled={transactionStatus === "pending"}
              className="mt-3 w-full px-4 py-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-600 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {transactionStatus === "pending"
                ? "Withdrawing..."
                : "Withdraw Income"}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/70 text-sm">Simulate Revenue</div>
            <div className="mt-1 flex gap-2">
              {[5, 10, 20].map((v) => (
                <button
                  key={v}
                  onClick={() => addPayout(v)}
                  disabled={transactionStatus === "pending"}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  +{v}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/70 text-sm">Wallet Balance (SOL)</div>
            <div className="mt-1 text-3xl font-black">
              {walletSolBalance.toFixed(2)} SOL
            </div>
            <button
              onClick={() => {
                const amt = Math.max(0.1, Math.min(walletSolBalance, 5));
                setFiatAmountDraft(String(amt));
                setFiatNameDraft("");
                setFiatIbanDraft("");
                setShowFiatWithdraw(true);
              }}
              className="mt-3 w-full px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-semibold"
            >
              Withdraw to Bank (Demo)
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-white/80 mb-2">Payout History</div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/10">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Amount (ROYALTY)</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p, i) => (
                  <tr key={i} className="odd:bg-white/5">
                    <td className="p-3">{p.date}</td>
                    <td className="p-3">{p.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-white/80 mb-2">My Offers</div>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/10">
                <tr>
                  <th className="text-left p-3">NFT</th>
                  <th className="text-left p-3">Price (SOL)</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {myOffers.map((o) => (
                  <tr key={o.id} className="odd:bg-white/5">
                    <td className="p-3">#{o.nftId}</td>
                    <td className="p-3">{o.priceSOL}</td>
                    <td className="p-3">{o.status}</td>
                  </tr>
                ))}
                {myOffers.length === 0 && (
                  <tr>
                    <td className="p-3 text-white/60" colSpan={3}>
                      No offers yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-white/80 mb-2">Withdrawal Requests (Demo)</div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/10">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Amount (SOL)</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">ETA</th>
                </tr>
              </thead>
              <tbody>
                {pendingFiat.map((w) => (
                  <tr key={w.id} className="odd:bg-white/5">
                    <td className="p-3">{new Date(w.ts).toLocaleString()}</td>
                    <td className="p-3">{w.amount}</td>
                    <td className="p-3">{w.status}</td>
                    <td className="p-3">{w.eta}</td>
                  </tr>
                ))}
                {pendingFiat.length === 0 && (
                  <tr>
                    <td className="p-3 text-white/60" colSpan={4}>
                      No withdrawal requests yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Shell>
    );
  };
  const FactoryAnalytics = () => {
    const farmNfts =
      user?.role === "factory" && user.farmId
        ? nfts.filter((n) => n.farmId === user.farmId)
        : nfts;
    const total = farmNfts.length;
    const sold = farmNfts.filter((n) => n.owned).length;
    const conversion = total > 0 ? sold / total : 0;
    const avgPrice =
      sold > 0
        ? farmNfts.filter((n) => n.owned).reduce((s, n) => s + n.priceSOL, 0) /
          sold
        : 0;

    const soldByProduct = farmNfts
      .filter((n) => n.owned)
      .reduce<Record<string, number>>((acc, n) => {
        const key = n.name.split(" — ")[0] || n.name;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    const productEntries = Object.entries(soldByProduct);
    const maxCount = productEntries.reduce((m, [, c]) => Math.max(m, c), 0);

    const tariffPlan = "Standard";
    const platformFeePct = 2;

    const recommendation =
      conversion < 0.3
        ? "Low conversion rate. Boost promotion: homepage banners, 10% discounts, social media posts."
        : conversion > 0.7
        ? "High conversion rate. Try raising prices by 10–15% and expanding production."
        : "Stable sales. Continue your current strategy and test collaborations.";

    return (
      <Shell>
        <h2 className="text-2xl font-bold">Factory Analytics</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/70 text-sm">Plan</div>
            <div className="mt-1 text-lg font-semibold">{tariffPlan}</div>
            <div className="text-white/70 text-sm">
              Platform fee: {platformFeePct}%
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/70 text-sm">Sales</div>
            <div className="mt-1 text-3xl font-black text-lime-400">{sold}</div>
            <div className="text-white/70 text-sm">out of {total} batches</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/70 text-sm">Average Price</div>
            <div className="mt-1 text-3xl font-black">
              {avgPrice.toFixed(2)} SOL
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:col-span-2">
            <div className="text-white/80 mb-2">Sales by Product</div>
            {productEntries.length === 0 ? (
              <div className="text-white/60 text-sm">No sales yet</div>
            ) : (
              <div className="space-y-3">
                {productEntries.map(([name, count]) => {
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={name} className="text-sm">
                      <div className="flex items-center justify-between">
                        <div className="text-white/80">{name}</div>
                        <div className="text-white/60">{count}</div>
                      </div>
                      <div className="mt-1 h-2 rounded bg-white/10 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-lime-400 bar-anim"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/80 mb-2">Recommendations</div>
            <div className="text-white/90 text-sm leading-relaxed">
              {recommendation}
            </div>
            <div className="mt-3 text-xs text-white/60">
              Conversion rate: {(conversion * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </Shell>
    );
  };

  const Artist = () => {
    const [artistShare, setArtistShare] = useState(70);
    const [fansShare, setFansShare] = useState(30);
    const farmNfts =
      user?.role === "factory" && user.farmId
        ? nfts.filter((n) => n.farmId === user.farmId)
        : nfts;
    const soldCountFarm = farmNfts.filter((n) => n.owned).length;
    const raisedSOLFarm = soldCountFarm * 1;
    const incomingOffers = offers
      .filter((o) => farmNfts.some((n) => n.id === o.nftId))
      .sort((a, b) => b.ts - a.ts);

    const farmSoldByProduct = farmNfts
      .filter((n) => n.owned)
      .reduce<Record<string, number>>((acc, n) => {
        const key = n.name.split(" — ")[0] || n.name;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    const productEntries = Object.entries(farmSoldByProduct);
    const maxProductCount = productEntries.reduce(
      (m, [, c]) => Math.max(m, c),
      0
    );

    const offersFunnel = {
      pending: incomingOffers.filter((o) => o.status === "pending").length,
      accepted: incomingOffers.filter((o) => o.status === "accepted").length,
      shipped: incomingOffers.filter((o) => o.status === "shipped").length,
    };
    const trendPoints = payouts.map((p) => p.amount);
    const maxTrend = trendPoints.reduce((m, v) => Math.max(m, v), 1);

    const handleCreate = (e: React.FormEvent) => {
      e.preventDefault();
      alert(
        "Batch saved (demo). Next steps: upload to IPFS/Arweave and write on-chain."
      );
    };

    return (
      <Shell>
        <h2 className="text-2xl font-bold">Factory Dashboard</h2>
        <form
          onSubmit={handleCreate}
          className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/80 mb-2">Release a Batch</div>
              <label className="text-sm text-white/70">Factory Name</label>
              <input
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-2 outline-none"
                placeholder="Factory name"
              />
              <label className="text-sm text-white/70 mt-3 block">
                Image URL
              </label>
              <input
                value={albumCover}
                onChange={(e) => setAlbumCover(e.target.value)}
                className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-2 outline-none"
                placeholder="https://…"
              />
              <label className="text-sm text-white/70 mt-3 block">
                Products (one per line)
              </label>
              <textarea
                value={tracks.map((t) => t.title).join("\n")}
                onChange={(e) =>
                  setTracks(
                    e.target.value
                      .split("\n")
                      .filter(Boolean)
                      .map((t, i) => ({ id: i + 1, title: t }))
                  )
                }
                className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-2 h-32 resize-y outline-none"
                placeholder={"Drumstick\nEggs\nWings"}
              />
              <button
                type="submit"
                className="mt-4 w-full px-4 py-2 rounded-xl bg-white text-black font-semibold"
              >
                Save Batch (local)
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/80 mb-2">Instructions</div>
              <ol className="list-decimal list-inside text-sm text-white/80 space-y-1">
                <li>Check the factory name and images.</li>
                <li>List your products, one per line.</li>
                <li>Save the batch and mint NFTs if needed.</li>
                <li>Respond to buyer offers below.</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/80 mb-2">Sales by Product</div>
              {productEntries.length === 0 ? (
                <div className="text-white/60 text-sm">No sales yet</div>
              ) : (
                <div className="space-y-3">
                  {productEntries.map(([name, count]) => {
                    const pct =
                      maxProductCount > 0 ? (count / maxProductCount) * 100 : 0;
                    return (
                      <div key={name} className="text-sm">
                        <div className="flex items-center justify-between">
                          <div className="text-white/80">{name}</div>
                          <div className="text-white/60">{count}</div>
                        </div>
                        <div className="mt-1 h-2 rounded bg-white/10 overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-lime-400 bar-anim"
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/80 mb-2">Offers Funnel</div>
              <div className="space-y-2 text-sm">
                {(
                  [
                    ["Pending", offersFunnel.pending, "bg-white/10"],
                    ["Accepted", offersFunnel.accepted, "bg-emerald-500/20"],
                    ["Shipped", offersFunnel.shipped, "bg-fuchsia-500/20"],
                  ] as const
                ).map(([label, val, bar]) => (
                  <div key={label}>
                    <div className="flex items-center justify-between text-white/80">
                      <span>{label}</span>
                      <span className="text-white/60">{val}</span>
                    </div>
                    <div
                      className={`mt-1 h-2 rounded ${bar}`}
                      style={{
                        width: `${Math.min(
                          100,
                          (val / Math.max(1, offersFunnel.pending)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/80 mb-2">Revenue by Date (demo)</div>
              <svg viewBox="0 0 200 60" className="w-full h-16">
                <polyline
                  fill="none"
                  stroke="#a3e635"
                  strokeWidth="2"
                  points={trendPoints
                    .map((v, i) => {
                      const x = (i / Math.max(1, trendPoints.length - 1)) * 200;
                      const y = 60 - (v / Math.max(1, maxTrend)) * 60;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />
              </svg>
              <div className="text-xs text-white/60">
                Source: Payout History
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/80 mb-2">Revenue Shares</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-white/70">Factory (%)</label>
                  <input
                    title="Type here"
                    type="number"
                    value={artistShare}
                    onChange={(e) => setArtistShare(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-2 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70">Investors (%)</label>
                  <input
                    title="Type here"
                    type="number"
                    value={fansShare}
                    onChange={(e) => setFansShare(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-2 outline-none"
                  />
                </div>
              </div>
              <div className="text-white/60 text-sm mt-2">
                Total: {artistShare + fansShare}%
              </div>
              <button
                onClick={mintAlbumNfts}
                type="button"
                disabled={transactionStatus === "pending"}
                className="mt-4 w-full px-4 py-2 rounded-xl bg-lime-400 text-black font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {transactionStatus === "pending"
                  ? "Creating collection..."
                  : "Mint NFT Products"}
              </button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/80 mb-2">Buyer Requests</div>
              <div className="rounded-2xl overflow-hidden border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="text-left p-3">NFT</th>
                      <th className="text-left p-3">Buyer</th>
                      <th className="text-left p-3">Price (SOL)</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomingOffers.map((o) => (
                      <tr key={o.id} className="odd:bg-white/5">
                        <td className="p-3">#{o.nftId}</td>
                        <td className="p-3">{o.buyer}</td>
                        <td className="p-3">{o.priceSOL}</td>
                        <td className="p-3">{o.status}</td>
                        <td className="p-3 space-x-2">
                          {o.status === "pending" && (
                            <>
                              <button
                                onClick={() => acceptOffer(o.id)}
                                className="px-3 py-1 rounded-lg bg-lime-400 text-black"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => declineOffer(o.id)}
                                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {o.status === "accepted" && (
                            <button
                              onClick={() => shipOffer(o.id)}
                              className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            >
                              Mark as Shipped
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {incomingOffers.length === 0 && (
                      <tr>
                        <td className="p-3 text-white/60" colSpan={5}>
                          No requests yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/80 mb-2">Statistics</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-2xl font-black">{soldCountFarm}</div>
                  <div className="text-xs text-white/70">NFTs Sold</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-2xl font-black">{raisedSOLFarm}</div>
                  <div className="text-xs text-white/70">SOL Raised</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-2xl font-black">{paidToFans}</div>
                  <div className="text-xs text-white/70">Paid to Investors</div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Shell>
    );
  };
  if (!user) return <AuthScreen />;

  return (
    <div className="font-sans">
      {tab === "landing" && <Landing />}
      {tab === "farms" && <Farms />}
      {tab === "album" && <Album />}
      {tab === "dashboard" && <Dashboard />}
      {tab === "artist" &&
        (user.role === "factory" ? (
          <Artist />
        ) : (
          <Shell>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              Access restricted to poultry farms only.
            </div>
          </Shell>
        ))}
      {tab === "factoryAnalytics" &&
        (user.role === "factory" ? (
          <FactoryAnalytics />
        ) : (
          <Shell>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              Access restricted to poultry farms only.
            </div>
          </Shell>
        ))}
    </div>
  );
}
