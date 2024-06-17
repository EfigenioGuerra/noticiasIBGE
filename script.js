document.addEventListener('DOMContentLoaded', () => {
    let paginaAtual = 1;
    const iconeFiltro = document.getElementById('iconeFiltro');
    const modalFiltro = document.getElementById('modalFiltro');
    const botaoFecharModal = document.getElementById('fecharModal');
    const formularioFiltro = document.getElementById('formularioFiltro');
    const listaNoticias = document.getElementById('listaNoticias');
    const contagemFiltrosAtivos = document.getElementById('contagemFiltrosAtivos');
    const paginacao = document.getElementById('paginacao');

    iconeFiltro.addEventListener('click', () => {
        aplicarQueryStringNosInputs();
        modalFiltro.showModal();
    });

    botaoFecharModal.addEventListener('click', () => {
        modalFiltro.close();
    });

    formularioFiltro.addEventListener('submit', (e) => {
        e.preventDefault();
        paginaAtual = 1;
        aplicarFiltros();
        modalFiltro.close();
    });

    document.getElementById('formularioBusca').addEventListener('submit', (e) => {
        e.preventDefault();
        const buscaTermo = document.getElementById('inputBusca').value.trim();
        if (buscaTermo !== '') {
            window.location.href = `${window.location.pathname}?busca=${buscaTermo}`;
        }
    })

    function aplicarQueryStringNosInputs() {
        const params = new URLSearchParams(window.location.search);
        document.getElementById('inputBusca').value = params.get('busca') || '';
        document.getElementById('quantidade').value = params.get('quantidade') || '10';
        document.getElementById('dataDe').value = params.get('dataDe') || '';
        document.getElementById('dataAte').value = params.get('dataAte') || '';
    }

    function atualizarContagemFiltrosAtivos() {
        const params = new URLSearchParams(window.location.search);
        const chavesFiltros = ['busca', 'quantidade', 'dataDe', 'dataAte'];
        const contagemFiltros = chavesFiltros.reduce((contagem, chave) => {
            if (chave !== 'page') {
                return params.has(chave) && params.get(chave) ? contagem + 1 : contagem;
            }
            return contagem;
        }, 0);
        contagemFiltrosAtivos.textContent = contagemFiltros;
    }

    async function buscarNoticias(pagina = 1) {
        try {
            const params = new URLSearchParams(window.location.search);
            params.set('page', pagina);
            const response = await fetch(`https://servicodados.ibge.gov.br/api/v3/noticias?${params}`);

            if (!response.ok) {
                throw new Error(`Erro HTTP! status: ${response.status}`);
            }

            const data = await response.json();
            exibirNoticias(data.items);
            configurarPaginacao(data.totalPages, pagina);
        } catch (error) {
            console.error('Erro ao buscar notícias:', error);
        }
    }

    function exibirNoticias(noticias) {
        listaNoticias.innerHTML = '';
        noticias.forEach(item => {
            const imagens = JSON.parse(item.imagens);
            const urlImagem = imagens.image_intro ? `https://agenciadenoticias.ibge.gov.br/${imagens.image_intro}` : '';

            const itemNoticia = document.createElement('li');
            itemNoticia.innerHTML = `
                ${urlImagem ? `<img src="${urlImagem}" alt="${item.titulo}">` : ''}
                <h2>${item.titulo}</h2>
                <p>${item.introducao} <button class="botao-leia-mais" link="${item.link}">Leia Mais</button></p>
                <p>${formatarEditorias(item.editorias)}</p>
                <p>Publicado ${formatarData(item.data_publicacao)}</p>
            `;
            listaNoticias.appendChild(itemNoticia);
        });
    }

    listaNoticias.addEventListener('click', (event) => {
        const botaoLeiaMais = event.target.closest('.botao-leia-mais');
        if (botaoLeiaMais) {
            const link = botaoLeiaMais.getAttribute('link');
            if (link) {
                window.open(link, '_blank');
            }
        }
    });

    function formatarEditorias(editorias) {
        if (Array.isArray(editorias)) {
            return editorias.map(editoria => `#${editoria.nome}`).join(', ');
        } else if (typeof editorias === 'string') {
            return `#${editorias}`;
        } else {
            return '';
        }
    }

    function formatarData(dataStr) {
        const data = new Date(dataStr);
        const agora = new Date();
        const diferencaTempo = Math.abs(agora - data);
        const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));
        if (diferencaDias === 1) return 'hoje';
        if (diferencaDias === 2) return 'ontem';
        return `há ${diferencaDias} dias`;
    }

    function aplicarFiltros() {
        const params = new URLSearchParams(new FormData(formularioFiltro));
        window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
        atualizarContagemFiltrosAtivos();
        buscarNoticias();
    }

    function configurarPaginacao(totalPaginas, paginaAtual) {
        paginacao.innerHTML = '';
        const maxBotoes = 10;
        let paginaInicial = Math.max(1, paginaAtual - Math.floor(maxBotoes / 2));
        let paginaFinal = paginaInicial + maxBotoes - 1;

        if (paginaFinal > totalPaginas) {
            paginaFinal = totalPaginas;
            paginaInicial = Math.max(1, paginaFinal - maxBotoes + 1);
        }

        for (let pagina = paginaInicial; pagina <= paginaFinal; pagina++) {
            const botaoPagina = document.createElement('button');
            botaoPagina.textContent = pagina;
            if (pagina === paginaAtual) {
                botaoPagina.disabled = true;
                botaoPagina.classList.add('active');
            }
            botaoPagina.addEventListener('click', () => {
                paginaAtual = pagina;
                buscarNoticias(pagina);
            });
            paginacao.appendChild(botaoPagina);
        }
    }


    atualizarContagemFiltrosAtivos();
    aplicarQueryStringNosInputs();
    buscarNoticias();
    ;
});
