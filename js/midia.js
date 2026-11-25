// Funções usadas pelo site e pelo painel: conexão, categorias e leitura de links de vídeo
(function () {
  const cfg = window.MAARI_CONFIG || {};
  const url = String(cfg.supabaseUrl || '').trim().replace(/\/+$/, '');
  const chave = String(cfg.supabaseAnonKey || '').trim();
  const bucket = 'midia';
  const prefixoPublico = `${url}/storage/v1/object/public/${bucket}/`;

  // Reconhece links de YouTube, Vimeo, Instagram, TikTok, Google Drive e arquivos enviados
  // Devolve { tipo: 'iframe' | 'arquivo', provedor, src, vertical, thumb } ou null
  function analisarVideo(link) {
    if (!link) return null;
    let u;
    try { u = new URL(String(link).trim()); } catch { return null; }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    const host = u.hostname.toLowerCase().replace(/^(www|m)\./, '');
    const caminho = u.pathname;

    // YouTube
    let yt = null;
    let ytVertical = false;
    if (host === 'youtu.be') yt = caminho.split('/')[1];
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
      if (caminho === '/watch') yt = u.searchParams.get('v');
      else {
        const m = caminho.match(/^\/(embed|shorts|live|v)\/([\w-]+)/);
        if (m) { yt = m[2]; ytVertical = m[1] === 'shorts'; }
      }
    }
    if (yt && /^[\w-]{6,20}$/.test(yt)) {
      return {
        tipo: 'iframe', provedor: 'YouTube', src: `https://www.youtube.com/embed/${yt}`, vertical: ytVertical,
        thumb: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,          // sempre existe (com faixas pretas)
        thumbGrande: `https://i.ytimg.com/vi/${yt}/maxresdefault.jpg`, // HD sem faixas, nem todo vídeo tem
      };
    }

    // Vimeo (inclui vídeos não listados: vimeo.com/123456/abcdef)
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const m = caminho.match(/\/(\d{5,})(?:\/([0-9a-f]{6,}))?/);
      if (m) {
        const h = m[2] || u.searchParams.get('h');
        return { tipo: 'iframe', provedor: 'Vimeo', src: `https://player.vimeo.com/video/${m[1]}${h ? `?h=${encodeURIComponent(h)}` : ''}`, vertical: false, thumb: '' };
      }
    }

    // Instagram (post, reel ou IGTV)
    if (host === 'instagram.com') {
      const m = caminho.match(/^\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/);
      if (m) {
        const tipo = m[1] === 'reels' ? 'reel' : m[1];
        return { tipo: 'iframe', provedor: 'Instagram', src: `https://www.instagram.com/${tipo}/${m[2]}/embed`, vertical: true, thumb: '' };
      }
    }

    // TikTok
    if (host === 'tiktok.com') {
      const m = caminho.match(/\/video\/(\d+)/);
      if (m) return { tipo: 'iframe', provedor: 'TikTok', src: `https://www.tiktok.com/embed/v2/${m[1]}`, vertical: true, thumb: '' };
    }

    // Google Drive (o arquivo precisa estar compartilhado como "qualquer pessoa com o link")
    if (host === 'drive.google.com') {
      const m = caminho.match(/\/file\/d\/([\w-]+)/);
      const id = m ? m[1] : u.searchParams.get('id');
      if (id && /^[\w-]{10,}$/.test(id)) {
        return { tipo: 'iframe', provedor: 'Google Drive', src: `https://drive.google.com/file/d/${id}/preview`, vertical: false, thumb: '' };
      }
    }

    // Arquivo de vídeo enviado pelo painel (ou qualquer .mp4/.webm/.mov direto)
    if ((url && u.href.startsWith(prefixoPublico)) || /\.(mp4|webm|mov|m4v)$/i.test(caminho)) {
      return { tipo: 'arquivo', provedor: 'Arquivo', src: u.href, vertical: false, thumb: '' };
    }

    return null;
  }

  window.Maari = {
    configurado: Boolean(url && chave),
    url,
    chave,
    bucket,
    categorias: { marcas: 'Marca', casamentos: 'Casamento', eventos: 'Evento', reels: 'Reels' },
    urlPublica: (caminho) => prefixoPublico + caminho,
    // Caminho dentro do bucket, se a URL for de um arquivo nosso (para poder apagar)
    caminhoNoBucket: (link) => (url && link && link.startsWith(prefixoPublico) ? decodeURIComponent(link.slice(prefixoPublico.length)) : null),
    analisarVideo,
  };
})();
