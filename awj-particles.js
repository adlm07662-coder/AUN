const canvas = document.createElement("canvas");
canvas.id = "electricBackgroundCanvas";
canvas.style.position = "fixed";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.style.zIndex = "1";
canvas.style.pointerEvents = "none";
canvas.style.mixBlendMode = "screen";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");
let pixelRatio = 1;

function resize() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * pixelRatio);
  canvas.height = Math.floor(window.innerHeight * pixelRatio);
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}
resize();
window.addEventListener("resize", resize);

const mouse = { x: -9999, y: -9999 };
window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

const COUNT = 205;
const SPARK_COLOR = [216, 246, 255];
const SPARK_BLUE = [80, 180, 255];

class Particle {
  constructor(randomY) {
    this.init(randomY);
  }

  init(randomY) {
    this.x = Math.random() * window.innerWidth;
    this.y = randomY ? Math.random() * window.innerHeight : window.innerHeight + 10;
    this.r = 0.75 + Math.random() * 2.15;
    this.riseSpeed = (0.14 + Math.random() * 0.36) * (1 / this.r) * 2.1;
    this.driftX = (Math.random() - 0.5) * 0.82;
    this.driftY = (Math.random() - 0.5) * 0.16;
    this.phase = Math.random() * Math.PI * 2;
    this.wobble = 0.55 + Math.random() * 1.25;
    this.baseAlpha = 0.45 + Math.random() * 0.38;
    this.flickerSpeed = 4.5 + Math.random() * 5.5;
    this.vx = 0;
    this.vy = 0;
  }

  update(t) {
    const naturalVY = -this.riseSpeed + Math.sin(t * 0.35 + this.phase) * this.driftY;
    const naturalVX = Math.sin(t * 0.6 + this.phase) * this.wobble * 0.08 + this.driftX * 0.3;
    const dx = this.x - mouse.x;
    const dy = this.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const repelRadius = 110;

    if (dist < repelRadius && dist > 0.1) {
      const strength = (1 - dist / repelRadius) * 2.8;
      this.vx += (dx / dist) * strength;
      this.vy += (dy / dist) * strength;
    }

    this.vx *= 0.88;
    this.vy *= 0.88;
    this.x += naturalVX + this.vx;
    this.y += naturalVY + this.vy;

    if (this.y < -10) this.init(false);
    if (this.x < -10) this.x = window.innerWidth + 10;
    if (this.x > window.innerWidth + 10) this.x = -10;
  }

  draw(t) {
    const dx = this.x - mouse.x;
    const dy = this.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nearMouse = Math.max(0, 1 - dist / 130);
    const pulse = 0.85 + 0.5 * Math.max(0, Math.sin(t * this.flickerSpeed + this.phase));
    const a = Math.min(1, (this.baseAlpha + nearMouse * 0.48) * pulse);
    const glowR = this.r * (1 + nearMouse * 0.9) * pulse;
    const rb = SPARK_COLOR[0];
    const g = SPARK_COLOR[1];
    const b = SPARK_COLOR[2];

    ctx.beginPath();
    ctx.arc(this.x, this.y, glowR, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rb},${g},${b},${a})`;
    ctx.shadowBlur = this.r * 6.5 + nearMouse * 14;
    ctx.shadowColor = `rgba(${SPARK_BLUE[0]},${SPARK_BLUE[1]},${SPARK_BLUE[2]},${a})`;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

const particles = Array.from({ length: COUNT }, () => new Particle(true));
const bolts = [];
let nextBoltAt = performance.now() + 150 + Math.random() * 550;
const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function jitter(value) {
  return (Math.random() - 0.5) * value;
}

function makeBolt() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const startX = Math.random() * w;
  const startY = -20 + Math.random() * h * 0.18;
  const length = h * (0.42 + Math.random() * 0.46);
  const endY = Math.min(h + 40, startY + length);
  const segments = 9 + Math.floor(Math.random() * 9);
  const lean = jitter(w * 0.12);
  const jag = 18 + Math.random() * 44;
  const pts = [];

  for (let i = 0; i <= segments; i++) {
    const p = i / segments;
    const taper = 1 - p * 0.55;
    pts.push({
      x: startX + lean * p + jitter(jag * taper),
      y: startY + (endY - startY) * p,
    });
  }

  const branches = [];
  const branchCount = 1 + Math.floor(Math.random() * 4);
  for (let i = 0; i < branchCount; i++) {
    const rootIndex = 2 + Math.floor(Math.random() * Math.max(2, pts.length - 4));
    const root = pts[rootIndex];
    const direction = Math.random() < 0.5 ? -1 : 1;
    const branchSegments = 3 + Math.floor(Math.random() * 4);
    const branchLength = 44 + Math.random() * 115;
    const branch = [];
    for (let j = 0; j <= branchSegments; j++) {
      const p = j / branchSegments;
      branch.push({
        x: root.x + direction * branchLength * p + jitter(20 * (1 - p * 0.25)),
        y: root.y + branchLength * 0.45 * p + jitter(16),
      });
    }
    branches.push(branch);
  }

  return {
    pts,
    branches,
    born: performance.now(),
    life: 110 + Math.random() * 170,
    flickers: 2 + Math.floor(Math.random() * 3),
    width: 0.55 + Math.random() * 0.7,
    alpha: 0.58 + Math.random() * 0.32,
  };
}

function drawBoltPath(points, alpha, width) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);

  ctx.strokeStyle = `rgba(0,168,255,${alpha * 0.2})`;
  ctx.lineWidth = width + 5.5;
  ctx.shadowBlur = 26;
  ctx.shadowColor = "#00aaff";
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.strokeStyle = `rgba(0,221,255,${alpha * 0.78})`;
  ctx.lineWidth = width + 1.05;
  ctx.shadowBlur = 14;
  ctx.shadowColor = "#00e5ff";
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.strokeStyle = `rgba(230,252,255,${Math.min(1, alpha * 1.1)})`;
  ctx.lineWidth = Math.max(0.45, width * 0.52);
  ctx.shadowBlur = 4;
  ctx.shadowColor = "#dffbff";
  ctx.stroke();
}

function updateBolts(now) {
  if (!reducedMotion && now >= nextBoltAt) {
    bolts.push(makeBolt());
    if (Math.random() < 0.28) bolts.push(makeBolt());
    nextBoltAt = now + 450 + Math.random() * 1700;
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (let i = bolts.length - 1; i >= 0; i--) {
    const bolt = bolts[i];
    const age = now - bolt.born;
    if (age > bolt.life) {
      bolts.splice(i, 1);
      continue;
    }

    const progress = age / bolt.life;
    const pulse = Math.abs(Math.sin(progress * Math.PI * bolt.flickers));
    const fade = Math.pow(1 - progress, 0.72);
    const alpha = bolt.alpha * fade * (0.35 + pulse * 0.65);
    drawBoltPath(bolt.pts, alpha, bolt.width);
    for (const branch of bolt.branches) drawBoltPath(branch, alpha * 0.55, bolt.width * 0.7);
  }

  ctx.restore();
  ctx.shadowBlur = 0;
}

const startTime = performance.now();

function drawConnections() {
  const maxDist = 100;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < maxDist) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(120,220,255,${(1 - dist / maxDist) * 0.10})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
}

function animate() {
  const now = performance.now();
  const t = (now - startTime) / 1000;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawConnections();
  for (const p of particles) {
    p.update(t);
    p.draw(t);
  }
  updateBolts(now);
  requestAnimationFrame(animate);
}

animate();
