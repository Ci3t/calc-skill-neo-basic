import { useState } from "react";

// Corrected Crit Rate formula (returns percentage directly)
function calculateCritRate(critPoints, onrush = false) {
  const base = (96.98979 * critPoints) / (critPoints + 2368.384);
  const extra = onrush ? 10 : 0;
  return base + extra;
}

// Corrected Crit Multiplier (returns multiplier like 2.32)
function calculateCritMultiplier(cdmgPoints) {
  return (cdmgPoints * 290.8) / (cdmgPoints + 2102.36) + 125;
}

// Accuracy returns % (e.g., 100.12%)
function calculateAccuracyPercent(points) {
  return (96.16 * points) / (820.5 + points) + 85;
}

// Debuff Resist returns % (e.g., 85.33%)
function calculateDebuffResistPercent(points) {
  return (100.0794 * points) / (366.3908 + points);
}

export default function CombatStatsOverview({
  crit,
  critDmg,
  accuracy,
  debuffResist,
  onChange,
  onrush,
}) {
  const parsedCrit = parseFloat(crit);
  const parsedCritDmg = parseFloat(critDmg);
  const parsedAccuracy = parseFloat(accuracy);
  const parsedDebuffResist = parseFloat(debuffResist);

  return (
    <div className="bg-black/40 p-5 rounded-lg border-l-4 border-cyan-600">
      <h2 className="text-cyan-400 text-lg uppercase tracking-wide flex items-center mb-4 font-semibold">
        <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
        Combat Stats Overview
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label
            htmlFor="crit"
            className="block text-cyan-200 font-medium mb-1 text-sm hover:text-cyan-400 transition-colors"
          >
            Critical (points):
          </label>
          <input
            type="number"
            id="crit"
            placeholder="e.g. 1711"
            className="no-spinner w-full p-3 bg-gray-900/90 border border-cyan-500/30 rounded-lg text-white outline-none focus:border-cyan-500/80 focus:shadow-lg focus:shadow-cyan-500/40 transition-all"
            value={crit}
            onChange={onChange}
          />
        </div>
        <div>
          <label
            htmlFor="critDmg"
            className="block text-cyan-200 font-medium mb-1 text-sm hover:text-cyan-400 transition-colors"
          >
            Critical Damage (points):
          </label>
          <input
            type="number"
            id="critDmg"
            placeholder="e.g. 1117"
            className="no-spinner w-full p-3 bg-gray-900/90 border border-cyan-500/30 rounded-lg text-white outline-none focus:border-cyan-500/80 focus:shadow-lg focus:shadow-cyan-500/40 transition-all"
            value={critDmg}
            onChange={onChange}
          />
        </div>
        <div>
          <label
            htmlFor="accuracy"
            className="block text-cyan-200 font-medium mb-1 text-sm hover:text-cyan-400 transition-colors"
          >
            Accuracy (points):
          </label>
          <input
            type="number"
            id="accuracy"
            placeholder="e.g. 950"
            className="no-spinner w-full p-3 bg-gray-900/90 border border-cyan-500/30 rounded-lg text-white outline-none focus:border-cyan-500/80 focus:shadow-lg focus:shadow-cyan-500/40 transition-all"
            value={accuracy}
            onChange={onChange}
          />
        </div>
        <div>
          <label
            htmlFor="debuffResist"
            className="block text-cyan-200 font-medium mb-1 text-sm hover:text-cyan-400 transition-colors"
          >
            Debuff Resistance (points):
          </label>
          <input
            type="number"
            id="debuffResist"
            placeholder="e.g. 420"
            className="no-spinner w-full p-3 bg-gray-900/90 border border-cyan-500/30 rounded-lg text-white outline-none focus:border-cyan-500/80 focus:shadow-lg focus:shadow-cyan-500/40 transition-all"
            value={debuffResist}
            onChange={onChange}
          />
        </div>
      </div>

      {/* Onrush Checkbox */}
      <div className="mt-4 flex items-center space-x-3">
        <input
          type="checkbox"
          id="onrush"
          checked={onrush}
          onChange={(e) =>
            onChange({
              target: { id: "onrush", value: e.target.checked },
            })
          }
          className="w-4 h-4 text-cyan-500 bg-gray-800 border-cyan-500 rounded focus:ring-cyan-400"
        />
        <label htmlFor="onrush" className="text-cyan-200 text-l">
          🌀 Onrush Active (+10% Crit Rate)
        </label>
      </div>

      {/* Calculated Values */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="flex justify-between text-cyan-200">
          <span>📈 Crit Rate:</span>
          <span className="text-white font-medium">
            {isNaN(parsedCrit)
              ? "--"
              : `${calculateCritRate(parsedCrit, onrush).toFixed(2)}%`}
          </span>
        </div>

        <div className="flex justify-between text-cyan-200">
          <span>🔥 Crit Damage Multiplier:</span>
          <span className="text-white font-medium">
            {isNaN(parsedCritDmg)
              ? "--"
              : `${calculateCritMultiplier(parsedCritDmg).toFixed(2)}%`}
          </span>
        </div>

        <div className="flex justify-between text-cyan-200">
          <span>🎯 Accuracy:</span>
          <span className="text-white font-medium">
            {isNaN(parsedAccuracy)
              ? "--"
              : `${calculateAccuracyPercent(parsedAccuracy).toFixed(2)}%`}
          </span>
        </div>

        <div className="flex justify-between text-cyan-200">
          <span>🛡️ Debuff Resistance:</span>
          <span className="text-white font-medium">
            {isNaN(parsedDebuffResist)
              ? "--"
              : `${calculateDebuffResistPercent(parsedDebuffResist).toFixed(
                  2
                )}%`}
          </span>
        </div>
      </div>
    </div>
  );
}
