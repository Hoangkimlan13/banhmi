"use client";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./LoginPage.module.css";

export default function StoreManagerLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load tài khoản đã lưu
  useEffect(() => {
    const savedUser = localStorage.getItem("savedUsername");
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    // Xử lý lưu tài khoản
    if (rememberMe) {
      localStorage.setItem("savedUsername", username);
    } else {
      localStorage.removeItem("savedUsername");
    }

    try {
      const res = await fetch("/api/store-manager/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      router.replace("/store-manager/orders");
    } catch (err: any) {
      setError(err.message || "ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>店舗管理</h1>
        <p className={styles.subtitle}>店舗スタッフログイン</p>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>ユーザー名</label>
            <input className={styles.input} value={username} onChange={e => setUsername(e.target.value)} required />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>パスワード</label>
            <input className={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <label className={styles.checkboxContainer}>
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
            次回からユーザー名を保存する
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.button} disabled={loading}>
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </main>
  );
}