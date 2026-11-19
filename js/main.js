// ===== Configuração =====
// Número do WhatsApp com DDI + DDD, só dígitos. Ex.: 5534999999999
const WHATSAPP = '5500000000000';

// Fotos: carrega a imagem de data-img; se o arquivo não existir, fica o gradiente
document.querySelectorAll('[data-img]').forEach((el) => {
  const img = new Image();
  img.onload = () => {
    el.style.backgroundImage = `url("${img.src}"), linear-gradient(150deg, #4a5436, #1f2418)`;
  };
  img.src = el.dataset.img;
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

// Filtros do portfólio
const filtros = document.querySelectorAll('.filtro');
const itens = document.querySelectorAll('.galeria .item');
const filtrar = (cat) => {
  filtros.forEach((f) => f.classList.toggle('ativo', f.dataset.filtro === cat));
  itens.forEach((i) => i.classList.toggle('oculto', cat !== 'todos' && i.dataset.cat !== cat));
};
filtros.forEach((f) => f.addEventListener('click', () => filtrar(f.dataset.filtro)));
// Cards de serviço levam ao portfólio já filtrado
document.querySelectorAll('.card[data-filtro]').forEach((c) => c.addEventListener('click', () => filtrar(c.dataset.filtro)));

// Modal de vídeo
const modal = document.getElementById('modal');
const modalVideo = document.getElementById('modalVideo');
const fecharModal = () => {
  modal.classList.remove('aberto');
  modal.setAttribute('aria-hidden', 'true');
  modalVideo.innerHTML = '';
  document.body.style.overflow = '';
};
itens.forEach((item) => item.addEventListener('click', () => {
  const url = item.dataset.video;
  modalVideo.innerHTML = url
    ? `<iframe src="${url}${url.includes('?') ? '&' : '?'}autoplay=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Vídeo"></iframe>`
    : '<p>Adicione o link do vídeo no atributo <code>data-video</code> deste item.</p>';
  modal.classList.add('aberto');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}));
document.getElementById('modalFechar').addEventListener('click', fecharModal);
modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { fecharModal(); setMenu(false); } });

// Ano no rodapé
document.getElementById('ano').textContent = new Date().getFullYear();
