import { useState } from "react";
import CombatStatsOverview from "./CombatStatsOverview";

// --- Grandmaster Bonus ---
function getBaseWithGM(min, max, level, percentPerLevel) {
  const effectivePercent = percentPerLevel * 0.728;
  const bonusMin = level > 0 ? min * (effectivePercent / 100) * level : 0;
  const bonusMax = level > 0 ? max * (effectivePercent / 100) * level : 0;
  return {
    baseMin: min + bonusMin,
    baseMax: max + bonusMax,
  };
}

// --- Crit Multiplier (fixed) ---
function calculateCritMultiplier(cdmgPoints) {
  return (290.8 * cdmgPoints) / (2102.36 + cdmgPoints) + 125;
}

// --- Crit Scale (based on crit multiplier) ---
function calculateCritScale(multiplier) {
  return 1 + Math.min(0.1, Math.max(0, (multiplier - 150) / 500));
}

// --- Crit Rate (based on crit points) ---
function calculateCritRate(critPoints) {
  return (96.98979 * critPoints) / (1124.069 + critPoints);
}

// --- Weighted average base (used for crit smoothing) ---
function calculateAnchorBase(baseMin, baseMax, totalStats) {
  const avgBase = (baseMin + baseMax) / 2;
  const weight = Math.min(1, Math.max(0, (totalStats - 3000) / 3000));
  return baseMin * (1 - weight) + avgBase * weight;
}

function App() {
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    minDamage: "",
    maxDamage: "",
    attackPower: "",
    soulBadge: "",
    crit: "",
    critDmg: "",
    accuracy: "",
    debuffResist: "",
  });

  // Define book types and their values
  const bookTypes = [
    {
      id: "green",
      name: "Green Book",
      level: 1,
      percent: 1.9,
      count: 0,
      color: "green",
    },
    {
      id: "blue",
      name: "Blue Book",
      level: 2,
      percent: 3.8,
      count: 0,
      color: "blue",
    },
    {
      id: "purple",
      name: "Purple Book",
      level: 6,
      percent: 11.4,
      count: 0,
      color: "purple",
    },
    {
      id: "legendary",
      name: "Legendary Book",
      level: 18,
      percent: 33,
      count: 0,
      color: "yellow",
    },
  ];

  const [books, setBooks] = useState(bookTypes);

  // Calculate total GM level and percent from books
  const calculateGMTotals = () => {
    let totalLevel = 0;
    let totalPercent = 0;

    books.forEach((book) => {
      totalLevel += book.level * book.count;
      totalPercent += book.percent * book.count;
    });

    return { gmLevel: totalLevel, percentPerLevel: totalPercent };
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleBookCountChange = (bookId, change) => {
    setBooks((prevBooks) =>
      prevBooks.map((book) =>
        book.id === bookId
          ? { ...book, count: Math.max(0, book.count + change) }
          : book
      )
    );
  };

  const calculateDamage = () => {
    const { minDamage, maxDamage, attackPower, soulBadge, crit, critDmg } =
      formData;

    // Get GM values from books
    const { gmLevel, percentPerLevel } = calculateGMTotals();

    const min = parseFloat(minDamage);
    const max = parseFloat(maxDamage);
    const level = parseFloat(gmLevel) || 0;
    const percent = parseFloat(percentPerLevel) || 0;
    const ap = parseFloat(attackPower);
    const badgePercent = parseFloat(soulBadge) || 0;
    const critValue = parseFloat(crit);
    const critDmgValue = parseFloat(critDmg);

    if (isNaN(critValue) || isNaN(critDmgValue)) {
      setResult({
        error: true,
        message: "⚠️ Please enter both Critical and Crit Damage points.",
      });
      return;
    }

    if (isNaN(min) || isNaN(max) || isNaN(ap)) {
      const critRate = calculateCritRate(critValue);
      const critMultiplier = calculateCritMultiplier(critDmgValue);

      setResult({
        error: false,
        critRateCalculated: `📈 Crit Rate: ${critRate.toFixed(2)}%`,
        critMultiplierCalculated: `🔥 Crit Damage Multiplier: ${critMultiplier.toFixed(
          2
        )}%`,
        message: "ℹ️ Enter full stats to calculate full damage output.",
      });
      return;
    }

    // --- Base Damage with GM Bonuses ---
    const gmMultiplier = 1 + (percent / 100) * level;
    const effectivePercent = percent * 0.728;
    const bonusMin = level > 0 ? min * (effectivePercent / 100) * level : 0;
    const bonusMax = level > 0 ? max * (effectivePercent / 100) * level : 0;
    const baseMin = min + bonusMin;
    const baseMax = max + bonusMax;

    // --- Badge Bonus ---
    const badgeBonus = ap * (badgePercent / 100);

    // --- Normal Hit ---
    const normalMin = (baseMin + ap + badgeBonus) * 0.88;
    const normalMax = (baseMax + ap + badgeBonus) * 0.88;
    const avgNormal = (normalMin + normalMax) / 2;

    // --- Crit Rate Calculation ---
    const critRate = (96.98979 * critValue) / (1124.069 + critValue);

    // --- Crit Multiplier (correct formula) ---
    const critMultiplier =
      (290.8 * critDmgValue) / (2102.36 + critDmgValue) + 125;

    // --- Crit Scale (bonus scaling for higher crit%) ---
    const critScale =
      1 + Math.min(0.1, Math.max(0, (critMultiplier - 150) / 500));

    // --- Anchor Base (used for consistent crit output) ---
    const avgBase = (baseMin + baseMax) / 2;
    const totalStats = ap + critValue + critDmgValue;
    const weight = Math.min(1, Math.max(0, (totalStats - 3000) / 3000));
    const anchorBase = baseMin * (1 - weight) + avgBase * weight;

    // --- Final Base including all sources ---
    const baseNormal = anchorBase + ap + badgeBonus;

    // ✅ FINAL Crit Damage Calc
    // Normalize critMultiplier to original formula (around 180%)
    const baseCrit = baseNormal * (critMultiplier / 155) * critScale;
    const critMin = baseCrit * 0.985 * 1.015;
    const critMax = baseCrit * 1.015 * 1.015;
    const avgCrit = (critMin + critMax) / 2;

    // --- Output Results ---
    setResult({
      error: false,
      baseWithoutGM: `🟫 Base Damage (no GM): ${min.toFixed(0)} – ${max.toFixed(
        0
      )}`,
      baseWithGM: `🟪 Base Damage (with GM): ${baseMin.toFixed(
        2
      )} – ${baseMax.toFixed(2)}`,
      normalDamage: `🔸 Non-Crit Damage: ${normalMin.toFixed(
        2
      )} – ${normalMax.toFixed(2)}`,
      critDamage: `🔹 Crit Damage: ${critMin.toFixed(2)} – ${critMax.toFixed(
        2
      )}`,
      avgNormalHit: `⭐ Avg Hit (non-crit): ${avgNormal.toFixed(2)}`,
      avgCritHit: `💥 Avg Hit (crit): ${avgCrit.toFixed(2)}`,
      critRateCalculated: `📈 Crit Rate: ${critRate.toFixed(2)}%`,
      critMultiplierCalculated: `🔥 Crit Damage Multiplier: ${critMultiplier.toFixed(
        2
      )}%`,
      critScaleCalculated: `🛠 Crit Scale: ${critScale.toFixed(3)}`,
    });
  };

  // Get GM totals for display
  const { gmLevel, percentPerLevel } = calculateGMTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-teal-900 py-8 px-4 flex flex-col items-center justify-center">
      <div className="bg-black/70 p-6 md:p-8 rounded-xl shadow-lg shadow-cyan-500/30 w-full max-w-4xl backdrop-blur-md border border-cyan-500/10 animate-fade-in">
        <h1 className="text-cyan-400 text-2xl md:text-3xl font-bold mb-6 text-center drop-shadow-lg shadow-cyan-500/50">
          Skill Damage Calculator
        </h1>

        {/* Instructions Section */}
        <div className="bg-black/40 p-5 rounded-lg border-l-4 border-yellow-600 mb-6">
          <h2 className="text-yellow-400 text-lg uppercase tracking-wide flex items-center mb-4 font-semibold">
            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
            Instructions
          </h2>
          <div className="text-yellow-200 space-y-3 text-sm">
            <p>
              <strong>Important Notes:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                This calculator assumes <strong>zero defense</strong> on the
                enemy (based on training dummy tests).
              </li>
              <li>
                Expect 700-1000 less damage on actual enemies due to their
                defense values.
              </li>
              <li>
                The results provide a good estimate but should be taken with a
                grain of salt.
              </li>
            </ul>

            <p className="mt-3">
              <strong>How to Use:</strong>
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Fill in your base skill damage and character stats values.
              </li>
              <li>
                For Grandmaster skills (optional):
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>
                    <strong>If you already have multi-skill books:</strong>{" "}
                    Leave Grandmaster fields empty since the game already scaled
                    it in base skill damage.
                  </li>
                  <li>
                    <strong> If you want to test additional books</strong>:{" "}
                    <br />
                    Select the number of additional books you want to test using
                    the book selector interface.
                  </li>
                  <li>
                    <strong>If you have no skill books:</strong> Leave all book
                    counters at zero.
                  </li>
                </ul>
              </li>
              <li>
                Press the Calculate button to get your damage information.
              </li>
            </ol>

            <p className="mt-3">
              <strong>Skill Books Reference:</strong>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              <div className="bg-green-900/30 p-2 rounded border border-green-500/30">
                <p className="text-green-300 font-semibold">Green Book</p>
                <p>Level 1, 1.90%</p>
              </div>
              <div className="bg-blue-900/30 p-2 rounded border border-blue-500/30">
                <p className="text-blue-300 font-semibold">Blue Book</p>
                <p>Level 2, 3.80%</p>
              </div>
              <div className="bg-purple-900/30 p-2 rounded border border-purple-500/30">
                <p className="text-purple-300 font-semibold">Purple Book</p>
                <p>Level 6, 11.40%</p>
              </div>
              <div className="bg-yellow-900/30 p-2 rounded border border-yellow-500/30">
                <p className="text-yellow-300 font-semibold">Legendary Book</p>
                <p>Level 18, 33%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Base Skill Damage Section */}
            <div className="bg-black/40 p-5 rounded-lg border-l-4 border-cyan-600">
              <h2 className="text-cyan-400 text-lg uppercase tracking-wide flex items-center mb-4 font-semibold">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                Base Skill Damage
              </h2>
              <div className=" grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="minDamage"
                    className="block text-cyan-200 font-medium mb-1 text-sm hover:text-cyan-400 transition-colors"
                  >
                    Base Min Damage:
                  </label>
                  <input
                    type="number"
                    id="minDamage"
                    placeholder="e.g. 2594"
                    className="no-spinner w-full p-3 bg-gray-900/90 border border-cyan-500/30 rounded-lg text-white outline-none focus:border-cyan-500/80 focus:shadow-lg focus:shadow-cyan-500/40 transition-all"
                    value={formData.minDamage}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="maxDamage"
                    className="block text-cyan-200 font-medium mb-1 text-sm hover:text-cyan-400 transition-colors"
                  >
                    Base Max Damage:
                  </label>
                  <input
                    type="number"
                    id="maxDamage"
                    placeholder="e.g. 2799"
                    className="no-spinner w-full p-3 bg-gray-900/90 border border-cyan-500/30 rounded-lg text-white outline-none focus:border-cyan-500/80 focus:shadow-lg focus:shadow-cyan-500/40 transition-all"
                    value={formData.maxDamage}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Grandmaster Skill Section with Book Selection UI */}
            <div className="bg-black/40 p-5 rounded-lg border-l-4 border-cyan-600">
              <h2 className="text-cyan-400 text-lg uppercase tracking-wide flex items-center mb-4 font-semibold">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                Grandmaster Skill
              </h2>

              {/* Book selection interface */}
              <div className="space-y-3">
                {books.map((book) => (
                  <div
                    key={book.id}
                    className={`flex items-center p-2 rounded bg-${book.color}-900/30 border border-${book.color}-500/30`}
                  >
                    <div className={`text-${book.color}-300 font-medium w-24`}>
                      {book.name}
                    </div>
                    <div className="flex items-center ml-auto">
                      <button
                        onClick={() => handleBookCountChange(book.id, -1)}
                        className={`flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-${book.color}-300 hover:bg-${book.color}-800 transition-colors cursor-pointer`}
                      >
                        -
                      </button>
                      <span className="mx-3 text-white w-4 text-center">
                        {book.count}
                      </span>
                      <button
                        onClick={() => handleBookCountChange(book.id, 1)}
                        className={`flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-${book.color}-300 hover:bg-${book.color}-800 transition-colors cursor-pointer`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}

                {/* Summary display */}
                <div className="mt-4 p-3 bg-gray-900/40 rounded-lg border border-cyan-500/20">
                  <div className="flex justify-between">
                    <span className="text-cyan-200">Total GM Level:</span>
                    <span className="text-white font-medium">{gmLevel}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-cyan-200">Total Percent:</span>
                    <span className="text-white font-medium">
                      {percentPerLevel.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Character Stats Section */}
            {/* Character Stats Section */}
            <div className="bg-black/40 p-5 rounded-lg border-l-4 border-cyan-600">
              <h2 className="text-cyan-400 text-lg uppercase tracking-wide flex items-center mb-4 font-semibold">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                Character Stats
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col h-full">
                  <label
                    htmlFor="attackPower"
                    className="block text-cyan-200 font-medium mb-1 text-sm hover:text-cyan-400 transition-colors"
                  >
                    Attack Power (AP):
                  </label>
                  <input
                    type="number"
                    id="attackPower"
                    placeholder="e.g. 700"
                    className="no-spinner w-full p-3 mt-auto bg-gray-900/90 border border-cyan-500/30 rounded-lg text-white outline-none focus:border-cyan-500/80 focus:shadow-lg focus:shadow-cyan-500/40 transition-all"
                    value={formData.attackPower}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex flex-col h-full">
                  <label
                    htmlFor="soulBadge"
                    className="block text-cyan-200 font-medium mb-1 text-sm hover:text-cyan-400 transition-colors"
                  >
                    Soul Badge Bonus (% of AP):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="soulBadge"
                    placeholder="e.g. 55"
                    className="no-spinner w-full p-3 mt-auto bg-gray-900/90 border border-cyan-500/30 rounded-lg text-white outline-none focus:border-cyan-500/80 focus:shadow-lg focus:shadow-cyan-500/40 transition-all"
                    value={formData.soulBadge}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <CombatStatsOverview
              crit={formData.crit}
              critDmg={formData.critDmg}
              accuracy={formData.accuracy}
              debuffResist={formData.debuffResist}
              onChange={handleChange}
            />
          </div>
        </div>

        <button
          onClick={calculateDamage}
          className="w-full mt-6 py-4 px-6 bg-gradient-to-r from-cyan-600 to-cyan-400 text-white font-bold text-lg tracking-wide uppercase rounded-lg hover:from-cyan-500 hover:to-cyan-300 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/40 transform hover:-translate-y-1 active:translate-y-0 cursor-pointer"
        >
          Calculate
        </button>

        {result && (
          <div
            className={`mt-8 p-5 font-semibold text-teal-300 whitespace-pre-line rounded-lg border ${
              result.error
                ? "border-red-500 bg-black/50"
                : "border-teal-500/20 bg-black/50"
            } ${!result.error ? "animate-pulse-glow" : ""}`}
          >
            {result.error ? (
              <p>{result.message}</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p>{result.baseWithoutGM}</p>
                  <p>{result.baseWithGM}</p>
                  <p>{result.normalDamage}</p>
                  <p>{result.critDamage}</p>
                </div>
                <div className="space-y-2">
                  <p>{result.avgNormalHit}</p>
                  <p>{result.avgCritHit}</p>
                  <p>{result.critRateCalculated}</p>
                  <p>{result.critMultiplierCalculated}</p>
                  <p>{result.critScaleCalculated}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <footer className="mt-2 flex justify-center items-center">
        <div className="bg-black/40 p-2  rounded-lg border-l-4 border-cyan-600">
          <h2 className="text-cyan-400 text-lg uppercase tracking-wide flex items-center  font-semibold">
            &#169; Ci3t {new Date().getFullYear()}
          </h2>
        </div>
      </footer>
    </div>
  );
}

export default App;
