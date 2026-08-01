export function calcularArbitragemAvancada(vias, indiceBase) {
  if (!vias || vias.length < 2) return null;
  if (!vias[indiceBase]) return null;

  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

  // Pré-identificar qual é o Grupo Base para a regra de Aposta Sem Risco
  const viaBasePrimaria = vias[indiceBase];
  const baseGroupId = viaBasePrimaria.parentId
    ? viaBasePrimaria.parentId
    : viaBasePrimaria.id || `temp-${indiceBase}`;

  // 1. Processar odds, Lay, bônus e preparar IDs de Família (Grupos)
  const viasProcessadas = vias.map((via, index) => {
    const id = via.id || `temp-${index}`;
    const parentId = via.parentId || null;
    const groupId = parentId ? parentId : id;

    const ehLay = via.type === "lay";
    const oddOriginal = num(via.odd);
    const oddValida = oddOriginal > 1 ? oddOriginal : 1.01;

    let lucroBruto = ehLay ? 1 / (oddValida - 1) : oddValida - 1;

    if (num(via.oddIncrease) > 0) {
      lucroBruto = lucroBruto * (1 + num(via.oddIncrease) / 100);
    }
    if (num(via.comissao) > 0) {
      lucroBruto = lucroBruto * (1 - num(via.comissao) / 100);
    }

    const recompensaAtiva = via.rewardActive !== false;
    const geraRecompensa =
      via.freebetType === "generatesFreebet" && recompensaAtiva;
    const ehTokenFreebet = geraRecompensa && via.rewardType === "freebet";
    const ehDinheiro = geraRecompensa && via.rewardType === "cashback";

    let oddRateio =
      via.freebetType === "isFreebet" ? lucroBruto : 1 + lucroBruto;
    let oddRetorno =
      via.freebetType === "isFreebet" ? lucroBruto : 1 + lucroBruto;

    const condicaoLose =
      via.rewardCondition === "lose" || via.rewardCondition === "always";
    const condicaoWin =
      via.rewardCondition === "win" || via.rewardCondition === "always";

    const usaApostaSemRisco =
      ehTokenFreebet &&
      via.rewardCondition === "lose" &&
      num(via.rewardValue) > 0;

    // A Aposta Sem Risco só reduz o rateio (Odd - 1) se pertencer à Casa Base.
    if (usaApostaSemRisco && groupId === baseGroupId) {
      oddRateio = lucroBruto;
    }

    // CONVERSÃO DO CASHBACK PARA PORCENTAGEM
    const cashbackPct =
      via.freebetType === "isFreebet" ? 0 : num(via.cashback) / 100;
    const valorRecompensa = ehDinheiro ? num(via.rewardValue) : 0;

    let bonusSeLoseFixo = 0;
    if (ehDinheiro && condicaoLose) bonusSeLoseFixo += valorRecompensa;

    let bonusSeGanha = 0;
    if (ehDinheiro && condicaoWin) bonusSeGanha += valorRecompensa;

    // Define o dinheiroEmRisco conhecido inicialmente (Casa Base e Splits)
    let dinheiroEmRisco =
      groupId === baseGroupId || parentId ? num(via.stake) : 0;

    return {
      ...via,
      id,
      parentId,
      groupId,
      oddRateio,
      oddRetorno,
      cashbackPct,
      bonusSeLoseFixo,
      bonusSeGanha,
      usaApostaSemRisco,
      ehLay,
      oddValida,
      dinheiroEmRisco,
    };
  });

  // 2. Mapeamento dos Grupos (Famílias) e acúmulo das variáveis
  const gruposMap = {};
  viasProcessadas.forEach((via) => {
    if (!gruposMap[via.groupId]) {
      gruposMap[via.groupId] = {
        vias: [],
        bonusSeGanha: 0,
        anySemRisco: false,
        sumFilhasRateio: 0,
        knownGroupBonusLose: 0,
      };
    }
    const g = gruposMap[via.groupId];
    g.vias.push(via);
    g.bonusSeGanha += via.bonusSeGanha;
    if (via.usaApostaSemRisco) g.anySemRisco = true;

    if (via.groupId === baseGroupId || via.parentId) {
      if (via.parentId) {
        g.sumFilhasRateio += via.dinheiroEmRisco * via.oddRateio;
      }
      g.knownGroupBonusLose +=
        via.bonusSeLoseFixo + via.dinheiroEmRisco * via.cashbackPct;
    } else {
      g.knownGroupBonusLose += via.bonusSeLoseFixo;
    }
  });

  const baseGroup = gruposMap[baseGroupId];

  // 3. Constante K
  let sumRateioBase = 0;
  baseGroup.vias.forEach((v) => {
    sumRateioBase += v.dinheiroEmRisco * v.oddRateio;
  });

  const descontoCashbackBase = baseGroup.anySemRisco
    ? 0
    : baseGroup.knownGroupBonusLose;
  const K = sumRateioBase - descontoCashbackBase + baseGroup.bonusSeGanha;

  // 4. Resolver o dinheiro em risco (Rateio) com a matemática do Cashback em %
  let investimentoTotalReal = 0;
  let totalBonusSeLose = 0;

  const rateio = viasProcessadas.map((via) => {
    const group = gruposMap[via.groupId];
    let dinheiroEmRisco = via.dinheiroEmRisco;

    if (via.groupId !== baseGroupId && !via.parentId) {
      if (via.oddRateio > 0) {
        // Isola o cashback no denominador para encontrar a stake exata
        const numerador =
          K -
          group.sumFilhasRateio +
          group.knownGroupBonusLose -
          group.bonusSeGanha;
        const denominador = via.oddRateio - via.cashbackPct;

        dinheiroEmRisco = denominador !== 0 ? numerador / denominador : 0;
        if (dinheiroEmRisco < 0) dinheiroEmRisco = 0;
      } else {
        dinheiroEmRisco = 0;
      }
      dinheiroEmRisco = round2(dinheiroEmRisco);
    }

    // Calcula o bônus de loss final da via com a stake definida
    const bonusSeLoseTotal =
      via.bonusSeLoseFixo + dinheiroEmRisco * via.cashbackPct;
    totalBonusSeLose += bonusSeLoseTotal;
    via.bonusSeLoseTotal = bonusSeLoseTotal;

    const custoOperacional =
      via.freebetType === "isFreebet" ? 0 : dinheiroEmRisco;
    investimentoTotalReal += custoOperacional;

    const responsabilidadeExibicao = via.ehLay ? dinheiroEmRisco : 0;
    const stakeApostador = via.ehLay
      ? round2(dinheiroEmRisco / (via.oddValida - 1))
      : dinheiroEmRisco;

    return {
      ...via,
      dinheiroEmRisco,
      custoOperacional,
      oddEfetivaExibicao: via.oddRetorno,
      retornoReal: round2(dinheiroEmRisco * via.oddRetorno),
      stakeApostador,
      responsabilidadeExibicao,
    };
  });

  // 5. Fechar o balanço financeiro final
  const resultadosFinais = rateio.map((r) => {
    const group = gruposMap[r.groupId];

    let sumRetornoRealGrupo = 0;
    let groupBonusLose = 0;
    let stakeMae = 0;

    rateio.forEach((v) => {
      if (v.groupId === r.groupId) {
        sumRetornoRealGrupo += v.retornoReal;
        groupBonusLose += v.bonusSeLoseTotal;
        if (!v.parentId) stakeMae = v.dinheiroEmRisco;
      }
    });

    const bonusDosPerdedores = totalBonusSeLose - groupBonusLose;
    const dinheiroRecebido =
      sumRetornoRealGrupo + group.bonusSeGanha + bonusDosPerdedores;

    const lucroGrupo = dinheiroRecebido - investimentoTotalReal;
    const roiGrupo =
      stakeMae > 0 ? (lucroGrupo / stakeMae) * 100 : lucroGrupo * 100;

    return {
      ...r,
      oddEfetiva: r.oddEfetivaExibicao,
      lucro: round2(lucroGrupo),
      roi: Number(roiGrupo.toFixed(4)),
    };
  });

  const lucrosPais = resultadosFinais
    .filter((r) => !r.parentId)
    .map((r) => r.lucro);
  const menorLucro = Math.min(...lucrosPais);

  const roiGlobal =
    investimentoTotalReal > 0
      ? (menorLucro / investimentoTotalReal) * 100
      : menorLucro * 100;

  return {
    investimentoTotal: round2(investimentoTotalReal),
    roiGlobal: round2(roiGlobal),
    vias: resultadosFinais,
  };
}
