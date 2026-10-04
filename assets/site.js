/* =============================================================================
   site.js — comportamento compartilhado das 5 paginas (reestruturacao 03/10/2026)
   Rafael Cassaro Tattooz

   Cada bloco e GUARDADO: se o elemento nao existe naquela pagina, o bloco nao
   roda. Assim o mesmo arquivo serve home, work, archive, artist e inquiry.

   REGRA QUE NAO SE QUEBRA: conteudo nunca depende deste arquivo pra existir.
   O JS liga a classe .js no <html> e so ENTAO o CSS esconde-pra-animar vale.
   Se este script morrer, a pagina continua legivel e o formulario continua
   enviando pelo POST nativo.
   ============================================================================ */
(function () {
  'use strict';

  /* ---------- HERO — ancoragem do nome (TRAVADO, so na home) ----------
     Reaproveitado verbatim da home aprovada. A IMAGEM SEGUE INTOCADA:
     nada de esticar, recortar ou reposicionar (ordem do Rafael, 12/jul).
     O que o calculo move e o BLOCO DE TEXTO, liberado por ele em 11/set. */
  var hImg = document.querySelector('.hero__img'),
      hIntro = document.querySelector('.intro');
  if (hImg && hIntro) {
    var CHIN = 0.79, TETO = 0.22, FOLGA = 30;
    var hHero = document.querySelector('.hero');
    var placeIntro = function () {
      if (window.innerWidth < 821) {
        // ---- CELULAR: nome centrado por calculo entre o cabecalho e o fim da foto ----
        hIntro.classList.remove('compacto');
        hIntro.style.removeProperty('--introTop');
        if (hHero) hHero.style.minHeight = '';
        var hHdr = document.querySelector('.hdr');
        var fimCabecalho = hHdr ? hHdr.getBoundingClientRect().height : 78;
        var alturaFoto = hImg.getBoundingClientRect().height;
        var eb = hIntro.querySelector('.eyebrow'), h1 = hIntro.querySelector('.h1');
        if (alturaFoto && eb && h1) {
          var blocoNome = (h1.getBoundingClientRect().bottom - eb.getBoundingClientRect().top);
          var espaco = alturaFoto - fimCabecalho;
          var folga = Math.max(16, (espaco - blocoNome) * 0.32);
          var topoIdeal = fimCabecalho + Math.max(0, folga);
          hIntro.style.marginTop = Math.round(topoIdeal - alturaFoto) + 'px';
          // o texto desvia da tatuagem enquanto a foto existe e volta a largura cheia abaixo
          var frase = hIntro.querySelector('.thesis');
          if (frase) {
            var esq = frase.querySelector('.esquiva');
            if (!esq) {
              esq = document.createElement('span');
              esq.className = 'esquiva';
              esq.setAttribute('aria-hidden', 'true');
              frase.insertBefore(esq, frase.firstChild);
            }
            var topoFrase = frase.getBoundingClientRect().top;
            var fimFoto = hImg.getBoundingClientRect().bottom;
            var sobra = fimFoto - topoFrase;
            var linha = parseFloat(getComputedStyle(frase).lineHeight) || 24;
            esq.style.height = (sobra > linha * 1.5) ? Math.round(sobra) + 'px' : '0px';
            // a primeira frase tem que caber em DUAS linhas (ordem do Rafael, 11/set)
            var primeiro = frase.firstChild;
            while (primeiro && primeiro.nodeType !== 3) primeiro = primeiro.nextSibling;
            if (primeiro) {
              var conta = function () {
                var r = document.createRange(); r.selectNodeContents(primeiro);
                return [].slice.call(r.getClientRects()).filter(function (x) { return x.width > 2; }).length;
              };
              frase.style.fontSize = '';
              var px = parseFloat(getComputedStyle(frase).fontSize);
              var piso = px * 0.78;
              while (conta() > 2 && px > piso) { px -= 0.5; frase.style.fontSize = px + 'px'; }
            }
          }
        }
        return;
      }
      var vw = window.innerWidth, vh = window.innerHeight;
      var nw = hImg.naturalWidth || 2400, nh = hImg.naturalHeight || 1697, ar = nw / nh, dispH, top;
      if (vw / vh > ar) { dispH = vh; top = 0; } else { dispH = vw / ar; top = (vh - dispH) / 2; }
      var chinY = top + CHIN * dispH, tetoY = top + TETO * dispH;
      hIntro.classList.remove('compacto');
      if (tetoY + hIntro.offsetHeight + FOLGA > vh) hIntro.classList.add('compacto');
      var introH = hIntro.offsetHeight;
      var cabeY = vh - introH - FOLGA;
      var y = Math.max(tetoY, Math.min(chinY, cabeY));
      hIntro.style.setProperty('--introTop', Math.round(y) + 'px');
      if (hHero) hHero.style.minHeight = Math.max(vh, Math.round(y + introH + FOLGA)) + 'px';
    };
    placeIntro();
    window.addEventListener('resize', placeIntro);
    window.addEventListener('load', placeIntro);
    if (!hImg.complete) hImg.addEventListener('load', placeIntro);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeIntro).catch(function () {});
    setTimeout(placeIntro, 400); setTimeout(placeIntro, 1200);
  }

  /* ---------- REVEAL no scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { threshold: .14 });
    document.querySelectorAll('.reveal').forEach(function (e) { io.observe(e); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (e) { e.classList.add('in'); });
  }

  /* ---------- CARROSSEL DA HOME ----------
     Briefing 03/10: 4-6 imagens, troca automatica LENTA, transicao suave,
     sem bolinhas. Para em hover, em foco, com a aba escondida e quando o
     visitante pede menos movimento. Swipe no celular. */
  var car = document.querySelector('.car');
  if (car) {
    var slides = [].slice.call(car.querySelectorAll('.car__slide'));
    var bars = [].slice.call(car.querySelectorAll('.car__bar'));
    var INTERVALO = 4800;   // 4,8s — dentro da faixa 4-5s que o Rafael pediu
    var i = 0, timer = null, parado = false;
    var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // legenda unica abaixo do quadro: uma copia por slide empilhava 7 blocos no
    // mesmo ponto e colidia com o fio de progresso
    var capT = car.querySelector('.car__capt'), capS = car.querySelector('.car__caps');

    var mostra = function (n) {
      i = (n + slides.length) % slides.length;
      if (capT) capT.textContent = slides[i].getAttribute('data-cap') || '';
      if (capS) capS.textContent = slides[i].getAttribute('data-sub') || '';
      slides.forEach(function (s, k) {
        var on = (k === i);
        s.classList.toggle('on', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        // o slide que sai nao deve ser alcancavel por teclado
        var a = s.querySelector('a');
        if (a) a.tabIndex = on ? 0 : -1;
      });
      bars.forEach(function (b, k) {
        b.classList.toggle('on', k === i);
        b.classList.toggle('done', k < i);
        b.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
      // carrega o proximo sob demanda, pra primeira tela nao pagar por todos
      var prox = slides[(i + 1) % slides.length];
      if (prox) {
        var pi = prox.querySelector('img');
        if (pi && pi.dataset.src) { pi.src = pi.dataset.src; delete pi.dataset.src; }
      }
    };
    var anda = function () { mostra(i + 1); };
    var liga = function () {
      if (timer || parado || reduz || slides.length < 2) return;
      timer = setInterval(anda, INTERVALO);
    };
    var desliga = function () { if (timer) { clearInterval(timer); timer = null; } };
    var recomeca = function () { desliga(); liga(); };

    mostra(0);
    liga();

    // pausa quando o visitante esta olhando de perto ou navegando por teclado
    car.addEventListener('mouseenter', function () { parado = true; desliga(); });
    car.addEventListener('mouseleave', function () { parado = false; liga(); });
    car.addEventListener('focusin', function () { parado = true; desliga(); });
    car.addEventListener('focusout', function () { parado = false; liga(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) desliga(); else liga();
    });

    var prev = car.querySelector('.car__prev'), next = car.querySelector('.car__next');
    if (prev) prev.addEventListener('click', function () { mostra(i - 1); recomeca(); });
    if (next) next.addEventListener('click', function () { mostra(i + 1); recomeca(); });
    bars.forEach(function (b, k) {
      b.addEventListener('click', function () { mostra(k); recomeca(); });
    });

    // swipe — o gesto natural no celular, que e onde o briefing mais pesa
    var x0 = null, y0 = null;
    car.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    car.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - x0, dy = t.clientY - y0;
      // so conta como swipe se for claramente horizontal (senao atrapalha o scroll)
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        mostra(i + (dx < 0 ? 1 : -1)); recomeca();
      }
      x0 = y0 = null;
    }, { passive: true });

    // setas do teclado quando o carrossel tem foco
    car.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { mostra(i - 1); recomeca(); }
      else if (e.key === 'ArrowRight') { mostra(i + 1); recomeca(); }
    });
  }

  /* ---------- MENU MOBILE ---------- */
  var nt = document.getElementById('navToggle'),
      ns = document.getElementById('navSheet'),
      nc = document.getElementById('navClose');
  if (nt && ns) {
    var setNav = function (open) {
      ns.classList.toggle('open', open);
      if (open) ns.removeAttribute('hidden'); else ns.setAttribute('hidden', '');
      nt.setAttribute('aria-expanded', open ? 'true' : 'false');
      nt.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) { try { ns.focus(); } catch (e) {} } else { nt.focus(); }
    };
    nt.addEventListener('click', function () { setNav(!ns.classList.contains('open')); });
    if (nc) nc.addEventListener('click', function () { setNav(false); });
    ns.addEventListener('click', function (e) { if (e.target.tagName === 'A') setNav(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ns.classList.contains('open')) setNav(false);
    });
  }

  /* ---------- LIGHTBOX (so as peças do portfolio) ----------
     As placas da Archive sao LINK de navegacao, por isso ficam de fora. */
  var shots = [].slice.call(document.querySelectorAll('.tile__img'));
  if (shots.length) {
    var lb = document.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = '<button class="lb__btn lb__close" type="button" aria-label="Close">&times;</button>' +
                   '<button class="lb__btn lb__prev" type="button" aria-label="Previous image">&#8249;</button>' +
                   '<img class="lb__img" alt=""><p class="lb__cap"></p>' +
                   '<button class="lb__btn lb__next" type="button" aria-label="Next image">&#8250;</button>';
    document.body.appendChild(lb);
    var lImg = lb.querySelector('.lb__img'), lCap = lb.querySelector('.lb__cap'), last = null, idx = 0;
    var show = function (n) {
      idx = (n + shots.length) % shots.length;
      var s = shots[idx];
      lImg.src = s.currentSrc || s.src; lImg.alt = s.alt || ''; lCap.textContent = s.alt || '';
    };
    var openLb = function (n) {
      last = document.activeElement; show(n);
      lb.classList.add('open'); document.body.style.overflow = 'hidden';
      lb.querySelector('.lb__close').focus();
    };
    var closeLb = function () {
      lb.classList.remove('open'); document.body.style.overflow = '';
      lImg.removeAttribute('src'); if (last && last.focus) last.focus();
    };
    shots.forEach(function (s, n) {
      var host = s.closest('.tile') || s;
      host.setAttribute('tabindex', '0'); host.setAttribute('role', 'button');
      host.setAttribute('aria-label', 'Open image: ' + (s.alt || 'tattoo by Rafael Cassaro'));
      host.addEventListener('click', function () { openLb(n); });
      host.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(n); }
      });
    });
    lb.querySelector('.lb__close').addEventListener('click', closeLb);
    lb.querySelector('.lb__prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb__next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'Tab') {
        var fx = lb.querySelectorAll('button'), first = fx[0], lastEl = fx[fx.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- FORMULARIO (pagina INQUIRY) ----------
     ENTREGA EM 3 CAMADAS — o lead NUNCA depende de um servico so:
       1) SUPABASE (banco do Rafael, via /api/contact). Fonte da verdade.
       2) FormSubmit (e-mail). So como aviso/backup.
       3) Se os dois falharem, mostrar os contatos diretos em vez de sumir.
     Motivo: em 30/09/2026 o FormSubmit ficou 500 em tudo e o formulario parou
     de entregar. Servico gratuito de terceiro nao pode ser ponto unico de falha
     do unico canal de captacao do site.

     NOVO EM 03/10: o briefing pediu campos de projeto (placement, tamanho,
     referencias). A tabela `contacts` nao tem coluna pra eles, e a API joga
     `message` dentro de `notes`. Entao os campos sao COMPOSTOS num `message`
     legivel antes do envio: nada muda no backend e nada se perde. */
  var f = document.getElementById('inqForm'),
      th = document.getElementById('thanks'),
      er = document.getElementById('inqErr');
  if (f && th) {
    var val = function (n) { var e = f.elements[n]; return e ? String(e.value).trim() : ''; };
    var fail = function (msg) {
      if (er) { er.textContent = msg; er.hidden = false; er.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    };
    var ok = function () {
      try { if (window.gtag) gtag('event', 'generate_lead', { form_location: 'site_inquiry', currency: 'USD', value: 1 }); } catch (e) {}
      try { if (window.fbq) fbq('track', 'Lead', { content_name: 'site_inquiry' }); } catch (e) {}
      f.style.display = 'none'; th.style.display = 'block';
      try { th.focus(); th.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
    };

    // monta a mensagem unica a partir dos campos do projeto
    var compoeMensagem = function () {
      var partes = [];
      var idea = val('message_idea'), place = val('placement'),
          size = val('size'), refs = val('references'), onde = val('location');
      if (idea) partes.push('Idea:\n' + idea);
      if (place) partes.push('Placement: ' + place);
      if (size) partes.push('Approximate size: ' + size);
      if (refs) partes.push('References: ' + refs);
      // de onde a pessoa vem: quem viaja ate Boca Raton precisa de sessoes
      // agrupadas, e isso muda a conversa inteira
      if (onde) partes.push('Based in: ' + onde);
      return partes.join('\n\n');
    };

    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var b = document.getElementById('sub');
      if (b && b.disabled) return;

      var em = val('email'), ph = val('phone'), ig = val('instagram');
      // REGRA DESTE HANDLER: nunca falhar em silencio e nunca barrar gente de
      // verdade. O unico motivo pra nao enviar e nao haver NENHUM contato.
      if (!em && !ph && !ig) return fail('Please leave one way to reach you: email, phone or Instagram.');
      if (em && !ph && !ig && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em))
        return fail('That email looks incomplete, and it is the only way I would have to reach you.');
      if (er) er.hidden = true;
      if (b) { b.disabled = true; b.textContent = 'Sending…'; }

      // o hidden `message` viaja nas DUAS camadas (JSON e FormData do FormSubmit)
      var msg = compoeMensagem();
      var hid = f.elements['message'];
      if (hid) hid.value = msg;

      var pronto = false;
      var API = 'https://cadastro-clientes-ten.vercel.app/api/contact';
      var payload = {
        name: val('name'),
        email: em,
        phone: ph,
        instagram: ig,
        message: msg,
        source: 'site_inquiry'
      };

      var avisaEmail = function () {
        // dispara e esquece: se o e-mail falhar, o lead ja esta salvo no banco
        try {
          fetch('https://formsubmit.co/ajax/contato.rafaelcassaro@gmail.com',
            { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(f) }).catch(function () {});
        } catch (e) {}
      };
      var semSaida = function () {
        if (b) { b.disabled = false; b.textContent = 'Submit your project'; }
        fail('Something went wrong on my end and your message did not go through. Please reach me directly on Instagram @rafaelcassaro or call (561) 419-3996, and I will take it from there.');
      };

      // rede de seguranca por tempo: se tudo travar, tenta o POST nativo
      var rede = setTimeout(function () { if (!pronto) { pronto = true; f.submit(); } }, 12000);

      fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (j) {
          if (pronto) return;
          if (!(j && j.ok === true)) throw new Error('api_rejected');
          pronto = true; clearTimeout(rede);
          avisaEmail();   // banco ja tem o lead; e-mail e so o aviso
          ok();
        })
        .catch(function () {
          if (pronto) return;
          fetch('https://formsubmit.co/ajax/contato.rafaelcassaro@gmail.com',
            { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(f) })
            .then(function (r) { return r.json(); })
            .then(function (j2) {
              if (pronto) return;
              if (!(j2 && String(j2.success) === 'true')) throw new Error('rejected');
              pronto = true; clearTimeout(rede); ok();
            })
            .catch(function () {
              if (pronto) return; pronto = true; clearTimeout(rede);
              semSaida();
            });
        });
    });

    // fallback nao-AJAX do FormSubmit volta em ?sent=1 — mostrar o agradecimento
    if (/[?&]sent=1/.test(location.search)) {
      f.style.display = 'none'; th.style.display = 'block';
      try { if (window.gtag) gtag('event', 'generate_lead', { form_location: 'site_inquiry_fallback', currency: 'USD', value: 1 }); } catch (e) {}
    }
  }
})();
