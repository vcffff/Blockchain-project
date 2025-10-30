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

  const [albumTitle, setAlbumTitle] = useState("Птицофабрика №1");
  const [albumCover, setAlbumCover] = useState("/main.jpg");

  const [tracks, setTracks] = useState<Track[]>([
    { id: 1, title: "Голень" },
    { id: 2, title: "Яйцо" },
    { id: 3, title: "Крылышки" },
    { id: 4, title: "Филе" },
    { id: 5, title: "Тушка" },
    { id: 6, title: "Переработка" },
  ]);

  const farms: Farm[] = useMemo(
    () => [
      {
        id: 1,
        name: "ТОО «Аса Агро»",
        cover: "/asa-agro-logo.jpeg",
        description:
          "Качественная продукция с полным трассингом происхождения.",
      },
      {
        id: 2,
        name: "ТОО «Алель Агро» / АО «Алель Агро»",
        cover: "/alel-agro-logo.jpg",
        description:
          "Современные мощности и стандарты безопасности пищевых продуктов.",
      },
      {
        id: 3,
        name: "ТОО «Аулие-Ата Феникс»",
        cover: "/aulata-logo.jpg",
        description: "Высокое качество и устойчивые практики производства.",
      },
      {
        id: 4,
        name: "ТОО «Жамбыл кус»",
        cover: "/Zhambylkus-logo.png",
        description: "Проверенное происхождение и прозрачная логистика.",
      },
      {
        id: 5,
        name: "ТОО «Жамбылская птицефабрика»",
        cover: "/zhambyl-logo.png",
        description:
          "Крупнейший производитель региона с инновационным подходом.",
      },
    ],
    []
  );

  const initialNfts: NftItem[] = useMemo(() => {
    const baseProducts = [
      "Голень",
      "Яйцо",
      "Крылышки",
      "Филе",
      "Тушка",
      "Переработка",
    ];
    const productImageMap: Record<string, string> = {
      Голень: "/golen.png",
      Яйцо: "/eggs.png",
      Крылышки: "/wings.jpeg",
      Филе: "/fillet.png",
      Тушка: "/tushka.png",
      Переработка: "/pererabotka.webp",
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
          caption: `Партия №${idx + 1}`,
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
        setAuthError("Введите логин");
        setAuthLoading(false);
        return;
      }
      if (password.length < 4) {
        setAuthError("Пароль минимум 4 символа");
        setAuthLoading(false);
        return;
      }

      if (authMode === "signup") {
        if (users[username]) {
          setAuthError("Пользователь уже существует");
          setAuthLoading(false);
          return;
        }
        if (confirm !== password) {
          setAuthError("Пароли не совпадают");
          setAuthLoading(false);
          return;
        }
        if (selectedRole === "factory" && !selectedFarmId) {
          setAuthError("Выберите птицофабрику");
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
        setAuthError("Неверный логин или пароль");
        setAuthLoading(false);
        return;
      }
      if (typeof userRecord === "string") {
        if (userRecord !== password) {
          setAuthError("Неверный логин или пароль");
          setAuthLoading(false);
          return;
        }
        setUser({ username, role: "investor" });
      } else {
        if (userRecord.password !== password) {
          setAuthError("Неверный логин или пароль");
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
          <label className="text-sm text-white/70">Тип аккаунта</label>
          <select
            name="role"
            className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
            defaultValue="factory"
            onChange={(e) =>
              setSignupRole(e.target.value as "factory" | "investor")
            }
          >
            <option value="factory">Птицофабрика</option>
            <option value="investor">Инвестор/ритейлер</option>
          </select>
        </div>
        {signupRole === "factory" && (
          <div>
            <label className="text-sm text-white/70">
              Выберите птицофабрику
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
      alert("Подключите Phantom Wallet");
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

      alert(`Покупка успешна: NFT #${id}\nТранзакция: ${txHash}`);
    } catch (error) {
      setTransactionStatus("error");
      setTransactionError(
        error instanceof Error ? error.message : "Purchase failed"
      );
      alert(
        `Ошибка покупки: ${
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
      alert("Войдите, чтобы отправить предложение");
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
      alert("Войдите, чтобы вывести средства");
      return;
    }
    if (!amount || amount <= 0 || amount > walletSolBalance) {
      alert("Некорректная сумма вывода");
      return;
    }
    if (!fiatNameDraft.trim() || !fiatIbanDraft.trim()) {
      alert("Заполните реквизиты получателя");
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
        "Заявка на вывод принята. Поступит в течение 2 рабочих дней (демо)."
      );
    }, 1000);
  };

  const withdrawRoyalty = async () => {
    if (!connected || !phantomPubkey) {
      alert("Подключите Phantom Wallet");
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

      alert(`ROYALTY выведены\nТранзакция: ${txHash}`);
    } catch (error) {
      setTransactionStatus("error");
      setTransactionError(
        error instanceof Error ? error.message : "Withdrawal failed"
      );
      alert(
        `Ошибка вывода: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const mintAlbumNfts = async () => {
    if (!connected || !phantomPubkey) {
      alert("Подключите Phantom Wallet артиста");
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

      alert(`Коллекция создана!\nID коллекции: ${collectionId}`);
    } catch (error) {
      setTransactionStatus("error");
      setTransactionError(
        error instanceof Error ? error.message : "Minting failed"
      );
      alert(
        `Ошибка создания коллекции: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const addPayout = async (amount: number) => {
    if (!connected || !phantomPubkey) {
      alert("Подключите Phantom Wallet");
      return;
    }

    setTransactionStatus("pending");
    setTransactionError(null);

    try {
      const fanAddresses = nfts
        .filter((n) => n.owned)
        .map((n) => phantomPubkey);

      if (fanAddresses.length === 0) {
        alert("Нет владельцев NFT для распределения роялти");
        return;
      }

      const txHash = await distributeRoyalties(amount, fanAddresses);

      const today = new Date().toISOString().slice(0, 10);
      setPayouts((p) => [...p, { date: today, amount }]);
      setRoyaltyBalance((b) => b + amount);

      setTransactionStatus("success");
      setTransactionHash(txHash);

      alert(`Роялти распределены\nТранзакция: ${txHash}`);
    } catch (error) {
      setTransactionStatus("error");
      setTransactionError(
        error instanceof Error ? error.message : "Distribution failed"
      );
      alert(
        `Ошибка распределения: ${
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
                ? "Войдите, чтобы продолжить"
                : "Зарегистрируйтесь, чтобы продолжить"}
            </div>
          </div>
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {authError && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl p-2">
                {authError}
              </div>
            )}
            <div>
              <label className="text-sm text-white/70">Логин</label>
              <input
                title="confirm"
                name="username"
                autoFocus
                className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">Пароль</label>
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
                  Подтвердите пароль
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
                  ? "Входим…"
                  : "Регистрируем…"
                : authMode === "login"
                ? "Войти"
                : "Зарегистрироваться"}
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
                  Нет аккаунта? Зарегистрируйтесь
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
                  Уже есть аккаунт? Войти
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
              {transactionStatus === "pending" && "Обработка транзакции..."}
              {transactionStatus === "success" && "Транзакция успешна!"}
              {transactionStatus === "error" && "Ошибка транзакции"}
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
            Закрыть
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
              {t === "landing" && "Главная"}
              {t === "farms" && "Птицофабрики"}
              {t === "album" && "Продукция"}
              {t === "dashboard" && "Кабинет"}
              {t === "artist" && "Птицофабрика"}
              {t === "factoryAnalytics" && "Аналитика"}
            </button>
          ))}
          <button
            onClick={() => setShowHelp(true)}
            className="px-3 py-1 rounded-xl text-sm bg-white/10 hover:bg-white/20 text-white"
          >
            Помощь
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
                Вывод (демо)
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
            <div className="text-lg font-semibold mb-2">Подключить кошелёк</div>
            <div className="text-white/70 text-sm mb-4">
              Выберите провайдера
            </div>
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
                {walletConnecting ? "Подключение..." : "Phantom Wallet"}
              </button>
              <a
                rel="noopener"
                href="https://phantom.app/"
                target="_blank"
                className="block text-center text-sm text-white/70 underline underline-offset-4"
              >
                У меня нет Phantom — установить
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
      {showPhantomConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#08130f] p-6">
            <div className="flex items-center gap-3 mb-3">
              <img
                alt="Phantom"
                src="https://assets.phantom.app/phantom-logo.png"
                className="h-8 w-8"
              />
              <div className="text-lg font-semibold">Подключение Phantom</div>
            </div>
            <div className="text-white/80 text-sm leading-relaxed">
              Для продолжения подтвердите подключение кошелька Phantom к
              AgroLink. Подключение позволит:
              <ul className="list-disc pl-5 mt-2 space-y-1 text-white/70">
                <li>Просматривать адрес кошелька и баланс</li>
                <li>Совершать покупки токенов продукции</li>
                <li>Подписывать транзакции в сети Solana</li>
              </ul>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPhantomConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
              >
                Отмена
              </button>
              <button
                onClick={doConnectPhantom}
                disabled={walletConnecting}
                className="px-4 py-2 rounded-xl bg-lime-400 text-black font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {walletConnecting ? "Подключение..." : "Согласен и подключить"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0b0014] p-6">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">
                Как пользоваться AgroLink
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20"
              >
                Закрыть
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-sm text-white/80">
              <div className="space-y-2">
                <div className="font-semibold text-white">Для покупателя</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Зарегистрируйтесь как инвестор/ритейлер.</li>
                  <li>Откройте вкладку «Продукция», выберите NFT партии.</li>
                  <li>
                    Купите по цене или нажмите «Предложить цену» и отправьте
                    оффер.
                  </li>
                  <li>Статусы и история — во вкладке «Кабинет».</li>
                </ol>
                <div className="mt-3 font-semibold text-white">Советы</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Смотрите описание фабрики во вкладке «Птицофабрики».</li>
                  <li>Используйте кошелёк Phantom для реальных транзакций.</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="font-semibold text-white">Для птицофабрики</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Зарегистрируйтесь как «Птицофабрика» и выберите предприятие.
                  </li>
                  <li>
                    Во вкладке «Птицофабрика» создайте партию и выпустите NFT.
                  </li>
                  <li>
                    Следите за офферами покупателей и принимайте/отклоняйте.
                  </li>
                  <li>Аналитику смотрите во вкладке «Аналитика».</li>
                </ol>
                <div className="mt-3 font-semibold text-white">Подсказки</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Улучшайте конверсию акциями и баннерами на главной.</li>
                  <li>Тестируйте цену: +10–15% при высокой конверсии.</li>
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
              Вывод на банковские реквизиты
            </div>
            <div className="text-white/70 text-sm mb-4">
              Данные конфиденциальны и не сохраняются (демо).
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-white/70">Сумма (SOL)</label>
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
                  Доступно: {walletSolBalance.toFixed(2)} SOL
                </div>
              </div>
              <div>
                <label className="text-sm text-white/70">
                  Получатель (ФИО/Компания)
                </label>
                <input
                  value={fiatNameDraft}
                  onChange={(e) => setFiatNameDraft(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-white/70">IBAN/Счёт</label>
                <input
                  value={fiatIbanDraft}
                  onChange={(e) => setFiatIbanDraft(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
                />
                {fiatIbanDraft && (
                  <div className="text-xs text-white/50 mt-1">
                    Будет отправлено на: {fiatIbanDraft.slice(0, 4)}****
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
                Отмена
              </button>
              <button
                onClick={confirmFiatWithdraw}
                disabled={fiatSubmitting}
                className="px-4 py-2 rounded-xl bg-lime-400 text-black font-semibold disabled:opacity-60"
              >
                {fiatSubmitting ? "Проверяем…" : "Подтвердить вывод"}
              </button>
            </div>
            <div className="text-xs text-white/50 mt-2">
              После подтверждения: "Заявка принята. Поступит в течение 2 рабочих
              дней"
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
          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            Инвестируй в агроактивы —{" "}
            <span className="text-lime-400">
              становись совладельцем продукции
            </span>
          </h1>
          <p className="mt-4 text-white/80 max-w-prose">
            AgroLink на Solana: каждый продукт или партия — это NFT,
            подтверждающий происхождение, количество и качество. Инвесторы
            получают доход при продаже, ритейлеры и агрохолдинги отслеживают
            путь «от фермы до прилавка».
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setTab("artist")}
              className="px-5 py-3 rounded-2xl bg-fuchsia-500 hover:bg-fuchsia-600 font-semibold btn-hover"
            >
              Завести партию (для птицофабрики)
            </button>
            <button
              onClick={() => setTab("album")}
              className="px-5 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-black font-semibold btn-hover"
            >
              Купить NFT‑продукцию (инвестор/ритейлер)
            </button>
            <button
              onClick={() => setTab("farms")}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold btn-hover"
            >
              Птицофабрики
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold btn-hover"
            >
              Как это работает
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
              Эксклюзивная коллекция из 10 NFT долей
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-lg font-semibold">Что это за сайт</div>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">
            Платформа для токенизации агропродукции. Партии товаров выпускаются
            как NFT на Solana. Покупатели могут инвестировать, предлагать цену и
            получать выручку после продажи, а фабрики — видеть аналитику и
            управлять спросом.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-lg font-semibold">Что можно делать</div>
          <ul className="text-white/80 text-sm mt-2 space-y-1 list-disc list-inside">
            <li>Покупать NFT‑доли партий продукции.</li>
            <li>Отправлять офферы с собственной ценой.</li>
            <li>Выпускать партии (для фабрик) и выпускать NFT.</li>
            <li>Смотреть аналитику продаж и воронку офферов.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-lg font-semibold">Ограничения</div>
          <ul className="text-white/70 text-sm mt-2 space-y-1 list-disc list-inside">
            <li>Демо‑версия: транзакции эмулируются.</li>
            <li>Нельзя размещать нелегальную продукцию.</li>
            <li>
              Требуется соблюдение требований безопасности пищевых продуктов.
            </li>
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Партнёры и спонсоры</h2>
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
        <h2 className="text-xl font-semibold mb-4">Птицофабрики</h2>
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
                <div className="text-white/80 text-xs">
                  От фермы до прилавка
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </Shell>
  );

  const Farms = () => (
    <Shell>
      <h2 className="text-2xl font-bold mb-6">Птицофабрики и продукция</h2>
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
                    Продано партий: {farmSold}/{farmNfts.length}
                  </div>
                  <div>Собрано: {fmtSOL(farmRaised)}</div>
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
                              Куплено
                            </span>
                          ) : (
                            <button
                              onClick={() => buyNft(n.id)}
                              className="px-3 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-black text-sm font-semibold"
                            >
                              Купить
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
          <div className="mt-2 text-white/70">Продукция</div>
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
            <h3 className="text-xl font-semibold">Партии продукции (NFT)</h3>
            <div className="text-sm text-white/70">
              Продано: {soldCount}/{nfts.length} • Собрано: {fmtSOL(raisedSOL)}
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
                    Цена: {n.priceSOL} SOL
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
                      ? "Куплено"
                      : transactionStatus === "pending"
                      ? "Покупка..."
                      : "Купить"}
                  </button>
                  {!n.owned && (
                    <button
                      onClick={() => openOfferModal(n.id)}
                      className="mt-2 w-full px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm"
                    >
                      Предложить цену
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
                  Покупка подтверждена
                </div>
                <div className="text-xs text-white/70 mt-1">
                  NFT ID: {lastPurchase.id}
                </div>
                <div className="text-xs text-white/70 mt-1">
                  Покупатель: {phantomPubkey}
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
              <div className="text-lg font-semibold mb-2">Предложить цену</div>
              <div className="text-white/70 text-sm mb-3">
                Введите вашу цену за NFT (SOL)
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
                  Отмена
                </button>
                <button
                  onClick={submitOffer}
                  className="px-4 py-2 rounded-xl bg-lime-400 text-black font-semibold"
                >
                  Отправить
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
        <h2 className="text-2xl font-bold">Кабинет</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/70 text-sm">Ваши NFT‑продукты</div>
            <div className="mt-1 text-xl font-semibold">
              NFT {owned.length > 0 ? owned.join(", ") : "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/70 text-sm">Баланс доходов</div>
            <div className="mt-1 text-3xl font-black text-lime-400">
              {royaltyBalance}
            </div>
            <button
              onClick={withdrawRoyalty}
              disabled={transactionStatus === "pending"}
              className="mt-3 w-full px-4 py-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-600 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {transactionStatus === "pending" ? "Вывод..." : "Вывести доход"}
            </button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/70 text-sm">Симулировать выручку</div>
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
            <div className="text-white/70 text-sm">Баланс кошелька (SOL)</div>
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
              Вывод на реквизиты (демо)
            </button>
          </div>
        </div>
        <div className="mt-6">
          <div className="text-white/80 mb-2">История выплат</div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/10">
                <tr>
                  <th className="text-left p-3">Дата</th>
                  <th className="text-left p-3">Сумма ROYALTY</th>
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
          <div className="text-white/80 mb-2">Мои предложения</div>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/10">
                <tr>
                  <th className="text-left p-3">NFT</th>
                  <th className="text-left p-3">Цена (SOL)</th>
                  <th className="text-left p-3">Статус</th>
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
                      Предложений пока нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-6">
          <div className="text-white/80 mb-2">Заявки на вывод (демо)</div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/10">
                <tr>
                  <th className="text-left p-3">Дата</th>
                  <th className="text-left p-3">Сумма (SOL)</th>
                  <th className="text-left p-3">Статус</th>
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
                      Пока нет заявок
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
        ? "Низкая конверсия. Усильте продвижение: баннеры на главной, акции -10%, посты в соцсетях."
        : conversion > 0.7
        ? "Высокая конверсия. Протестируйте повышение цены на 10–15% и расширьте объём."
        : "Стабильные продажи. Продолжайте текущую стратегию и протестируйте коллаборации.";

    return (
      <Shell>
        <h2 className="text-2xl font-bold">Аналитика птицофабрики</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/70 text-sm">Тариф</div>
            <div className="mt-1 text-lg font-semibold">{tariffPlan}</div>
            <div className="text-white/70 text-sm">
              Комиссия платформы: {platformFeePct}%
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/70 text-sm">Продажи</div>
            <div className="mt-1 text-3xl font-black text-lime-400">{sold}</div>
            <div className="text-white/70 text-sm">из {total} партий</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/70 text-sm">Средняя цена</div>
            <div className="mt-1 text-3xl font-black">
              {avgPrice.toFixed(2)} SOL
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:col-span-2">
            <div className="text-white/80 mb-2">Продажи по продуктам</div>
            {productEntries.length === 0 ? (
              <div className="text-white/60 text-sm">Пока нет продаж</div>
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
            <div className="text-white/80 mb-2">Рекомендации</div>
            <div className="text-white/90 text-sm leading-relaxed">
              {recommendation}
            </div>
            <div className="mt-3 text-xs text-white/60">
              Конверсия: {(conversion * 100).toFixed(0)}%
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
        "Партия сохранена (демо). Далее: загрузка в IPFS/Arweave и запись on-chain."
      );
    };

    return (
      <Shell>
        <h2 className="text-2xl font-bold">Кабинет птицофабрики</h2>
        <form
          onSubmit={handleCreate}
          className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/80 mb-2">Выпустить партию</div>
              <label className="text-sm text-white/70">
                Название птицофабрики
              </label>
              <input
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-2 outline-none"
                placeholder="Название птицофабрики"
              />
              <label className="text-sm text-white/70 mt-3 block">
                URL фото
              </label>
              <input
                value={albumCover}
                onChange={(e) => setAlbumCover(e.target.value)}
                className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-2 outline-none"
                placeholder="https://…"
              />
              <label className="text-sm text-white/70 mt-3 block">
                Продукция (по строке)
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
                placeholder={"Голень\nЯйцо\nКрылышки"}
              />
              <button
                type="submit"
                className="mt-4 w-full px-4 py-2 rounded-xl bg-white text-black font-semibold"
              >
                Сохранить партию (локально)
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/80 mb-2">Инструкция</div>
              <ol className="list-decimal list-inside text-sm text-white/80 space-y-1">
                <li>Проверьте название фабрики и изображения.</li>
                <li>Укажите список продукции построчно.</li>
                <li>Сохраните партию и при необходимости выпустите NFT.</li>
                <li>Отвечайте на офферы покупателей ниже.</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/80 mb-2">Продажи по продуктам</div>
              {productEntries.length === 0 ? (
                <div className="text-white/60 text-sm">Пока нет продаж</div>
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
              <div className="text-white/80 mb-2">Воронка офферов</div>
              <div className="space-y-2 text-sm">
                {(
                  [
                    ["В ожидании", offersFunnel.pending, "bg-white/10"],
                    ["Принято", offersFunnel.accepted, "bg-emerald-500/20"],
                    ["Отгружено", offersFunnel.shipped, "bg-fuchsia-500/20"],
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
              <div className="text-white/80 mb-2">Выручка по датам (демо)</div>
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
                Источник: История выплат
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/80 mb-2">Доли выручки</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-white/70">
                    Птицофабрика (%)
                  </label>
                  <input
                    title="Type here"
                    type="number"
                    value={artistShare}
                    onChange={(e) => setArtistShare(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-2 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70">Инвесторы (%)</label>
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
                Суммарно: {artistShare + fansShare}%
              </div>
              <button
                onClick={mintAlbumNfts}
                type="button"
                disabled={transactionStatus === "pending"}
                className="mt-4 w-full px-4 py-2 rounded-xl bg-lime-400 text-black font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {transactionStatus === "pending"
                  ? "Создание коллекции..."
                  : "Выпустить NFT‑продукцию"}
              </button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/80 mb-2">Запросы покупателей</div>
              <div className="rounded-2xl overflow-hidden border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="text-left p-3">NFT</th>
                      <th className="text-left p-3">Покупатель</th>
                      <th className="text-left p-3">Цена (SOL)</th>
                      <th className="text-left p-3">Статус</th>
                      <th className="text-left p-3">Действия</th>
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
                                Принять
                              </button>
                              <button
                                onClick={() => declineOffer(o.id)}
                                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
                              >
                                Отклонить
                              </button>
                            </>
                          )}
                          {o.status === "accepted" && (
                            <button
                              onClick={() => shipOffer(o.id)}
                              className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            >
                              Отметить отгрузку
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {incomingOffers.length === 0 && (
                      <tr>
                        <td className="p-3 text-white/60" colSpan={5}>
                          Запросов пока нет
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/80 mb-2">Статистика</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-2xl font-black">{soldCountFarm}</div>
                  <div className="text-xs text-white/70">NFT продано</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-2xl font-black">{raisedSOLFarm}</div>
                  <div className="text-xs text-white/70">Собрано SOL</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-2xl font-black">{paidToFans}</div>
                  <div className="text-xs text-white/70">
                    Выплачено инвесторам
                  </div>
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
              Доступ только для птицофабрик.
            </div>
          </Shell>
        ))}
      {tab === "factoryAnalytics" &&
        (user.role === "factory" ? (
          <FactoryAnalytics />
        ) : (
          <Shell>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              Доступ только для птицофабрик.
            </div>
          </Shell>
        ))}
    </div>
  );
}
