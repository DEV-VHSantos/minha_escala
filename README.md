# Minha Escala — PWA 1.0.2

Calendário pessoal de trabalho a partir de uma planilha Excel da equipe.

Desenvolvido por **Vitor Santos** · **dev.vitorhugosantos@gmail.com**

## Atualizar seu aplicativo existente para 1.0.4

1. Extraia este ZIP e abra o mesmo repositório que você já usa.
2. Em **Add file → Upload files**, envie o conteúdo extraído inteiro, incluindo as pastas **assets** e **icons**. Mantenha os mesmos nomes e caminhos; o novo arquivo `assets/team.js` também precisa ser enviado.
3. Salve em **Commit changes** e aguarde a publicação do GitHub Pages.
4. Abra o aplicativo conectado à internet. Se aparecer **Uma nova versão está pronta**, toque em **Atualizar app**. Confira **1.0.4** no rodapé. Se o aviso não aparecer, feche e abra novamente.
5. A escala e a equipe já salvas na versão 1.0.2 são preservadas. Ao importar a próxima revisão do mesmo mês, o campo **Alterações na escala**, abaixo do resumo mensal, mostra a comparação por funcionário. Se não houver uma planilha anterior salva, importe primeiro a versão anterior e depois a nova. Quem ainda usa 1.0.1 deve anexar a planilha uma vez para salvar a equipe inteira.
6. Feche e reabra. Use **Trocar funcionário**: a lista da última planilha estará disponível sem anexar novamente.

Não limpe os dados do navegador nem desinstale o PWA para atualizar.

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
3. Consulte o mês no calendário ou em **Lista**. Os cinco cartões de resumo ficam abaixo do calendário, antes dos detalhes no celular.
4. Toque em um dia para ver a atividade, o horário, a equipe e as observações.
5. Use **Trocar funcionário** para consultar outra pessoa, inclusive após fechar e reabrir o PWA. Os ajustes feitos em **Conferir registro** são mantidos ao trocar de pessoa.
6. Ao receber uma nova revisão, anexe o novo arquivo. A última planilha atualiza o calendário sem acumular plantões duplicados e a anterior fica como base da comparação; os ajustes manuais da revisão anterior precisam ser conferidos novamente. Se algum funcionário não puder ser validado, ele fica marcado na lista como leitura pendente, com a causa, e não recebe um calendário inventado.

## Equipe do dia

A seção **Equipe do dia** fica abaixo do resumo mensal, antes da comparação de revisões. Ela consulta a última planilha importada, independentemente do funcionário selecionado para o calendário pessoal.

- Clique em **Ver equipe de hoje** para consultar a data atual em America/Fortaleza.
- Toque em um dia do calendário ou escolha uma data no campo **Data da consulta**. O calendário, seus detalhes e a equipe acompanham essa data.
- Veja o nome da equipe e os colaboradores do turno **diurno (07h00–19h00)** e do **noturno (19h00–07h00 do dia seguinte)**. Os turnos são agrupados pela data de início; o término do noturno é informado com a data correta.
- Observações, treinamentos e apoios aparecem junto ao colaborador. Nomes tachados ficam separados como **ausências**; registros ambíguos aparecem como **Conferir**, sem entrar na contagem de previstos.
- Os ajustes manuais de interpretação realizados neste aparelho também aparecem nesta consulta. A comparação entre arquivos continua usando os dados de origem, como antes.
- Datas fora da cobertura e turnos não identificados não geram equipes presumidas. Se algum colaborador tiver falha de leitura, a seção avisa que a relação pode estar incompleta.
- Os dados salvos em 1.0.2/1.0.3 continuam disponíveis. Anexe a planilha **uma vez após atualizar** para guardar também todos os cabeçalhos de equipe e turno. Antes disso, a consulta usa os registros já disponíveis e sinaliza a cobertura não verificada. Se somente a escala individual estiver salva, será necessário reanexar para consultar a equipe inteira.

Os dados continuam salvos somente neste aparelho e disponíveis sem anexar novamente. O PWA não registra presença real; mostra o que está previsto na planilha.

## Ver o que mudou em uma revisão

1. Mantenha a escala anterior salva no aplicativo e importe a nova revisão do **mesmo mês**.
2. Escolha o colaborador em **Trocar funcionário**.
3. Abaixo dos cartões de resumo, consulte **Alterações na escala**: revisões comparadas, nomes dos arquivos, quantidades de registros adicionados, alterados, removidos e mantidos.
4. Nos registros alterados, compare **Antes** e **Agora**: data, equipe, turno, horários, atividade, observação e presença/ausência. **Ver dia** abre a data no calendário.
5. Funcionários novos recebem a indicação de que não apareciam na versão anterior. Quem deixou de aparecer continua na seleção, marcado como **ausente na nova planilha**, para consultar os registros retirados. A ausência do nome não confirma folga.

A comparação fica salva neste aparelho e acompanha a troca de funcionário. Reanexar o mesmo conteúdo e revisão mantém a última comparação, mesmo se o arquivo tiver sido renomeado. Outra revisão passa a ser comparada com a última importação anterior. Não há histórico completo de todas as revisões.

**Limites da comparação:**

- Meses diferentes não são tratados como revisões um do outro.
- Uma mudança de data aparece como remoção e inclusão, sem tentar adivinhar que se trata do mesmo plantão.
- Leitura pendente ou cobertura incompleta produz uma diferença **sem confirmação**. Uma ausência de registro só é classificada como remoção confirmada quando a nova versão cobre integralmente o mês principal daquela data. Registros fora do mês principal sem correspondência ficam para conferência.
- Se a leitura de um funcionário falhou em uma das versões, as mudanças dele não são confirmadas.
- Ajustes manuais continuam disponíveis no calendário. A partir de 1.0.3, o relatório compara cópias dos dados **extraídos dos arquivos**, separadas dos ajustes. A base migrada de 1.0.2 pode incluir ajustes feitos anteriormente; o aplicativo avisa nesse caso.
- Se um mês novo for importado, a comparação anterior é substituída. Para comparar duas revisões, elas precisam ser importadas em sequência neste aparelho.

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

As escalas extraídas de **todos os funcionários da última planilha**, as observações, as ausências, o nome do arquivo, o período, a revisão, a data de importação e os ajustes manuais ficam no **IndexedDB**, um banco de dados do próprio navegador. O Excel original não é guardado pelo PWA e não é modificado. O último funcionário selecionado também é lembrado. A base da importação anterior e a comparação mais recente ficam no mesmo armazenamento local; os arquivos Excel originais não são guardados.

O salvamento reúne a planilha inteira em uma transação. Há uma segunda cópia dos dados no armazenamento local do mesmo navegador (`localStorage`), usada se o banco estiver indisponível. **Essa segunda cópia não é um backup externo** e também é removida ao limpar os dados do site. O aplicativo só informa que salvou depois de concluir o salvamento; falhas aparecem na tela. Se o navegador não permitir salvar, a troca de funcionários ainda funciona na sessão aberta, mas será necessário reimportar depois de fechar.

O aplicativo solicita ao navegador a persistência do armazenamento quando disponível. O navegador pode conceder ou negar. Isso não impede a remoção manual dos dados e não garante recuperação após perda do aparelho. Trocar de celular, trocar de navegador ou limpar os dados do site exige uma nova importação. Não existe sincronização entre dispositivos nem backup na nuvem. Cada aparelho precisa importar sua própria cópia da planilha.

Na primeira atualização a partir de 1.0.1, a escala individual já salva é preservada. Como aquela versão não guardava os outros funcionários, anexe o Excel uma vez para habilitar a troca após reabrir.

Depois do primeiro acesso completo com internet, os arquivos do aplicativo ficam em cache. O modo offline permite abrir o aplicativo, consultar a última escala e importar um Excel que já esteja salvo no dispositivo. O navegador pode remover dados locais por configurações de privacidade ou falta de espaço.

## Arquivos principais

| Arquivo/pasta | Função |
| --- | --- |
| `index.html` | Tela inicial e estrutura da aplicação |
| `assets/styles.css` | Cores, modo escuro e layout responsivo |
| `assets/core.js` | Leitura e interpretação do Excel |
| `assets/app.js` | Calendário, funcionários e ajustes de interpretação |
| `assets/storage.js` | IndexedDB, cópia local de recuperação e persistência |
| `assets/changes.js` | Comparação das revisões por funcionário |
| `assets/team.js` | Equipes e colaboradores dos dois turnos por data |
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
2. Antes de publicar arquivos modificados, altere `VERSION` no início de `sw.js`, por exemplo de `1.0.4` para `1.0.5`.
3. Atualize a versão exibida no rodapé de `index.html` e publique os arquivos atualizados.
4. O aplicativo avisa quando a nova versão estiver pronta. O usuário escolhe **Atualizar app**; a escala local é preservada.
5. Ao incluir um novo arquivo essencial ao aplicativo, acrescente seu caminho relativo à lista `FILES` de `sw.js`.

## Conferir após publicar

- Abra o endereço HTTPS sem erro 404 e confira o autor e o e-mail no rodapé.
- Importe uma planilha real e confira um plantão diurno, um noturno e um treinamento.
- Confira uma ausência com nome tachado e seu motivo; confirme que não somou 12 horas.
- Feche e reabra o aplicativo e confira a última escala.
- Toque em **Trocar funcionário** e selecione outra pessoa sem anexar novamente.
- Faça um ajuste de interpretação, troque de pessoa e volte para conferir que o ajuste foi mantido.
- Importe uma revisão real do mesmo mês e confira as alterações de dois funcionários diferentes no campo abaixo do calendário.
- Reabra e confirme que a comparação continua disponível.
- Reanexe a mesma revisão e confirme que o relatório anterior foi mantido.
- Instale no dispositivo e confira novamente. A interface da instalação varia por navegador.
- Após o primeiro carregamento completo, ative o modo avião, reabra o aplicativo e confira a última escala.

## Referências oficiais

- [Configurar a publicação no GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Criar um site GitHub Pages e usar .nojekyll](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Requisitos de instalação de PWA — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [Adicionar um app da web no iPhone — Apple](https://support.apple.com/guide/iphone/iphea86e5236/ios)

Biblioteca de terceiros: Pako (MIT/Zlib); arquivo e licença preservados em `assets/vendor/`.

## Validação da versão 1.0.4

Leitura de 25 colaboradores e 64 blocos de equipe/turno validada com a planilha de referência. Todos os eventos extraídos mantiveram o resultado da versão anterior. Conferidos NR35, apoio, BH, ENEM, dados persistidos e virada de ano. A prévia visual do navegador foi bloqueada pelo ambiente de desenvolvimento; confira o layout e os controles no endereço publicado, no computador e no iPhone.
