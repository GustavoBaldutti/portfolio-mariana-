// ===== Painel Maari Mobile: login + vídeos e fotos do site =====
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const LIMITE_VIDEO = 50 * 1024 * 1024;
  const GRADIENTE = 'linear-gradient(150deg, #B8837B, #7B5540)';
  const EXTENSAO = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' };
  const TIPO_POR_EXTENSAO = { mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' };
  const FORMATOS = { normal: 'tamanho normal', alto: 'tamanho alto', largo: 'tamanho largo' };
  const SLOTS = [
    { slot: 'hero', nome: 'Foto do topo', onde: 'A primeira imagem do site', padrao: '../fotos/mariana.png' },
    { slot: 'sobre', nome: 'Foto do "Sobre"', onde: 'Ao lado de "Oi, eu sou a Mariana"', padrao: '../fotos/mariana.png' },
    { slot: 'servico-marcas', nome: 'Card: Conteúdo para marcas', onde: 'Seção de serviços', padrao: '../fotos/servico-marcas.jpg' },
    { slot: 'servico-casamentos', nome: 'Card: Casamentos', onde: 'Seção de serviços', padrao: '../fotos/servico-casamentos.jpg' },
    { slot: 'servico-eventos', nome: 'Card: Eventos', onde: 'Seção de serviços', padrao: '../fotos/servico-eventos.jpg' },
    { slot: 'servico-reels', nome: 'Card: Reels & edição', onde: 'Seção de serviços', padrao: '../fotos/servico-reels.jpg' },
  ];
  const ICONES = {
    subir: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M4 7l4-4 4 4"/></svg>',
    descer: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M4 9l4 4 4-4"/></svg>',
    editar: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 2.5l3 3L5 14H2v-3z"/></svg>',
    ver: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>',
    ocultar: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2l12 12M6.5 3.2A7 7 0 0 1 8 3c4.5 0 7 5 7 5a12 12 0 0 1-2 2.6M10 12.5A6.6 6.6 0 0 1 8 13c-4.5 0-7-5-7-5a12 12 0 0 1 3-3.4"/></svg>',
    excluir: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4"/></svg>',
    foto: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="3" width="13" height="10" rx="2"/><circle cx="8" cy="8" r="2.5"/></svg>',
    desfazer: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3v4h4"/><path d="M3.5 7A5 5 0 1 1 5 11.5"/></svg>',
  };

  // ---------- Utilidades ----------
  const telas = ['telaCarregando', 'telaAviso', 'telaLogin', 'telaNovaSenha', 'telaPainel'];
  const mostrarTela = (id) => telas.forEach((t) => { $(`#${t}`).hidden = t !== id; });
  const mb = (bytes) => (bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`);
  const cssUrl = (u) => `url("${String(u).replace(/["\\\n\r]/g, encodeURIComponent)}")`;
  const fundo = (el, u) => { el.style.backgroundImage = u ? `${cssUrl(u)}, ${GRADIENTE}` : GRADIENTE; };
  const criar = (tag, classe, texto) => {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto != null) el.textContent = texto;
    return el;
  };

  let avisoTimer;
  function avisar(texto, ruim = false) {
    const el = $('#aviso');
    el.textContent = texto;
    el.classList.toggle('ruim', ruim);
    el.classList.add('mostrar');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => el.classList.remove('mostrar'), ruim ? 6000 : 3500);
  }

  function ocupado(btn, sim, texto) {
    if (sim) {
      btn.dataset.texto = btn.textContent;
      btn.textContent = texto;
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.texto || btn.textContent;
      btn.disabled = false;
    }
  }

  function traduzirErro(erro) {
    const msg = String(erro?.message || erro || '');
    if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
    if (/email not confirmed/i.test(msg)) return 'Esse e-mail ainda não foi confirmado. Veja a caixa de entrada.';
    if (/rate limit|too many/i.test(msg)) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
    if (/should be different/i.test(msg)) return 'A senha nova precisa ser diferente da antiga.';
    if (/password.*(at least|characters)|weak/i.test(msg)) return 'Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.';
    if (/failed to fetch|network|load failed/i.test(msg)) return 'Sem conexão com a internet. Confira e tente de novo.';
    if (/row-level|policy|permission/i.test(msg)) return 'Sem permissão. Confira se o arquivo setup.sql foi executado no Supabase.';
    return msg || 'Algo deu errado. Tente de novo.';
  }

  function confirmar(texto, rotulo = 'Excluir') {
    return new Promise((resolve) => {
      const d = $('#confirmar');
      $('#confirmarTexto').textContent = texto;
      $('#confirmarSim').textContent = rotulo;
      d.returnValue = '';
      d.addEventListener('close', () => resolve(d.returnValue === 'sim'), { once: true });
      d.showModal();
    });
  }

  // Reduz a foto (máx. 2000 px) e converte para JPG, para o site carregar rápido
  async function prepararImagem(arquivo, max = 2000) {
    let bmp;
    try { bmp = await createImageBitmap(arquivo, { imageOrientation: 'from-image' }); } catch { return null; }
    const escala = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = criar('canvas');
    canvas.width = Math.round(bmp.width * escala);
    canvas.height = Math.round(bmp.height * escala);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#EBD5BE';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();
    return new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
  }

  // Tira uma "foto" do vídeo para usar como capa automática
  function capturarQuadro(arquivo) {
    return new Promise((resolve) => {
      const video = criar('video');
      const url = URL.createObjectURL(arquivo);
      let feito = false;
      const fim = (blob) => {
        if (feito) return;
        feito = true;
        clearTimeout(limite);
        URL.revokeObjectURL(url);
        resolve(blob || null);
      };
      const limite = setTimeout(() => fim(null), 10000);
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.onloadedmetadata = () => { video.currentTime = Math.min(1.5, (video.duration || 3) / 3); };
      video.onseeked = () => {
        if (!video.videoWidth) return fim(null);
        const escala = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
        const canvas = criar('canvas');
        canvas.width = Math.round(video.videoWidth * escala);
        canvas.height = Math.round(video.videoHeight * escala);
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(fim, 'image/jpeg', 0.85);
      };
      video.onerror = () => fim(null);
      video.src = url;
    });
  }

  // ---------- Início ----------
  if (!window.Maari || !Maari.configurado) { mostrarTela('telaAviso'); return; }
  if (!window.supabase?.createClient) {
    $('#telaAviso h1').textContent = 'Não foi possível carregar o painel';
    $('#telaAviso p').textContent = 'Confira a sua conexão com a internet e recarregue a página.';
    mostrarTela('telaAviso');
    return;
  }

  const sb = window.supabase.createClient(Maari.url, Maari.chave);
  let recuperando = /type=recovery/.test(location.hash);
  let estado = 'fora'; // fora | verificando | dentro
  let trabalhos = [];
  let fotosSite = {};

  // Link de e-mail expirado (ex.: "esqueci minha senha" antigo)
  const erroNoLink = new URLSearchParams(location.hash.slice(1)).get('error_description');
  if (erroNoLink) {
    $('#formLogin .erro').textContent = /expired|invalid/i.test(erroNoLink)
      ? 'Esse link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".'
      : erroNoLink;
    history.replaceState(null, '', location.pathname);
  }

  sb.auth.onAuthStateChange((evento, sessao) => {
    // Recomendado pelo Supabase: não chamar o banco direto dentro deste callback
    setTimeout(() => tratarSessao(evento, sessao), 0);
  });

  async function tratarSessao(evento, sessao) {
    if (evento === 'PASSWORD_RECOVERY') recuperando = true;
    if (!sessao) {
      estado = 'fora';
      mostrarTela('telaLogin');
      return;
    }
    if (recuperando) { mostrarTela('telaNovaSenha'); return; }
    if (estado !== 'fora') return;

    estado = 'verificando';
    const { data: ehAdmin, error } = await sb.rpc('is_admin');
    if (error || !ehAdmin) {
      estado = 'fora';
      $('#formLogin .erro').textContent = error
        ? 'Não foi possível verificar o acesso. Confira se o setup.sql foi executado no Supabase.'
        : 'Este e-mail não tem permissão para usar o painel.';
      await sb.auth.signOut();
      mostrarTela('telaLogin');
      return;
    }
    estado = 'dentro';
    mostrarTela('telaPainel');
    carregarTrabalhos();
    carregarFotosSite();
  }

  // ---------- Login, senha e saída ----------
  $$('[data-ir]').forEach((b) => b.addEventListener('click', () => {
    const paraLogin = b.dataset.ir === 'login';
    $('#formLogin').hidden = !paraLogin;
    $('#formEsqueci').hidden = paraLogin;
    const destino = paraLogin ? $('#formLogin') : $('#formEsqueci');
    const email = (paraLogin ? $('#formEsqueci') : $('#formLogin')).email.value;
    if (email && !destino.email.value) destino.email.value = email;
    destino.email.focus();
  }));

  $('#formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const erro = $('.erro', f);
    erro.textContent = '';
    const email = f.email.value.trim();
    const senha = f.senha.value;
    if (!email || !senha) { erro.textContent = 'Preencha o e-mail e a senha.'; return; }
    const btn = $('[type="submit"]', f);
    ocupado(btn, true, 'Entrando…');
    const { error } = await sb.auth.signInWithPassword({ email, password: senha });
    ocupado(btn, false);
    if (error) erro.textContent = traduzirErro(error);
    else f.senha.value = '';
  });

  $('#formEsqueci').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const erro = $('.erro', f);
    const ok = $('.ok', f);
    erro.textContent = '';
    ok.textContent = '';
    const email = f.email.value.trim();
    if (!email) { erro.textContent = 'Digite o seu e-mail.'; return; }
    const btn = $('[type="submit"]', f);
    ocupado(btn, true, 'Enviando…');
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    ocupado(btn, false);
    if (error) erro.textContent = traduzirErro(error);
    else ok.textContent = 'Pronto! Se esse e-mail tiver acesso, o link chega em alguns minutos. Confira também a caixa de spam.';
  });

  $('#formNovaSenha').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const erro = $('.erro', f);
    erro.textContent = '';
    if (f.senha.value.length < 8) { erro.textContent = 'A senha precisa ter pelo menos 8 caracteres.'; return; }
    if (f.senha.value !== f.confirma.value) { erro.textContent = 'As duas senhas não estão iguais.'; return; }
    const btn = $('[type="submit"]', f);
    ocupado(btn, true, 'Salvando…');
    const { error } = await sb.auth.updateUser({ password: f.senha.value });
    ocupado(btn, false);
    if (error) { erro.textContent = traduzirErro(error); return; }
    f.reset();
    recuperando = false;
    history.replaceState(null, '', location.pathname);
    avisar('Senha nova salva!');
    const { data } = await sb.auth.getSession();
    tratarSessao('SIGNED_IN', data.session);
  });

  $('#btnSair').addEventListener('click', () => sb.auth.signOut());

  // ---------- Abas ----------
  $$('.aba').forEach((aba) => aba.addEventListener('click', () => {
    $$('.aba').forEach((a) => {
      const ativa = a === aba;
      a.classList.toggle('ativa', ativa);
      a.setAttribute('aria-selected', ativa);
      $(`#${a.dataset.aba}`).hidden = !ativa;
    });
  }));

  // ---------- Envio de arquivos (com barra de progresso) ----------
  async function enviarArquivo(blob, pasta, tipo, aoProgredir) {
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Sua sessão expirou. Saia e entre de novo.');
    const caminho = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXTENSAO[tipo] || 'bin'}`;
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${Maari.url}/storage/v1/object/${Maari.bucket}/${caminho}`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('apikey', Maari.chave);
      xhr.setRequestHeader('Content-Type', tipo);
      xhr.setRequestHeader('Cache-Control', 'max-age=31536000');
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) aoProgredir?.(e.loaded / e.total); };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) { resolve({ caminho, url: Maari.urlPublica(caminho) }); return; }
        let msg = '';
        try { const j = JSON.parse(xhr.responseText); msg = j.message || j.error || ''; } catch { /* resposta sem JSON */ }
        if (xhr.status === 413 || /size|too large/i.test(msg)) msg = 'O arquivo passa do limite de 50 MB.';
        else if (/mime/i.test(msg)) msg = 'Esse formato de arquivo não é aceito.';
        else if (xhr.status === 403 || /row-level|policy|unauthorized/i.test(msg)) msg = 'Sem permissão para enviar arquivos. Confira se o setup.sql foi executado no Supabase.';
        reject(new Error(msg || `O envio falhou (erro ${xhr.status}).`));
      };
      xhr.onerror = () => reject(new Error('A conexão caiu durante o envio. Tente de novo.'));
      xhr.send(blob);
    });
  }

  async function apagarArquivos(urls) {
    const caminhos = urls.map(Maari.caminhoNoBucket).filter(Boolean);
    if (caminhos.length) await sb.storage.from(Maari.bucket).remove(caminhos);
  }

  // ---------- Lista de trabalhos ----------
  async function carregarTrabalhos() {
    const { data, error } = await sb.from('trabalhos').select('*')
      .order('ordem', { ascending: true })
      .order('criado_em', { ascending: false });
    if (error) { avisar(`Não consegui carregar os trabalhos. ${traduzirErro(error)}`, true); return; }
    trabalhos = data;
    desenharLista();
  }

  const capaDe = (t) => t.capa_url || Maari.analisarVideo(t.video_url)?.thumb || '';

  function botaoAcao(icone, rotulo, rotuloAcessivel, aoClicar, { classe = '', desativado = false, soIcone = false } = {}) {
    const b = criar('button', `acao ${classe}`);
    b.type = 'button';
    b.innerHTML = ICONES[icone];
    if (!soIcone) b.append(criar('span', '', rotulo));
    b.title = rotulo;
    b.setAttribute('aria-label', rotuloAcessivel);
    b.dataset.acao = icone;
    b.disabled = desativado;
    b.addEventListener('click', aoClicar);
    return b;
  }

  function desenharLista(foco) {
    const lista = $('#lista');
    lista.replaceChildren();
    $('#vazio').hidden = trabalhos.length > 0;
    const n = trabalhos.length;
    $('#contagem').textContent = n
      ? `${n} ${n === 1 ? 'trabalho' : 'trabalhos'} · aparecem no site nesta mesma ordem.`
      : 'Os trabalhos aparecem no site na mesma ordem desta lista.';

    trabalhos.forEach((t, i) => {
      const cartao = criar('article', `cartao${t.visivel ? '' : ' oculto-site'}`);
      cartao.dataset.id = t.id;

      const img = criar('div', 'cartao-img foto');
      fundo(img, capaDe(t));
      const selos = criar('div', 'selos');
      selos.append(criar('span', 'selo', Maari.categorias[t.categoria] || t.categoria));
      const video = Maari.analisarVideo(t.video_url);
      selos.append(criar('span', 'selo', video ? 'Vídeo' : 'Foto'));
      if (!t.visivel) selos.append(criar('span', 'selo selo-oculto', 'Oculto'));
      img.append(selos, criar('span', 'cartao-posicao', String(i + 1)));

      const corpo = criar('div', 'cartao-corpo');
      const origem = video ? (video.provedor === 'Arquivo' ? 'Vídeo enviado' : `Vídeo do ${video.provedor}`) : 'Só foto';
      corpo.append(criar('h3', '', t.titulo), criar('p', '', `${origem} · ${FORMATOS[t.formato] || ''}`));

      const nome = `“${t.titulo}”`;
      const acoes = criar('div', 'cartao-acoes');
      acoes.append(
        botaoAcao('subir', 'Subir', `Subir ${nome} na ordem`, () => mover(i, -1), { desativado: i === 0, soIcone: true }),
        botaoAcao('descer', 'Descer', `Descer ${nome} na ordem`, () => mover(i, 1), { desativado: i === n - 1, soIcone: true }),
        criar('span', 'espaco'),
        botaoAcao(t.visivel ? 'ocultar' : 'ver', t.visivel ? 'Ocultar' : 'Mostrar', `${t.visivel ? 'Ocultar' : 'Mostrar'} ${nome} no site`, () => alternarVisivel(t)),
        botaoAcao('editar', 'Editar', `Editar ${nome}`, () => abrirEditor(t)),
        botaoAcao('excluir', 'Excluir', `Excluir ${nome}`, () => excluir(t), { classe: 'acao-perigo', soIcone: true }),
      );

      cartao.append(img, corpo, acoes);
      lista.append(cartao);
    });

    if (foco) {
      const b = $(`[data-id="${foco.id}"] [data-acao="${foco.acao}"]`, lista);
      (b && !b.disabled ? b : $(`[data-id="${foco.id}"] [data-acao="editar"]`, lista))?.focus();
    }
  }

  async function mover(i, direcao) {
    const j = i + direcao;
    if (j < 0 || j >= trabalhos.length) return;
    const nova = trabalhos.slice();
    [nova[i], nova[j]] = [nova[j], nova[i]];
    const mudancas = [];
    nova.forEach((t, idx) => {
      if (t.ordem !== idx) { t.ordem = idx; mudancas.push(t); }
    });
    trabalhos = nova;
    desenharLista({ id: nova[j].id, acao: direcao < 0 ? 'subir' : 'descer' });
    const resultados = await Promise.all(mudancas.map((t) => sb.from('trabalhos').update({ ordem: t.ordem }).eq('id', t.id)));
    if (resultados.some((r) => r.error)) {
      avisar('Não consegui salvar a nova ordem. Tente de novo.', true);
      carregarTrabalhos();
    }
  }

  async function alternarVisivel(t) {
    const { error } = await sb.from('trabalhos').update({ visivel: !t.visivel }).eq('id', t.id);
    if (error) { avisar(traduzirErro(error), true); return; }
    t.visivel = !t.visivel;
    desenharLista({ id: t.id, acao: t.visivel ? 'ocultar' : 'ver' });
    avisar(t.visivel ? 'Agora aparece no site.' : 'Escondido do site. Você pode mostrar de novo quando quiser.');
  }

  async function excluir(t) {
    const sim = await confirmar(`“${t.titulo}” vai sair do site e os arquivos enviados serão apagados. Isso não pode ser desfeito.`);
    if (!sim) return;
    const { error } = await sb.from('trabalhos').delete().eq('id', t.id);
    if (error) { avisar(traduzirErro(error), true); return; }
    await apagarArquivos([t.capa_url, t.video_url]);
    trabalhos = trabalhos.filter((x) => x.id !== t.id);
    desenharLista();
    avisar('Trabalho excluído.');
  }

  // ---------- Editor (adicionar / editar) ----------
  const editor = $('#editor');
  const form = $('#formTrabalho');
  let edicao = null;
  let salvando = false;
  let previaUrl = '';

  const modoAtual = () => form.modoVideo.value;

  function dica(id, texto, tipo = '') {
    const el = $(`#${id}`);
    el.textContent = texto;
    el.className = `dica ${tipo}`;
  }

  function abrirEditor(t = null) {
    form.reset();
    edicao = { original: t, arquivoVideo: null, tipoVideo: '', capaBlob: null, capaAuto: false, tirarCapa: false };
    $('#editorTitulo').textContent = t ? 'Editar trabalho' : 'Adicionar trabalho';
    $('#btnSalvar').textContent = t ? 'Salvar alterações' : 'Adicionar ao site';
    $('#erroEditor').textContent = '';
    $('#progresso').hidden = true;

    let modo = 'link';
    if (t) {
      form.titulo.value = t.titulo;
      form.categoria.value = t.categoria;
      form.formato.value = t.formato;
      form.visivel.checked = t.visivel;
      if (!t.video_url) modo = 'nenhum';
      else if (Maari.caminhoNoBucket(t.video_url)) modo = 'arquivo';
      else form.link.value = t.video_url;
    }
    form.modoVideo.value = modo;
    dica('dicaArquivo', modo === 'arquivo' ? '✓ Vídeo já enviado. Escolha outro arquivo só se quiser trocar.' : '', modo === 'arquivo' ? 'bom' : '');
    definirModo();
    editor.showModal();
    if (!t) form.titulo.focus();
  }

  function definirModo() {
    const modo = modoAtual();
    $$('.modo', form).forEach((m) => { m.hidden = m.dataset.modo !== modo; });
    atualizarDicaLink();
    atualizarZonaVideo();
    atualizarCapa();
  }

  function atualizarZonaVideo() {
    const temVideo = edicao?.arquivoVideo || Maari.caminhoNoBucket(edicao?.original?.video_url);
    $('#soltarVideo strong').textContent = temVideo ? 'Trocar vídeo' : 'Clique para escolher o vídeo';
  }

  function atualizarDicaLink() {
    const link = form.link.value.trim();
    if (!link) { dica('dicaLink', 'Dica: no YouTube, o vídeo pode ser "não listado" para aparecer só aqui.'); return; }
    const v = Maari.analisarVideo(link);
    if (v && v.tipo === 'iframe') dica('dicaLink', `✓ Vídeo do ${v.provedor} reconhecido.${v.provedor === 'Google Drive' ? ' Ele precisa estar compartilhado como "qualquer pessoa com o link".' : ''}`, 'bom');
    else if (v) dica('dicaLink', '✓ Link de arquivo de vídeo reconhecido.', 'bom');
    else dica('dicaLink', 'Não reconheci esse link. Use um link do YouTube, Vimeo, Instagram, TikTok ou Google Drive.', 'ruim');
  }

  function atualizarCapa() {
    const modo = modoAtual();
    const previa = $('#previaCapa');
    const zona = $('#soltarCapa');
    const original = edicao?.original?.capa_url && !edicao.tirarCapa ? edicao.original.capa_url : '';
    const miniatura = modo === 'link' ? Maari.analisarVideo(form.link.value)?.thumb : '';

    if (previaUrl) { URL.revokeObjectURL(previaUrl); previaUrl = ''; }
    let src = '';
    let texto = '';
    if (edicao?.capaBlob) {
      previaUrl = URL.createObjectURL(edicao.capaBlob);
      src = previaUrl;
      if (edicao.capaAuto) texto = 'Capa criada a partir do vídeo. Se preferir, escolha outra foto.';
    } else if (original) {
      src = original;
    } else if (miniatura) {
      src = miniatura;
      texto = 'Usando a miniatura do YouTube. Se preferir, escolha outra foto.';
    } else if (modo === 'nenhum') {
      texto = 'Sem vídeo, a foto é obrigatória: é ela que aparece no site.';
    } else if (modo === 'link' && form.link.value.trim()) {
      texto = 'Recomendado: escolha uma foto de capa para este vídeo aparecer bonito na galeria.';
    }

    previa.hidden = !src;
    if (src) previa.src = src; else previa.removeAttribute('src');
    zona.classList.toggle('tem-previa', Boolean(src));
    $('.soltar-texto strong', zona).textContent = src ? 'Trocar foto' : 'Clique para escolher a foto';
    $('#capaOpcional').textContent = modo === 'nenhum' ? '(obrigatória)' : '(opcional se o vídeo for do YouTube)';
    $('#btnTirarCapa').hidden = !(edicao?.capaBlob || original);
    dica('dicaCapa', texto);
  }

  $$('[name="modoVideo"]', form).forEach((r) => r.addEventListener('change', definirModo));
  form.link.addEventListener('input', () => { atualizarDicaLink(); atualizarCapa(); });

  form.arquivoVideo.addEventListener('change', async () => {
    const arquivo = form.arquivoVideo.files[0];
    if (!arquivo) return;
    const ext = (arquivo.name.split('.').pop() || '').toLowerCase();
    const tipo = EXTENSAO[arquivo.type] ? arquivo.type : TIPO_POR_EXTENSAO[ext];
    edicao.arquivoVideo = null;
    atualizarZonaVideo();
    if (!tipo) {
      dica('dicaArquivo', 'Esse formato não é aceito. Use um vídeo MP4, MOV ou WEBM.', 'ruim');
      form.arquivoVideo.value = '';
      return;
    }
    if (arquivo.size > LIMITE_VIDEO) {
      dica('dicaArquivo', `Esse vídeo tem ${mb(arquivo.size)} e o limite é 50 MB. Dica: publique no YouTube (pode ser como "não listado") e use a opção "Colar um link".`, 'ruim');
      form.arquivoVideo.value = '';
      return;
    }
    edicao.arquivoVideo = arquivo;
    edicao.tipoVideo = tipo;
    atualizarZonaVideo();
    dica('dicaArquivo', `✓ ${arquivo.name} (${mb(arquivo.size)}) pronto para enviar.`, 'bom');

    const temCapaEscolhida = (edicao.capaBlob && !edicao.capaAuto) || (edicao.original?.capa_url && !edicao.tirarCapa);
    if (!temCapaEscolhida) {
      const quadro = await capturarQuadro(arquivo);
      if (quadro && edicao?.arquivoVideo === arquivo) {
        edicao.capaBlob = quadro;
        edicao.capaAuto = true;
        atualizarCapa();
      }
    }
  });

  form.arquivoCapa.addEventListener('change', async () => {
    const arquivo = form.arquivoCapa.files[0];
    form.arquivoCapa.value = '';
    if (!arquivo) return;
    dica('dicaCapa', 'Preparando a foto…');
    const blob = await prepararImagem(arquivo);
    if (!blob) { dica('dicaCapa', 'Não consegui abrir essa foto. Tente um arquivo JPG ou PNG.', 'ruim'); return; }
    edicao.capaBlob = blob;
    edicao.capaAuto = false;
    edicao.tirarCapa = false;
    atualizarCapa();
  });

  $('#btnTirarCapa').addEventListener('click', () => {
    if (edicao.capaBlob) { edicao.capaBlob = null; edicao.capaAuto = false; } else edicao.tirarCapa = true;
    atualizarCapa();
  });

  // Destaque ao arrastar arquivos para as áreas de envio
  $$('.soltar').forEach((zona) => {
    ['dragenter', 'dragover'].forEach((ev) => zona.addEventListener(ev, () => zona.classList.add('arrastando')));
    ['dragleave', 'drop'].forEach((ev) => zona.addEventListener(ev, () => zona.classList.remove('arrastando')));
  });

  $$('[data-fechar]', editor).forEach((b) => b.addEventListener('click', () => { if (!salvando) editor.close(); }));
  editor.addEventListener('cancel', (e) => { if (salvando) e.preventDefault(); });
  editor.addEventListener('close', () => { if (previaUrl) { URL.revokeObjectURL(previaUrl); previaUrl = ''; } });

  function progresso(texto, fracao) {
    $('#progresso').hidden = false;
    $('#progressoTexto').textContent = fracao == null ? texto : `${texto}… ${Math.round(fracao * 100)}%`;
    $('#progressoBarra').style.width = `${Math.round((fracao ?? 1) * 100)}%`;
  }

  function validar() {
    const modo = modoAtual();
    const orig = edicao.original;
    if (!form.titulo.value.trim()) return ['Dê um nome para o trabalho.', form.titulo];
    if (!form.categoria.value) return ['Escolha uma categoria.', $('[name="categoria"]', form)];
    if (modo === 'link') {
      const link = form.link.value.trim();
      if (!link) return ['Cole o link do vídeo (ou escolha outra opção).', form.link];
      if (!Maari.analisarVideo(link)) return ['Não reconheci o link do vídeo.', form.link];
    }
    if (modo === 'arquivo' && !edicao.arquivoVideo && !Maari.caminhoNoBucket(orig?.video_url)) {
      return ['Escolha o arquivo de vídeo.', form.arquivoVideo];
    }
    const temCapa = edicao.capaBlob || (orig?.capa_url && !edicao.tirarCapa);
    if (modo === 'nenhum' && !temCapa) return ['Sem vídeo, é preciso escolher uma foto.', form.arquivoCapa];
    return null;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (salvando) return;
    const erro = $('#erroEditor');
    erro.textContent = '';
    const problema = validar();
    if (problema) { erro.textContent = problema[0]; problema[1]?.focus(); return; }

    salvando = true;
    const btn = $('#btnSalvar');
    ocupado(btn, true, 'Salvando…');
    $$('[data-fechar]', editor).forEach((b) => { b.disabled = true; });

    const orig = edicao.original;
    const modo = modoAtual();
    const enviados = [];
    try {
      let videoUrl = null;
      if (modo === 'link') videoUrl = form.link.value.trim();
      else if (modo === 'arquivo') {
        if (edicao.arquivoVideo) {
          const r = await enviarArquivo(edicao.arquivoVideo, 'videos', edicao.tipoVideo, (p) => progresso('Enviando o vídeo', p));
          enviados.push(r.url);
          videoUrl = r.url;
        } else videoUrl = orig.video_url;
      }

      let capaUrl = orig?.capa_url || null;
      if (edicao.capaBlob) {
        const r = await enviarArquivo(edicao.capaBlob, 'capas', 'image/jpeg', (p) => progresso('Enviando a foto', p));
        enviados.push(r.url);
        capaUrl = r.url;
      } else if (edicao.tirarCapa) capaUrl = null;

      progresso('Salvando', null);
      const dados = {
        titulo: form.titulo.value.trim(),
        categoria: form.categoria.value,
        formato: form.formato.value,
        visivel: form.visivel.checked,
        video_url: videoUrl,
        capa_url: capaUrl,
      };
      let resposta;
      if (orig) resposta = await sb.from('trabalhos').update(dados).eq('id', orig.id);
      else {
        dados.ordem = Math.min(0, ...trabalhos.map((t) => t.ordem)) - 1; // novo trabalho entra no topo
        resposta = await sb.from('trabalhos').insert(dados);
      }
      if (resposta.error) throw resposta.error;

      // Apaga arquivos antigos que foram substituídos
      if (orig) {
        const antigos = [orig.video_url, orig.capa_url].filter((u) => u && u !== videoUrl && u !== capaUrl);
        apagarArquivos(antigos);
      }

      salvando = false;
      editor.close();
      avisar(dados.visivel ? 'Salvo! Já está no site.' : 'Salvo! (escondido do site por enquanto)');
      carregarTrabalhos();
    } catch (err) {
      erro.textContent = traduzirErro(err);
      $('#progresso').hidden = true;
      apagarArquivos(enviados); // não deixa arquivo solto se o salvamento falhou
    } finally {
      salvando = false;
      ocupado(btn, false);
      $$('[data-fechar]', editor).forEach((b) => { b.disabled = false; });
    }
  });

  $('#btnNovo').addEventListener('click', () => abrirEditor());

  // ---------- Fotos do site ----------
  let slotAlvo = null;

  async function carregarFotosSite() {
    const { data, error } = await sb.from('fotos_site').select('slot, url');
    if (error) { avisar(`Não consegui carregar as fotos do site. ${traduzirErro(error)}`, true); return; }
    fotosSite = Object.fromEntries(data.map((f) => [f.slot, f.url]));
    desenharFotos();
  }

  function desenharFotos() {
    const lista = $('#listaFotos');
    lista.replaceChildren();
    SLOTS.forEach((s) => {
      const atual = fotosSite[s.slot];
      const cartao = criar('article', 'cartao');
      cartao.dataset.slot = s.slot;
      const img = criar('div', 'cartao-img foto');
      fundo(img, atual || s.padrao);
      if (!atual) {
        const selos = criar('div', 'selos');
        const selo = criar('span', 'selo', 'Original');
        selos.append(selo);
        img.append(selos);
        const teste = new Image();
        teste.onerror = () => { selo.textContent = 'Sem foto ainda'; };
        teste.src = s.padrao;
      }
      const corpo = criar('div', 'cartao-corpo');
      corpo.append(criar('h3', '', s.nome), criar('p', '', s.onde));
      const acoes = criar('div', 'cartao-acoes');
      acoes.append(botaoAcao('foto', 'Trocar foto', `Trocar ${s.nome}`, () => {
        slotAlvo = s.slot;
        $('#arquivoFotoSite').click();
      }));
      if (atual) acoes.append(botaoAcao('desfazer', 'Voltar à original', `Voltar ${s.nome} para a original`, () => restaurarFoto(s)));
      cartao.append(img, corpo, acoes);
      lista.append(cartao);
    });
  }

  $('#arquivoFotoSite').addEventListener('change', async (e) => {
    const arquivo = e.target.files[0];
    e.target.value = '';
    const slot = slotAlvo;
    if (!arquivo || !slot) return;
    const cartao = $(`[data-slot="${slot}"]`);
    $$('button', cartao).forEach((b) => { b.disabled = true; });
    avisar('Enviando a foto…');
    try {
      const blob = await prepararImagem(arquivo);
      if (!blob) throw new Error('Não consegui abrir essa foto. Tente um arquivo JPG ou PNG.');
      const r = await enviarArquivo(blob, 'site', 'image/jpeg');
      const { error } = await sb.from('fotos_site').upsert({ slot, url: r.url, atualizado_em: new Date().toISOString() });
      if (error) { apagarArquivos([r.url]); throw error; }
      if (fotosSite[slot]) apagarArquivos([fotosSite[slot]]);
      fotosSite[slot] = r.url;
      desenharFotos();
      avisar('Foto trocada! Já está no site.');
    } catch (err) {
      avisar(traduzirErro(err), true);
      desenharFotos();
    }
  });

  async function restaurarFoto(s) {
    const sim = await confirmar(`A foto atual de "${s.nome}" será apagada e o site volta a usar a original.`, 'Voltar à original');
    if (!sim) return;
    const { error } = await sb.from('fotos_site').delete().eq('slot', s.slot);
    if (error) { avisar(traduzirErro(error), true); return; }
    apagarArquivos([fotosSite[s.slot]]);
    delete fotosSite[s.slot];
    desenharFotos();
    avisar('Pronto, voltou à foto original.');
  }
})();
