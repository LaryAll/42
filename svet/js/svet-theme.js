/* GlowByte «Свет» 1.0.0: тема, телефонное меню, кнопки «Скопировать», палитра и контрасты дизайнбука.
 * Без фреймворка, без инлайн-скриптов (CSP script-src 'self'): подключать в <head> обычным <script src> без defer -
 * тема ставится до первой отрисовки, без вспышки. Не правьте копию в проекте: правка идёт через дизайнбук портала.
 *
 * Тема: <html data-theme="light"> или без атрибута (тёмная по умолчанию). Выбор хранится в localStorage «sv-theme»
 * и в cookie (имя - <html data-sv-cookie="portal_theme">, по умолчанию «sv-theme»), чтобы сервер мог отдать страницу
 * сразу в нужной теме. Кнопка - [data-sv-theme] со значками .sv-ic-sun и .sv-ic-moon внутри; aria-label и title
 * говорят, какую тему она включит (data-label-light / data-label-dark, иначе русские подписи по умолчанию).
 * Событие «sv:theme» на document - для графиков, которые рисуются скриптом.
 *
 * Телефон: <html class="sv-js"> ставится сразу; .sv-burger[aria-controls] открывает меню (<html class="sv-menu-open">),
 * закрывают [data-sv-close], Esc и выбор пункта; Tab не уходит из открытого меню.
 */
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;
  var KEY = 'sv-theme';
  var LABEL = { light: 'Включить светлую тему', dark: 'Включить тёмную тему' };

  root.classList.add('sv-js');

  /* ---------- тема ---------- */
  function cookieName() { return root.getAttribute('data-sv-cookie') || KEY; }

  function stored() {
    var value = null;
    try { value = window.localStorage.getItem(KEY); } catch (e) { /* приватный режим */ }
    if (value !== 'light' && value !== 'dark') {
      var m = doc.cookie.match(new RegExp('(?:^|; )' + cookieName().replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
      value = m ? decodeURIComponent(m[1]) : null;
    }
    return value === 'light' || value === 'dark' ? value : null;
  }

  function current() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }

  function apply(theme) {
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
  }

  function label(button, theme) {
    var text = button.getAttribute('data-label-' + theme) || LABEL[theme];
    button.setAttribute('aria-label', text);
    button.setAttribute('title', text);
    if (button.hasAttribute('value')) button.value = theme;
  }

  function sync() {
    var next = current() === 'dark' ? 'light' : 'dark';
    doc.querySelectorAll('[data-sv-theme]').forEach(function (b) { label(b, next); });
  }

  function save(theme) {
    try { window.localStorage.setItem(KEY, theme); } catch (e) { /* без хранилища тема живёт до перезагрузки */ }
    doc.cookie = cookieName() + '=' + theme + ';path=/;max-age=31536000;samesite=lax';
  }

  var first = stored();
  if (first) apply(first);

  function setTheme(theme) {
    apply(theme);
    save(theme);
    sync();
    doc.dispatchEvent(new CustomEvent('sv:theme', { detail: { theme: theme } }));
  }

  /* ---------- телефонное меню ---------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

  function menu() {
    var burger = doc.querySelector('.sv-burger[aria-controls]');
    var panel = burger && doc.getElementById(burger.getAttribute('aria-controls'));
    if (!burger || !panel) return;
    var isOpen = function () { return root.classList.contains('sv-menu-open'); };
    var items = function () {
      return Array.prototype.filter.call(panel.querySelectorAll(FOCUSABLE), function (el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0;
      });
    };
    function open() {
      root.classList.add('sv-menu-open');
      burger.setAttribute('aria-expanded', 'true');
      var target = panel.querySelector('[aria-current]') || items()[0];
      if (target) target.focus({ preventScroll: true });
    }
    function close(back) {
      if (!isOpen()) return;
      root.classList.remove('sv-menu-open');
      burger.setAttribute('aria-expanded', 'false');
      if (back) burger.focus();
    }
    burger.addEventListener('click', function () { if (isOpen()) close(true); else open(); });
    doc.querySelectorAll('[data-sv-close]').forEach(function (el) {
      el.addEventListener('click', function () { close(true); });
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a[href^="#"]')) close(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
      if (e.key !== 'Tab') return;
      var list = items();
      if (!list.length) return;
      var a = list[0], z = list[list.length - 1];
      if (!panel.contains(doc.activeElement)) { e.preventDefault(); a.focus(); }
      else if (e.shiftKey && doc.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && doc.activeElement === z) { e.preventDefault(); a.focus(); }
    });
    if (window.matchMedia) {
      var mq = window.matchMedia('(min-width: 861px)');
      var reset = function () { if (mq.matches) close(false); };
      if (mq.addEventListener) mq.addEventListener('change', reset);
    }
  }

  /* ---------- «Скопировать» у образцов кода: [data-sv-copy="id"] копирует <code data-sv-code="id"> ---------- */
  function copy() {
    doc.addEventListener('click', function (e) {
      var button = e.target.closest('[data-sv-copy]');
      if (!button) return;
      var code = doc.querySelector('[data-sv-code="' + button.getAttribute('data-sv-copy') + '"]');
      if (!code) return;
      var text = code.textContent;
      var done = function () {
        var was = button.getAttribute('data-text') || button.textContent;
        button.setAttribute('data-text', was);
        button.textContent = 'Скопировано';
        button.setAttribute('data-done', '');
        window.setTimeout(function () { button.textContent = was; button.removeAttribute('data-done'); }, 1600);
      };
      var fallback = function () {
        var area = doc.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.className = 'sv-sr';
        doc.body.appendChild(area);
        area.select();
        try { doc.execCommand('copy'); done(); } catch (err) { /* копировать вручную */ }
        doc.body.removeChild(area);
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    });
  }

  /* ---------- палитра и контрасты: значения читаются из CSS-переменных обеих тем, не вписаны руками ---------- */
  function rgb(value, under) {
    value = (value || '').trim();
    under = under || [0, 0, 0];
    if (value.charAt(0) === '#') {
      var h = value.slice(1);
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); });
    }
    var n = (value.match(/[\d.]+/g) || []).map(Number);
    var a = n.length > 3 ? n[3] : 1;
    return [0, 1, 2].map(function (i) { return n[i] * a + under[i] * (1 - a); });
  }
  function lum(c) {
    var ch = c.map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  function ratio(a, b) {
    var la = lum(a), lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  /* Значения нужных переменных в тёмной и светлой: тему переключают на миг и возвращают до отрисовки. */
  function read(names) {
    var was = root.getAttribute('data-theme');
    var out = {};
    ['dark', 'light'].forEach(function (theme) {
      apply(theme);
      var cs = window.getComputedStyle(root);
      out[theme] = {};
      names.forEach(function (n) { out[theme][n] = cs.getPropertyValue('--' + n).trim(); });
    });
    if (was) root.setAttribute('data-theme', was); else root.removeAttribute('data-theme');
    return out;
  }

  function surfaces(tok, theme) {
    var room = rgb(tok.room);
    var glass = rgb(tok.glass, room);
    return { room: room, glass: glass, lit: rgb(theme === 'dark' ? tok.lift : tok.glass, glass) };
  }

  function palette() {
    var swatches = doc.querySelectorAll('[data-sv-sw]');
    var pairs = doc.querySelectorAll('[data-sv-pair]');
    if (!swatches.length && !pairs.length) return;
    var names = ['room', 'glass', 'lift'];
    swatches.forEach(function (el) { names.push(el.getAttribute('data-sv-sw')); });
    pairs.forEach(function (el) { names.push.apply(names, el.getAttribute('data-sv-pair').split(' ')); });
    var tok = read(names.filter(function (n) { return n !== 'lit'; }));
    swatches.forEach(function (el) {
      var name = el.getAttribute('data-sv-sw');
      ['dark', 'light'].forEach(function (theme) {
        var v = tok[theme][name];
        var shape = el.querySelector('[data-sv-fill="' + theme + '"]');
        var base = el.querySelector('[data-sv-base="' + theme + '"]');
        var text = el.querySelector('[data-sv-v="' + theme + '"]');
        if (base) { base.setAttribute('class', ''); base.setAttribute('fill', tok[theme].room); }
        if (shape) { shape.setAttribute('class', ''); shape.setAttribute('fill', v); }
        if (text) text.textContent = v.replace(/\s+/g, '');
      });
    });
    var all = 0, ok = 0;
    pairs.forEach(function (el) {
      var p = el.getAttribute('data-sv-pair').split(' ');
      var need = parseFloat(el.getAttribute('data-sv-need'));
      var pass = true;
      ['dark', 'light'].forEach(function (theme) {
        var t = tok[theme];
        var back = surfaces(t, theme)[p[1]] || rgb(t[p[1]]);
        var r = ratio(rgb(t[p[0]], back), back);
        var cell = el.querySelector('[data-sv-r="' + theme + '"]');
        if (cell) cell.textContent = r.toFixed(1).replace('.', ',');
        if (r < need) pass = false;
      });
      var badge = el.querySelector('[data-sv-aa]');
      if (badge) {
        badge.innerHTML = '';
        var led = doc.createElement('i');
        led.className = 'sv-led ' + (pass ? 'sv-led--cool' : 'sv-led--warm');
        badge.appendChild(led);
        badge.appendChild(doc.createTextNode(pass ? 'AA' : 'ниже AA'));
      }
      all += 1;
      if (pass) ok += 1;
    });
    doc.querySelectorAll('[data-sv-aa-total]').forEach(function (el) {
      el.textContent = ok + ' из ' + all;
    });
  }

  /* ---------- оглавление: текущий раздел подсвечен в меню ---------- */
  function spy() {
    var links = doc.querySelectorAll('.sv-nav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var mark = function (id) {
      links.forEach(function (a) {
        var on = a === map[id];
        a.classList.toggle('sv-nav-i--on', on && a.classList.contains('sv-nav-i'));
        a.classList.toggle('sv-nav-sub--on', on && a.classList.contains('sv-nav-sub'));
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    };
    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen[en.target.id] = en.isIntersecting; });
      var ids = Object.keys(map).filter(function (id) { return seen[id]; });
      if (ids.length) mark(ids[0]);
    }, { rootMargin: '-80px 0px -55% 0px' });
    Object.keys(map).forEach(function (id) {
      var sec = doc.getElementById(id);
      if (sec) io.observe(sec);
    });
  }

  function init() {
    sync();
    doc.addEventListener('click', function (e) {
      var button = e.target.closest('[data-sv-theme]');
      if (!button) return;
      e.preventDefault();
      setTheme(current() === 'dark' ? 'light' : 'dark');
    });
    menu();
    copy();
    palette();
    spy();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();

  window.SvetTheme = { set: setTheme, get: current };
}());
