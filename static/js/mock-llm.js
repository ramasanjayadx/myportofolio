// Mock LLM: berpikir lama, lalu menjawab dengan satu emoji. Tidak ada API yang dipanggil.
(function () {
  const app = document.querySelector('.llm-app');
  const log = document.getElementById('llm-log');
  const form = document.getElementById('llm-form');
  const input = document.getElementById('llm-input');
  if (!app || !log || !form || !input) return;

  const MODELS = {
    maple: 'Maple 8.5',
    pebble: 'Pebble 8',
    lumen: 'Lumen Pro 6.7',
    tango: 'Tango 8.5',
    quill: 'Quill 9.1',
  };

  const EMOJIS = ['🚀', '👌', '😂', '😘', '😜', '👍'];

  const THOUGHTS = [
    'Understanding the question',
    'Looking through relevant context',
    'Weighing a few possible answers',
    'Comparing different approaches',
    'Double-checking assumptions',
    'Outlining the answer',
    'Choosing the right words',
    'Trimming the answer down',
  ];
  const FINAL_THOUGHT = 'Summarizing everything into a well defined answer';

  // Sapaan singkat dijawab dengan teks yang wajar, bukan emoji
  const GREETINGS = {
    hi: 'Hello! How can I help you today?',
    hai: 'Halo, apa yang bisa saya bantu hari ini?',
  };
  const GREETING_THOUGHTS = ['Reading the greeting'];
  const GREETING_DURATION = 1200;

  // Effort menentukan jumlah langkah berpikir yang ditampilkan
  const EFFORTS = [
    { label: 'Low', steps: 3 },
    { label: 'Medium', steps: 4 },
    { label: 'High', steps: 5, recommended: true },
    { label: 'Extra High', steps: 6 },
    { label: 'Max', steps: 8 },
  ];

  // Lama berpikir berbanding lurus dengan effort: Low 4 detik sampai Max 20 detik
  const MAX_THINK_DURATION = 20000;
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DEFAULT_TITLE = 'New chat';

  // Ikon garis dengan stroke yang sama seperti ikon lain di toolbar
  const ICONS = {
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
    check: '<path d="M5 12.5 9.5 17 19 7"/>',
    like: '<path d="M7 11v9H4v-9h3Zm0 0 4-7a2 2 0 0 1 3 1.7V10h5a2 2 0 0 1 2 2.3l-1.2 6a2 2 0 0 1-2 1.7H7"/>',
    dislike: '<path d="M17 13V4h3v9h-3Zm0 0-4 7a2 2 0 0 1-3-1.7V14H5a2 2 0 0 1-2-2.3l1.2-6A2 2 0 0 1 6.2 4H17"/>',
    retry: '<path d="M20 12a8 8 0 1 1-2.34-5.66L20 8.5"/><path d="M20 3.5v5h-5"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
  };

  function icon(name) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</g></svg>`;
  }

  const sendButton = form.querySelector('.llm-send');
  const emptyState = document.getElementById('llm-empty');
  const titleEl = document.getElementById('llm-title');
  const newChatButton = document.getElementById('llm-new-chat');
  const jumpButton = document.getElementById('llm-jump');
  const announcer = document.getElementById('llm-announcer');
  const modelButton = document.getElementById('llm-model-button');
  const modelMenu = document.getElementById('llm-model-menu');
  const modelItems = [...modelMenu.querySelectorAll('[data-model]')];
  const menuItems = [...modelMenu.querySelectorAll('.llm-menu__item')];
  const effortButton = document.getElementById('llm-effort-button');
  const effortPanel = document.getElementById('llm-effort-panel');
  const effortRange = document.getElementById('llm-effort-range');
  const effortValue = document.getElementById('llm-effort-value');
  const effortMarks = document.getElementById('llm-effort-marks');
  const effortRecommended = document.getElementById('llm-effort-recommended');
  const status = document.getElementById('llm-status');

  let currentModel = 'maple';
  let effortIndex = 2;
  let generation = null;
  let stickToBottom = true;
  let lastEmoji = '';
  const CANCELLED = Symbol('cancelled');

  // Jeda yang bisa langsung dibatalkan saat pengguna menekan Stop
  function wait(ms, run) {
    return new Promise((resolve, reject) => {
      if (run.cancelled) return reject(CANCELLED);
      const timer = setTimeout(resolve, ms);
      run.onCancel = () => {
        clearTimeout(timer);
        reject(CANCELLED);
      };
    });
  }

  function cancelGeneration() {
    if (!generation) return;
    generation.cancelled = true;
    if (generation.onCancel) generation.onCancel();
  }

  function notify(title, message) {
    if (typeof showToast === 'function') showToast(title, message, 'normal');
  }

  function announce(message) {
    announcer.textContent = '';
    requestAnimationFrame(() => { announcer.textContent = message; });
  }

  // Logo model: kotak membulat polos, sengaja tidak meniru logo AI mana pun
  function createSpark() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'llm-spark');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<rect x="4" y="4" width="16" height="16" rx="5" fill="currentColor"/>';
    return svg;
  }

  // Auto-scroll hanya selama pengguna berada di dekat pesan terbaru
  function isNearBottom() {
    return log.scrollHeight - log.scrollTop - log.clientHeight < 48;
  }

  function updateJumpButton() {
    jumpButton.hidden = isNearBottom();
  }

  function followBottom() {
    if (stickToBottom) log.scrollTop = log.scrollHeight;
    updateJumpButton();
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Hindari emoji yang sama dua kali berturut-turut, terutama saat regenerate
  function pickEmoji() {
    const options = EMOJIS.filter(emoji => emoji !== lastEmoji);
    lastEmoji = options[Math.floor(Math.random() * options.length)];
    return lastEmoji;
  }

  function buildThoughts(count) {
    return [...shuffle(THOUGHTS).slice(0, count - 1), FINAL_THOUGHT];
  }

  // "Hi", "hai!", dan sejenisnya dianggap sama
  function findGreeting(question) {
    const key = question.trim().toLowerCase().replace(/[\s!.?,]+$/, '');
    return GREETINGS[key] || null;
  }

  function setBusy(busy) {
    app.classList.toggle('is-busy', busy);
    log.setAttribute('aria-busy', String(busy));
    status.classList.toggle('is-busy', busy);
    status.setAttribute('aria-label', busy ? 'Thinking' : 'Ready');
    app.querySelectorAll('.llm-chip, [data-idle-only]').forEach(element => { element.disabled = busy; });
    updateSendButton();
  }

  function updateSendButton() {
    const busy = Boolean(generation);
    sendButton.classList.toggle('is-stop', busy);
    sendButton.setAttribute('aria-label', busy ? 'Stop response' : 'Send message');
    sendButton.title = busy ? 'Stop (Esc)' : 'Send (Enter)';
    sendButton.disabled = !busy && !input.value.trim();
  }

  function autoResize(field = input) {
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }

  function createActions(actions) {
    const row = document.createElement('div');
    row.className = 'llm-actions';
    actions.forEach(({ action, label, toggle, idleOnly }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'llm-action';
      button.dataset.action = action;
      button.setAttribute('aria-label', label);
      button.title = label;
      if (toggle) button.setAttribute('aria-pressed', 'false');
      if (idleOnly) button.dataset.idleOnly = '';
      button.innerHTML = icon(action);
      row.appendChild(button);
    });
    return row;
  }

  function createUserTurn(text) {
    const turn = document.createElement('div');
    turn.className = 'llm-turn llm-turn--user';
    turn.dataset.text = text;

    const bubble = document.createElement('div');
    bubble.className = 'llm-bubble';
    // textContent supaya input pengguna tidak pernah dirender sebagai HTML
    bubble.textContent = text;

    turn.append(bubble, createActions([
      { action: 'copy', label: 'Copy message' },
      { action: 'edit', label: 'Edit message', idleOnly: true },
    ]));
    log.appendChild(turn);
    return turn;
  }

  function createBotTurn() {
    const turn = document.createElement('div');
    turn.className = 'llm-turn llm-turn--bot is-thinking';

    const avatar = document.createElement('span');
    avatar.className = 'llm-turn__avatar';
    avatar.appendChild(createSpark());

    const body = document.createElement('div');
    body.className = 'llm-turn__body';

    turn.append(avatar, body);
    turn.dataset.text = '';
    log.appendChild(turn);
    return { turn, body };
  }

  function thinkDuration(index) {
    return (MAX_THINK_DURATION * (index + 1)) / EFFORTS.length;
  }

  // Durasi total dibagi ke tiap langkah dengan variasi acak, tapi jumlahnya tetap
  function splitDuration(total, count) {
    const weights = Array.from({ length: count }, () => 0.7 + Math.random() * 0.6);
    const sum = weights.reduce((a, b) => a + b, 0);
    return weights.map(weight => (weight / sum) * total);
  }

  async function think(body, thoughts, duration, run) {
    const indicator = document.createElement('p');
    indicator.className = 'llm-thinking';
    body.appendChild(indicator);

    const startedAt = performance.now();
    const stepDurations = splitDuration(duration, thoughts.length);
    const seen = [];
    try {
      for (const [index, thought] of thoughts.entries()) {
        seen.push(thought);
        indicator.textContent = `${thought}...`;
        followBottom();
        await wait(stepDurations[index], run);
      }
    } finally {
      // Ganti indikator dengan ringkasan yang bisa dibuka, seperti AI sungguhan
      const seconds = Math.max(1, Math.round((performance.now() - startedAt) / 1000));
      const details = document.createElement('details');
      details.className = 'llm-thought';
      const summary = document.createElement('summary');
      summary.textContent = `Thought for ${seconds}s`;
      const steps = document.createElement('ol');
      seen.forEach(thought => {
        const step = document.createElement('li');
        step.textContent = thought;
        steps.appendChild(step);
      });
      details.append(summary, steps);
      indicator.replaceWith(details);
    }
  }

  async function respond(userTurn) {
    const run = { cancelled: false, onCancel: null };
    const modelName = MODELS[currentModel];
    const greeting = findGreeting(userTurn.dataset.text);
    const thoughts = greeting ? GREETING_THOUGHTS : buildThoughts(EFFORTS[effortIndex].steps);
    const duration = greeting ? GREETING_DURATION : thinkDuration(effortIndex);

    generation = run;
    setBusy(true);
    const { turn, body } = createBotTurn();
    followBottom();

    let stopped = false;
    try {
      await think(body, thoughts, duration, run);
      const answer = document.createElement('p');
      answer.className = greeting ? 'llm-answer' : 'llm-answer llm-answer--emoji';
      answer.textContent = greeting || pickEmoji();
      turn.dataset.text = answer.textContent;
      body.appendChild(answer);
    } catch (error) {
      if (error !== CANCELLED) throw error;
      stopped = true;
      const note = document.createElement('p');
      note.className = 'llm-note';
      note.textContent = 'Response stopped';
      body.appendChild(note);
    }

    turn.classList.remove('is-thinking');
    const actions = createActions([
      { action: 'copy', label: 'Copy response' },
      { action: 'like', label: 'Good response', toggle: true },
      { action: 'dislike', label: 'Bad response', toggle: true },
      { action: 'retry', label: 'Retry', idleOnly: true },
    ]);
    const modelLabel = document.createElement('span');
    modelLabel.className = 'llm-actions__model';
    modelLabel.textContent = modelName;
    actions.appendChild(modelLabel);
    body.appendChild(actions);
    followBottom();

    // Percakapan bisa sudah di-reset (New chat) sebelum baris ini berjalan
    if (generation === run) {
      generation = null;
      setBusy(false);
      announce(stopped ? 'Response stopped' : `${modelName} replied: ${turn.dataset.text}`);
    }
  }

  function removeAfter(node) {
    while (node.nextElementSibling) node.nextElementSibling.remove();
  }

  function setTitle(rawText) {
    const text = rawText.replace(/\s+/g, ' ').trim();
    titleEl.textContent = text || DEFAULT_TITLE;
    titleEl.classList.toggle('is-placeholder', !text);
    titleEl.title = text;
  }

  function send(question) {
    const text = question.trim();
    if (!text || generation) return;

    if (emptyState.isConnected) {
      emptyState.remove();
      setTitle(text);
      newChatButton.disabled = false;
    }
    const userTurn = createUserTurn(text);
    stickToBottom = true;
    respond(userTurn);
  }

  function resetChat() {
    cancelGeneration();
    generation = null;
    log.replaceChildren(emptyState);
    setTitle('');
    newChatButton.disabled = true;
    stickToBottom = true;
    setBusy(false);
    updateJumpButton();
    input.value = '';
    autoResize();
    input.focus();
  }

  // Aksi pesan
  async function copyText(text, button) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const scratch = document.createElement('textarea');
      scratch.value = text;
      scratch.setAttribute('readonly', '');
      scratch.style.position = 'fixed';
      scratch.style.opacity = '0';
      document.body.appendChild(scratch);
      scratch.select();
      document.execCommand('copy');
      scratch.remove();
    }

    button.innerHTML = icon('check');
    button.classList.add('is-copied');
    announce('Copied to clipboard');
    setTimeout(() => {
      button.innerHTML = icon('copy');
      button.classList.remove('is-copied');
    }, 1500);
  }

  function toggleFeedback(turn, button) {
    const wasPressed = button.getAttribute('aria-pressed') === 'true';
    turn.querySelectorAll('[aria-pressed]').forEach(other => other.setAttribute('aria-pressed', 'false'));
    if (!wasPressed) {
      button.setAttribute('aria-pressed', 'true');
      announce('Thanks for your feedback');
    }
  }

  function retry(botTurn) {
    const userTurn = botTurn.previousElementSibling;
    if (generation || !userTurn) return;
    removeAfter(userTurn);
    stickToBottom = true;
    respond(userTurn);
  }

  function startEdit(turn) {
    if (generation || turn.classList.contains('is-editing')) return;
    turn.classList.add('is-editing');

    const editor = document.createElement('form');
    editor.className = 'llm-edit';

    const field = document.createElement('textarea');
    field.className = 'llm-edit__input';
    field.rows = 1;
    field.maxLength = input.maxLength;
    field.value = turn.dataset.text;
    field.setAttribute('aria-label', 'Edit message');

    const row = document.createElement('div');
    row.className = 'llm-edit__row';
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'llm-pill llm-pill--ghost';
    cancelButton.textContent = 'Cancel';
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.className = 'llm-pill llm-pill--primary';
    saveButton.textContent = 'Send';
    row.append(cancelButton, saveButton);

    editor.append(field, row);
    turn.appendChild(editor);
    autoResize(field);
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);

    function close() {
      editor.remove();
      turn.classList.remove('is-editing');
    }

    field.addEventListener('input', () => {
      autoResize(field);
      saveButton.disabled = !field.value.trim();
    });

    cancelButton.addEventListener('click', () => {
      close();
      turn.querySelector('[data-action="edit"]').focus();
    });

    editor.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        cancelButton.click();
      } else if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.target === field) {
        event.preventDefault();
        editor.requestSubmit();
      }
    });

    editor.addEventListener('submit', event => {
      event.preventDefault();
      const text = field.value.trim();
      if (!text || generation) return;

      close();
      turn.dataset.text = text;
      turn.querySelector('.llm-bubble').textContent = text;
      if (turn === log.querySelector('.llm-turn--user')) setTitle(text);
      removeAfter(turn);
      stickToBottom = true;
      respond(turn);
    });
  }

  log.addEventListener('click', event => {
    const button = event.target.closest('.llm-action');
    if (!button || button.disabled) return;
    const turn = button.closest('.llm-turn');

    switch (button.dataset.action) {
      case 'copy':
        copyText(turn.dataset.text, button);
        break;
      case 'like':
      case 'dislike':
        toggleFeedback(turn, button);
        break;
      case 'retry':
        retry(turn);
        break;
      case 'edit':
        startEdit(turn);
        break;
    }
  });

  log.addEventListener('scroll', () => {
    stickToBottom = isNearBottom();
    updateJumpButton();
  }, { passive: true });

  jumpButton.addEventListener('click', () => {
    stickToBottom = true;
    log.scrollTo({ top: log.scrollHeight, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
  });

  newChatButton.addEventListener('click', resetChat);

  // Menu pemilihan model
  function openMenu() {
    closeEffort(false);
    modelMenu.hidden = false;
    modelButton.setAttribute('aria-expanded', 'true');
    const checked = modelItems.find(item => item.getAttribute('aria-checked') === 'true');
    (checked || menuItems[0]).focus();
  }

  function closeMenu(returnFocus) {
    if (modelMenu.hidden) return;
    modelMenu.hidden = true;
    modelButton.setAttribute('aria-expanded', 'false');
    if (returnFocus) modelButton.focus();
  }

  function selectModel(modelKey) {
    if (modelKey !== currentModel) {
      currentModel = modelKey;
      modelButton.textContent = MODELS[modelKey];
      modelItems.forEach(item => {
        item.setAttribute('aria-checked', String(item.dataset.model === modelKey));
      });
    }
    closeMenu(true);
  }

  modelButton.addEventListener('click', () => {
    if (modelMenu.hidden) openMenu();
    else closeMenu(false);
  });

  modelItems.forEach(item => {
    item.addEventListener('click', () => selectModel(item.dataset.model));
  });

  modelMenu.querySelector('[data-more-models]').addEventListener('click', () => {
    closeMenu(true);
    notify('More models', 'No other models are available in this demo yet.');
  });

  modelMenu.addEventListener('keydown', event => {
    const index = menuItems.indexOf(document.activeElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      menuItems[(index + step + menuItems.length) % menuItems.length].focus();
    } else if (/^[1-9]$/.test(event.key) && Number(event.key) <= modelItems.length) {
      event.preventDefault();
      selectModel(modelItems[Number(event.key) - 1].dataset.model);
    }
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('.llm-model-picker')) closeMenu(false);
    if (!event.target.closest('.llm-effort')) closeEffort(false);
  });

  // Popover effort
  function stopPosition(index) {
    return `${(index / (EFFORTS.length - 1)) * 100}%`;
  }

  function setEffort(index) {
    effortIndex = index;
    const { label } = EFFORTS[index];
    effortButton.textContent = label;
    effortValue.textContent = label;
    effortRange.value = String(index);
    effortRange.setAttribute('aria-valuetext', label);
    effortRange.parentElement.style.setProperty('--progress', index / (EFFORTS.length - 1));
  }

  function openEffort() {
    closeMenu(false);
    effortPanel.hidden = false;
    effortButton.setAttribute('aria-expanded', 'true');
    effortRange.focus();
  }

  function closeEffort(returnFocus) {
    if (effortPanel.hidden) return;
    effortPanel.hidden = true;
    effortButton.setAttribute('aria-expanded', 'false');
    if (returnFocus) effortButton.focus();
  }

  // Titik di slider dibuat dari EFFORTS supaya jumlahnya selalu cocok
  effortRange.max = String(EFFORTS.length - 1);
  EFFORTS.forEach((effort, index) => {
    const mark = document.createElement('span');
    mark.className = 'llm-slider__mark';
    if (effort.recommended) {
      mark.classList.add('llm-slider__mark--recommended');
      effortRecommended.style.left = stopPosition(index);
    }
    mark.style.left = stopPosition(index);
    effortMarks.appendChild(mark);
  });

  effortButton.addEventListener('click', () => {
    if (effortPanel.hidden) openEffort();
    else closeEffort(false);
  });

  effortRange.addEventListener('input', () => setEffort(Number(effortRange.value)));

  effortPanel.addEventListener('keydown', event => {
    if (event.key === 'Escape' || (event.key === 'Enter' && event.target === effortRange)) {
      event.preventDefault();
      closeEffort(true);
    }
  });

  effortPanel.querySelector('[data-effort-help]').addEventListener('click', () => {
    notify('Effort', 'Higher effort means the model thinks longer before it answers, up to 20 seconds on Max.');
  });

  document.querySelectorAll('[data-mock-feature]').forEach(button => {
    button.addEventListener('click', () => {
      notify(`${button.dataset.mockFeature} unavailable`, "This feature isn't supported in this demo yet.");
    });
  });

  // Composer
  document.querySelectorAll('.llm-chip').forEach(chip => {
    chip.addEventListener('click', () => send(chip.textContent));
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (generation) {
      cancelGeneration();
      return;
    }
    const question = input.value;
    if (!question.trim()) return;
    input.value = '';
    autoResize();
    send(question);
    input.focus();
  });

  input.addEventListener('input', () => {
    autoResize();
    updateSendButton();
  });

  input.addEventListener('keydown', event => {
    if (event.key === 'Escape' && generation) {
      event.preventDefault();
      cancelGeneration();
    } else if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      // Enter saat model menjawab tidak boleh berfungsi sebagai Stop
      if (!generation) form.requestSubmit();
    }
  });

  document.querySelectorAll('[data-spark]').forEach(slot => slot.appendChild(createSpark()));
  setEffort(effortIndex);
  updateSendButton();
})();
