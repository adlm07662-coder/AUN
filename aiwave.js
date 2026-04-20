;(function () {
  'use strict'

  const canvas = document.getElementById('aiWave')
  const ctx    = canvas.getContext('3d')

  let t            = 0          // master time (seconds)
  let smoothVol    = 0          // 0-100, lerped
  let isSpeakingPrev = false

  /* ── Resize to fill window ─────────────────────────────── */
  function resize() {
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  /* ═══════════════════════════════════════════════════════════
     1. SOFT GLOWING ORB
     A large radial gradient sitting behind the energy line.
     Breathes gently at idle; blooms when AI speaks.
  ═══════════════════════════════════════════════════════════ */
  function drawOrb(W, H, cy, vol) {
    const breathe  = 1 + Math.sin(t * 0.9) * 0.03
    const boost    = 1 + vol * 0.006
    const baseR    = Math.min(W, H) * 0.30
    const orbR     = baseR * breathe * boost

    /* wide outer bloom */
    const bloom = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, orbR * 1.8)
    bloom.addColorStop(0,   `rgba(0,160,255,${(0.07 + vol * 0.0008).toFixed(3)})`)
    bloom.addColorStop(0.4, `rgba(0,80,200,${(0.04).toFixed(3)})`)
    bloom.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.save()
    ctx.beginPath()
    ctx.arc(W / 2, cy, orbR * 1.8, 0, Math.PI * 2)
    ctx.fillStyle = bloom
    ctx.fill()

    /* inner core glow */
    const core = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, orbR)
    core.addColorStop(0,   `rgba(0,220,255,${(0.14 + vol * 0.001).toFixed(3)})`)
    core.addColorStop(0.5, `rgba(0,120,220,0.06)`)
    core.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.arc(W / 2, cy, orbR, 0, Math.PI * 2)
    ctx.fillStyle = core
    ctx.fill()
    ctx.restore()
  }

  /* ═══════════════════════════════════════════════════════════
     2. STABLE HORIZONTAL ENERGY LINE
     Four layered strokes: wide bloom → mid glow → bright line → hot core.
     Always perfectly horizontal. No oscillation at idle.
  ═══════════════════════════════════════════════════════════ */
  function drawEnergyLine(W, cy, vol) {
    const glowBoost = 1 + vol * 0.012

    ctx.save()

    /* layer 1 – wide ambient bloom */
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy)
    ctx.strokeStyle = `rgba(0,140,255,${(0.18 * glowBoost).toFixed(3)})`
    ctx.lineWidth   = 18
    ctx.shadowBlur  = 40
    ctx.shadowColor = '#0066cc'
    ctx.stroke()

    /* layer 2 – mid cyan glow */
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy)
    ctx.strokeStyle = `rgba(0,210,255,${(0.38 * glowBoost).toFixed(3)})`
    ctx.lineWidth   = 5
    ctx.shadowBlur  = 20
    ctx.shadowColor = '#00ccff'
    ctx.stroke()

    /* layer 3 – bright inner line */
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy)
    ctx.strokeStyle = `rgba(140,245,255,${(0.80 * glowBoost).toFixed(3)})`
    ctx.lineWidth   = 1.5
    ctx.shadowBlur  = 10
    ctx.shadowColor = '#80eeff'
    ctx.stroke()

    /* layer 4 – hot-white core */
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy)
    ctx.strokeStyle = 'rgba(240,255,255,0.95)'
    ctx.lineWidth   = 0.6
    ctx.shadowBlur  = 0
    ctx.stroke()

    ctx.restore()
  }

  /* ═══════════════════════════════════════════════════════════
     3. ELECTRICITY SPARKS
     Small lightning filaments that drift along the line.
     Each spark is a pre-seeded jagged path that sits right on
     the line and extends no more than ~8 px above or below.
     Thin, smooth, subtle — never chaotic.
  ═══════════════════════════════════════════════════════════ */
  const sparks = []

  function makeSpark(W, cy, vol) {
    /* segment offsets pre-generated so the shape is stable */
    const segs = 5 + Math.floor(Math.random() * 4)          // 5-8 segments
    const span = 18 + Math.random() * 45                    // 18-63 px wide
    const amp  = 1.5 + Math.random() * (2.5 + vol * 0.05)  // 1.5-4 px tall
    const pts  = []
    for (let j = 0; j <= segs; j++) {
      const frac   = j / segs
      const altDir = (j % 2 === 0 ? 1 : -1) * (Math.random() < 0.5 ? 1 : -1)
      pts.push({ fx: frac, dy: altDir * amp * (0.3 + Math.random() * 0.7) })
    }
    return {
      x:     Math.random() * W,       // position along the line
      span,
      pts,
      vel:   (0.3 + Math.random() * 1.2) * (Math.random() < 0.5 ? 1 : -1),
      life:  1.0,
      decay: 0.008 + Math.random() * 0.018,
      delay: Math.random() * 0.4,    // appear with a short delay
      alpha: 0.28 + Math.random() * 0.32,
      pale:  Math.random() < 0.35,   // some sparks are paler white-ish
    }
  }

  function drawSparks(W, cy, vol, speaking) {
    /* target count scales with speaking state */
    const targetCount = speaking
      ? 14 + Math.round(vol * 0.20)
      : 5

    /* spawn up to target */
    const budget = Math.min(3, targetCount - sparks.length)
    for (let s = 0; s < budget; s++) {
      if (Math.random() < 0.55) sparks.push(makeSpark(W, cy, vol))
    }

    ctx.save()
    ctx.lineJoin = 'round'
    ctx.lineCap  = 'round'

    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i]

      /* delay before appearing */
      if (sp.delay > 0) { sp.delay -= 0.016; continue }

      sp.x    += sp.vel
      sp.life -= sp.decay

      if (sp.life <= 0 || sp.x < -80 || sp.x > W + 80) {
        sparks.splice(i, 1); continue
      }

      /* fade in for first 20% of life, fade out for last 30% */
      const prog    = 1 - sp.life
      const fadeIn  = Math.min(1, prog * 5)
      const fadeOut = sp.life < 0.3 ? sp.life / 0.3 : 1
      const a       = sp.alpha * fadeIn * fadeOut

      ctx.beginPath()
      const x0 = sp.x - sp.span / 2
      ctx.moveTo(x0, cy)
      for (const pt of sp.pts) {
        ctx.lineTo(x0 + pt.fx * sp.span, cy + pt.dy)
      }

      /* colour: cyan or pale white-blue */
      const col = sp.pale ? '180,240,255' : '0,220,255'
      ctx.strokeStyle = `rgba(${col},${a.toFixed(3)})`
      ctx.lineWidth   = 0.75
      ctx.shadowBlur  = 5
      ctx.shadowColor = sp.pale ? '#aaeeff' : '#00ccff'
      ctx.stroke()
    }
    ctx.restore()
  }

  /* ═══════════════════════════════════════════════════════════
     4. SOUND RINGS  (only while AI speaks)
     Clean expanding circles from the screen center.
  ═══════════════════════════════════════════════════════════ */
  const rings     = []
  let   ringTimer = 0

  function spawnRing(W, cy, vol) {
    const maxR = 160 + Math.random() * 120 + vol * 0.8
    rings.push({ x: W / 2, y: cy, r: 4, maxR, life: 1.0 })
  }

  function drawRings(W, cy, vol, speaking) {
    if (speaking) {
      ringTimer += 0.016
      const interval = Math.max(0.55, 1.1 - vol * 0.005)
      if (ringTimer >= interval && rings.length < 5) {
        ringTimer = 0
        spawnRing(W, cy, vol)
      }
    } else {
      ringTimer = 0
    }

    if (!rings.length) return
    ctx.save()
    for (let i = rings.length - 1; i >= 0; i--) {
      const rg   = rings[i]
      const prog = rg.r / rg.maxR
      rg.r   += 2.8 + (1 - prog) * 3.5    // ease-out expansion
      rg.life = Math.max(0, 1 - prog)
      if (rg.life <= 0) { rings.splice(i, 1); continue }

      const a = rg.life * 0.22

      /* soft outer halo */
      ctx.beginPath()
      ctx.arc(rg.x, rg.y, rg.r + 5, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(0,160,255,${(a * 0.4).toFixed(3)})`
      ctx.lineWidth   = 4
      ctx.shadowBlur  = 16
      ctx.shadowColor = '#0088ff'
      ctx.stroke()

      /* crisp core ring */
      ctx.beginPath()
      ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(0,220,255,${a.toFixed(3)})`
      ctx.lineWidth   = 1.2
      ctx.shadowBlur  = 8
      ctx.shadowColor = '#00ccff'
      ctx.stroke()
    }
    ctx.restore()
  }

  /* ═══════════════════════════════════════════════════════════
     5.  MAIN DRAW LOOP
  ═══════════════════════════════════════════════════════════ */
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const W  = canvas.width
    const H  = canvas.height
    const cy = H / 2

    const speaking = (typeof isSpeaking !== 'undefined' && isSpeaking)

    /* smooth volume — ramps up fast when speaking, decays quickly when silent */
    const target = speaking ? 55 + 35 * Math.abs(Math.sin(t * 6)) : 0
    smoothVol   += (target - smoothVol) * (speaking ? 0.09 : 0.06)

    /* draw order: orb → rings → line → sparks */
    drawOrb(W, H, cy, smoothVol)
    drawRings(W, cy, smoothVol, speaking)
    drawEnergyLine(W, cy, smoothVol)
    drawSparks(W, cy, smoothVol, speaking)

    t += 0.016
    requestAnimationFrame(draw)
  }

  draw()

})()
