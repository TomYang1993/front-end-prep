type Entry = { value: unknown; expiresAt?: number };

export class InMemoryRedis {
  private store = new Map<string, Entry>();

  private alive(e: Entry | undefined): e is Entry {
    if (!e) return false;
    if (e.expiresAt && e.expiresAt <= Date.now()) return false;
    return true;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const e = this.store.get(key);
    if (!this.alive(e)) {
      this.store.delete(key);
      return null;
    }
    return e.value as T;
  }

  async set(key: string, value: unknown, opts?: { ex?: number; px?: number }) {
    const ttlMs = opts?.px ?? (opts?.ex ? opts.ex * 1000 : undefined);
    this.store.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined
    });
    return 'OK';
  }

  async incr(key: string): Promise<number> {
    const cur = (await this.get<number>(key)) ?? 0;
    const next = cur + 1;
    await this.set(key, next);
    return next;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async expire(key: string, seconds: number) {
    const e = this.store.get(key);
    if (!this.alive(e)) return 0;
    e.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  flushall() {
    this.store.clear();
  }
}

export function makeRedis() {
  return new InMemoryRedis();
}
