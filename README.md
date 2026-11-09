# Minha Escala — PWA 1.0.0

Calendário pessoal de trabalho a partir de uma planilha Excel da equipe.

Desenvolvido por **Vitor Santos** · **dev.vitorhugosantos@gmail.com**

## Publicar no GitHub Pages

1. Extraia o arquivo ZIP para uma pasta no computador.
2. No GitHub, crie um repositório, por exemplo `minha-escala`. Para usar GitHub Pages no plano gratuito pessoal, escolha um repositório público.
3. No repositório, abra **Add file → Upload files**.
4. Envie o **conteúdo da pasta extraída**, incluindo as pastas `assets` e `icons` e o arquivo `.nojekyll`.
5. Confira que `index.html`, `manifest.webmanifest` e `sw.js` estão na **raiz do repositório**. O ZIP não deve ser enviado como único arquivo.
6. Clique em **Commit changes** para salvar os arquivos na branch `main`.
7. Abra **Settings → Pages**.
8. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
9. Em **Branch**, escolha **main** e **/(root)**. Clique em **Save**.
10. Aguarde a conclusão da publicação. O endereço aparecerá nessa página.
11. Abra o endereço HTTPS do aplicativo e recarregue uma vez após o primeiro carregamento completo.

Exemplo de formato do endereço: `https://SEU_USUARIO.github.io/minha-escala/`. Use o endereço real mostrado pelo GitHub. O nome do repositório pode ser outro; os caminhos do aplicativo são relativos.

Se o arquivo `.nojekyll` não aparecer após o envio, use **Add file → Create new file**, digite `.nojekyll` como nome, deixe o conteúdo vazio e salve.

**Envie apenas os arquivos deste pacote ao repositório. As planilhas dos funcionários são anexadas dentro do aplicativo no dispositivo de cada pessoa.**

## Instalar no computador ou celular

- **Chrome ou Edge:** abra o endereço publicado e use **Instalar aplicativo**. Se o navegador não oferecer a janela de instalação, procure a opção de instalação no menu do próprio navegador.
- **iPhone/iPad:** abra o endereço no Safari, toque em **Compartilhar → Adicionar à Tela de Início** e confirme. Se houver a opção **Abrir como App da Web**, mantenha-a ativada.
- A instalação depende do navegador e do dispositivo. O aplicativo também funciona como site.
- Para instalar e preparar o modo offline, use o endereço HTTPS publicado. Abrir `index.html` diretamente na pasta do computador não ativa o PWA.
- Se a escala não aparecer no aplicativo instalado, anexe a planilha novamente nele.

## Usar no dia a dia

1. Clique em **Anexar planilha** e escolha o arquivo `.xlsx` enviado pela empresa.
2. Na primeira vez, escolha seu nome como ele aparece na lista.
3. Consulte o mês no calendário ou em **Lista**.
4. Toque em um dia para ver a atividade, o horário, a equipe e as observações.
5. Ao receber uma nova revisão, anexe o novo arquivo. A nova importação substitui a escala exibida e não acumula plantões duplicados.

## Regras preservadas

- Leitura do modelo de Excel analisado da empresa, procurando o funcionário em todas as equipes e abas.
- Diurno: **07h00 às 19h00**.
- Noturno: **19h00 às 07h00 do dia seguinte**, inclusive na mudança de mês ou ano.
- Fuso: **America/Fortaleza**.
- Treinamentos mantêm 12 horas de turno.
- O texto após o hífen é preservado no calendário e nos detalhes.
- Nomes tachados representam **ausência**. O motivo permanece visível e o registro não soma horas nem plantões ativos.
- **BH** significa **Banco de Horas**, inclusive quando vier sem hífen.
- Siglas não reconhecidas são exibidas como observações, sem inventar seu significado.
- Quando só parte do nome estiver tachada ou a identificação for ambígua, o aplicativo pede conferência.
- Uma ocorrência de treinamento e outra regular no mesmo horário são reunidas quando compatíveis.
- Registros fora do mês principal aparecem nas datas corretas. Mês parcialmente coberto não permite concluir que todos os dias sem registro são folga.
- Os apoios de 24/11/2026 e 02/12/2026 confirmados para Vitor Hugo foram preservados.

## Dados e funcionamento offline

O processamento do Excel acontece no navegador. Não há login, servidor de dados, integração com agenda, analytics ou envio da planilha para um serviço externo.

O nome escolhido e a última escala ficam no armazenamento local do navegador. Trocar de celular, trocar de navegador ou limpar os dados do site não transfere a escala. Não há backup automático. Basta importar o Excel novamente.

Depois do primeiro acesso completo com internet, os arquivos do aplicativo ficam em cache. O modo offline permite abrir o aplicativo, consultar a última escala e importar um Excel que já esteja salvo no dispositivo. O navegador pode remover dados locais por configurações de privacidade ou falta de espaço.

## Arquivos principais

| Arquivo/pasta | Função |
| --- | --- |
| `index.html` | Tela inicial e estrutura da aplicação |
| `assets/styles.css` | Cores, modo escuro e layout responsivo |
| `assets/core.js` | Leitura e interpretação do Excel |
| `assets/app.js` | Calendário, funcionário e dados locais |
| `assets/pwa.js` | Instalação e aviso de atualização |
| `assets/vendor/` | Descompactação local do Excel e licença |
| `manifest.webmanifest` | Nome, ícones e comportamento de instalação |
| `sw.js` | Cache e funcionamento offline |
| `icons/` | Ícones do aplicativo, incluindo versões maskable |
| `.nojekyll` | Publicação dos arquivos estáticos no GitHub Pages |
| `GUIA_PUBLICACAO.html` | Guia visual para abrir no navegador |

Não há dependências a instalar, build a executar ou chaves a configurar para publicar este pacote.

## Atualizações futuras

1. Preserve o mesmo repositório e endereço para manter o armazenamento local no mesmo site.
2. Antes de publicar arquivos modificados, altere `VERSION` no início de `sw.js`, por exemplo de `1.0.0` para `1.0.1`.
3. Atualize a versão exibida no rodapé de `index.html` e publique os arquivos atualizados.
4. O aplicativo avisa quando a nova versão estiver pronta. O usuário escolhe **Atualizar app**; a escala local é preservada.
5. Ao incluir um novo arquivo essencial ao aplicativo, acrescente seu caminho relativo à lista `FILES` de `sw.js`.

## Conferir após publicar

- Abra o endereço HTTPS sem erro 404 e confira o autor e o e-mail no rodapé.
- Importe uma planilha real e confira um plantão diurno, um noturno e um treinamento.
- Confira uma ausência com nome tachado e seu motivo; confirme que não somou 12 horas.
- Feche e reabra o aplicativo e confira a última escala.
- Instale no dispositivo e confira novamente. A interface da instalação varia por navegador.
- Após o primeiro carregamento completo, ative o modo avião, reabra o aplicativo e confira a última escala.

## Referências oficiais

- [Configurar a publicação no GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Criar um site GitHub Pages e usar .nojekyll](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Requisitos de instalação de PWA — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [Adicionar um app da web no iPhone — Apple](https://support.apple.com/guide/iphone/iphea86e5236/ios)

Biblioteca de terceiros: Pako (MIT/Zlib); arquivo e licença preservados em `assets/vendor/`.
