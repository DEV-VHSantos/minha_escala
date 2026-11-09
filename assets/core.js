/* Minha Escala • leitura local de Excel para calendário por funcionário. */
(() => {
  'use strict';
  const DAY = 86400000;
  const TZ = 'America/Fortaleza';
  const normalize = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const iso = d => d.toISOString().slice(0, 10);
  const addDays = (date, count) => iso(new Date(Date.parse(date + 'T12:00:00Z') + count * DAY));
  const monthOf = date => date.slice(0, 7);
  const idFor = (date, person) => normalize(person) + '|' + date;
  const times = (date, shift) => ({start: date + (shift === 'night' ? 'T19:00:00-03:00' : 'T07:00:00-03:00'), end: (shift === 'night' ? addDays(date, 1) : date) + (shift === 'night' ? 'T07:00:00-03:00' : 'T19:00:00-03:00'), timeZone: TZ});
  const daysInMonth = m => new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 0)).getUTCDate();
  const approvedSupport = new Set(['2026-11-24', '2026-12-02']);
  function validateEvents(events) {
    const keys = new Set();
    for (const e of events) {
      if (!/^20\d{2}-\d{2}-\d{2}$/.test(e.date) || iso(new Date(e.date + 'T12:00Z')) !== e.date) throw Error('Há uma data inválida na escala.');
      if (!['day', 'night'].includes(e.shift)) throw Error('Há um turno não identificado.');
      if ((Date.parse(e.end) - Date.parse(e.start)) / 3600000 !== 12) throw Error('Foi identificado um evento com duração diferente de 12 horas.');
      if (keys.has(e.id)) throw Error('Há dois turnos diferentes no mesmo dia. Revise a planilha antes de continuar.');
      keys.add(e.id);
    }
  }
  function crc32(bytes) {
    let crc = -1;
    for (const b of bytes) {crc ^= b; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);}
    return (crc ^ -1) >>> 0;
  }
  function zipReader(buffer) {
    const data = new Uint8Array(buffer), view = new DataView(buffer), decoder = new TextDecoder();
    if (data.length < 22 || data.length > 8 * 1024 * 1024) throw Error('Escolha uma planilha .xlsx com até 8 MB.');
    let end = -1;
    for (let i = data.length - 22; i >= Math.max(0, data.length - 65557); i--) if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === data.length) {end = i; break;}
    if (end < 0) throw Error('O arquivo não é um Excel .xlsx válido ou está corrompido.');
    const count = view.getUint16(end + 10, true), start = view.getUint32(end + 16, true);
    if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || count > 500 || start >= end) throw Error('Este formato de arquivo Excel não é compatível com o protótipo.');
    const entries = new Map(); let offset = start, total = 0;
    for (let i = 0; i < count; i++) {
      if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) throw Error('A estrutura interna do Excel está incompleta.');
      const flags = view.getUint16(offset + 8, true), method = view.getUint16(offset + 10, true), crc = view.getUint32(offset + 16, true), size = view.getUint32(offset + 20, true), expanded = view.getUint32(offset + 24, true);
      const len = view.getUint16(offset + 28, true), extra = view.getUint16(offset + 30, true), comment = view.getUint16(offset + 32, true), pos = view.getUint32(offset + 42, true);
      if (flags & 1) throw Error('Arquivos protegidos por senha não são compatíveis.');
      if (offset + 46 + len + extra + comment > end) throw Error('O Excel possui um índice interno inválido.');
      const name = decoder.decode(data.subarray(offset + 46, offset + 46 + len));
      if (entries.has(name) || name.includes('..') || name.startsWith('/')) throw Error('O Excel possui caminhos internos inválidos.');
      total += expanded;
      if (expanded > 12 * 1024 * 1024 || total > 30 * 1024 * 1024) throw Error('A planilha é muito grande após a descompactação. Limite: 30 MB.');
      entries.set(name, {method, crc, size, expanded, pos}); offset += 46 + len + extra + comment;
    }
    return name => {
      const e = entries.get(name); if (!e) return null;
      if (e.pos + 30 > data.length || view.getUint32(e.pos, true) !== 0x04034b50) throw Error('Um componente do Excel está corrompido.');
      const body = e.pos + 30 + view.getUint16(e.pos + 26, true) + view.getUint16(e.pos + 28, true);
      if (body + e.size > data.length) throw Error('O arquivo Excel foi truncado.');
      const compressed = data.subarray(body, body + e.size); let bytes;
      if (e.method === 0) bytes = compressed;
      else if (e.method === 8) {
        const inflater = new pako.Inflate({raw: true, chunkSize: 65536});
        const chunks = []; let length = 0;
        inflater.onData = chunk => {length += chunk.length; if (length > e.expanded || length > 12 * 1024 * 1024) throw Error('O arquivo excedeu o tamanho esperado.'); chunks.push(chunk);};
        inflater.push(compressed, true);
        if (inflater.err) throw Error('Não foi possível descompactar a planilha.');
        bytes = new Uint8Array(length); let cursor = 0;
        for (const chunk of chunks) {bytes.set(chunk, cursor); cursor += chunk.length;}
      } else throw Error('Método de compactação não suportado. Salve o arquivo como .xlsx no Excel.');
      if (bytes.length !== e.expanded || crc32(bytes) !== e.crc) throw Error('A integridade do Excel não pôde ser confirmada.');
      return decoder.decode(bytes);
    };
  }
  const tags = (el, name) => [...el.getElementsByTagNameNS('*', name)];
  const child = (el, name) => [...el.children].find(e => e.localName === name);
  function xml(text, description) {
    if (text == null) throw Error('Falta um componente obrigatório do Excel: ' + description + '.');
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw Error('O Excel contém uma estrutura XML não suportada.');
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (tags(doc, 'parsererror').length) throw Error('O Excel contém XML inválido: ' + description + '.');
    return doc;
  }
  const months = [['jan','janeiro'],['fev','fevereiro'],['mar','marco'],['abr','abril'],['mai','maio'],['jun','junho'],['jul','julho'],['ago','agosto'],['set','setembro'],['out','outubro'],['nov','novembro'],['dez','dezembro']];
  function metadataMonth(label) {
    const s = normalize(label), years = [...new Set(s.match(/(?<!\d)20\d{2}(?!\d)/g))];
    const matched = months.flatMap((names, i) => names.some(n => new RegExp('(^|[^a-z])' + n + '(?=$|[^a-z])').test(s)) ? [i + 1] : []);
    return years.length === 1 && matched.length === 1 ? years[0] + '-' + String(matched[0]).padStart(2, '0') : null;
  }
  function revision(label) {const m = normalize(label).match(/(?:^|[^a-z])rev\s*0*(\d+)(?!\d)/); return m ? 'REV' + m[1].padStart(2, '0') : null;}
  function activityFor(raw, date, shift, team, blue, person) {
    const name = normalize(raw), target = normalize(person), exact = name === target;
    const startsWithName = name.startsWith(target) && (!name[target.length] || /[\s–—-]/.test(name[target.length]));
    const tail = startsWithName ? name.slice(target.length).trim() : '';
    const hasSeparator = startsWithName && /^[-–—]/.test(tail);
    const annotation = exact ? '' : hasSeparator ? raw.slice(raw.search(/[-–—]/) + 1).trim() : raw.trim().split(/\s+/).slice(person.trim().split(/\s+/).length).join(' ').trim();
    const acceptedBareCode = /^(?:BH|NR\s*-?\s*\d*|PT|LOTO|APOIO)(?:\b|\/)/i.test(tail);
    const identityAmbiguous = !exact && (!startsWithName || !hasSeparator && !acceptedBareCode);
    let type = 'regular', activity = 'Plantão regular', pending = false, note = '';
    if (identityAmbiguous) {
      type = 'review'; activity = 'Identificação a confirmar'; pending = true;
      note = 'O texto contém seu nome com informação adicional sem separador. Confirme se o registro é seu.';
    } else if (/^APOIO\b/i.test(annotation)) {type = 'support'; activity = annotation;}
    else if (/^(?:NR\s*-?\s*\d*|PT|LOTO)(?:\b|\/)/i.test(annotation)) {type = 'training'; activity = annotation;}
    else if (annotation) {type = 'special'; activity = annotation;}
    else if (normalize(person) === 'vitor hugo' && approvedSupport.has(date) && team === 'A' && shift === 'day') {type = 'support'; activity = 'Apoio ao turno'; note = 'Apoio diurno confirmado por você na análise da REV01.';}
    else if (blue) {type = 'review'; activity = 'Atividade a confirmar'; pending = true; note = 'Nome destacado em azul sem indicação da atividade. Revise antes de confirmar.';}
    return {type, activity, annotation: identityAmbiguous ? '' : annotation, pending, note, identityAmbiguous};
  }
  function textRuns(node) {
    if (!node) return [];
    const runs = [...node.children].filter(n => n.localName === 'r');
    if (!runs.length) return [{text:tags(node,'t').map(t=>t.textContent).join(''), strike:undefined}];
    return runs.map(r=>{const strike=child(child(r,'rPr')||r,'strike');return {text:tags(r,'t').map(t=>t.textContent).join(''),strike:strike?!['0','false'].includes(strike.getAttribute('val')):undefined};});
  }
  function nameStrike(cell, person) {
    let text='', flags=[];
    const runs=cell.runs?.length?cell.runs:[{text:String(cell.value),strike:undefined}];
    for(const run of runs) for(const ch of run.text) {
      const normalized=normalize(ch).replace(/\s/g,'');
      for(const n of normalized){text+=n;flags.push(run.strike??cell.strike);}
    }
    const target=normalize(person).replace(/\s/g,''), start=text.indexOf(target);
    if(start<0)return {full:false,partial:false};
    const values=flags.slice(start,start+target.length);
    return {full:values.every(Boolean),partial:values.some(Boolean)&&!values.every(Boolean)};
  }
  async function parseWorkbook(file, person) {
    if (!person || normalize(person).split(' ').length < 2) throw Error('Selecione seu nome completo na lista de funcionários.');
    const escapedPerson = normalize(person).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const namePattern = new RegExp('(^|\\W)' + escapedPerson + '(?=$|\\W)');
    if (!/\.xlsx$/i.test(file.name)) throw Error('Formato não suportado. Selecione um arquivo .xlsx.');
    const get = zipReader(await file.arrayBuffer());
    const workbook = xml(get('xl/workbook.xml'), 'pasta de trabalho');
    const rels = xml(get('xl/_rels/workbook.xml.rels'), 'relações');
    const relationshipMap = new Map(tags(rels, 'Relationship').map(r => [r.getAttribute('Id'), {path: r.getAttribute('Target'), external: r.getAttribute('TargetMode') === 'External'}]));
    const stringsText = get('xl/sharedStrings.xml');
    const stringNodes = stringsText ? tags(xml(stringsText, 'textos'), 'si') : [];
    const strings = stringNodes.map(s => tags(s, 't').map(t => t.textContent).join(''));
    const stylesText = get('xl/styles.xml'), styles = stylesText ? xml(stylesText, 'formatação') : null;
    const fills = styles ? tags(styles, 'fills').flatMap(el => [...el.children]).map(el => tags(el, 'fgColor')[0]?.getAttribute('rgb')?.slice(-6).toUpperCase() || '') : [];
    const xfs = styles ? tags(styles, 'cellXfs').flatMap(el => [...el.children]).map(el => ({fill:+el.getAttribute('fillId'), font:+el.getAttribute('fontId')})) : [];
    const fontStrike = styles ? tags(styles, 'fonts').flatMap(el => [...el.children]).map(el => tags(el, 'strike').some(s => !['0','false'].includes(s.getAttribute('val')))) : [];
    const epoch = tags(workbook, 'workbookPr')[0]?.getAttribute('date1904');
    const base = Date.UTC(epoch === '1' || epoch === 'true' ? 1904 : 1899, epoch === '1' || epoch === 'true' ? 0 : 11, epoch === '1' || epoch === 'true' ? 1 : 30);
    const events = [], issues = [], coverage = new Map(), headerMonths = new Set(), sheetInfo = [], metadata = [];
    const fileMonth = metadataMonth(file.name); if (fileMonth) metadata.push(fileMonth);
    let scanned = 0, countHeaders = 0, resolvedFormulaCount = 0;
    const sheets = tags(workbook, 'sheet');
    if (!sheets.length || sheets.length > 30) throw Error('A pasta de trabalho não contém uma quantidade compatível de abas.');
    for (const sheet of sheets) {
      const name = sheet.getAttribute('name');
      const relId = sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || sheet.getAttribute('r:id');
      const relation = relationshipMap.get(relId);
      if (!relation || relation.external) throw Error('Não foi possível localizar uma aba interna do Excel.');
      const path = relation.path.startsWith('/') ? relation.path.slice(1) : 'xl/' + relation.path.replace(/^\.\//, '');
      if (path.includes('..')) throw Error('Caminho de aba não suportado. Salve uma cópia .xlsx no Excel.');
      const doc = xml(get(path), 'aba ' + name), cells = new Map(), merges = tags(doc, 'mergeCell').map(m => m.getAttribute('ref'));
      for (const el of tags(doc, 'c')) {
        if (++scanned > 120000) throw Error('A planilha contém células demais para este protótipo.');
        const address = el.getAttribute('r'), parts = address?.match(/^([A-Z]+)(\d+)$/);
        if (!parts) throw Error('Uma célula do Excel não possui endereço válido.');
        const t = el.getAttribute('t'), v = child(el, 'v')?.textContent, formula = child(el, 'f')?.textContent || '';
        let value = t === 'inlineStr' ? tags(el, 't').map(e => e.textContent).join('') : t === 's' ? strings[+v] : t === 'str' || t === 'd' || t === 'e' ? v : v === undefined || v === '' ? null : +v;
        const style = xfs[+el.getAttribute('s') || 0];
        cells.set(address, {address, col: parts[1], row: +parts[2], value, formula, type: t, blue: fills[style?.fill] === '0099FF', strike:!!fontStrike[style?.font], runs:textRuns(t==='s'?stringNodes[+v]:child(el,'is'))});
      }
      function locate(address) {
        let c = cells.get(address); if (c && (c.value != null || c.formula)) return c;
        const p = address.match(/^([A-Z]+)(\d+)$/); if (!p) return c;
        const colNum = s => [...s].reduce((n, x) => n * 26 + x.charCodeAt(0) - 64, 0);
        for (const m of merges) {
          const match = m?.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/); if (!match) continue;
          if (+p[2] >= +match[2] && +p[2] <= +match[4] && colNum(p[1]) >= colNum(match[1]) && colNum(p[1]) <= colNum(match[3])) return cells.get(match[1] + match[2]);
        }
        return c;
      }
      function numeric(address, seen = new Set()) {
        const c = locate(address); if (!c) return null;
        if (seen.has(c.address) || seen.size > 80) return null;
        if (c.formula) {
          const f = c.formula.replace(/\$/g, '').trim().match(/^=?([A-Z]+\d+)(?:\s*([+-])\s*(\d+))?$/i);
          if (f) {const next = new Set(seen); next.add(c.address); const v = numeric(f[1].toUpperCase(), next); if (typeof v === 'number') {resolvedFormulaCount++; return v + (f[2] === '-' ? -1 : 1) * +(f[3] || 0);}}
          // Never accept an unverified cached value for an unsupported date formula.
          return null;
        }
        if (c.type === 'd' && /^20\d{2}-\d{2}-\d{2}/.test(c.value)) return (Date.parse(c.value.slice(0, 10) + 'T00:00Z') - base) / DAY;
        return typeof c.value === 'number' && Number.isFinite(c.value) ? c.value : null;
      }
      const headers = [];
      for (const c of cells.values()) {
        const m = typeof c.value === 'string' && c.value.trim().match(/^Equipe\s+([A-Z0-9]+)\s*[-–—]\s*(DIA|NOITE)\s*$/i);
        if (!m) continue;
        const serial = numeric(c.col + (c.row - 1));
        const date = serial == null ? null : iso(new Date(base + Math.floor(serial) * DAY));
        if (!date || !/^20\d{2}/.test(date)) throw Error('Data não identificada acima de ' + name + '!' + c.address + '. A importação foi cancelada porque a data não pôde ser validada.');
        headers.push({...c, date, team: m[1].toUpperCase(), shift: m[2].toUpperCase() === 'DIA' ? 'day' : 'night'});
        const month = monthOf(date); headerMonths.add(month);
        if (!coverage.has(month)) coverage.set(month, new Map());
        if (!coverage.get(month).has(date)) coverage.get(month).set(date, new Set());
        coverage.get(month).get(date).add(m[2].toUpperCase()); countHeaders++;
      }
      if (headers.length) {sheetInfo.push(name); const m = metadataMonth(name); if (m) metadata.push(m);}
      for (const c of cells.values()) {
        if (typeof c.value !== 'string' || !namePattern.test(normalize(c.value))) continue;
        const preceding = headers.filter(h => h.col === c.col && h.row < c.row).sort((a, b) => b.row - a.row)[0];
        const following = preceding && headers.filter(h => h.col === c.col && h.row > preceding.row).sort((a, b) => a.row - b.row)[0];
        if (!preceding || following && c.row >= following.row - 2) throw Error('Encontrei seu nome em ' + name + '!' + c.address + ', mas não consegui associá-lo com segurança a uma data e turno.');
        const {date, team, shift} = preceding;
        const a = activityFor(c.value, date, shift, team, c.blue, person);
        const struck = nameStrike(c,person);
        if (struck.full && !a.identityAmbiguous) Object.assign(a, {pending:false,type:'absence',activity:a.annotation||'Ausência sem motivo informado',note:'Nome tachado na planilha: o colaborador não irá a este plantão. Este registro não soma horas de trabalho.'});
        else if (struck.partial) Object.assign(a,{pending:true,type:'review',activity:'Nome parcialmente tachado',note:'Somente parte do nome está tachada. Confirme se o registro representa uma ausência.'});
        const absence = a.type==='absence';
        const e = {id: idFor(date, person)+(absence?'|absence|'+shift+'|'+team:''), date, team, shift, type: a.type, activity: a.activity, annotation:a.annotation, status:absence?'absent':'scheduled', workHours:absence?0:12, strikeInSource:struck.full, ...times(date, shift), raw: c.value, pending: a.pending, note: a.note, sources: [name + '!' + c.address]};
        if (a.pending) issues.push({id: e.id, message: a.note});
        events.push(e);
      }
    }
    if (!countHeaders) throw Error('Não reconheci o modelo da escala. São necessários cabeçalhos de equipe e turno com a data acima.');
    if (!events.length) throw Error('Não encontrei ' + person + ' em nenhuma aba. Confira o nome; sua escala anterior foi preservada.');
    const uniqueMonths = [...new Set(metadata)];
    const month = uniqueMonths.length === 1 ? uniqueMonths[0] : null;
    if (!month) throw Error(uniqueMonths.length ? 'O mês indicado no arquivo diverge do mês indicado nas abas. Corrija a identificação antes de importar.' : 'Não consegui identificar mês e ano no nome do arquivo ou da aba. Use uma identificação como NOV 2026.');
    const monthCoverage = coverage.get(month) || new Map();
    const missingDays = Array.from({length: daysInMonth(month)}, (_, i) => month + '-' + String(i + 1).padStart(2, '0')).filter(d => !monthCoverage.has(d) || !monthCoverage.get(d).has('DIA') || !monthCoverage.get(d).has('NOITE'));
    const merged = new Map();
    for (const e of events) {
      const old = merged.get(e.id);
      if (!old) {merged.set(e.id, e); continue;}
      if (old.shift !== e.shift || old.team !== e.team) throw Error('Seu nome aparece em equipes ou turnos diferentes na mesma data (' + e.date.split('-').reverse().join('/') + '). É necessária uma revisão manual da planilha.');
      old.sources.push(...e.sources);
      const annotations=[...new Set([old.annotation,e.annotation].filter(Boolean))];
      old.annotation=annotations.join(' / ');
      if (old.type === 'regular' && e.type === 'training') {old.type = 'training'; old.activity = e.activity;}
      else if (old.type === 'training' && e.type === 'training' && normalize(old.activity) !== normalize(e.activity)) old.activity += ' / ' + e.activity;
      else if (old.type === 'absence' && e.type === 'absence') old.activity=old.annotation||'Ausência sem motivo informado';
      else if (e.type === 'special' && old.type === 'regular') {old.type='special';old.activity=old.annotation;}
      else if (old.type === 'special' && e.type === 'regular') { /* Keep the annotation on the one scheduled shift. */ }
      else if (old.type === 'special' && e.type === 'special') old.activity=old.annotation;
      else if (old.type !== e.type && !['regular','training'].includes(e.type)) {old.pending = true; old.type = 'review'; old.activity = 'Atividades divergentes'; issues.push({id: old.id, message: 'Há indicações diferentes para o mesmo turno. Confirme a atividade.'});}
      old.pending ||= e.pending;
      old.note = [old.note, e.note, 'Ocorrências no mesmo horário foram reunidas em um único evento.'].filter(Boolean).join(' ');
    }
    const result = [...merged.values()].sort((a, b) => a.start.localeCompare(b.start));
    validateEvents(result);
    if (!result.some(e => monthOf(e.date) === month)) throw Error('Há registros seus fora do mês principal, mas nenhum no mês declarado. A importação precisa de revisão.');
    const revs = [...new Set([revision(file.name), ...sheetInfo.map(revision)].filter(Boolean))];
    if (revs.length > 1) throw Error('A revisão no nome do arquivo diverge da revisão na aba. Confirme qual versão está correta.');
    return {person, parseVersion:3, fileName: file.name, month, revision: revs[0] || 'Não identificada', importedAt: new Date().toISOString(), source: 'excel', sheets: sheetInfo, events: result, complete: missingDays.length === 0, missingDays, issues: [...new Map(issues.map(i => [i.id, i])).values()], coverage: Object.fromEntries([...coverage].map(([m, days]) => [m, days.size])), notes: {scanned, countHeaders, resolvedFormulaCount, consolidated: events.length - result.length}};
  }
  async function listEmployees(file) {
    if (!/\.xlsx$/i.test(file.name)) throw Error('Selecione uma planilha .xlsx.');
    const get = zipReader(await file.arrayBuffer());
    const workbook = xml(get('xl/workbook.xml'), 'pasta de trabalho');
    const rels = xml(get('xl/_rels/workbook.xml.rels'), 'relações');
    const relationMap = new Map(tags(rels,'Relationship').map(r=>[r.getAttribute('Id'),r]));
    const stringsText = get('xl/sharedStrings.xml');
    const strings = stringsText ? tags(xml(stringsText,'textos'),'si').map(s=>tags(s,'t').map(t=>t.textContent).join('')) : [];
    const names = new Map(); let count = 0;
    const sheets = tags(workbook,'sheet');
    if (!sheets.length || sheets.length > 30) throw Error('Quantidade de abas não compatível com este protótipo.');
    for (const sheet of sheets) {
      const id = sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id') || sheet.getAttribute('r:id');
      const rel = relationMap.get(id);
      if (!rel || rel.getAttribute('TargetMode') === 'External') throw Error('Não foi possível localizar a aba interna do Excel.');
      const target = rel.getAttribute('Target');
      const path = target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//,'');
      if (path.includes('..')) throw Error('Caminho interno de aba inválido.');
      const doc = xml(get(path),'aba ' + sheet.getAttribute('name'));
      const cells = tags(doc,'c').map(el=>{
        if (++count > 120000) throw Error('A planilha contém células demais para esta versão.');
        const address=el.getAttribute('r')?.match(/^([A-Z]+)(\d+)$/), t=el.getAttribute('t'), v=child(el,'v')?.textContent;
        return {col:address?.[1],row:+address?.[2],text:t==='s'?strings[+v]:t==='inlineStr'?tags(el,'t').map(t=>t.textContent).join(''):t==='str'?v:''};
      });
      const headers=cells.filter(c=>/^Equipe\s+[A-Z0-9]+\s*[-–—]\s*(DIA|NOITE)\s*$/i.test(c.text||''));
      for (const c of cells) {
        if (!c.text || /[<>=]/.test(c.text)) continue;
        const preceding=headers.filter(h=>h.col===c.col&&h.row<c.row).sort((a,b)=>b.row-a.row)[0];
        const next=preceding&&headers.filter(h=>h.col===c.col&&h.row>preceding.row).sort((a,b)=>a.row-b.row)[0];
        if (!preceding || next&&c.row>=next.row-2) continue;
        const name=c.text.split(/[-–—]/)[0].replace(/\s+BH\s*$/i,'').replace(/\s+/g,' ').trim();
        if (!/^[\p{L}][\p{L}\s.'’]*$/u.test(name) || name.split(' ').length<2 || name.length>90 || /^Equipe\b/i.test(name)) continue;
        if (!names.has(normalize(name))) names.set(normalize(name),name);
      }
    }
    const result=[...names.values()].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    if (!result.length) throw Error('Não encontrei nomes de funcionários no modelo de escala. Confira se este é o Excel correto.');
    return result;
  }
  window.EscalaCore = {normalize, addDays, monthOf, idFor, times, daysInMonth, validateEvents, listEmployees, parseWorkbook, TZ};
})();
