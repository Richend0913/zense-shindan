// ========================================
// Past Life & Future Life Diagnosis App
// ========================================

(function() {
  'use strict';

  // ---- Stars Background ----
  function initStars() {
    const canvas = document.getElementById('stars-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function createStars() {
      stars = [];
      const count = Math.floor((w * h) / 4000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.5 + 0.3,
          alpha: Math.random(),
          speed: Math.random() * 0.02 + 0.005
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.alpha += s.speed;
        const a = (Math.sin(s.alpha) + 1) / 2 * 0.8 + 0.1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 200, 255, ${a})`;
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    resize();
    createStars();
    draw();
    window.addEventListener('resize', () => { resize(); createStars(); });
  }

  // ---- DJB2 Hash ----
  function djb2Hash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return hash >>> 0;
  }

  function multiHash(name, birthday) {
    const base = name + '|' + birthday;
    const h1 = djb2Hash(base);
    const h2 = djb2Hash(base + '#past');
    const h3 = djb2Hash(base + '#future');
    const h4 = djb2Hash(base + '#trait');
    const h5 = djb2Hash(base + '#ability');
    const h6 = djb2Hash(base + '#destiny');
    const h7 = djb2Hash(base + '#score');
    const h8 = djb2Hash(base + '#story1');
    const h9 = djb2Hash(base + '#story2');
    return { h1, h2, h3, h4, h5, h6, h7, h8, h9 };
  }

  // ---- Diagnose ----
  function diagnose(name, birthday) {
    const hashes = multiHash(name, birthday);

    // Past life
    const eraIdx = hashes.h1 % ERAS.length;
    const era = ERAS[eraIdx];
    const occIdx = hashes.h2 % era.occupations.length;
    const occupation = era.occupations[occIdx];
    const traitIdx = hashes.h4 % PERSONALITY_TRAITS.length;
    const trait = PERSONALITY_TRAITS[traitIdx];

    // Future life
    const futureIdx = hashes.h3 % FUTURE_TYPES.length;
    const future = FUTURE_TYPES[futureIdx];
    const abilityIdx = hashes.h5 % future.abilities.length;
    const ability = future.abilities[abilityIdx];
    const destinyIdx = hashes.h6 % DESTINY_DESCRIPTIONS.length;
    const destiny = DESTINY_DESCRIPTIONS[destinyIdx];

    // Stories
    const pastStoryIdx = hashes.h8 % STORY_TEMPLATES_PAST.length;
    const futureStoryIdx = hashes.h9 % STORY_TEMPLATES_FUTURE.length;

    const pastStory = STORY_TEMPLATES_PAST[pastStoryIdx]
      .replace(/{era}/g, era.name)
      .replace(/{occupation}/g, occupation)
      .replace(/{trait}/g, trait);

    const futureStory = STORY_TEMPLATES_FUTURE[futureStoryIdx]
      .replace(/{type}/g, future.name)
      .replace(/{ability}/g, ability)
      .replace(/{destiny}/g, destiny);

    // Soul score (60-99)
    const score = 60 + (hashes.h7 % 40);

    return {
      name, birthday, era, occupation, trait, pastStory,
      future, ability, destiny, futureStory, score
    };
  }

  // ---- Display Results ----
  function displayResults(result) {
    document.getElementById('results-name').textContent = result.name + ' さんの診断結果';
    document.getElementById('past-era-icon').textContent = result.era.icon;
    document.getElementById('past-era').textContent = result.era.name + '（' + result.era.period + '）';
    document.getElementById('past-occupation').textContent = result.occupation;
    document.getElementById('past-trait').textContent = result.trait;
    document.getElementById('past-story').textContent = result.pastStory;
    document.getElementById('future-icon').textContent = result.future.icon;
    document.getElementById('future-type').textContent = result.future.name;
    document.getElementById('future-ability').textContent = '\u2728 ' + result.ability;
    document.getElementById('future-destiny').textContent = result.destiny;
    document.getElementById('future-story').textContent = result.futureStory;
    document.getElementById('score-value').textContent = result.score + '%';

    // Show results
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Animate score bar
    setTimeout(() => {
      document.getElementById('score-fill').style.width = result.score + '%';
    }, 800);
  }

  // ---- Loading Sequence ----
  const LOADING_MESSAGES = [
    '\u{1F52E} \u9B42\u306E\u8A18\u61B6\u306B\u30A2\u30AF\u30BB\u30B9\u3057\u3066\u3044\u307E\u3059...',
    '\u{1F30C} \u524D\u4E16\u306E\u8A18\u61B6\u3092\u8AAD\u307F\u53D6\u3063\u3066\u3044\u307E\u3059...',
    '\u2728 \u904B\u547D\u306E\u7CF8\u3092\u305F\u3069\u3063\u3066\u3044\u307E\u3059...',
    '\u{1F320} \u6765\u4E16\u306E\u59FF\u3092\u6620\u3057\u51FA\u3057\u3066\u3044\u307E\u3059...',
    '\u{1F4AB} \u8A3A\u65AD\u7D50\u679C\u3092\u307E\u3068\u3081\u3066\u3044\u307E\u3059...'
  ];

  function showLoading(callback) {
    const overlay = document.getElementById('loading-overlay');
    const textEl = document.getElementById('loading-text');
    const barFill = document.getElementById('loading-bar-fill');
    overlay.style.display = 'flex';
    barFill.style.width = '0%';

    let step = 0;
    const totalSteps = LOADING_MESSAGES.length;
    const interval = 700;

    function next() {
      if (step < totalSteps) {
        textEl.textContent = LOADING_MESSAGES[step];
        barFill.style.width = ((step + 1) / totalSteps * 100) + '%';
        step++;
        setTimeout(next, interval);
      } else {
        setTimeout(() => {
          overlay.style.display = 'none';
          callback();
        }, 400);
      }
    }
    next();
  }

  // ---- Canvas Image Generation ----
  function generateResultImage(result) {
    const canvas = document.getElementById('result-canvas');
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#0a0a1a');
    bgGrad.addColorStop(0.4, '#1a0e33');
    bgGrad.addColorStop(0.7, '#0e1a33');
    bgGrad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 150; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * H;
      const sr = Math.random() * 2;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,200,255,' + (Math.random() * 0.5 + 0.2) + ')';
      ctx.fill();
    }

    // Decorative circles
    ctx.beginPath();
    ctx.arc(W * 0.2, H * 0.15, 200, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(139, 92, 246, 0.06)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W * 0.8, H * 0.7, 250, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
    ctx.fill();

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = '700 64px "Zen Old Mincho", serif';
    ctx.fillText('\u524D\u4E16&\u6765\u4E16\u8A3A\u65AD', W / 2, 130);

    // Divider
    const divGrad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
    divGrad.addColorStop(0, 'rgba(255,215,0,0)');
    divGrad.addColorStop(0.5, 'rgba(255,215,0,0.6)');
    divGrad.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.15, 170);
    ctx.lineTo(W * 0.85, 170);
    ctx.stroke();

    // User name
    ctx.fillStyle = '#f0e6ff';
    ctx.font = '700 48px "Noto Sans JP", sans-serif';
    ctx.fillText(result.name + ' \u3055\u3093', W / 2, 250);

    // Past life section
    const pastY = 330;
    // Section bg
    ctx.fillStyle = 'rgba(45, 21, 78, 0.4)';
    roundRect(ctx, 60, pastY - 20, W - 120, 520, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.lineWidth = 1;
    roundRect(ctx, 60, pastY - 20, W - 120, 520, 24);
    ctx.stroke();

    ctx.fillStyle = '#a89cc8';
    ctx.font = '500 32px "Noto Sans JP", sans-serif';
    ctx.fillText('\u{1F3EF} \u524D\u4E16', W / 2, pastY + 35);

    ctx.fillStyle = '#ffd700';
    ctx.font = '900 52px "Zen Old Mincho", serif';
    ctx.fillText(result.era.name, W / 2, pastY + 110);

    ctx.fillStyle = '#f0e6ff';
    ctx.font = '700 42px "Noto Sans JP", sans-serif';
    ctx.fillText(result.occupation, W / 2, pastY + 180);

    ctx.fillStyle = '#22d3ee';
    ctx.font = '500 30px "Noto Sans JP", sans-serif';
    ctx.fillText('\u300C' + result.trait + '\u300D', W / 2, pastY + 240);

    // Past story (wrapped)
    ctx.fillStyle = '#c4b5e0';
    ctx.font = '400 26px "Noto Sans JP", sans-serif';
    wrapText(ctx, result.pastStory, W / 2, pastY + 310, W - 180, 40);

    // Future life section
    const futY = 900;
    ctx.fillStyle = 'rgba(14, 26, 62, 0.4)';
    roundRect(ctx, 60, futY - 20, W - 120, 560, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.lineWidth = 1;
    roundRect(ctx, 60, futY - 20, W - 120, 560, 24);
    ctx.stroke();

    ctx.fillStyle = '#a89cc8';
    ctx.font = '500 32px "Noto Sans JP", sans-serif';
    ctx.fillText('\u{1F320} \u6765\u4E16', W / 2, futY + 35);

    ctx.fillStyle = '#ffd700';
    ctx.font = '900 52px "Zen Old Mincho", serif';
    ctx.fillText(result.future.name, W / 2, futY + 110);

    ctx.fillStyle = '#22d3ee';
    ctx.font = '700 34px "Noto Sans JP", sans-serif';
    ctx.fillText('\u2728 ' + result.ability, W / 2, futY + 180);

    ctx.fillStyle = '#e0d0ff';
    ctx.font = '500 28px "Noto Sans JP", sans-serif';
    wrapText(ctx, result.destiny, W / 2, futY + 240, W - 180, 38);

    ctx.fillStyle = '#c4b5e0';
    ctx.font = '400 26px "Noto Sans JP", sans-serif';
    wrapText(ctx, result.futureStory, W / 2, futY + 340, W - 180, 40);

    // Soul score
    const scoreY = 1530;
    ctx.fillStyle = '#a89cc8';
    ctx.font = '500 28px "Noto Sans JP", sans-serif';
    ctx.fillText('\u9B42\u306E\u6210\u719F\u5EA6', W / 2, scoreY);

    // Score bar bg
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, 200, scoreY + 20, W - 400, 16, 8);
    ctx.fill();

    // Score bar fill
    const scoreGrad = ctx.createLinearGradient(200, 0, 200 + (W - 400) * result.score / 100, 0);
    scoreGrad.addColorStop(0, '#8b5cf6');
    scoreGrad.addColorStop(0.5, '#ffd700');
    scoreGrad.addColorStop(1, '#ec4899');
    ctx.fillStyle = scoreGrad;
    roundRect(ctx, 200, scoreY + 20, (W - 400) * result.score / 100, 16, 8);
    ctx.fill();

    ctx.fillStyle = '#ffd700';
    ctx.font = '900 56px "Zen Old Mincho", serif';
    ctx.fillText(result.score + '%', W / 2, scoreY + 100);

    // Divider
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.2, 1680);
    ctx.lineTo(W * 0.8, 1680);
    ctx.stroke();

    // Hashtag
    ctx.fillStyle = '#8b5cf6';
    ctx.font = '500 28px "Noto Sans JP", sans-serif';
    ctx.fillText('#\u524D\u4E16\u6765\u4E16\u8A3A\u65AD', W / 2, 1730);

    // Watermark
    ctx.fillStyle = 'rgba(168, 156, 200, 0.5)';
    ctx.font = '400 24px "Noto Sans JP", sans-serif';
    ctx.fillText('richend0913.github.io/zense-shindan/', W / 2, 1790);

    // Bottom decorative line
    ctx.strokeStyle = divGrad;
    ctx.beginPath();
    ctx.moveTo(W * 0.25, 1830);
    ctx.lineTo(W * 0.75, 1830);
    ctx.stroke();

    return canvas;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = text.split('');
    let line = '';
    let lineY = y;
    for (let i = 0; i < chars.length; i++) {
      const testLine = line + chars[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line.length > 0) {
        ctx.fillText(line, x, lineY);
        line = chars[i];
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line, x, lineY);
  }

  // ---- Share Functions ----
  function shareOnX(result) {
    const text = '\u{1F52E}\u524D\u4E16&\u6765\u4E16\u8A3A\u65AD\u306E\u7D50\u679C\u{1F52E}\n\n' +
      '\u79C1\u306E\u524D\u4E16\u306F' + result.era.name + '\u306E\u300C' + result.occupation + '\u300D\uFF01\n' +
      '\u6765\u4E16\u306F\u300C' + result.future.name + '\u300D\u306B\u8EE2\u751F\u{1F320}\n' +
      '\u9B42\u306E\u6210\u719F\u5EA6: ' + result.score + '%\n\n' +
      '\u3042\u306A\u305F\u3082\u8A3A\u65AD\u3057\u3066\u307F\u3066\uFF01\n' +
      '#\u524D\u4E16\u6765\u4E16\u8A3A\u65AD';
    const url = 'https://richend0913.github.io/zense-shindan/';
    window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url), '_blank');
  }

  function shareOnLINE(result) {
    const text = '\u{1F52E}\u524D\u4E16&\u6765\u4E16\u8A3A\u65AD\u306E\u7D50\u679C\u{1F52E}\n' +
      '\u79C1\u306E\u524D\u4E16\u306F' + result.era.name + '\u306E\u300C' + result.occupation + '\u300D\uFF01\n' +
      '\u6765\u4E16\u306F\u300C' + result.future.name + '\u300D\u306B\u8EE2\u751F\u{1F320}\n' +
      '\u3042\u306A\u305F\u3082\u8A3A\u65AD\u3057\u3066\u307F\u3066\uFF01\nhttps://richend0913.github.io/zense-shindan/';
    window.open('https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent('https://richend0913.github.io/zense-shindan/') + '&text=' + encodeURIComponent(text), '_blank');
  }

  function saveImage() {
    const canvas = document.getElementById('result-canvas');
    const link = document.createElement('a');
    link.download = '\u524D\u4E16\u6765\u4E16\u8A3A\u65AD_\u7D50\u679C.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // ---- Event Handlers ----
  let currentResult = null;

  function init() {
    initStars();

    const form = document.getElementById('shindan-form');
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('user-name').value.trim();
      const birthday = document.getElementById('user-birthday').value;
      if (!name || !birthday) return;

      // Button loading state
      const btn = document.getElementById('btn-diagnose');
      btn.querySelector('.btn-text').style.display = 'none';
      btn.querySelector('.btn-loading').style.display = 'inline-flex';
      btn.disabled = true;

      // Reset results
      document.getElementById('results').style.display = 'none';
      document.getElementById('score-fill').style.width = '0%';

      // Run diagnosis
      currentResult = diagnose(name, birthday);

      // Show loading then results
      showLoading(function() {
        displayResults(currentResult);
        generateResultImage(currentResult);

        // Reset button
        btn.querySelector('.btn-text').style.display = 'inline-flex';
        btn.querySelector('.btn-loading').style.display = 'none';
        btn.disabled = false;
      });
    });

    // Share buttons
    document.getElementById('btn-share-x').addEventListener('click', function() {
      if (currentResult) shareOnX(currentResult);
    });
    document.getElementById('btn-share-line').addEventListener('click', function() {
      if (currentResult) shareOnLINE(currentResult);
    });
    document.getElementById('btn-save-image').addEventListener('click', function() {
      if (currentResult) saveImage();
    });

    // Retry button
    document.getElementById('btn-retry').addEventListener('click', function() {
      document.getElementById('results').style.display = 'none';
      document.getElementById('user-name').value = '';
      document.getElementById('user-name').focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
