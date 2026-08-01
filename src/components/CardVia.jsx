import { useState } from "react";

export default function CardVia({
  via,
  index,
  isBase,
  resultadoVia,
  onUpdate,
  onSetBase,
  onRemove,
}) {
  const [configAberto, setConfigAberto] = useState(false);
  const [freebetMenu, setFreebetMenu] = useState(false);

  return (
    <div className="flex-none w-[280px] bg-[#1a1d2d] rounded-xl border border-gray-700 p-4 flex flex-col relative">
      <button
        onClick={() => onRemove(index)}
        className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
      >
        ×
      </button>

      {/* Casa */}
      <div className="mb-4">
        <label className="text-gray-400 text-xs font-semibold mb-1 block">
          Casa
        </label>
        <input
          type="text"
          value={via.nome}
          onChange={(e) => onUpdate(index, "nome", e.target.value)}
          className="w-full bg-[#11131f] border border-gray-700 rounded-md p-2 text-white font-bold text-sm focus:border-blue-500 outline-none"
        />
      </div>

      {/* Odd */}
      <div className="mb-4">
        <label className="text-gray-400 text-xs font-semibold mb-1 block">
          Odd
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            value={via.odd}
            onChange={(e) => onUpdate(index, "odd", Number(e.target.value))}
            className="w-full bg-[#11131f] border border-gray-700 rounded-md p-2 text-white font-bold text-sm focus:border-blue-500 outline-none"
          />
          {resultadoVia?.oddEfetiva !== via.odd && via.odd > 0 && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600/30 text-blue-400 text-[10px] px-2 py-0.5 rounded border border-blue-500/50">
              Real: {resultadoVia?.oddEfetiva.toFixed(3)}
            </span>
          )}
        </div>
        <p className="text-[10px] text-gray-500 mt-1">
          Retorno:{" "}
          <span className="text-gray-300 font-semibold">
            R$ {resultadoVia?.retornoReal || "0.00"}
          </span>
        </p>
      </div>

      {/* Stake & Back/Lay Toggle */}
      <div className="mb-4">
        <label
          className={`text-xs font-semibold mb-1 block ${via.isLay ? "text-orange-400" : "text-gray-400"}`}
        >
          {via.isLay && !isBase ? "Responsabilidade" : "Stake"}
        </label>
        <div className="flex gap-2">
          <div
            className={`flex-1 flex items-center bg-[#11131f] border rounded-md p-2 ${isBase ? "border-blue-500" : "border-gray-700"}`}
          >
            <span className="text-gray-500 text-xs mr-1">R$</span>
            {isBase ? (
              <input
                type="number"
                step="0.01"
                value={via.stake}
                onChange={(e) =>
                  onUpdate(index, "stake", Number(e.target.value))
                }
                className="w-full bg-transparent text-white font-bold text-sm outline-none"
              />
            ) : (
              <span className="w-full text-white font-bold text-sm">
                {via.isLay
                  ? resultadoVia?.responsabilidade
                  : resultadoVia?.stakeReal || 0}
              </span>
            )}
          </div>
          <button
            onClick={() => onUpdate(index, "isLay", !via.isLay)}
            className={`text-xs px-3 rounded-md font-bold transition-colors ${via.isLay ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
          >
            {via.isLay ? "Lay" : "Back"}
          </button>
        </div>
      </div>

      {/* Configurações Avançadas */}
      <div className="mb-2 border border-gray-700 rounded-md bg-[#151824]">
        <button
          onClick={() => setConfigAberto(!configAberto)}
          className="w-full p-2 flex justify-between items-center text-xs font-semibold text-gray-300"
        >
          <span>⚙ CONFIGURAÇÕES</span>
          <span>{configAberto ? "▲" : "▼"}</span>
        </button>
        {configAberto && (
          <div className="p-3 space-y-3 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <label className="text-xs text-gray-400">Aumento (%)</label>
              <input
                type="number"
                value={via.oddIncrease}
                onChange={(e) =>
                  onUpdate(index, "oddIncrease", Number(e.target.value))
                }
                className="w-16 bg-[#11131f] border border-gray-700 rounded p-1 text-white text-xs text-center"
              />
            </div>
            <div className="flex justify-between items-center">
              <label className="text-xs text-gray-400">Comissão (%)</label>
              <input
                type="number"
                value={via.comissao}
                onChange={(e) =>
                  onUpdate(index, "comissao", Number(e.target.value))
                }
                className="w-16 bg-[#11131f] border border-gray-700 rounded p-1 text-white text-xs text-center"
              />
            </div>
            <div className="flex justify-between items-center">
              <label className="text-xs text-gray-400">Cashback R$</label>
              <input
                type="number"
                value={via.cashback}
                onChange={(e) =>
                  onUpdate(index, "cashback", Number(e.target.value))
                }
                className="w-16 bg-[#11131f] border border-gray-700 rounded p-1 text-white text-xs text-center"
              />
            </div>
          </div>
        )}
      </div>

      {/* Dropdown Freebet */}
      <div className="mb-2 relative">
        <button
          onClick={() => setFreebetMenu(!freebetMenu)}
          className="w-full p-2 flex justify-between items-center bg-[#151824] border border-gray-700 rounded-md text-xs font-semibold text-gray-300"
        >
          <span>🎁 FREEBET</span>
          <span className="text-blue-500">
            {via.freebetType === "none" ? "Configurar ⌄" : "Ativo ⌄"}
          </span>
        </button>

        {freebetMenu && (
          <div className="absolute z-20 top-full left-0 mt-1 w-full sm:w-[320px] bg-[#1a1d2d] border border-gray-600 rounded-lg shadow-xl p-3">
            <p className="text-xs text-gray-400 mb-3 font-bold">Freebet</p>
            <div className="space-y-2">
              <label
                className={`flex items-start gap-2 p-2 rounded cursor-pointer border ${via.freebetType === "isFreebet" ? "border-blue-500 bg-blue-900/20" : "border-gray-700 bg-[#11131f]"}`}
              >
                <input
                  type="radio"
                  checked={via.freebetType === "isFreebet"}
                  onChange={() => {
                    onUpdate(index, "freebetType", "isFreebet");
                    setFreebetMenu(false);
                  }}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-bold text-white">
                    Esta aposta é uma Freebet
                  </p>
                  <p className="text-[10px] text-gray-400">
                    O valor da stake não retorna no lucro
                  </p>
                </div>
              </label>
              <label
                className={`flex items-start gap-2 p-2 rounded cursor-pointer border ${via.freebetType === "none" ? "border-blue-500 bg-blue-900/20" : "border-gray-700 bg-[#11131f]"}`}
              >
                <input
                  type="radio"
                  checked={via.freebetType === "none"}
                  onChange={() => {
                    onUpdate(index, "freebetType", "none");
                    setFreebetMenu(false);
                  }}
                  className="mt-1"
                />
                <p className="text-sm font-bold text-white mt-0.5">Nenhuma</p>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Dividir Linhas */}
      <div className="mb-4 bg-[#151824] border border-gray-700 rounded-md p-2 flex justify-between items-center text-xs font-semibold text-gray-300">
        <span className="flex items-center gap-2">✂ DIVIDIR</span>
        <button className="text-gray-500 hover:text-white">
          Adicionar linha +
        </button>
      </div>

      {/* Resultados */}
      <div className="mb-4 bg-[#11131f] border border-gray-700 rounded-md p-3">
        <h3 className="text-[10px] text-gray-500 font-bold mb-2">
          📈 RESULTADO
        </h3>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Lucro</span>
          <span
            className={`text-sm font-bold ${resultadoVia?.lucro > 0 ? "text-green-400" : "text-red-400"}`}
          >
            R$ {resultadoVia?.lucro || "0.00"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">ROI</span>
          <span
            className={`text-xs font-bold ${resultadoVia?.roi > 0 ? "text-green-400" : "text-red-400"}`}
          >
            {resultadoVia?.roi || "0.0000"}%
          </span>
        </div>
      </div>

      <button
        onClick={() => onSetBase(index)}
        className={`mt-auto w-full py-2 rounded-md font-bold text-sm ${isBase ? "bg-indigo-600 text-white" : "bg-[#2a2d42] text-indigo-400 hover:bg-[#343854]"}`}
      >
        {isBase ? "Stake Fixa" : "Fixar Stake"}
      </button>
    </div>
  );
}
