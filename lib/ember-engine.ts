/**
 * Ember tiger engine: draws the logo as a field of ember particles on a full-viewport canvas,
 * positioned over a "slot" element in the layout.
 *
 * Stirring (pointer movement, taps, or calls to `stir`) adds heat. Heat compounds, so sustained
 * motion grows from loose sparks, to flames licking off the tiger, to a full blaze, then cools.
 */

export interface EmberEngine {
  /** Add heat. Roughly 0..1; the effect compounds with the heat already there. */
  stir(amount: number): void;
  /** Kick the particles outward from a point in viewport coordinates (defaults to the tiger's center). */
  burst(x?: number, y?: number): void;
  destroy(): void;
}

export interface EmberEngineOptions {
  /** URL of the logo to sample. Its opaque pixels become particles. */
  src: string;
  /** Listen to pointer movement on the window. Default true. */
  interactive?: boolean;
  /** Called when the displayed heat (0..1) changes. */
  onHeat?: (heat: number) => void;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; tx: number; ty: number;
  seed: number; base: number; delay: number; size: number;
}
interface Ember { x: number; y: number; vx: number; vy: number; life: number; max: number; wait: number }
interface Flame { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; phase: number }

const LOGO_W = 1284;
const LOGO_H = 755;

export function createEmberEngine(
  canvas: HTMLCanvasElement,
  slot: HTMLElement,
  { src, interactive = true, onHeat }: EmberEngineOptions,
): EmberEngine {
  const ctx = canvas.getContext("2d")!;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, small = false, first = true, ready = false, dead = false, raf = 0;
  let parts: Particle[] = [];
  const embers: Ember[] = [];
  const flames: Flame[] = [];
  let box = { x: 0, y: 0, w: 1, h: 1 };
  const ptr = { x: -9999, y: -9999, on: false };
  let energy = 0, lastStir = 0, blaze = 0, lastT = 0, shownHeat = -1;
  const t0 = performance.now();

  // Particle colors by heat, dull orange to white-hot.
  const PAL: string[] = [];
  for (let i = 0; i < 24; i++) {
    const h = (i / 23) * 1.5;
    const g = Math.min(255, 112 + h * 105) | 0;
    const b = Math.min(230, 18 + h * h * 95) | 0;
    PAL.push(`rgba(255,${g},${b},${Math.min(1, 0.5 + h * 0.4).toFixed(2)})`);
  }
  // Soft sprites for flame tongues: core, body, tail.
  const SPRITES = [[255, 214, 120], [255, 132, 28], [214, 48, 8]].map((c) => {
    const k = document.createElement("canvas");
    k.width = k.height = 64;
    const g = k.getContext("2d")!;
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, `rgba(${c},1)`);
    r.addColorStop(0.25, `rgba(${c},.7)`);
    r.addColorStop(0.6, `rgba(${c},.18)`);
    r.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
    return k;
  });

  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    if (dead) return;
    ready = true;
    layout();
    if (reduce) { settle(); draw(0); } else raf = requestAnimationFrame(frame);
  };
  img.src = src;

  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    small = W < 700;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const r = slot.getBoundingClientRect();
    const s = Math.min(r.width / LOGO_W, r.height / LOGO_H);
    const w = Math.max(40, Math.round(LOGO_W * s));
    const h = Math.max(24, Math.round(LOGO_H * s));
    box = { x: r.left + (r.width - w) / 2, y: r.top + (r.height - h) / 2, w, h };

    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const o = off.getContext("2d", { willReadFrequently: true })!;
    o.drawImage(img, 0, 0, w, h);
    const d = o.getImageData(0, 0, w, h).data;
    let filled = 0;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 120) filled++;
    filled *= 4;
    const step = Math.max(1.6, Math.sqrt(filled / (small ? 2800 : 5600)));

    const pts: [number, number][] = [];
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        const jx = Math.min(w - 1, Math.max(0, Math.round(x + (Math.random() - 0.5) * step * 0.5)));
        const jy = Math.min(h - 1, Math.max(0, Math.round(y + (Math.random() - 0.5) * step * 0.5)));
        if (d[(jy * w + jx) * 4 + 3] > 120) pts.push([box.x + jx, box.y + jy]);
      }
    }
    for (let i = pts.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [pts[i], pts[j]] = [pts[j], pts[i]];
    }
    const size = Math.max(1.1, Math.min(2.4, step * 0.62));
    parts = pts.map(([tx, ty], i) => {
      const p = parts[i] ?? {
        x: tx + (Math.random() - 0.5) * W * 0.5,
        y: H + 20 + Math.random() * H * 0.7,
        vx: 0, vy: 0, tx, ty,
        seed: Math.random() * 6.283,
        base: Math.random(),
        delay: first ? Math.random() * 1.1 + ((tx - box.x) / w) * 0.7 : 0,
        size,
      };
      p.tx = tx;
      p.ty = ty;
      p.size = size * (0.75 + Math.random() * 0.6);
      return p;
    });
    first = false;
    if (!embers.length) {
      for (let i = 0; i < (small ? 240 : 480); i++) {
        embers.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, wait: Math.random() * 4 + 1.6 });
      }
    }
  }

  function settle() {
    for (const p of parts) { p.x = p.tx; p.y = p.ty; }
  }

  function draw(t: number) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    const dt = Math.min(0.05, Math.max(0, t - lastT));
    lastT = t;

    if (!reduce) {
      const idle = performance.now() - lastStir > 350;
      energy = Math.max(0, energy - dt * (idle ? 0.085 : 0.02));
      if (energy >= 1 && blaze <= 0) {
        blaze = 2.8;
        kick(box.x + box.w / 2, box.y + box.h / 2, Infinity, 5);
      }
      if (blaze > 0) { blaze -= dt; if (blaze <= 0) energy = 0.6; }
    }
    const E = blaze > 0 ? 1.3 : energy;
    const heat = Math.min(1, E);
    if (Math.abs(heat - shownHeat) > 0.012) { shownHeat = heat; onHeat?.(heat); }

    // Flames: appear once there is some heat, first near the pointer, then across the whole tiger.
    if (E > 0.15 && parts.length) {
      const cap = small ? 560 : 1100;
      const rate = (E - 0.15) * (small ? 20 : 38);
      const near = Math.min(W, H) * 0.24;
      let n = rate | 0;
      if (Math.random() < rate - n) n++;
      for (let i = 0; i < n && flames.length < cap; i++) {
        let from = parts[(Math.random() * parts.length) | 0];
        if (ptr.on && E < 0.8 && Math.random() < 0.7) {
          for (let k = 0; k < 6; k++) {
            const c = parts[(Math.random() * parts.length) | 0];
            if (Math.abs(c.x - ptr.x) < near && Math.abs(c.y - ptr.y) < near) { from = c; break; }
          }
        }
        const life = 0.45 + Math.random() * 0.6 + E * 0.3;
        flames.push({
          x: from.x, y: from.y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -(1.2 + Math.random() * 2) * (1 + E * 0.9),
          life, max: life,
          size: (7 + Math.random() * 12) * (1 + E * 1.3) * (small ? 0.8 : 1),
          phase: Math.random() * 6.28,
        });
      }
    }
    for (let i = flames.length - 1; i >= 0; i--) {
      const f = flames[i];
      f.life -= dt;
      if (f.life <= 0) { flames[i] = flames[flames.length - 1]; flames.pop(); continue; }
      f.x += f.vx + Math.sin(t * 6 + f.phase) * 0.45;
      f.y += f.vy;
      const k = f.life / f.max;
      const w = f.size * (0.4 + 0.6 * k);
      const h = w * 1.9;
      ctx.globalAlpha = k * 0.8 * Math.min(1, (1 - k) * 8);
      ctx.drawImage(SPRITES[k > 0.62 ? 0 : k > 0.3 ? 1 : 2], f.x - w / 2, f.y - h * 0.7, w, h);
    }
    ctx.globalAlpha = 1;

    // The tiger itself.
    const cyc = (t * 0.16) % 1.6;
    const band = box.x + (cyc * 1.4 - 0.2) * box.w;
    const bw = box.w * 0.11;
    const R = Math.min(W, H) * 0.17 * (1 + E * 0.45);
    const R2 = R * R;
    const wob = 0.7 * (1 + E * 3);
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (t < p.delay) continue;
      if (!reduce) {
        const tx = p.tx + Math.sin(t * (1.3 + E * 5) + p.seed) * wob;
        const ty = p.ty + Math.cos(t * (1.1 + E * 4) + p.seed * 1.7) * wob;
        let ax = (tx - p.x) * 0.05;
        let ay = (ty - p.y) * 0.05;
        if (ptr.on) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            let f = 1 - d2 / R2;
            f *= f;
            const d = Math.sqrt(d2) + 0.01;
            ax += (dx / d) * f * 3.2;
            ay += (dy / d) * f * 3.2 - f * 0.9;
          }
        }
        p.vx = (p.vx + ax) * 0.86;
        p.vy = (p.vy + ay) * 0.86;
        p.x += p.vx;
        p.y += p.vy;
      }
      const q = (p.tx - band) / bw;
      const speed = Math.abs(p.vx) + Math.abs(p.vy);
      const hot = 0.22 + p.base * 0.4 + Math.exp(-q * q) * 0.95 + Math.min(0.8, speed * 0.1) + E * (0.3 + Math.random() * 0.35);
      ctx.fillStyle = PAL[Math.min(23, ((hot / 1.5) * 23) | 0)];
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    if (reduce || t < 2.2) return;

    // Loose embers drifting up; more of them, faster and bigger, as heat builds.
    const active = Math.min(embers.length, Math.round(embers.length * (0.19 + 0.81 * heat)));
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      if (e.life <= 0) {
        if (i >= active) continue;
        if (e.wait > 0) { e.wait -= 0.016; continue; }
        const from = parts[(Math.random() * parts.length) | 0];
        if (!from) continue;
        e.x = from.x;
        e.y = from.y;
        e.vx = (Math.random() - 0.5) * 0.5;
        e.vy = -(0.35 + Math.random() * 0.9) * (1 + E * 1.8);
        e.max = e.life = 1.6 + Math.random() * 2.4;
        e.wait = Math.random() * 1.5 * (1 - heat * 0.8);
      }
      e.life -= 0.016;
      e.x += e.vx + Math.sin(t * 2 + e.max * 9) * 0.25;
      e.y += e.vy;
      const k = Math.max(0, e.life / e.max);
      ctx.fillStyle = `rgba(255,${(150 + k * 90) | 0},${(40 + k * 120) | 0},${(k * 0.85).toFixed(2)})`;
      const z = (1 + k * 1.6) * (1 + heat * 0.7);
      ctx.fillRect(e.x, e.y, z, z);
    }
  }

  function frame(now: number) {
    if (dead) return;
    draw((now - t0) / 1000);
    raf = requestAnimationFrame(frame);
  }

  function stir(amount: number) {
    if (reduce) return;
    energy = Math.min(1, energy + amount * (1 + energy * 1.6));
    lastStir = performance.now();
  }

  function kick(x: number, y: number, radius: number, force: number) {
    for (const p of parts) {
      const dx = p.x - x, dy = p.y - y, d = Math.sqrt(dx * dx + dy * dy) + 1;
      if (d >= radius) continue;
      const f = radius === Infinity ? force : (1 - d / radius) * force;
      p.vx += (dx / d) * f;
      p.vy += (dy / d) * f - f * 0.25;
    }
  }

  function burst(x = box.x + box.w / 2, y = box.y + box.h / 2) {
    if (reduce) return;
    kick(x, y, Math.min(W, H) * 0.32, 14);
    stir(0.1);
  }

  function onMove(e: PointerEvent) {
    if (ptr.on) {
      const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
      stir(Math.min(160, Math.sqrt(dx * dx + dy * dy)) / (Math.max(W, H) * 9));
    }
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    ptr.on = true;
  }
  function onDown(e: PointerEvent) {
    ptr.on = false;
    onMove(e);
    burst(e.clientX, e.clientY);
  }
  function onUp(e: PointerEvent) { if (e.pointerType !== "mouse") ptr.on = false; }
  function onLeave() { ptr.on = false; }

  let resizeTimer = 0;
  function relayout() {
    if (!ready || dead) return;
    layout();
    if (reduce) { settle(); draw(0); }
  }
  function onResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(relayout, 120);
  }

  if (interactive) {
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onLeave, { passive: true });
    document.addEventListener("pointerleave", onLeave);
  }
  window.addEventListener("resize", onResize);
  // The slot can move when fonts load or content above it changes size.
  const observer = new ResizeObserver(onResize);
  observer.observe(slot);
  document.fonts?.ready.then(relayout);

  return {
    stir,
    burst,
    destroy() {
      dead = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onLeave);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
    },
  };
}
