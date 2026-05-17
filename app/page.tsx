"use client";

import { useState, useEffect } from "react";

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
  const [selectedItem, setSelectedItem] = useState<DecryptedItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newWebsite, setNewWebsite] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newNotes, setNewNotes] = useState("");

  function apiHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    };
  }

  async function loadItems() {
    try {
      const res = await fetch("/api/items", { headers: apiHeaders() });
      setItems(await res.json());
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    if (unlocked) loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

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
    const num = parseInt(value);
    if (!isNaN(num) && num > 0 && num <= items.length) {
      decryptItem(items[num - 1].id);
    } else if (value.length === 0) {
      setSelectedItem(null);
    }
  }

  async function decryptItem(id: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/items/" + id, { headers: apiHeaders() });
      if (!res.ok) throw new Error("decrypt failed");
      setSelectedItem(await res.json());
    } catch (e) {
      setError("解密失败");
    } finally {
      setLoading(false);
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
    if (!confirm("确认删除？")) return;
    try {
      const res = await fetch("/api/items/" + id, {
        method: "DELETE",
        headers: apiHeaders(),
      });
      if (res.ok) {
        setSelectedItem(null);
        setSearchInput("");
        await loadItems();
      }
    } catch (e) {
      setError("删除失败");
    }
  }

  const filteredItems = searchInput && isNaN(parseInt(searchInput))
    ? items.filter(
        (item) =>
          item.website.toLowerCase().includes(searchInput.toLowerCase()) ||
          item.username.toLowerCase().includes(searchInput.toLowerCase())
      )
    : items;

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm p-8 bg-slate-800 rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold text-center mb-1">PassMan</h1>
          <p className="text-slate-400 text-center mb-6 text-sm">密码管理器</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="输入访问密码"
            className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button
            onClick={handleUnlock}
            className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
          >
            解锁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">PassMan</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
        >
          + 添加
        </button>
      </div>

      <input
        type="text"
        value={searchInput}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="输入编号或搜索网站..."
        className="w-full px-4 py-3 rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
      />

      {selectedItem && (
        <div className="mb-4 p-4 bg-slate-800 rounded-xl border border-blue-500/30">
          <div className="flex items-start justify-between">
            <h3 className="font-bold text-lg text-blue-400">
              {selectedItem.website}
            </h3>
            <button
              onClick={() => { setSelectedItem(null); setSearchInput(""); }}
              className="text-slate-500 hover:text-white text-lg"
            >
              &times;
            </button>
          </div>
          {selectedItem.url && (
            <p className="text-sm text-slate-400 mt-1 break-all">
              {selectedItem.url}
            </p>
          )}
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center bg-slate-700/50 rounded-lg px-3 py-2">
              <span className="text-slate-400 text-sm">账号</span>
              <span className="font-mono text-sm select-all">{selectedItem.username}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-700/50 rounded-lg px-3 py-2">
              <span className="text-slate-400 text-sm">密码</span>
              <span className="font-mono text-sm text-green-400 select-all">
                {selectedItem.password}
              </span>
            </div>
            {selectedItem.notes && (
              <div className="bg-slate-700/50 rounded-lg px-3 py-2">
                <span className="text-slate-400 text-sm block mb-1">备注</span>
                <span className="text-sm">{selectedItem.notes}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => handleDelete(selectedItem.id)}
            className="mt-3 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs transition"
          >
            删除此条
          </button>
        </div>
      )}

      <div className="space-y-2">
        {filteredItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => decryptItem(item.id)}
            className={
              "w-full text-left px-4 py-3 rounded-lg transition flex items-center justify-between " +
              (selectedItem?.id === item.id
                ? "bg-blue-600/20 border border-blue-500/30"
                : "bg-slate-800 hover:bg-slate-700")
            }
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 font-mono w-8">
                #{index + 1}
              </span>
              <div>
                <p className="font-medium">{item.website}</p>
                <p className="text-xs text-slate-400">{item.username}</p>
              </div>
            </div>
            <span className="text-slate-600 text-xs">&rarr;</span>
          </button>
        ))}
        {filteredItems.length === 0 && (
          <p className="text-center text-slate-500 py-8">
            {items.length === 0 ? "暂无保存的密码，点击右上角 + 添加 开始" : "无匹配结果"}
          </p>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">添加密码</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newWebsite}
                onChange={(e) => setNewWebsite(e.target.value)}
                placeholder="网站名称 *"
                className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                autoFocus
              />
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="网址（可选）"
                className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="账号 *"
                className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="密码 *"
                className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="备注（可选）"
                className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={!newWebsite || !newUsername || !newPassword}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-700 text-white px-4 py-2 rounded-lg text-sm z-50">
          加载中...
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-4 py-2 rounded-lg text-sm z-50">
          {error}
        </div>
      )}
    </div>
  );
}