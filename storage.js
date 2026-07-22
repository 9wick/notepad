// file:// 直開きでも動くよう、ESM を使わずグローバル関数として定義する

const PREFIX = "id:";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30日: 自動削除までの保持期間（ここだけ変更すればよい）

function loadNote(id) {
  const raw = localStorage.getItem(PREFIX + id);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    if (typeof parsed.text !== "string" || typeof parsed.updatedAt !== "number") return null;
    return { text: parsed.text, updatedAt: parsed.updatedAt };
  } catch {
    // 壊れたデータは存在しないものとして扱う（呼び出し側の分岐を増やさないため）
    return null;
  }
}

function saveNote(id, text) {
  const key = PREFIX + id;
  if (text === "") {
    // 空メモを保持し続けると一覧・cleanup 双方の対象が無駄に増えるため即時削除する
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, JSON.stringify({ text, updatedAt: Date.now() }));
}

function listNotes() {
  const notes = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key === null || !key.startsWith(PREFIX)) continue;
    const id = key.slice(PREFIX.length);
    const note = loadNote(id);
    if (note === null) continue;
    notes.push({ id, text: note.text, updatedAt: note.updatedAt });
  }
  notes.sort((a, b) => b.updatedAt - a.updatedAt);
  return notes;
}

function cleanup() {
  const now = Date.now();
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key === null || !key.startsWith(PREFIX)) continue;
    const id = key.slice(PREFIX.length);
    const note = loadNote(id);
    // parse 不能なキーも期限切れ扱いのキーも、削除対象としては同列
    if (note === null || now - note.updatedAt > TTL_MS) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}
