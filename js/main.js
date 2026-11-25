// ===== Configuração =====
// Número do WhatsApp com DDI + DDD, só dígitos. Ex.: 5534999999999
const WHATSAPP = '5500000000000';

const M = window.Maari || { configurado: false, analisarVideo: () => null, categorias: {} };
const GRADIENTE = 'linear-gradient(150deg, #B8837B, #7B5540)';
const cssUrl = (u) => `url("${String(u).replace(/["\\\n\r]/g, encodeURIComponent)}")`;

// Fotos: carrega a imagem de data-img; se o arquivo não existir, fica o gradiente
const carregarFoto = (el, src = el.dataset.img) => {
  if (!src) return;
  const reserva = el.dataset.imgReserva;
  const img = new Image();
  img.onload = () => {
    // YouTube devolve uma miniatura cinza de 120px quando o vídeo não tem versão HD
    if (reserva && src !== reserva && img.naturalWidth <= 120) { carregarFoto(el, reserva); return; }
    el.style.backgroundImage = `${cssUrl(img.src)}, ${GRADIENTE}`;
  };
  img.onerror = () => { if (reserva && src !== reserva) carregarFoto(el, reserva); };
  img.src = src;
};

// Conteúdo gerenciado pelo painel (/admin). Sem configuração, vale o que está no HTML.
const buscar = async (tabela, consulta) => {
  const ctrl = new AbortController();
  const limite = setTimeout(() => ctrl.abort(), 7000);
  try {
    const r = await fetch(`${M.url}/rest/v1/${tabela}?${consulta}`, {
      headers: { apikey: M.chave, Authorization: `Bearer ${M.chave}` },
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(limite);
  }
};
const pedidoFotos = M.configurado ? buscar('fotos_site', 'select=slot,url').catch(() => []) : Promise.resolve([]);
const pedidoTrabalhos = M.configurado
  ? buscar('trabalhos', 'select=id,titulo,categoria,capa_url,video_url,formato&visivel=eq.true&order=ordem.asc,criado_em.desc').catch(() => null)
  : Promise.resolve(null);

document.querySelectorAll('[data-img]:not([data-slot])').forEach(carregarFoto);
pedidoFotos.then((fotos) => {
  const porSlot = Object.fromEntries((fotos || []).map((f) => [f.slot, f.url]));
  document.querySelectorAll('[data-slot]').forEach((el) => {
    if (porSlot[el.dataset.slot]) el.dataset.img = porSlot[el.dataset.slot];
    carregarFoto(el);
  });
});

// Links de WhatsApp com mensagem pronta
document.querySelectorAll('[data-wa]').forEach((el) => {
  el.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(el.dataset.wa)}`;
  el.target = '_blank';
  el.rel = 'noopener';
});

// Navbar muda ao rolar
const navbar = document.getElementById('navbar');
const onScroll = () => navbar.classList.toggle('rolado', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Menu mobile
const toggle = document.getElementById('menuToggle');
const links = document.getElementById('navLinks');
const setMenu = (aberto) => {
  toggle.classList.toggle('aberto', aberto);
  links.classList.toggle('aberto', aberto);
  toggle.setAttribute('aria-expanded', aberto);
  document.body.style.overflow = aberto ? 'hidden' : '';
};
toggle.addEventListener('click', () => setMenu(!links.classList.contains('aberto')));
links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

// Link ativo no menu conforme a seção visível
const navAnchors = [...links.querySelectorAll('a[href^="#"]')];
const secoes = navAnchors.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      navAnchors.forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === `#${e.target.id}`));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
secoes.forEach((s) => spy.observe(s));

// Animação de entrada
const reveal = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('visivel');
      reveal.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el));

// Contador dos números
const contador = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const alvo = Number(el.dataset.count);
    const inicio = performance.now();
    const dur = 1600;
    const passo = (agora) => {
      const p = Math.min((agora - inicio) / dur, 1);
      el.textContent = `+${Math.round(alvo * (1 - Math.pow(1 - p, 3))).toLocaleString('pt-BR')}`;
      if (p < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
    contador.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach((el) => contador.observe(el));

// Galeria do portfólio
const galeria = document.querySelector('.galeria');
const filtros = document.querySelectorAll('.filtro');
let filtroAtual = 'todos';
const filtrar = (cat) => {
  filtroAtual = cat;
  filtros.forEach((f) => f.classList.toggle('ativo', f.dataset.filtro === cat));
  galeria.querySelectorAll('.item').forEach((i) => i.classList.toggle('oculto', cat !== 'todos' && i.dataset.cat !== cat));
};
filtros.forEach((f) => f.addEventListener('click', () => filtrar(f.dataset.filtro)));
// Cards de serviço levam ao portfólio já filtrado
document.querySelectorAll('.card[data-filtro]').forEach((c) => c.addEventListener('click', () => filtrar(c.dataset.filtro)));

const criarItem = (t) => {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = `item foto reveal${t.formato === 'alto' ? ' item-alto' : ''}${t.formato === 'largo' ? ' item-largo' : ''}`;
  item.dataset.cat = t.categoria;
  item.dataset.video = t.video_url || '';
  item.dataset.foto = t.capa_url || '';
  const v = M.analisarVideo(t.video_url);
  if (t.capa_url) item.dataset.img = t.capa_url;
  else if (v?.thumb) {
    item.dataset.img = v.thumbGrande || v.thumb;
    item.dataset.imgReserva = v.thumb;
  }

  const info = document.createElement('span');
  info.className = 'item-info';
  const cat = document.createElement('small');
  cat.textContent = M.categorias[t.categoria] || '';
  info.append(cat, document.createTextNode(t.titulo));
  item.append(info);
  if (t.video_url) {
    const play = document.createElement('span');
    play.className = 'play';
    item.append(play);
  } else {
    item.classList.add('item-foto');
  }
  item.setAttribute('aria-label', `${t.video_url ? 'Assistir' : 'Ver foto'}: ${t.titulo}`);
  return item;
};

pedidoTrabalhos.then((lista) => {
  if (!lista || !lista.length) return; // sem itens no painel: mantém os do HTML
  const itens = lista.map(criarItem);
  galeria.replaceChildren(...itens);
  itens.forEach((i) => { carregarFoto(i); reveal.observe(i); });
  filtrar(filtroAtual);
});

// Modal de vídeo / foto
const modal = document.getElementById('modal');
const modalVideo = document.getElementById('modalVideo');
const fecharModal = () => {
  modal.classList.remove('aberto');
  modal.setAttribute('aria-hidden', 'true');
  modalVideo.replaceChildren();
  modalVideo.className = 'modal-video';
  document.body.style.overflow = '';
};
const abrirModal = (item) => {
  const v = M.analisarVideo(item.dataset.video);
  modalVideo.replaceChildren();
  modalVideo.className = 'modal-video';
  if (v && v.tipo === 'iframe') {
    const iframe = document.createElement('iframe');
    iframe.src = `${v.src}${v.src.includes('?') ? '&' : '?'}autoplay=1`;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.title = 'Vídeo';
    if (v.provedor === 'Instagram') modalVideo.classList.add('instagram');
    else if (v.vertical) modalVideo.classList.add('vertical');
    modalVideo.append(iframe);
  } else if (v && v.tipo === 'arquivo') {
    const video = document.createElement('video');
    video.src = v.src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    if (item.dataset.foto) video.poster = item.dataset.foto;
    modalVideo.classList.add('solto');
    modalVideo.append(video);
  } else if (item.dataset.foto) {
    const img = document.createElement('img');
    img.src = item.dataset.foto;
    img.alt = item.querySelector('.item-info')?.lastChild?.textContent || '';
    modalVideo.classList.add('solto');
    modalVideo.append(img);
  } else {
    modalVideo.innerHTML = '<p>Adicione o vídeo pelo painel em <code>/admin</code>.</p>';
  }
  modal.classList.add('aberto');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
};
galeria.addEventListener('click', (e) => {
  const item = e.target.closest('.item');
  if (item) abrirModal(item);
});
document.getElementById('modalFechar').addEventListener('click', fecharModal);
modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { fecharModal(); setMenu(false); } });

// Ano no rodapé
document.getElementById('ano').textContent = new Date().getFullYear();
