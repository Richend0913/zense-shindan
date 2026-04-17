// ========================================
// Spiritual Diagnosis App (5 Types)
// ========================================

(function() {
  'use strict';

  var currentType = 'pastlife';
  var currentResult = null;

  // ---- Stars Background ----
  function initStars() {
    var canvas = document.getElementById('stars-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var stars = [];
    var w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function createStars() {
      stars = [];
      var count = Math.floor((w * h) / 4000);
      for (var i = 0; i < count; i++) {
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
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.alpha += s.speed;
        var a = (Math.sin(s.alpha) + 1) / 2 * 0.8 + 0.1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 200, 255, ' + a + ')';
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    resize();
    createStars();
    draw();
    window.addEventListener('resize', function() { resize(); createStars(); });
  }

  // ---- DJB2 Hash ----
  function djb2Hash(str) {
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return hash >>> 0;
  }

  function multiHash(name, birthday, prefix) {
    prefix = prefix || '';
    var base = prefix + name + '|' + birthday;
    return {
      h1: djb2Hash(base),
      h2: djb2Hash(base + '#2'),
      h3: djb2Hash(base + '#3'),
      h4: djb2Hash(base + '#4'),
      h5: djb2Hash(base + '#5'),
      h6: djb2Hash(base + '#6'),
      h7: djb2Hash(base + '#7'),
      h8: djb2Hash(base + '#8'),
      h9: djb2Hash(base + '#9'),
      h10: djb2Hash(base + '#10')
    };
  }

  // ---- Diagnosis Counter ----
  function initCounter() {
    var SEED = 12847;
    var key = 'zense_shindan_count';
    var count = parseInt(localStorage.getItem(key)) || SEED;
    updateCounterDisplay(count);
  }

  function incrementCounter() {
    var SEED = 12847;
    var key = 'zense_shindan_count';
    var count = parseInt(localStorage.getItem(key)) || SEED;
    count++;
    localStorage.setItem(key, count);
    updateCounterDisplay(count);
  }

  function updateCounterDisplay(count) {
    var el = document.getElementById('counter-number');
    if (el) el.textContent = count.toLocaleString();
  }

  // ---- Past Life Diagnosis (original) ----
  function diagnosePastLife(name, birthday) {
    var hashes = multiHash(name, birthday);
    var eraIdx = hashes.h1 % ERAS.length;
    var era = ERAS[eraIdx];
    var occIdx = hashes.h2 % era.occupations.length;
    var occupation = era.occupations[occIdx];
    var traitIdx = hashes.h4 % PERSONALITY_TRAITS.length;
    var trait = PERSONALITY_TRAITS[traitIdx];
    var futureIdx = hashes.h3 % FUTURE_TYPES.length;
    var future = FUTURE_TYPES[futureIdx];
    var abilityIdx = hashes.h5 % future.abilities.length;
    var ability = future.abilities[abilityIdx];
    var destinyIdx = hashes.h6 % DESTINY_DESCRIPTIONS.length;
    var destiny = DESTINY_DESCRIPTIONS[destinyIdx];
    var pastStoryIdx = hashes.h8 % STORY_TEMPLATES_PAST.length;
    var futureStoryIdx = hashes.h9 % STORY_TEMPLATES_FUTURE.length;
    var pastStory = STORY_TEMPLATES_PAST[pastStoryIdx]
      .replace(/{era}/g, era.name).replace(/{occupation}/g, occupation).replace(/{trait}/g, trait);
    var futureStory = STORY_TEMPLATES_FUTURE[futureStoryIdx]
      .replace(/{type}/g, future.name).replace(/{ability}/g, ability).replace(/{destiny}/g, destiny);
    var score = 60 + (hashes.h7 % 40);

    return {
      diagType: 'pastlife', name: name, birthday: birthday,
      era: era, occupation: occupation, trait: trait, pastStory: pastStory,
      future: future, ability: ability, destiny: destiny, futureStory: futureStory, score: score
    };
  }

  // ---- Compatibility Diagnosis ----
  function diagnoseCompatibility(name1, birthday1, name2, birthday2) {
    var combined = name1 + '|' + birthday1 + '|' + name2 + '|' + birthday2;
    var reversed = name2 + '|' + birthday2 + '|' + name1 + '|' + birthday1;
    // Make it symmetric
    var key = combined < reversed ? combined : reversed;
    var hashes = multiHash(key, '', 'compat_');

    var percentage = hashes.h1 % 101;
    var relType = null;
    for (var i = 0; i < COMPAT_RELATIONSHIP_TYPES.length; i++) {
      var rt = COMPAT_RELATIONSHIP_TYPES[i];
      if (percentage >= rt.min && percentage <= rt.max) { relType = rt; break; }
    }

    var pastIdx = hashes.h2 % COMPAT_PAST_CONNECTIONS.length;
    var adviceIdx = hashes.h3 % COMPAT_ADVICE_LIST.length;

    // Sub-meters
    var loveMeter = 20 + (hashes.h4 % 81);
    var friendMeter = 20 + (hashes.h5 % 81);
    var workMeter = 20 + (hashes.h6 % 81);
    var fateMeter = 20 + (hashes.h7 % 81);

    return {
      diagType: 'compatibility',
      name1: name1, name2: name2,
      percentage: percentage,
      relType: relType,
      pastConnection: COMPAT_PAST_CONNECTIONS[pastIdx],
      advice: COMPAT_ADVICE_LIST[adviceIdx],
      meters: {
        love: loveMeter,
        friend: friendMeter,
        work: workMeter,
        fate: fateMeter
      }
    };
  }

  // ---- Daily Fortune ----
  function diagnoseFortune(name, birthday) {
    var today = new Date();
    var dateStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var hashes = multiHash(name, birthday, 'fortune_' + dateStr + '_');

    var luckScore = 1 + (hashes.h1 % 5); // 1-5
    var colorIdx = hashes.h2 % FORTUNE_LUCKY_COLORS.length;
    var luckyNumber = 1 + (hashes.h3 % 99);
    var actionIdx = hashes.h4 % FORTUNE_ACTIONS.length;
    var adviceIdx = hashes.h5 % FORTUNE_ADVICE_TEXTS.length;

    var stars = '';
    for (var i = 0; i < 5; i++) {
      stars += i < luckScore ? '\u2605' : '\u2606';
    }

    return {
      diagType: 'fortune',
      name: name,
      luckScore: luckScore,
      stars: stars,
      luckyColor: FORTUNE_LUCKY_COLORS[colorIdx],
      luckyNumber: luckyNumber,
      luckyAction: FORTUNE_ACTIONS[actionIdx],
      advice: FORTUNE_ADVICE_TEXTS[adviceIdx],
      date: dateStr
    };
  }

  // ---- Guardian Spirit ----
  function diagnoseGuardian(name, birthday) {
    var hashes = multiHash(name, birthday, 'guardian_');
    var spiritIdx = hashes.h1 % GUARDIAN_SPIRITS.length;
    var spirit = GUARDIAN_SPIRITS[spiritIdx];
    var protectionLevel = 50 + (hashes.h2 % 51); // 50-100

    return {
      diagType: 'guardian',
      name: name,
      spirit: spirit,
      protectionLevel: protectionLevel
    };
  }

  // ---- Isekai Reincarnation ----
  function diagnoseIsekai(name, birthday) {
    var hashes = multiHash(name, birthday, 'isekai_');
    var worldIdx = hashes.h1 % ISEKAI_WORLDS.length;
    var world = ISEKAI_WORLDS[worldIdx];
    var classIdx = hashes.h2 % ISEKAI_CLASSES.length;
    var charClass = ISEKAI_CLASSES[classIdx];
    var skillIdx = hashes.h3 % ISEKAI_SKILLS.length;
    var skill = ISEKAI_SKILLS[skillIdx];

    var atk = 30 + (hashes.h4 % 71);
    var def = 30 + (hashes.h5 % 71);
    var intel = 30 + (hashes.h6 % 71);
    var spd = 30 + (hashes.h7 % 71);

    var synopsisIdx = hashes.h8 % ISEKAI_SYNOPSIS_TEMPLATES.length;
    var synopsis = ISEKAI_SYNOPSIS_TEMPLATES[synopsisIdx]
      .replace(/{world}/g, world.name)
      .replace(/{class}/g, charClass)
      .replace(/{skill}/g, skill);

    return {
      diagType: 'isekai',
      name: name,
      world: world,
      charClass: charClass,
      skill: skill,
      stats: { ATK: atk, DEF: def, INT: intel, SPD: spd },
      synopsis: synopsis
    };
  }

  // ---- Display Functions ----
  function hideAllResults() {
    var ids = ['results', 'results-compat', 'results-fortune', 'results-guardian', 'results-isekai'];
    for (var i = 0; i < ids.length; i++) {
      document.getElementById(ids[i]).style.display = 'none';
    }
  }

  function displayPastLifeResults(result) {
    document.getElementById('results-name').textContent = result.name + ' \u3055\u3093\u306E\u8A3A\u65AD\u7D50\u679C';
    document.getElementById('past-era-icon').textContent = result.era.icon;
    document.getElementById('past-era').textContent = result.era.name + '\uFF08' + result.era.period + '\uFF09';
    document.getElementById('past-occupation').textContent = result.occupation;
    document.getElementById('past-trait').textContent = result.trait;
    document.getElementById('past-story').textContent = result.pastStory;
    document.getElementById('future-icon').textContent = result.future.icon;
    document.getElementById('future-type').textContent = result.future.name;
    document.getElementById('future-ability').textContent = '\u2728 ' + result.ability;
    document.getElementById('future-destiny').textContent = result.destiny;
    document.getElementById('future-story').textContent = result.futureStory;
    document.getElementById('score-value').textContent = result.score + '%';
    document.getElementById('score-fill').style.width = '0%';
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function() {
      document.getElementById('score-fill').style.width = result.score + '%';
    }, 800);
  }

  function displayCompatResults(result) {
    document.getElementById('compat-results-name').textContent = result.name1 + ' \u00D7 ' + result.name2;
    document.getElementById('compat-percentage').textContent = result.percentage;
    document.getElementById('compat-type').textContent = result.relType.type;
    document.getElementById('compat-type').style.color = result.relType.color;
    document.getElementById('compat-past-relation').textContent = result.relType.type;
    document.getElementById('compat-past-story').textContent = '\u524D\u4E16\u3067\u4E8C\u4EBA\u306F' + result.pastConnection + '\u3002\u305D\u306E\u7D46\u306F\u4ECA\u4E16\u3067\u3082\u7D9A\u3044\u3066\u3044\u307E\u3059\u3002' + result.relType.desc;
    document.getElementById('compat-advice').textContent = result.advice;

    // Meters
    var metersEl = document.getElementById('compat-meters');
    metersEl.innerHTML = '';
    var labels = COMPAT_METERS_LABELS;
    var values = [result.meters.love, result.meters.friend, result.meters.work, result.meters.fate];
    var colors = ['#ec4899', '#22d3ee', '#f59e0b', '#8b5cf6'];
    for (var i = 0; i < labels.length; i++) {
      var row = document.createElement('div');
      row.className = 'compat-meter-row';
      row.innerHTML = '<span class="compat-meter-label">' + labels[i] + '</span>' +
        '<div class="compat-meter-bar"><div class="compat-meter-fill" style="width:0%;background:' + colors[i] + ';" data-width="' + values[i] + '%"></div></div>' +
        '<span class="compat-meter-val">' + values[i] + '%</span>';
      metersEl.appendChild(row);
    }

    document.getElementById('results-compat').style.display = 'block';
    document.getElementById('results-compat').scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Animate meters
    setTimeout(function() {
      var fills = metersEl.querySelectorAll('.compat-meter-fill');
      for (var j = 0; j < fills.length; j++) {
        fills[j].style.width = fills[j].getAttribute('data-width');
      }
    }, 800);
  }

  function displayFortuneResults(result) {
    document.getElementById('fortune-results-name').textContent = result.name + ' \u3055\u3093\u306E\u4ECA\u65E5\u306E\u904B\u52E2';
    document.getElementById('fortune-stars').textContent = result.stars;

    var scoreTexts = ['', '\u8981\u6CE8\u610F\u306E\u4E00\u65E5', '\u5E73\u7A4F\u306A\u4E00\u65E5', '\u307E\u305A\u307E\u305A\u306E\u904B\u52E2', '\u597D\u8ABF\u306A\u4E00\u65E5', '\u6700\u9AD8\u306E\u4E00\u65E5\uFF01'];
    document.getElementById('fortune-score-text').textContent = scoreTexts[result.luckScore];

    var colorEl = document.getElementById('fortune-color');
    colorEl.textContent = result.luckyColor.name;
    colorEl.style.color = result.luckyColor.color;
    document.getElementById('fortune-number').textContent = result.luckyNumber;
    document.getElementById('fortune-action').textContent = result.luckyAction;
    document.getElementById('fortune-advice').textContent = result.advice;

    document.getElementById('results-fortune').style.display = 'block';
    document.getElementById('results-fortune').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function displayGuardianResults(result) {
    var s = result.spirit;
    document.getElementById('guardian-results-name').textContent = result.name + ' \u3055\u3093\u306E\u5B88\u8B77\u970A';
    document.getElementById('guardian-icon').textContent = s.icon;
    document.getElementById('guardian-type').textContent = s.type;
    document.getElementById('guardian-spirit-name').textContent = s.name;
    document.getElementById('guardian-power').textContent = s.power;
    document.getElementById('guardian-message').textContent = s.desc;
    document.getElementById('guardian-advice').textContent = s.advice;
    document.getElementById('guardian-score-value').textContent = result.protectionLevel + '%';
    document.getElementById('guardian-score-fill').style.width = '0%';

    document.getElementById('results-guardian').style.display = 'block';
    document.getElementById('results-guardian').scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(function() {
      document.getElementById('guardian-score-fill').style.width = result.protectionLevel + '%';
    }, 800);
  }

  function displayIsekaiResults(result) {
    document.getElementById('isekai-results-name').textContent = result.name + ' \u3055\u3093\u306E\u8EE2\u751F\u5148';
    document.getElementById('isekai-world-icon').textContent = result.world.icon;
    document.getElementById('isekai-world-name').textContent = result.world.name;
    document.getElementById('isekai-class').textContent = result.charClass;
    document.getElementById('isekai-skill').textContent = result.skill;
    document.getElementById('isekai-synopsis').textContent = result.synopsis;

    // Stats bars
    var statsEl = document.getElementById('isekai-stat-bars');
    statsEl.innerHTML = '';
    var statKeys = ['ATK', 'DEF', 'INT', 'SPD'];
    var statLabels = ['ATK (\u653B\u6483)', 'DEF (\u9632\u5FA1)', 'INT (\u77E5\u529B)', 'SPD (\u901F\u5EA6)'];
    var statColors = ['#ef4444', '#3b82f6', '#a78bfa', '#22d3ee'];
    for (var i = 0; i < statKeys.length; i++) {
      var val = result.stats[statKeys[i]];
      var row = document.createElement('div');
      row.className = 'stat-bar-row';
      row.innerHTML = '<span class="stat-label">' + statLabels[i] + '</span>' +
        '<div class="stat-bar-track"><div class="stat-bar-fill" style="width:0%;background:' + statColors[i] + ';" data-width="' + val + '%"></div></div>' +
        '<span class="stat-value">' + val + '</span>';
      statsEl.appendChild(row);
    }

    document.getElementById('results-isekai').style.display = 'block';
    document.getElementById('results-isekai').scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(function() {
      var fills = statsEl.querySelectorAll('.stat-bar-fill');
      for (var j = 0; j < fills.length; j++) {
        fills[j].style.width = fills[j].getAttribute('data-width');
      }
    }, 800);
  }

  // ---- Loading Sequence ----
  var LOADING_MESSAGES_MAP = {
    pastlife: [
      '\uD83D\uDD2E \u9B42\u306E\u8A18\u61B6\u306B\u30A2\u30AF\u30BB\u30B9\u3057\u3066\u3044\u307E\u3059...',
      '\uD83C\uDF0C \u524D\u4E16\u306E\u8A18\u61B6\u3092\u8AAD\u307F\u53D6\u3063\u3066\u3044\u307E\u3059...',
      '\u2728 \u904B\u547D\u306E\u7CF8\u3092\u305F\u3069\u3063\u3066\u3044\u307E\u3059...',
      '\uD83C\uDF20 \u6765\u4E16\u306E\u59FF\u3092\u6620\u3057\u51FA\u3057\u3066\u3044\u307E\u3059...',
      '\uD83D\uDCAB \u8A3A\u65AD\u7D50\u679C\u3092\u307E\u3068\u3081\u3066\u3044\u307E\u3059...'
    ],
    compatibility: [
      '\uD83D\uDC95 \u4E8C\u4EBA\u306E\u7E01\u3092\u8AAD\u307F\u53D6\u3063\u3066\u3044\u307E\u3059...',
      '\uD83D\uDD2E \u524D\u4E16\u306E\u3064\u306A\u304C\u308A\u3092\u63A2\u3063\u3066\u3044\u307E\u3059...',
      '\u2728 \u9B42\u306E\u5171\u9CF4\u5EA6\u3092\u6E2C\u5B9A\u4E2D...',
      '\uD83C\uDF1F \u76F8\u6027\u30C7\u30FC\u30BF\u3092\u5206\u6790\u4E2D...',
      '\uD83D\uDCAB \u7D50\u679C\u3092\u307E\u3068\u3081\u3066\u3044\u307E\u3059...'
    ],
    fortune: [
      '\u2B50 \u661F\u306E\u914D\u7F6E\u3092\u8AAD\u307F\u53D6\u3063\u3066\u3044\u307E\u3059...',
      '\uD83C\uDF19 \u6708\u306E\u6E80\u3061\u6B20\u3051\u3092\u78BA\u8A8D\u4E2D...',
      '\u2728 \u4ECA\u65E5\u306E\u904B\u52E2\u3092\u5360\u3063\u3066\u3044\u307E\u3059...',
      '\uD83C\uDF1F \u30E9\u30C3\u30AD\u30FC\u30A2\u30A4\u30C6\u30E0\u3092\u7279\u5B9A\u4E2D...',
      '\uD83D\uDCAB \u7D50\u679C\u3092\u307E\u3068\u3081\u3066\u3044\u307E\u3059...'
    ],
    guardian: [
      '\uD83D\uDC7B \u970A\u754C\u3068\u4EA4\u4FE1\u3057\u3066\u3044\u307E\u3059...',
      '\uD83D\uDD2E \u5B88\u8B77\u970A\u3092\u63A2\u3057\u3066\u3044\u307E\u3059...',
      '\u2728 \u5B88\u8B77\u529B\u3092\u6E2C\u5B9A\u4E2D...',
      '\uD83D\uDCAC \u5B88\u8B77\u970A\u304B\u3089\u306E\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u53D7\u4FE1\u4E2D...',
      '\uD83D\uDCAB \u7D50\u679C\u3092\u307E\u3068\u3081\u3066\u3044\u307E\u3059...'
    ],
    isekai: [
      '\u2694 \u7570\u4E16\u754C\u306E\u6249\u3092\u958B\u3044\u3066\u3044\u307E\u3059...',
      '\uD83C\uDF0D \u8EE2\u751F\u5148\u306E\u4E16\u754C\u3092\u63A2\u7D22\u4E2D...',
      '\uD83D\uDCAA \u30B9\u30C6\u30FC\u30BF\u30B9\u3092\u7B97\u51FA\u4E2D...',
      '\uD83D\uDDE1 \u56FA\u6709\u30B9\u30AD\u30EB\u3092\u7279\u5B9A\u4E2D...',
      '\uD83D\uDCAB \u8EE2\u751F\u6E96\u5099\u5B8C\u4E86...'
    ]
  };

  function showLoading(type, callback) {
    var overlay = document.getElementById('loading-overlay');
    var textEl = document.getElementById('loading-text');
    var barFill = document.getElementById('loading-bar-fill');
    overlay.style.display = 'flex';
    barFill.style.width = '0%';

    var messages = LOADING_MESSAGES_MAP[type] || LOADING_MESSAGES_MAP.pastlife;
    var step = 0;
    var totalSteps = messages.length;
    var interval = 700;

    function next() {
      if (step < totalSteps) {
        textEl.textContent = messages[step];
        barFill.style.width = ((step + 1) / totalSteps * 100) + '%';
        step++;
        setTimeout(next, interval);
      } else {
        setTimeout(function() {
          overlay.style.display = 'none';
          callback();
        }, 400);
      }
    }
    next();
  }

  // ---- Canvas Image Generation ----
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
    var chars = text.split('');
    var line = '';
    var lineY = y;
    for (var i = 0; i < chars.length; i++) {
      var testLine = line + chars[i];
      var metrics = ctx.measureText(testLine);
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

  function drawCanvasBg(ctx, W, H) {
    var bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#0a0a1a');
    bgGrad.addColorStop(0.4, '#1a0e33');
    bgGrad.addColorStop(0.7, '#0e1a33');
    bgGrad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < 150; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,200,255,' + (Math.random() * 0.5 + 0.2) + ')';
      ctx.fill();
    }
  }

  function drawDivider(ctx, W, y) {
    var divGrad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
    divGrad.addColorStop(0, 'rgba(255,215,0,0)');
    divGrad.addColorStop(0.5, 'rgba(255,215,0,0.6)');
    divGrad.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.15, y);
    ctx.lineTo(W * 0.85, y);
    ctx.stroke();
  }

  function generateResultImage(result) {
    var canvas = document.getElementById('result-canvas');
    var W = 1080, H = 1920;
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    drawCanvasBg(ctx, W, H);
    ctx.textAlign = 'center';

    if (result.diagType === 'pastlife') {
      generatePastLifeImage(ctx, W, H, result);
    } else if (result.diagType === 'compatibility') {
      generateCompatImage(ctx, W, H, result);
    } else if (result.diagType === 'fortune') {
      generateFortuneImage(ctx, W, H, result);
    } else if (result.diagType === 'guardian') {
      generateGuardianImage(ctx, W, H, result);
    } else if (result.diagType === 'isekai') {
      generateIsekaiImage(ctx, W, H, result);
    }

    return canvas;
  }

  function generatePastLifeImage(ctx, W, H, result) {
    ctx.fillStyle = '#ffd700';
    ctx.font = '700 64px "Zen Old Mincho", serif';
    ctx.fillText('\u524D\u4E16&\u6765\u4E16\u8A3A\u65AD', W / 2, 130);
    drawDivider(ctx, W, 170);
    ctx.fillStyle = '#f0e6ff';
    ctx.font = '700 48px "Noto Sans JP", sans-serif';
    ctx.fillText(result.name + ' \u3055\u3093', W / 2, 250);
    // Past
    var pastY = 330;
    ctx.fillStyle = 'rgba(45, 21, 78, 0.4)';
    roundRect(ctx, 60, pastY - 20, W - 120, 520, 24); ctx.fill();
    ctx.fillStyle = '#a89cc8'; ctx.font = '500 32px "Noto Sans JP", sans-serif';
    ctx.fillText('\uD83C\uDFEF \u524D\u4E16', W / 2, pastY + 35);
    ctx.fillStyle = '#ffd700'; ctx.font = '900 52px "Zen Old Mincho", serif';
    ctx.fillText(result.era.name, W / 2, pastY + 110);
    ctx.fillStyle = '#f0e6ff'; ctx.font = '700 42px "Noto Sans JP", sans-serif';
    ctx.fillText(result.occupation, W / 2, pastY + 180);
    ctx.fillStyle = '#22d3ee'; ctx.font = '500 30px "Noto Sans JP", sans-serif';
    ctx.fillText('\u300C' + result.trait + '\u300D', W / 2, pastY + 240);
    ctx.fillStyle = '#c4b5e0'; ctx.font = '400 26px "Noto Sans JP", sans-serif';
    wrapText(ctx, result.pastStory, W / 2, pastY + 310, W - 180, 40);
    // Future
    var futY = 900;
    ctx.fillStyle = 'rgba(14, 26, 62, 0.4)';
    roundRect(ctx, 60, futY - 20, W - 120, 560, 24); ctx.fill();
    ctx.fillStyle = '#a89cc8'; ctx.font = '500 32px "Noto Sans JP", sans-serif';
    ctx.fillText('\uD83C\uDF20 \u6765\u4E16', W / 2, futY + 35);
    ctx.fillStyle = '#ffd700'; ctx.font = '900 52px "Zen Old Mincho", serif';
    ctx.fillText(result.future.name, W / 2, futY + 110);
    ctx.fillStyle = '#22d3ee'; ctx.font = '700 34px "Noto Sans JP", sans-serif';
    ctx.fillText('\u2728 ' + result.ability, W / 2, futY + 180);
    ctx.fillStyle = '#c4b5e0'; ctx.font = '400 26px "Noto Sans JP", sans-serif';
    wrapText(ctx, result.futureStory, W / 2, futY + 280, W - 180, 40);
    // Score
    ctx.fillStyle = '#ffd700'; ctx.font = '900 56px "Zen Old Mincho", serif';
    ctx.fillText('\u9B42\u306E\u6210\u719F\u5EA6 ' + result.score + '%', W / 2, 1600);
    drawDivider(ctx, W, 1680);
    ctx.fillStyle = '#8b5cf6'; ctx.font = '500 28px "Noto Sans JP", sans-serif';
    ctx.fillText('#\u524D\u4E16\u6765\u4E16\u8A3A\u65AD', W / 2, 1730);
    ctx.fillStyle = 'rgba(168, 156, 200, 0.5)'; ctx.font = '400 24px "Noto Sans JP", sans-serif';
    ctx.fillText('richend0913.github.io/zense-shindan/', W / 2, 1790);
  }

  function generateCompatImage(ctx, W, H, result) {
    ctx.fillStyle = '#ffd700'; ctx.font = '700 64px "Zen Old Mincho", serif';
    ctx.fillText('\u76F8\u6027\u8A3A\u65AD', W / 2, 130);
    drawDivider(ctx, W, 170);
    ctx.fillStyle = '#f0e6ff'; ctx.font = '700 44px "Noto Sans JP", sans-serif';
    ctx.fillText(result.name1 + ' \u00D7 ' + result.name2, W / 2, 250);
    ctx.fillStyle = result.relType.color; ctx.font = '900 120px "Zen Old Mincho", serif';
    ctx.fillText(result.percentage + '%', W / 2, 460);
    ctx.fillStyle = result.relType.color; ctx.font = '700 48px "Noto Sans JP", sans-serif';
    ctx.fillText(result.relType.type, W / 2, 540);
    ctx.fillStyle = '#c4b5e0'; ctx.font = '400 28px "Noto Sans JP", sans-serif';
    wrapText(ctx, '\u524D\u4E16\u3067\u4E8C\u4EBA\u306F' + result.pastConnection, W / 2, 650, W - 180, 42);
    drawDivider(ctx, W, 1680);
    ctx.fillStyle = '#ec4899'; ctx.font = '500 28px "Noto Sans JP", sans-serif';
    ctx.fillText('#\u76F8\u6027\u8A3A\u65AD', W / 2, 1730);
    ctx.fillStyle = 'rgba(168, 156, 200, 0.5)'; ctx.font = '400 24px "Noto Sans JP", sans-serif';
    ctx.fillText('richend0913.github.io/zense-shindan/', W / 2, 1790);
  }

  function generateFortuneImage(ctx, W, H, result) {
    ctx.fillStyle = '#ffd700'; ctx.font = '700 64px "Zen Old Mincho", serif';
    ctx.fillText('\u4ECA\u65E5\u306E\u904B\u52E2', W / 2, 130);
    drawDivider(ctx, W, 170);
    ctx.fillStyle = '#f0e6ff'; ctx.font = '700 44px "Noto Sans JP", sans-serif';
    ctx.fillText(result.name + ' \u3055\u3093', W / 2, 250);
    ctx.fillStyle = '#ffd700'; ctx.font = '900 80px "Noto Sans JP", sans-serif';
    ctx.fillText(result.stars, W / 2, 420);
    ctx.fillStyle = result.luckyColor.color; ctx.font = '700 36px "Noto Sans JP", sans-serif';
    ctx.fillText('\u30E9\u30C3\u30AD\u30FC\u30AB\u30E9\u30FC: ' + result.luckyColor.name, W / 2, 550);
    ctx.fillStyle = '#22d3ee'; ctx.font = '700 36px "Noto Sans JP", sans-serif';
    ctx.fillText('\u30E9\u30C3\u30AD\u30FC\u30CA\u30F3\u30D0\u30FC: ' + result.luckyNumber, W / 2, 630);
    ctx.fillStyle = '#c4b5e0'; ctx.font = '400 28px "Noto Sans JP", sans-serif';
    wrapText(ctx, result.advice, W / 2, 750, W - 180, 42);
    drawDivider(ctx, W, 1680);
    ctx.fillStyle = '#f59e0b'; ctx.font = '500 28px "Noto Sans JP", sans-serif';
    ctx.fillText('#\u4ECA\u65E5\u306E\u904B\u52E2', W / 2, 1730);
    ctx.fillStyle = 'rgba(168, 156, 200, 0.5)'; ctx.font = '400 24px "Noto Sans JP", sans-serif';
    ctx.fillText('richend0913.github.io/zense-shindan/', W / 2, 1790);
  }

  function generateGuardianImage(ctx, W, H, result) {
    var s = result.spirit;
    ctx.fillStyle = '#ffd700'; ctx.font = '700 64px "Zen Old Mincho", serif';
    ctx.fillText('\u5B88\u8B77\u970A\u8A3A\u65AD', W / 2, 130);
    drawDivider(ctx, W, 170);
    ctx.fillStyle = '#f0e6ff'; ctx.font = '700 44px "Noto Sans JP", sans-serif';
    ctx.fillText(result.name + ' \u3055\u3093', W / 2, 250);
    ctx.font = '120px sans-serif';
    ctx.fillText(s.icon, W / 2, 430);
    ctx.fillStyle = '#ffd700'; ctx.font = '900 48px "Zen Old Mincho", serif';
    ctx.fillText(s.type, W / 2, 520);
    ctx.fillStyle = '#22d3ee'; ctx.font = '700 36px "Noto Sans JP", sans-serif';
    ctx.fillText(s.name, W / 2, 590);
    ctx.fillStyle = '#c4b5e0'; ctx.font = '400 28px "Noto Sans JP", sans-serif';
    wrapText(ctx, s.desc, W / 2, 680, W - 180, 42);
    ctx.fillStyle = '#a89cc8'; ctx.font = '500 28px "Noto Sans JP", sans-serif';
    ctx.fillText('\u5B88\u8B77\u529B: ' + result.protectionLevel + '%', W / 2, 900);
    drawDivider(ctx, W, 1680);
    ctx.fillStyle = '#8b5cf6'; ctx.font = '500 28px "Noto Sans JP", sans-serif';
    ctx.fillText('#\u5B88\u8B77\u970A\u8A3A\u65AD', W / 2, 1730);
    ctx.fillStyle = 'rgba(168, 156, 200, 0.5)'; ctx.font = '400 24px "Noto Sans JP", sans-serif';
    ctx.fillText('richend0913.github.io/zense-shindan/', W / 2, 1790);
  }

  function generateIsekaiImage(ctx, W, H, result) {
    ctx.fillStyle = '#ffd700'; ctx.font = '700 64px "Zen Old Mincho", serif';
    ctx.fillText('\u7570\u4E16\u754C\u8EE2\u751F\u8A3A\u65AD', W / 2, 130);
    drawDivider(ctx, W, 170);
    ctx.fillStyle = '#f0e6ff'; ctx.font = '700 44px "Noto Sans JP", sans-serif';
    ctx.fillText(result.name + ' \u3055\u3093', W / 2, 250);
    ctx.fillStyle = '#ffd700'; ctx.font = '900 44px "Zen Old Mincho", serif';
    ctx.fillText(result.world.name, W / 2, 350);
    ctx.fillStyle = '#22d3ee'; ctx.font = '700 40px "Noto Sans JP", sans-serif';
    ctx.fillText('\u8077\u696D: ' + result.charClass, W / 2, 430);
    ctx.fillStyle = '#ec4899'; ctx.font = '600 32px "Noto Sans JP", sans-serif';
    ctx.fillText('\u56FA\u6709\u30B9\u30AD\u30EB: ' + result.skill, W / 2, 500);
    // Stats
    var statsY = 580;
    var statKeys = ['ATK', 'DEF', 'INT', 'SPD'];
    var statColors = ['#ef4444', '#3b82f6', '#a78bfa', '#22d3ee'];
    for (var i = 0; i < statKeys.length; i++) {
      var val = result.stats[statKeys[i]];
      var barY = statsY + i * 70;
      ctx.fillStyle = '#a89cc8'; ctx.font = '500 28px "Noto Sans JP", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(statKeys[i], 120, barY + 5);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      roundRect(ctx, 240, barY - 15, 600, 30, 8); ctx.fill();
      ctx.fillStyle = statColors[i];
      roundRect(ctx, 240, barY - 15, 600 * val / 100, 30, 8); ctx.fill();
      ctx.textAlign = 'right'; ctx.fillStyle = '#f0e6ff'; ctx.font = '700 28px "Noto Sans JP", sans-serif';
      ctx.fillText(val.toString(), 920, barY + 5);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c4b5e0'; ctx.font = '400 26px "Noto Sans JP", sans-serif';
    wrapText(ctx, result.synopsis, W / 2, 920, W - 180, 40);
    drawDivider(ctx, W, 1680);
    ctx.fillStyle = '#ef4444'; ctx.font = '500 28px "Noto Sans JP", sans-serif';
    ctx.fillText('#\u7570\u4E16\u754C\u8EE2\u751F\u8A3A\u65AD', W / 2, 1730);
    ctx.fillStyle = 'rgba(168, 156, 200, 0.5)'; ctx.font = '400 24px "Noto Sans JP", sans-serif';
    ctx.fillText('richend0913.github.io/zense-shindan/', W / 2, 1790);
  }

  // ---- Share Functions ----
  function getShareUrl() {
    return 'https://richend0913.github.io/zense-shindan/';
  }

  function shareOnX(text) {
    window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(getShareUrl()), '_blank');
  }

  function shareOnLINE(text) {
    window.open('https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(getShareUrl()) + '&text=' + encodeURIComponent(text), '_blank');
  }

  function saveImage() {
    var canvas = document.getElementById('result-canvas');
    var link = document.createElement('a');
    link.download = '\u8A3A\u65AD\u7D50\u679C.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function getShareText(result) {
    if (result.diagType === 'pastlife') {
      return '\uD83D\uDD2E\u524D\u4E16&\u6765\u4E16\u8A3A\u65AD\u306E\u7D50\u679C\uD83D\uDD2E\n\n' +
        '\u79C1\u306E\u524D\u4E16\u306F' + result.era.name + '\u306E\u300C' + result.occupation + '\u300D\uFF01\n' +
        '\u6765\u4E16\u306F\u300C' + result.future.name + '\u300D\u306B\u8EE2\u751F\uD83C\uDF20\n' +
        '\u9B42\u306E\u6210\u719F\u5EA6: ' + result.score + '%\n\n' +
        '\u3042\u306A\u305F\u3082\u8A3A\u65AD\u3057\u3066\u307F\u3066\uFF01\n#\u524D\u4E16\u6765\u4E16\u8A3A\u65AD';
    } else if (result.diagType === 'compatibility') {
      return '\uD83D\uDC95\u76F8\u6027\u8A3A\u65AD\u306E\u7D50\u679C\uD83D\uDC95\n\n' +
        result.name1 + '\u3068' + result.name2 + '\u306E\u76F8\u6027\u306F' + result.percentage + '%\uFF01\n' +
        '\u524D\u4E16\u3067\u306F' + result.pastConnection + '\n\n' +
        '\u3042\u306A\u305F\u3082\u8A3A\u65AD\u3057\u3066\u307F\u3066\uFF01\n#\u76F8\u6027\u8A3A\u65AD';
    } else if (result.diagType === 'fortune') {
      return '\u2B50\u4ECA\u65E5\u306E\u904B\u52E2\u2B50\n\n' +
        '\u4ECA\u65E5\u306E\u904B\u52E2\uFF1A' + result.stars + '\n' +
        '\u30E9\u30C3\u30AD\u30FC\u30AB\u30E9\u30FC\u306F' + result.luckyColor.name + '\n\n' +
        '\u3042\u306A\u305F\u3082\u5360\u3063\u3066\u307F\u3066\uFF01\n#\u4ECA\u65E5\u306E\u904B\u52E2';
    } else if (result.diagType === 'guardian') {
      return '\uD83D\uDC7B\u5B88\u8B77\u970A\u8A3A\u65AD\u306E\u7D50\u679C\uD83D\uDC7B\n\n' +
        '\u79C1\u306E\u5B88\u8B77\u970A\u306F\u300C' + result.spirit.type + '\u300D\uFF01\n' +
        result.spirit.name + '\u304C\u898B\u5B88\u3063\u3066\u304F\u308C\u3066\u3044\u307E\u3059\n\n' +
        '\u3042\u306A\u305F\u3082\u8A3A\u65AD\u3057\u3066\u307F\u3066\uFF01\n#\u5B88\u8B77\u970A\u8A3A\u65AD';
    } else if (result.diagType === 'isekai') {
      return '\u2694\u7570\u4E16\u754C\u8EE2\u751F\u8A3A\u65AD\u306E\u7D50\u679C\u2694\n\n' +
        '\u8EE2\u751F\u5148: ' + result.world.name + '\n' +
        '\u8077\u696D: ' + result.charClass + '\n' +
        '\u56FA\u6709\u30B9\u30AD\u30EB: ' + result.skill + '\n\n' +
        '\u3042\u306A\u305F\u3082\u8A3A\u65AD\u3057\u3066\u307F\u3066\uFF01\n#\u7570\u4E16\u754C\u8EE2\u751F\u8A3A\u65AD';
    }
    return '';
  }

  // ---- Navigation ----
  var TYPE_CONFIG = {
    pastlife: { icon: '\uD83D\uDD2E', title: '\u524D\u4E16&\u6765\u4E16', sub: '\u8A3A\u65AD', desc: '\u540D\u524D\u3068\u8A95\u751F\u65E5\u304B\u3089\u3001\u3042\u306A\u305F\u306E\u9B42\u306E\u7269\u8A9E\u3092\u7D10\u89E3\u304F', form: 'shindan-form' },
    compatibility: { icon: '\uD83D\uDC95', title: '\u76F8\u6027', sub: '\u8A3A\u65AD', desc: '\u4E8C\u4EBA\u306E\u9B42\u306E\u3064\u306A\u304C\u308A\u3092\u8AAD\u307F\u89E3\u304F', form: 'compat-form' },
    fortune: { icon: '\u2B50', title: '\u4ECA\u65E5\u306E\u904B\u52E2', sub: '', desc: '\u4ECA\u65E5\u306E\u904B\u52E2\u3068\u30E9\u30C3\u30AD\u30FC\u30A2\u30A4\u30C6\u30E0\u3092\u5360\u3046', form: 'fortune-form' },
    guardian: { icon: '\uD83D\uDC7B', title: '\u5B88\u8B77\u970A', sub: '\u8A3A\u65AD', desc: '\u3042\u306A\u305F\u3092\u898B\u5B88\u308B\u5B88\u8B77\u970A\u3092\u7279\u5B9A\u3059\u308B', form: 'guardian-form' },
    isekai: { icon: '\u2694', title: '\u7570\u4E16\u754C\u8EE2\u751F', sub: '\u8A3A\u65AD', desc: '\u3042\u306A\u305F\u306E\u8EE2\u751F\u5148\u3068\u30B9\u30C6\u30FC\u30BF\u30B9\u3092\u8A3A\u65AD', form: 'isekai-form' }
  };

  function switchType(type) {
    currentType = type;
    hideAllResults();
    var config = TYPE_CONFIG[type];

    // Update hero
    document.getElementById('hero-icon').innerHTML = config.icon;
    var titleLine = document.getElementById('title-line');
    if (config.sub) {
      titleLine.innerHTML = config.title;
    } else {
      titleLine.innerHTML = config.title;
    }
    document.getElementById('title-sub').textContent = config.sub || '';
    document.getElementById('hero-desc').textContent = config.desc;

    // Switch forms
    var formIds = ['shindan-form', 'compat-form', 'fortune-form', 'guardian-form', 'isekai-form'];
    for (var i = 0; i < formIds.length; i++) {
      document.getElementById(formIds[i]).style.display = formIds[i] === config.form ? 'flex' : 'none';
    }

    // Nav active state
    var navBtns = document.querySelectorAll('.nav-card');
    for (var j = 0; j < navBtns.length; j++) {
      if (navBtns[j].getAttribute('data-type') === type) {
        navBtns[j].classList.add('active');
      } else {
        navBtns[j].classList.remove('active');
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---- Button helpers ----
  function setButtonLoading(form, loading) {
    var btn = form.querySelector('.btn-diagnose');
    if (!btn) return;
    var text = btn.querySelector('.btn-text');
    var load = btn.querySelector('.btn-loading');
    if (loading) {
      text.style.display = 'none';
      load.style.display = 'inline-flex';
      btn.disabled = true;
    } else {
      text.style.display = 'inline-flex';
      load.style.display = 'none';
      btn.disabled = false;
    }
  }

  // ---- Init ----
  function init() {
    initStars();
    initCounter();

    // Nav cards
    var navBtns = document.querySelectorAll('.nav-card');
    for (var i = 0; i < navBtns.length; i++) {
      navBtns[i].addEventListener('click', function() {
        switchType(this.getAttribute('data-type'));
      });
    }

    // Footer links
    var footerLinks = document.querySelectorAll('.footer-link');
    for (var fi = 0; fi < footerLinks.length; fi++) {
      footerLinks[fi].addEventListener('click', function(e) {
        e.preventDefault();
        switchType(this.getAttribute('data-type'));
      });
    }

    // --- Past Life Form ---
    document.getElementById('shindan-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var name = document.getElementById('user-name').value.trim();
      var birthday = document.getElementById('user-birthday').value;
      if (!name || !birthday) return;
      setButtonLoading(this, true);
      hideAllResults();
      currentResult = diagnosePastLife(name, birthday);
      incrementCounter();
      var form = this;
      showLoading('pastlife', function() {
        displayPastLifeResults(currentResult);
        generateResultImage(currentResult);
        setButtonLoading(form, false);
      });
    });

    // --- Compatibility Form ---
    document.getElementById('compat-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var n1 = document.getElementById('compat-name1').value.trim();
      var b1 = document.getElementById('compat-birthday1').value;
      var n2 = document.getElementById('compat-name2').value.trim();
      var b2 = document.getElementById('compat-birthday2').value;
      if (!n1 || !b1 || !n2 || !b2) return;
      setButtonLoading(this, true);
      hideAllResults();
      currentResult = diagnoseCompatibility(n1, b1, n2, b2);
      incrementCounter();
      var form = this;
      showLoading('compatibility', function() {
        displayCompatResults(currentResult);
        generateResultImage(currentResult);
        setButtonLoading(form, false);
      });
    });

    // --- Fortune Form ---
    document.getElementById('fortune-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var name = document.getElementById('fortune-name').value.trim();
      var birthday = document.getElementById('fortune-birthday').value;
      if (!name || !birthday) return;
      setButtonLoading(this, true);
      hideAllResults();
      currentResult = diagnoseFortune(name, birthday);
      incrementCounter();
      var form = this;
      showLoading('fortune', function() {
        displayFortuneResults(currentResult);
        generateResultImage(currentResult);
        setButtonLoading(form, false);
      });
    });

    // --- Guardian Form ---
    document.getElementById('guardian-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var name = document.getElementById('guardian-name').value.trim();
      var birthday = document.getElementById('guardian-birthday').value;
      if (!name || !birthday) return;
      setButtonLoading(this, true);
      hideAllResults();
      currentResult = diagnoseGuardian(name, birthday);
      incrementCounter();
      var form = this;
      showLoading('guardian', function() {
        displayGuardianResults(currentResult);
        generateResultImage(currentResult);
        setButtonLoading(form, false);
      });
    });

    // --- Isekai Form ---
    document.getElementById('isekai-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var name = document.getElementById('isekai-name').value.trim();
      var birthday = document.getElementById('isekai-birthday').value;
      if (!name || !birthday) return;
      setButtonLoading(this, true);
      hideAllResults();
      currentResult = diagnoseIsekai(name, birthday);
      incrementCounter();
      var form = this;
      showLoading('isekai', function() {
        displayIsekaiResults(currentResult);
        generateResultImage(currentResult);
        setButtonLoading(form, false);
      });
    });

    // --- Share buttons (all types) ---
    var shareMap = [
      { x: 'btn-share-x', line: 'btn-share-line', save: 'btn-save-image' },
      { x: 'btn-share-x-compat', line: 'btn-share-line-compat', save: 'btn-save-image-compat' },
      { x: 'btn-share-x-fortune', line: 'btn-share-line-fortune', save: 'btn-save-image-fortune' },
      { x: 'btn-share-x-guardian', line: 'btn-share-line-guardian', save: 'btn-save-image-guardian' },
      { x: 'btn-share-x-isekai', line: 'btn-share-line-isekai', save: 'btn-save-image-isekai' }
    ];
    for (var si = 0; si < shareMap.length; si++) {
      (function(sm) {
        document.getElementById(sm.x).addEventListener('click', function() {
          if (currentResult) shareOnX(getShareText(currentResult));
        });
        document.getElementById(sm.line).addEventListener('click', function() {
          if (currentResult) shareOnLINE(getShareText(currentResult));
        });
        document.getElementById(sm.save).addEventListener('click', function() {
          if (currentResult) saveImage();
        });
      })(shareMap[si]);
    }

    // --- Retry buttons ---
    var retryIds = ['btn-retry', 'btn-retry-compat', 'btn-retry-fortune', 'btn-retry-guardian', 'btn-retry-isekai'];
    for (var ri = 0; ri < retryIds.length; ri++) {
      document.getElementById(retryIds[ri]).addEventListener('click', function() {
        hideAllResults();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
