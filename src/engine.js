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

    // REGRA DO ORIGINAL: A Aposta Sem Risco só reduz o rateio (Odd - 1) se pertencer à Casa Base.
    if (usaApostaSemRisco && groupId === baseGroupId) {
      oddRateio = lucroBruto;
    }

    const cashbackRapido =
      via.freebetType === "isFreebet" ? 0 : num(via.cashback);
    const valorRecompensa = ehDinheiro ? num(via.rewardValue) : 0;

    let bonusSeLose = cashbackRapido;
    if (ehDinheiro && condicaoLose) bonusSeLose += valorRecompensa;

    let bonusSeGanha = 0;
    if (ehDinheiro && condicaoWin) bonusSeGanha += valorRecompensa;

    return {
      ...via,
      id,
      parentId,
      groupId,
      oddRateio,
      oddRetorno,
      bonusSeLose,
      bonusSeGanha,
      usaApostaSemRisco,
      ehLay,
      oddValida,
    };
  });

  // 2. Mapeamento dos Grupos (Famílias)
  const gruposMap = {};
  viasProcessadas.forEach((via) => {
    if (!gruposMap[via.groupId]) {
      gruposMap[via.groupId] = {
        vias: [],
        bonusSeLose: 0,
        bonusSeGanha: 0,
        anySemRisco: false,
      };
    }
    gruposMap[via.groupId].vias.push(via);
    gruposMap[via.groupId].bonusSeLose += via.bonusSeLose;
    gruposMap[via.groupId].bonusSeGanha += via.bonusSeGanha;
    if (via.usaApostaSemRisco) gruposMap[via.groupId].anySemRisco = true;
  });

  const baseGroup = gruposMap[baseGroupId];

  // 3. Constante K
  let sumRateioBase = 0;
  baseGroup.vias.forEach((v) => {
    sumRateioBase += num(v.stake) * v.oddRateio;
  });

  const descontoCashbackBase = baseGroup.anySemRisco
    ? 0
    : baseGroup.bonusSeLose;
  const K = sumRateioBase - descontoCashbackBase + baseGroup.bonusSeGanha;

  const totalBonusSeLose = Object.values(gruposMap).reduce(
    (acc, g) => acc + g.bonusSeLose,
    0,
  );

  // 4. Resolver o dinheiro em risco (Rateio)
  let investimentoTotalReal = 0;
  const rateio = viasProcessadas.map((via) => {
    const group = gruposMap[via.groupId];
    let dinheiroEmRisco = num(via.stake);

    if (via.groupId !== baseGroupId && !via.parentId) {
      let sumFilhasRateio = 0;
      group.vias.forEach((v) => {
        if (v.parentId) sumFilhasRateio += num(v.stake) * v.oddRateio;
      });

      if (via.oddRateio > 0) {
        dinheiroEmRisco =
          (K - sumFilhasRateio + group.bonusSeLose - group.bonusSeGanha) /
          via.oddRateio;
        if (dinheiroEmRisco < 0) dinheiroEmRisco = 0;
      } else {
        dinheiroEmRisco = 0;
      }
      dinheiroEmRisco = round2(dinheiroEmRisco);
    }

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
    let stakeMae = 0;

    rateio.forEach((v) => {
      if (v.groupId === r.groupId) {
        sumRetornoRealGrupo += v.retornoReal;
        if (!v.parentId) stakeMae = v.dinheiroEmRisco;
      }
    });

    const bonusDosPerdedores = totalBonusSeLose - group.bonusSeLose;
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
