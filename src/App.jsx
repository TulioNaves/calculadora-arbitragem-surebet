import { supabase } from "./supabase";
import { useState, useMemo, useEffect, useRef } from "react";
import { calcularArbitragemAvancada } from "./engine";
import { QRCodeSVG } from "qrcode.react";
import {
  Plus,
  Minus,
  X,
  CornerDownRight,
  Lock,
  Gift,
  Scissors,
  TrendingUp,
  BarChart2,
  LayoutGrid,
  LayoutList,
  Settings2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Trash2,
  Share2,
  Loader2,
  Copy,
  Check,
  Send,
  Camera,
  Mail,
} from "lucide-react";

const generateId = () => Math.random().toString(36).substr(2, 9);

// TODO: troque pelos seus links reais
const TELEGRAM_URL = "https://botgram.club/pardal-do-green/telegram";
const INSTAGRAM_URL =
  "https://www.instagram.com/pdgprocedimentos?igsh=azduam9ybW9xaWYy&utm_source=qr";
const SUPPORT_EMAIL = "";

const viaVazia = {
  type: "back",
  nome: "Casa ",
  odd: 2.0,
  stake: "",
  oddIncrease: "",
  comissao: "",
  cashback: "",
  freebetType: "none",
  rewardActive: false,
  rewardType: "freebet",
  rewardValue: "",
  rewardCondition: "lose",
  rewardDescription: "",
  rewardDate: "",
};

export default function App() {
  const [vias, setVias] = useState([
    { ...viaVazia, id: generateId(), parentId: null, nome: "Casa 1" },
    { ...viaVazia, id: generateId(), parentId: null, nome: "Casa 2" },
  ]);

  const [indiceBase, setIndiceBase] = useState(0);
  const [layout, setLayout] = useState("grid"); // 'grid' | 'list'
  const [collapsedCards, setCollapsedCards] = useState(new Set());

  const [dropdownAberto, setDropdownAberto] = useState(null);
  const dropdownRef = useRef(null);

  const [isSharing, setIsSharing] = useState(false);
  const [isLoadingShare, setIsLoadingShare] = useState(false);

  // Popup de compartilhamento (link + QR code)
  const [shareOpen, setShareOpen] = useState(false); // controla a montagem do popup
  const [shareClosing, setShareClosing] = useState(false); // toca a animação de saída antes de desmontar
  const [shareUrl, setShareUrl] = useState(null);
  const [shareError, setShareError] = useState(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownAberto(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // LÓGICA DE CARREGAMENTO DO COMPARTILHAMENTO
  useEffect(() => {
    const carregarCompartilhamento = async () => {
      const params = new URLSearchParams(window.location.search);
      const saveId = params.get("s");

      if (saveId) {
        setIsLoadingShare(true);
        const { data, error } = await supabase
          .from("saves")
          .select("state")
          .eq("id", saveId)
          .single();

        if (data && data.state) {
          if (data.state.vias) setVias(data.state.vias);
          if (data.state.indiceBase !== undefined)
            setIndiceBase(data.state.indiceBase);
          if (data.state.layout) setLayout(data.state.layout);

          window.history.replaceState({}, "", window.location.pathname);
        } else if (error) {
          console.error("Erro ao carregar link:", error);
          alert("Link de compartilhamento inválido ou expirado.");
        }
        setIsLoadingShare(false);
      }
    };

    carregarCompartilhamento();
  }, []);

  // LÓGICA DE SALVAMENTO DO COMPARTILHAMENTO
  // Abre o popup imediatamente (com spinner) e preenche o link assim que
  // o Supabase responder — assim o usuário já vê feedback visual na hora.
  const handleCompartilhar = async () => {
    setShareUrl(null);
    setShareError(null);
    setShareOpen(true);
    setIsSharing(true);

    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const stateToSave = {
      vias,
      indiceBase,
      layout,
    };

    const { error } = await supabase
      .from("saves")
      .insert([{ id, state: stateToSave }]);

    if (error) {
      console.error(error);
      setShareError("Não foi possível gerar o link. Tente novamente.");
    } else {
      setShareUrl(`${window.location.origin}/?s=${id}`);
    }

    setIsSharing(false);
  };

  // Copia o link já gerado (usado pelo botão dentro do popup)
  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    } catch (e) {
      console.error("Erro ao copiar link:", e);
    }
  };

  // Fecha o popup tocando a animação de saída antes de desmontar
  const closeShareModal = () => {
    setShareClosing(true);
    setTimeout(() => {
      setShareOpen(false);
      setShareClosing(false);
      setShareUrl(null);
      setShareError(null);
      setLinkCopiado(false);
    }, 160);
  };

  const [modalRecompensa, setModalRecompensa] = useState({
    isOpen: false,
    viaIndex: null,
  });

  const abrirModalRecompensa = (index) => {
    setDropdownAberto(null);
    setModalRecompensa({ isOpen: true, viaIndex: index });
  };

  const resultado = useMemo(() => {
    return calcularArbitragemAvancada(vias, indiceBase);
  }, [vias, indiceBase]);

  const atualizarVia = (index, campo, valor) => {
    setVias((viasAtuais) => {
      const novasVias = [...viasAtuais];
      novasVias[index] = { ...novasVias[index], [campo]: valor };
      return novasVias;
    });
  };

  const adicionarVia = () => {
    setVias([
      ...vias,
      {
        ...viaVazia,
        id: generateId(),
        parentId: null,
        nome: `Casa ${vias.filter((v) => !v.parentId).length + 1}`,
      },
    ]);
  };

  const dividirVia = (indexParent) => {
    const parent = vias[indexParent];
    const newChild = {
      ...parent,
      id: generateId(),
      parentId: parent.id,
      nome: parent.nome,
      stake: 0,
    };

    let insertIndex = indexParent + 1;
    while (
      insertIndex < vias.length &&
      vias[insertIndex].parentId === parent.id
    ) {
      insertIndex++;
    }

    const novasVias = [...vias];
    novasVias.splice(insertIndex, 0, newChild);
    setVias(novasVias);

    if (collapsedCards.has(parent.id)) toggleCollapse(parent.id);
    if (indiceBase >= insertIndex) setIndiceBase(indiceBase + 1);
  };

  const removerVia = (indexToRemove) => {
    const via = vias[indexToRemove];
    let novasVias = [];

    if (!via.parentId) {
      const parentCount = vias.filter((v) => !v.parentId).length;
      if (parentCount <= 2) return;
      novasVias = vias.filter((v) => v.id !== via.id && v.parentId !== via.id);
    } else {
      novasVias = vias.filter((_, i) => i !== indexToRemove);
    }

    setVias(novasVias);

    const currentBaseId = vias[indiceBase]?.id;
    const newBaseIndex = novasVias.findIndex((v) => v.id === currentBaseId);
    setIndiceBase(newBaseIndex !== -1 ? newBaseIndex : 0);
  };

  const toggleCollapse = (id) => {
    setCollapsedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllCollapsed = collapsedCards.size === vias.length;

  const toggleAllCollapse = () => {
    if (isAllCollapsed) {
      setCollapsedCards(new Set());
    } else {
      setCollapsedCards(new Set(vias.map((v) => v.id)));
    }
  };

  const familias = useMemo(() => {
    const grupos = [];
    vias.forEach((via, index) => {
      if (!via.parentId) {
        grupos.push({ mae: { ...via, realIndex: index }, filhas: [] });
      } else {
        const familia = grupos.find((g) => g.mae.id === via.parentId);
        if (familia) familia.filhas.push({ ...via, realIndex: index });
      }
    });
    return grupos;
  }, [vias]);

  return (
    <div className="min-h-screen bg-[#070b11] text-slate-200 p-4 md:p-6 lg:p-8 font-sans selection:bg-emerald-500/30 flex flex-col">
      <div className="w-full mx-auto flex-1 flex flex-col gap-6">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0d131f] p-4 lg:px-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-4">
            <img
              src="/calculadorass.png"
              alt="Logo"
              className="w-16 h-16 rounded-xl object-contain shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            />
            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-tight">
                PDG Surebet Calculator
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Calcule stakes e lucros da sua arbitragem
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={toggleAllCollapse}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a2332] hover:bg-[#202b3c] border border-slate-700/50 text-slate-300 text-sm font-medium transition-all"
            >
              {isAllCollapsed ? (
                <Maximize2 size={14} />
              ) : (
                <Minimize2 size={14} />
              )}
              <span className="hidden sm:inline">
                {isAllCollapsed ? "Expandir tudo" : "Recolher tudo"}
              </span>
            </button>

            <div className="flex bg-[#070b11] p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setLayout("grid")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${layout === "grid" ? "bg-[#1a2332] text-emerald-400 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
              >
                <LayoutGrid size={16} />{" "}
                <span className="hidden sm:inline">Horizontal</span>
              </button>
              <button
                onClick={() => setLayout("list")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${layout === "list" ? "bg-[#1a2332] text-emerald-400 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
              >
                <LayoutList size={16} />{" "}
                <span className="hidden sm:inline">Vertical</span>
              </button>
            </div>

            <button
              onClick={adicionarVia}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a2332] hover:bg-[#202b3c] border border-slate-700/50 text-emerald-400 text-sm font-bold transition-all duration-200 active:scale-95"
            >
              <Plus size={16} strokeWidth={3} /> Nova Casa
            </button>

            <button
              onClick={handleCompartilhar}
              disabled={isSharing || isLoadingShare}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-sm font-bold transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.25)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSharing || isLoadingShare ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Share2 size={16} strokeWidth={2.5} />
              )}
              <span className="hidden sm:inline">Compartilhar</span>
            </button>
          </div>
        </header>

        <main
          className={`flex-1 flex gap-6 pb-32 items-start ${layout === "grid" ? "flex-wrap" : "flex-col max-w-4xl mx-auto"}`}
        >
          {familias.map((familia, fIndex) => (
            <div
              key={`fam-${familia.mae.id}`}
              className={`flex gap-4 p-3 rounded-[2rem] transition-all duration-500
                ${familia.filhas.length > 0 ? "bg-[#0f1522] border border-slate-800/60 shadow-inner" : "bg-transparent"}
                ${layout === "grid" ? "flex-col xl:flex-row w-full xl:w-auto" : "flex-col w-full"}
              `}
            >
              {[familia.mae, ...familia.filhas].map((via, relIndex) => {
                const index = via.realIndex;
                const ehLay = via.type === "lay";
                const isChild = via.parentId !== null;
                const isBase = index === indiceBase;
                const isCollapsed = collapsedCards.has(via.id);
                const dadosCalculados = resultado?.vias[index];
                const oddExibicaoFormatada = dadosCalculados
                  ? (
                      Math.floor(dadosCalculados.oddEfetiva * 1000) / 1000
                    ).toFixed(3)
                  : "0.000";

                const numFilhas = familia.filhas.length;
                const indexFilha = isChild ? relIndex : 0;

                return (
                  <div
                    key={via.id}
                    className={`relative group flex-none transition-all duration-300 ease-in-out
                      ${layout === "grid" ? (isChild ? "w-full lg:w-[320px]" : "w-full lg:w-[340px]") : "w-full"}
                      p-5 rounded-2xl border bg-[#0d131f]
                      ${isBase ? "border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/30 z-10" : "border-slate-800 hover:border-slate-700"}
                    `}
                  >
                    {isBase && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-emerald-950 px-4 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg shadow-emerald-500/20 z-20">
                        Casa Base
                      </div>
                    )}

                    <div className="mb-5">
                      {isChild && (
                        <div className="flex justify-between items-center text-xs mb-3">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <CornerDownRight size={14} /> Linha filha{" "}
                            {indexFilha}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 bg-[#070b11] px-2.5 py-1 rounded-md border border-slate-800/80">
                            Split da Casa {fIndex + 1}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 items-center">
                        <div className="flex-1 relative group/input">
                          <input
                            type="text"
                            value={via.nome}
                            onChange={(e) =>
                              atualizarVia(index, "nome", e.target.value)
                            }
                            className="w-full bg-[#070b11] border border-slate-800/80 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 text-sm font-bold text-white transition-all min-w-0"
                            placeholder={
                              isChild ? "Nome da Filha" : "Nome da Casa"
                            }
                          />
                        </div>

                        <div className="flex bg-[#070b11] p-1 rounded-xl border border-slate-800/80 flex-none">
                          <button
                            onClick={() => atualizarVia(index, "type", "back")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!ehLay ? "bg-emerald-500 text-emerald-950 shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                          >
                            Back
                          </button>
                          <button
                            onClick={() => atualizarVia(index, "type", "lay")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${ehLay ? "bg-amber-500 text-amber-950 shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                          >
                            Lay
                          </button>
                        </div>

                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={() => toggleCollapse(via.id)}
                            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                          >
                            {isCollapsed ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronUp size={16} />
                            )}
                          </button>
                          {((!isChild &&
                            vias.filter((v) => !v.parentId).length > 2) ||
                            isChild) && (
                            <button
                              onClick={() => removerVia(index)}
                              className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="relative">
                          <label className="text-[13px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider ml-1">
                            Odd
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0"
                              value={via.odd}
                              onChange={(e) =>
                                atualizarVia(
                                  index,
                                  "odd",
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value),
                                )
                              }
                              className="w-full bg-[#070b11] border border-slate-800 rounded-xl px-4 py-3 pr-24 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-base font-bold tabular-nums transition-all"
                            />
                            {(via.oddIncrease > 0 ||
                              via.comissao > 0 ||
                              ehLay ||
                              via.freebetType === "isFreebet") &&
                              dadosCalculados && (
                                <div className="absolute right-2 top-2 bottom-2 flex items-center">
                                  <div className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-500/20 tabular-nums">
                                    Real: {oddExibicaoFormatada}
                                  </div>
                                </div>
                              )}
                          </div>
                          <div className="flex justify-between items-center mt-1.5 ml-1">
                            <span className="text-[10px] font-medium text-slate-500">
                              Retorno Bruto
                            </span>
                            <span className="text-xs font-bold text-slate-300 tabular-nums">
                              R$ {dadosCalculados?.retornoReal || "0.00"}
                            </span>
                          </div>
                        </div>

                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-500 flex items-center justify-between mb-1.5 uppercase tracking-wider ml-1">
                            {ehLay ? "Responsabilidade" : "Stake"}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0"
                              value={
                                isBase || isChild
                                  ? via.stake
                                  : dadosCalculados?.dinheiroEmRisco || ""
                              }
                              onChange={(e) => {
                                atualizarVia(
                                  index,
                                  "stake",
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value),
                                );
                                if (!isChild && index !== indiceBase)
                                  setIndiceBase(index);
                              }}
                              className={`w-full bg-[#070b11] border rounded-xl px-4 py-3 pr-10 font-bold text-base tabular-nums outline-none transition-all ${
                                isBase || isChild
                                  ? "border-emerald-500/40 text-emerald-400 focus:border-emerald-500"
                                  : "border-slate-800 text-slate-200 focus:border-slate-600"
                              }`}
                            />
                            {(isBase || isChild) && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/70">
                                <Lock size={14} />
                              </div>
                            )}
                          </div>
                        </div>

                        {ehLay && (
                          <div className="relative pt-1">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider ml-1">
                              Stake (Calculada)
                            </label>
                            <input
                              type="number"
                              disabled
                              value={dadosCalculados?.stakeApostador || 0}
                              className="w-full bg-[#141b29] border border-slate-800/50 rounded-xl px-4 py-2.5 text-slate-500 text-sm font-bold tabular-nums cursor-not-allowed"
                            />
                          </div>
                        )}
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-4 pt-2 border-t border-slate-800/60 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest mb-2 ml-1">
                              <Settings2 size={12} /> Ajustes da Odd
                            </label>
                            <div className="flex gap-2">
                              <div className="flex-1 bg-[#070b11] border border-slate-800 rounded-xl p-2 relative">
                                <label className="text-[10px] text-slate-500 uppercase font-bold absolute top-1.5 left-2">
                                  Aumento %
                                </label>
                                <input
                                  type="number"
                                  step="0.1"
                                  placeholder="0"
                                  value={via.oddIncrease}
                                  onChange={(e) =>
                                    atualizarVia(
                                      index,
                                      "oddIncrease",
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value),
                                    )
                                  }
                                  className="w-full bg-transparent text-sm font-semibold tabular-nums outline-none mt-3 px-1"
                                />
                              </div>
                              <div className="flex-1 bg-[#070b11] border border-slate-800 rounded-xl p-2 relative">
                                <label className="text-[10px] text-slate-500 uppercase font-bold absolute top-1.5 left-2">
                                  Comissão %
                                </label>
                                <input
                                  type="number"
                                  step="0.1"
                                  placeholder="0"
                                  value={via.comissao}
                                  onChange={(e) =>
                                    atualizarVia(
                                      index,
                                      "comissao",
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value),
                                    )
                                  }
                                  className="w-full bg-transparent text-sm font-semibold tabular-nums outline-none mt-3 px-1"
                                />
                              </div>
                              <div className="flex-1 bg-[#070b11] border border-slate-800 rounded-xl p-2 relative">
                                <label className="text-[10px] text-slate-500 uppercase font-bold absolute top-1.5 left-2">
                                  Cash %
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0"
                                  value={via.cashback}
                                  onChange={(e) =>
                                    atualizarVia(
                                      index,
                                      "cashback",
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value),
                                    )
                                  }
                                  className="w-full bg-transparent text-sm font-semibold tabular-nums outline-none mt-3 px-1"
                                />
                              </div>
                            </div>
                          </div>

                          <div
                            className="relative"
                            ref={dropdownAberto === index ? dropdownRef : null}
                          >
                            <button
                              onClick={() =>
                                setDropdownAberto(
                                  dropdownAberto === index ? null : index,
                                )
                              }
                              className={`w-full p-3 flex justify-between items-center border rounded-xl text-xs font-bold transition-all ${via.freebetType !== "none" ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-[#070b11] border-slate-800 text-slate-400 hover:border-slate-600"}`}
                            >
                              <span className="flex items-center gap-2">
                                <Gift
                                  size={14}
                                  className={
                                    via.freebetType !== "none"
                                      ? "text-emerald-400"
                                      : "text-slate-500"
                                  }
                                />{" "}
                                FREEBET
                              </span>
                              <span className="flex items-center gap-1">
                                {via.freebetType === "none"
                                  ? "Configurar Bônus"
                                  : via.freebetType === "isFreebet"
                                    ? "É Freebet"
                                    : "Gera Freebet"}{" "}
                                <ChevronDown size={14} />
                              </span>
                            </button>

                            {dropdownAberto === index && (
                              <div className="absolute z-30 top-full left-0 mt-2 w-full bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl p-2 animate-in fade-in duration-150">
                                <div className="space-y-1 p-1">
                                  <label
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${via.freebetType === "isFreebet" ? "border-emerald-500/50 bg-emerald-500/10" : "border-transparent hover:bg-slate-800"}`}
                                  >
                                    <input
                                      type="radio"
                                      checked={via.freebetType === "isFreebet"}
                                      onChange={() => {
                                        atualizarVia(
                                          index,
                                          "freebetType",
                                          "isFreebet",
                                        );
                                        setDropdownAberto(null);
                                      }}
                                      className="accent-emerald-500"
                                    />
                                    <span className="text-sm font-bold text-slate-200">
                                      Aposta usando Freebet
                                    </span>
                                  </label>
                                  <label
                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${via.freebetType === "generatesFreebet" ? "border-emerald-500/50 bg-emerald-500/10" : "border-transparent hover:bg-slate-800"}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="radio"
                                        checked={
                                          via.freebetType === "generatesFreebet"
                                        }
                                        onChange={() => {
                                          atualizarVia(
                                            index,
                                            "freebetType",
                                            "generatesFreebet",
                                          );
                                          abrirModalRecompensa(index);
                                        }}
                                        className="accent-emerald-500"
                                      />
                                      <span className="text-sm font-bold text-slate-200">
                                        Aposta gera Freebet
                                      </span>
                                    </div>
                                    {via.freebetType === "generatesFreebet" && (
                                      <span
                                        onClick={(e) => {
                                          e.preventDefault();
                                          abrirModalRecompensa(index);
                                        }}
                                        className="text-[10px] font-bold text-emerald-400 hover:underline"
                                      >
                                        EDITAR
                                      </span>
                                    )}
                                  </label>
                                  <label
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${via.freebetType === "none" ? "border-slate-700 bg-slate-800" : "border-transparent hover:bg-slate-800"}`}
                                  >
                                    <input
                                      type="radio"
                                      checked={via.freebetType === "none"}
                                      onChange={() => {
                                        atualizarVia(
                                          index,
                                          "freebetType",
                                          "none",
                                        );
                                        setDropdownAberto(null);
                                      }}
                                      className="accent-emerald-500"
                                    />
                                    <span className="text-sm font-bold text-slate-200">
                                      Nenhuma Recompensa
                                    </span>
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>

                          {!isChild && (
                            <button
                              onClick={() => dividirVia(index)}
                              className="w-full p-2.5 flex justify-between items-center px-4 border border-slate-800 rounded-xl text-xs font-bold bg-[#070b11] hover:bg-slate-800 hover:border-slate-600 text-slate-400 transition-all"
                            >
                              <span className="flex items-center gap-2">
                                <Scissors size={14} /> Dividir Stake
                              </span>
                              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                                {numFilhas > 0
                                  ? `${numFilhas} filha(s) +`
                                  : "Criar Split +"}
                              </span>
                            </button>
                          )}
                        </div>
                      )}

                      {!isChild && (
                        <div className="pt-2">
                          {resultado && dadosCalculados && (
                            <div className="mb-3 px-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                  Lucro Líquido
                                </span>
                                <span
                                  className={`text-sm font-black tabular-nums ${dadosCalculados.lucro > 0 ? "text-emerald-400" : "text-rose-400"}`}
                                >
                                  R$ {dadosCalculados.lucro}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                  ROI
                                </span>
                                <span
                                  className={`text-xs font-bold tabular-nums ${dadosCalculados.roi > 0 ? "text-emerald-400" : "text-rose-400"}`}
                                >
                                  {dadosCalculados.roi}%
                                </span>
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => setIndiceBase(index)}
                            className={`w-full py-3 rounded-xl text-sm font-bold transition-all outline-none flex items-center justify-center gap-2 ${
                              isBase
                                ? "bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                : "bg-[#141b29] hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-600"
                            }`}
                          >
                            {isBase && <Lock size={14} strokeWidth={2.5} />}
                            {isBase ? "Stake Fixada" : "Fixar como Base"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </main>

        <div className="sticky bottom-4 md:bottom-6 z-40 mx-auto w-full max-w-[800px] bg-[#070b11]/80 backdrop-blur-2xl p-4 md:px-8 rounded-2xl border border-slate-700/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-6">
          <div className="flex-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
              Investimento Total
            </p>
            <p className="text-xl md:text-2xl font-black text-white tabular-nums">
              R$ {resultado?.investimentoTotal || "0.00"}
            </p>
          </div>

          <div className="w-1 h-8 rounded-full bg-slate-700/50" />

          <div className="flex-1 text-right">
            <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest mb-1">
              ROI Global Mínimo
            </p>
            <p
              className={`text-2xl md:text-3xl font-black tabular-nums tracking-tight ${Number(resultado?.roiGlobal) > 0 ? "text-emerald-400" : "text-rose-400"}`}
            >
              {resultado?.roiGlobal || "0.00"}%
            </p>
          </div>
        </div>

        <footer className="border-t border-slate-800/60 pt-4 pb-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-400 transition-colors"
            >
              <Send size={14} />
              Telegram
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-400 transition-colors"
            >
              <Camera size={14} />
              Instagram
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-400 transition-colors"
            >
              <Mail size={14} />
              E-mail
            </a>
          </div>

          <div className="mt-4 space-y-1.5 text-center">
            <p className="mx-auto max-w-lg text-[11px] leading-relaxed text-slate-600">
              Ferramenta com fins exclusivamente informativos e de cálculo -
              jogue com responsabilidade.
            </p>
            <p className="text-[11px] text-slate-700">
              © {new Date().getFullYear()} PDG-Surebet Calculator. Todos os
              direitos reservados.
            </p>
          </div>
        </footer>
      </div>

      {modalRecompensa.isOpen && modalRecompensa.viaIndex !== null && (
        <div className="fixed inset-0 bg-[#070b11]/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0d131f] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col scale-in-center">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#070b11]">
              <div>
                <h2 className="font-bold text-lg text-white flex items-center gap-2">
                  <Gift className="text-emerald-400" size={20} /> Regras de
                  Recompensa
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  {vias[modalRecompensa.viaIndex].parentId
                    ? "Linha Filha Selecionada"
                    : `Configuração da Casa ${modalRecompensa.viaIndex + 1}`}
                </p>
              </div>
              <button
                onClick={() =>
                  setModalRecompensa({ isOpen: false, viaIndex: null })
                }
                className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <label className="flex items-center gap-3 p-4 bg-[#070b11] border border-slate-700 hover:border-emerald-500/50 rounded-xl cursor-pointer transition-all group">
                <input
                  type="checkbox"
                  checked={vias[modalRecompensa.viaIndex].rewardActive}
                  onChange={(e) =>
                    atualizarVia(
                      modalRecompensa.viaIndex,
                      "rewardActive",
                      e.target.checked,
                    )
                  }
                  className="w-5 h-5 rounded-md border-slate-600 text-emerald-500 bg-slate-900 focus:ring-emerald-500 accent-emerald-500 transition-all"
                />
                <div>
                  <span className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                    Ativar Condicionais de Bônus
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Habilita o motor de cálculo para contabilizar o prêmio.
                  </p>
                </div>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Tipo de Retorno
                  </label>
                  <select
                    value={vias[modalRecompensa.viaIndex].rewardType}
                    onChange={(e) =>
                      atualizarVia(
                        modalRecompensa.viaIndex,
                        "rewardType",
                        e.target.value,
                      )
                    }
                    className="w-full bg-[#070b11] border border-slate-800 rounded-xl p-3 outline-none text-sm font-bold text-white focus:border-emerald-500 transition-all"
                  >
                    <option value="freebet">Token Freebet</option>
                    <option value="cashback">Dinheiro Real</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Valor do Bônus
                  </label>
                  <div className="flex items-center bg-[#070b11] border border-slate-800 rounded-xl p-3 focus-within:border-emerald-500 transition-all">
                    <span className="text-emerald-500 text-xs font-bold mr-2">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={vias[modalRecompensa.viaIndex].rewardValue}
                      onChange={(e) =>
                        atualizarVia(
                          modalRecompensa.viaIndex,
                          "rewardValue",
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="w-full bg-transparent outline-none font-bold text-sm text-white tabular-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Gatilho (Condição)
                </label>
                <select
                  value={vias[modalRecompensa.viaIndex].rewardCondition}
                  onChange={(e) =>
                    atualizarVia(
                      modalRecompensa.viaIndex,
                      "rewardCondition",
                      e.target.value,
                    )
                  }
                  className="w-full bg-[#070b11] border border-slate-800 rounded-xl p-3 outline-none text-sm font-bold text-white focus:border-emerald-500 transition-all"
                >
                  <option value="lose">
                    Somente em caso de Red (Sem Risco)
                  </option>
                  <option value="win">Somente em caso de Green</option>
                  <option value="always">
                    Sempre (Independente do resultado)
                  </option>
                </select>
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-[#070b11]">
              <button
                onClick={() =>
                  setModalRecompensa({ isOpen: false, viaIndex: null })
                }
                className="px-6 py-2.5 bg-transparent border border-slate-700 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              >
                Descartar
              </button>
              <button
                onClick={() =>
                  setModalRecompensa({ isOpen: false, viaIndex: null })
                }
                className="px-8 py-2.5 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-sm font-bold text-emerald-950 transition-all shadow-lg shadow-emerald-500/20"
              >
                Salvar Regras
              </button>
            </div>
          </div>
        </div>
      )}

      {shareOpen && (
        <div
          onClick={closeShareModal}
          className={`fixed inset-0 bg-[#070b11]/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4 ${
            shareClosing
              ? "animate-out fade-out duration-150"
              : "animate-in fade-in duration-200"
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-[#0d131f] border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
              shareClosing
                ? "animate-out fade-out zoom-out-95 slide-out-to-bottom-2 duration-150"
                : "animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
            }`}
          >
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#070b11]">
              <h2 className="font-bold text-lg text-white flex items-center gap-2">
                <Share2 className="text-emerald-400" size={18} />
                Compartilhar
              </h2>
              <button
                onClick={closeShareModal}
                className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-5">
              {shareError ? (
                <div className="w-full py-4 text-center space-y-3">
                  <p className="text-sm text-rose-400 font-medium">
                    {shareError}
                  </p>
                  <button
                    onClick={handleCompartilhar}
                    className="px-5 py-2 rounded-lg bg-[#1a2332] hover:bg-[#202b3c] border border-slate-700/50 text-sm font-bold text-slate-200 transition-all"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : !shareUrl ? (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Loader2
                    size={28}
                    className="animate-spin text-emerald-400"
                  />
                  <p className="text-xs text-slate-500 font-medium">
                    Gerando link...
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-white p-3 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                    <QRCodeSVG
                      value={shareUrl}
                      size={152}
                      bgColor="#ffffff"
                      fgColor="#070b11"
                      level="M"
                    />
                  </div>

                  <p className="w-full truncate rounded-lg bg-[#070b11] border border-slate-800 px-3 py-2 text-center text-xs font-medium text-slate-400 tabular-nums">
                    {shareUrl}
                  </p>

                  <button
                    onClick={handleCopyLink}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${
                      linkCopiado
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
                        : "bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                    }`}
                  >
                    {linkCopiado ? (
                      <Check size={16} strokeWidth={2.5} />
                    ) : (
                      <Copy size={16} strokeWidth={2.5} />
                    )}
                    {linkCopiado ? "Link copiado!" : "Copiar link"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
