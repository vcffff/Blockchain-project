import React from "react";

type Tab = "landing" | "farms" | "album" | "dashboard" | "artist" | "factoryAnalytics";
type User = { username: string; role: "factory" | "investor"; farmId?: number };

type Props = {
  tabs: Tab[];
  current: Tab;
  setTab: (t: Tab) => void;
  user: User | null;
  logout: () => void;
  walletSolBalance: number;
  connected: boolean;
  walletConnecting: boolean;
  connectWallet: () => void;
  disconnectWallet: () => void;
  phantomPubkey: string | null;
  onOpenWithdraw: () => void;
};

export default function NavBar({
  tabs,
  current,
  setTab,
  user,
  logout,
  walletSolBalance,
  connected,
  walletConnecting,
  connectWallet,
  disconnectWallet,
  phantomPubkey,
  onOpenWithdraw,
}: Props) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="text-xl font-semibold text-white">AgroLink</div>
      <div className="flex items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-xl text-sm transition ${
              current === t ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {t === "landing" && "Home"}
            {t === "farms" && "Farms"}
            {t === "album" && "Products"}
            {t === "dashboard" && "Dashboard"}
            {t === "artist" && "Factory"}
            {t === "factoryAnalytics" && "Analytics"}
          </button>
        ))}
        <button onClick={onOpenWithdraw} className="px-3 py-1 rounded-xl text-sm bg-white/10 hover:bg-white/20 text-white">
          Withdraw (demo)
        </button>
        {user && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-white/80 text-sm">{user.username}</span>
            <button onClick={logout} className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-sm">
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
            {walletConnecting ? "Connecting..." : "Connect wallet"}
          </button>
        ) : (
          <button onClick={disconnectWallet} className="ml-2 px-4 py-2 rounded-xl bg-fuchsia-500 text-white font-semibold">
            {phantomPubkey?.slice(0, 4)}…{phantomPubkey?.slice(-4)}
            <span className="ml-2 text-white/80">{walletSolBalance.toFixed(2)} SOL</span>
          </button>
        )}
      </div>
    </div>
  );
}


