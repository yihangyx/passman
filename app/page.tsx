"use client";

import { useState, useEffect, useCallback } from "react";

interface ListItem {
  id: string;
  website: string;
  url: string;
  username: string;
  createdAt: string;
}

interface DecryptedItem extends ListItem {
  password: string;
  notes: string;
}

export default function HomePage() {
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [items, setItems] = useState<ListItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decryptedItem, setDecryptedItem] = useState<DecryptedItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyPasswordInput, setVerifyPasswordInput] = useState("");
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [bgUrl, setBgUrl] = useState("");

  // 新增表单
  const [newWebsite, setNewWebsite] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // 复制提示
  const [copyTip, setCopyTip] = useState("");

  function apiHeaders(): Record<string, string> {
    return { "Content-Type": "application/json", Authorization: "Bearer " + token };
  }

  async function loadItems() {
    try {
      const res = await fetch("/api/items", { headers: apiHeaders() });
      if (res.ok) setItems(await res.json());
    } catch (e) {}
  }

  useEffect(() => {
    if (unlocked) loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  // 获取背景图 URL
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => d.bgUrl && setBgUrl(d.bgUrl))
      .catch(() => {});
  }, []);

  async function handleUnlock() {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setUnlocked(true);
        setError("");
      } else {
        setError("密码错误");
      }
    } catch (e) {
      setError("连接失败");
    }
  }

  function handleSearch(value: string) {
    setSearchInput(value);
    setSelectedId(null);
    setDecryptedItem(null);
    const num = parseInt(value);
    if (!isNaN(num) && num > 0 && num <= items.length) {
      requestDecrypt(items[num - 1].id);
    } else if (value.length === 0) {
      setDecryptedItem(null);
      setSelectedId(null);
    }
  }

  function requestDecrypt(id: string) {
    setPendingItemId(id);
    setShowVerify(true);
    setVerifyPasswordInput("");
  }

  async function doDecrypt() {
    if (!pendingItemId || !verifyPasswordInput) return;
    setShowVerify(false);
    setLoading(true);
    try {
      const res = await fetch("/api/items/" + pendingItemId, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ password: verifyPasswordInput }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "解密失败" }));
        setError(err.error || "二次密码错误");
        return;
      }
      const data = await res.json();
      setDecryptedItem(data);
      setSelectedId(pendingItemId);
      setSearchInput("");
      setError("");
    } catch (e) {
      setError("解密失败");
    } finally {
      setLoading(false);
      setVerifyPasswordInput("");
      setPendingItemId(null);
    }
  }

  async function handleAdd() {
    if (!newWebsite || !newUsername || !newPassword) return;
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          website: newWebsite,
          url: newUrl,
          username: newUsername,
          password: newPassword,
          notes: newNotes,
        }),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewWebsite("");
        setNewUrl("");
        setNewUsername("");
        setNewPassword("");
        setNewNotes("");
        await loadItems();
      }
    } catch (e) {
      setError("添加失败");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/items/" + id, {
        method: "DELETE",
        headers: apiHeaders(),
      });
      if (res.ok) {
        setDecryptedItem(null);
        setSelectedId(null);
        setSearchInput("");
        await loadItems();
      }
    } catch (e) {
      setError("删除失败");
    }
  }

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyTip(label + " 已复制！");
      setTimeout(() => setCopyTip(""), 2000);
    } catch (e) {}
  }

  const filteredItems =
    searchInput && isNaN(parseInt(searchInput))
      ? items.filter(
          (item) =>
            item.website.toLowerCase().includes(searchInput.toLowerCase())
        )
      : items;

  // ========== 锁定页 ==========
  if (!unlocked) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center px-4"
        style={
          bgUrl
            ? {
                backgroundImage: "url(" + bgUrl + ")",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="w-full max-w-sm p-8 rounded-2xl shadow-2xl backdrop-blur-xl" style={{ backgroundColor: "rgba(15,23,42,0.85)" }}>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">PassMan</h1>
            <p className="text-slate-400 mt-1 text-sm">安全密码管理器</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="输入访问密码解锁"
            className="w-full px-4 py-3.5 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-white/10 backdrop-blur-sm text-base"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
          <button
            onClick={handleUnlock}
            className="w-full mt-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/25 text-white"
          >
            解锁
          </button>
        </div>
      </div>
    );
  }

  // ========== 主界面 ==========
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={
        bgUrl
          ? {
              backgroundImage: "url(" + bgUrl + ")",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }
          : undefined
      }
    >
      {/* 背景遮罩 - 功能区外透明 */}
      {bgUrl && (
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      )}

      {/* 主内容区 */}
      <div className="relative z-10 max-w-lg mx-auto px-4 py-6 min-h-screen">

        {/* 顶部栏 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white drop-shadow">PassMan</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 mr-1">{items.length} 条</span>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-600/25 text-white"
            >
              + 添加
            </button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="mb-4">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="输入编号或搜索网站..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-900/80 backdrop-blur-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-white/10 text-base"
            />
          </div>
        </div>

        {/* 解密详情卡片 */}
        {decryptedItem && (
          <div className="mb-4 p-5 rounded-2xl backdrop-blur-xl shadow-2xl border border-white/10" style={{ backgroundColor: "rgba(15,23,42,0.88)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-600/30 flex items-center justify-center text-lg">
                  🔐
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{decryptedItem.website}</h3>
                  {decryptedItem.url && (
                    <a href={decryptedItem.url.startsWith("http") ? decryptedItem.url : "https://" + decryptedItem.url}
                       target="_blank" rel="noopener noreferrer"
                       className="text-xs text-blue-400 hover:text-blue-300 truncate block max-w-[240px]">
                      {decryptedItem.url}
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => { setDecryptedItem(null); setSelectedId(null); }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 mt-4">
              {/* 账号行 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 group cursor-pointer" onClick={() => copyToClipboard(decryptedItem.username, "账号")}>
                <span className="text-slate-400 text-sm">账号</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-white">{decryptedItem.username}</span>
                  <span className="opacity-0 group-hover:opacity-100 text-xs text-blue-400 transition">复制</span>
                </div>
              </div>

              {/* 密码行 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 group cursor-pointer" onClick={() => copyToClipboard(decryptedItem.password, "密码")}>
                <span className="text-slate-400 text-sm">密码</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-green-400 tracking-wider">{decryptedItem.password}</span>
                  <span className="opacity-0 group-hover:opacity-100 text-xs text-blue-400 transition">复制</span>
                </div>
              </div>

              {/* 备注 */}
              {decryptedItem.notes && (
                <div className="p-3 rounded-xl bg-white/5">
                  <span className="text-slate-400 text-xs block mb-1">备注</span>
                  <span className="text-sm text-slate-300">{decryptedItem.notes}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => handleDelete(decryptedItem.id)}
              className="mt-4 w-full py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-xl text-sm font-medium transition border border-red-500/20"
            >
              🗑 删除此条记录
            </button>
          </div>
        )}

        {/* 密码列表 - 只显示网站名和编号，不显示账号 */}
        <div className="space-y-2 pb-20">
          {filteredItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => requestDecrypt(item.id)}
              className={
                "w-full text-left px-4 py-3.5 rounded-xl transition-all flex items-center justify-between backdrop-blur-md border " +
                (selectedId === item.id
                  ? "bg-blue-600/25 border-blue-500/40 shadow-lg shadow-blue-600/10"
                  : "bg-slate-900/60 hover:bg-slate-800/70 border-white/5")
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-mono font-bold text-blue-400/70 w-7 shrink-0">
                  #{index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{item.website}</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-slate-500 shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ))}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-slate-400 text-sm">
                {items.length === 0 ? "暂无保存的密码\n点击右上角「+ 添加」开始" : "无匹配结果"}
              </p>
            </div>
          )}
        </div>

        {/* ====== 二次密码验证弹窗 ====== */}
        {showVerify && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}>
            <div className="w-full max-w-sm p-6 rounded-2xl shadow-2xl" style={{ backgroundColor: "rgba(15,23,42,0.95)" }}>
              <div className="text-center mb-5">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-yellow-500/20 flex items-center justify-center mb-3">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 019.9-1" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white">安全验证</h2>
                <p className="text-slate-400 text-sm mt-1">输入访问密码以查看详情</p>
              </div>
              <input
                type="password"
                value={verifyPasswordInput}
                onChange={(e) => setVerifyPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doDecrypt()}
                placeholder="输入访问密码"
                className="w-full px-4 py-3.5 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 border border-white/10 text-base"
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setShowVerify(false); setPendingItemId(null); setVerifyPasswordInput(""); }}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium transition text-slate-300"
                >
                  取消
                </button>
                <button
                  onClick={doDecrypt}
                  disabled={!verifyPasswordInput}
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition text-white shadow-lg shadow-yellow-600/25"
                >
                  确认查看
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====== 添加弹窗 ====== */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}>
            <div className="w-full max-w-sm p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "rgba(15,23,42,0.95)" }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">添加新密码</h2>
                <button
                  onClick={() => setShowAdd(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition"
                >✕</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">网站名称 *</label>
                  <input type="text" value={newWebsite} onChange={(e) => setNewWebsite(e.target.value)} placeholder="如：GitHub、微信"
                    className="w-full px-3.5 py-3 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 border border-white/10 text-sm" autoFocus />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">网址（可选）</label>
                  <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..."
                    className="w-full px-3.5 py-3 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 border border-white/10 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">账号 *</label>
                  <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="用户名 / 邮箱 / 手机号"
                    className="w-full px-3.5 py-3 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 border border-white/10 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">密码 *</label>
                  <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="输入密码"
                    className="w-full px-3.5 py-3 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 border border-white/10 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">备注（可选）</label>
                  <input type="text" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="任意备注信息"
                    className="w-full px-3.5 py-3 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 border border-white/10 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAdd(false)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium transition text-slate-300">
                  取消
                </button>
                <button onClick={handleAdd} disabled={!newWebsite || !newUsername || !newPassword}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition text-white shadow-lg shadow-blue-600/25">
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 加载指示器 */}
        {loading && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl backdrop-blur-xl text-white text-sm shadow-lg flex items-center gap-2" style={{ backgroundColor: "rgba(15,23,42,0.9)" }}>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
            解密中...
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl backdrop-blur-xl text-red-400 text-sm shadow-lg max-w-[90vw] text-center" style={{ backgroundColor: "rgba(127,29,29,0.9)" }}>
            {error}
          </div>
        )}

        {/* 复制成功提示 */}
        {copyTip && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl backdrop-blur-xl text-green-400 text-sm shadow-lg" style={{ backgroundColor: "rgba(22,101,52,0.9)" }}>
            ✓ {copyTip}
          </div>
        )}

      </div>
    </div>
  );
}