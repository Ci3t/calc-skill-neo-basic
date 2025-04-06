import { useState } from "react";
import CombatStatsOverview from "./CombatStatsOverview";

const GM_PERCENT_LOOKUP = [
  0.0,
  1.9,
  3.8,
  5.7,
  7.6,
  9.5,
  11.4,
  13.3,
  15.2,
  17.1,
  19.0,
  20.9,
  22.8,
  24.7,
  26.6,
  28.5,
  30.0,
  31.5,
  33.0,
  34.5,
  36.0,
  37.5,
  39.0,
  40.5,
  42.0,
  43.5,
  45.0,
  46.5,
  48.0,
  49.5,
  51.0,
  52.5,
  54.0,
  55.5,
  57.0,
  58.5,
  59.6,
  60.7,
  61.8,
  62.9,
  64.0,
  65.1,
  66.2,
  67.3,
  68.4,
  69.5,
  70.6,
  71.7,
  72.8,
  73.9,
  75.0,
  76.1,
  77.2,
  78.3,
  79.4,
  80.5,
  81.6,
  82.7,
  83.8,
  84.9,
  86.0,
  87.1,
  88.2,
  89.3,
  90.4,
  91.5,
  92.6,
  93.7,
  94.8,
  95.9,
  97.0,
  98.1,
  99.2,
  100.3,
  101.4,
  102.5,
  103.6,
  104.7,
  105.8,
  106.9,
  108.0,
  109.1,
  110.2,
  111.3,
  112.4,
  113.5,
  114.6,
  115.7,
  116.8,
  117.9,
  119.0,
  120.1,
  121.2,
  122.3,
  123.4,
  124.5,
  125.6,
  126.7,
  127.8,
  128.9,
  130.0, // up to 130 GM levels, you can add more
];
// --- Crit Multiplier (fixed) ---
function calculateCritMultiplier(cdmgPoints) {
  return (180 * cdmgPoints) / (1800 + cdmgPoints) + 125;
}

// --- Crit Scale (based on crit multiplier) ---
function calculateCritScale(multiplier) {
  return 1 + Math.min(0.07, (multiplier - 150) / 600);
}

// --- Crit Rate (based on crit points) ---
function calculateCritRate(critPoints) {
  return (96.98979 * critPoints) / (1124.069 + critPoints);
}

// --- Weighted average base (used for crit smoothing) ---
function calculateAnchorBase(baseMin, baseMax, totalStats) {
  const avgBase = (baseMin + baseMax) / 2;
  const weight = Math.min(1, Math.max(0, (totalStats - 2500) / 3500));
  return baseMin * (1 - weight) + avgBase * weight;
}
function calculateUniversalCrit(inputData) {
  const {
    minDamage = 0,
    maxDamage = 0,
    attackPower = 0,
    soulBadge = 0,
    critDmg = 0,
    crit = 0,
  } = inputData || {};

  const baseAvg = (parseFloat(minDamage) + parseFloat(maxDamage)) / 2;
  const ap = parseFloat(attackPower);
  const badgeMult = parseFloat(soulBadge) / 100;
  const critDmgPoints = parseFloat(critDmg);

  const totalStats = ap + critDmgPoints;

  // 📈 Smoother tiering (no jumps)
  const scaleFactor = Math.min(1.2, Math.max(0.85, totalStats / 4800)); // floats between ~0.85 – 1.2

  const apScale = 0.62 + scaleFactor * 0.3;
  const baseScale = 0.88 + scaleFactor * 0.1;
  const critBase = 1.27 + scaleFactor * 0.15;
  const critScale = 0.00028 + scaleFactor * 0.00004;

  const totalBase = baseAvg * baseScale + ap * apScale + ap * badgeMult;
  const critMult = critBase + critDmgPoints * critScale;
  const avgCrit = totalBase * critMult * 0.95;

  const variance = avgCrit * 0.04;
  const critMin = avgCrit - variance;
  const critMax = avgCrit + variance;

  return {
    average: avgCrit.toFixed(2),
    min: critMin.toFixed(2),
    max: critMax.toFixed(2),
  };
}

// --- AP Multiplier Conversion ---
function convertSkillDamage(min, max, oldMultiplier, newMultiplier) {
  const factor = newMultiplier / oldMultiplier;
  return {
    newMin: (parseFloat(min) || 0) * factor,
    newMax: (parseFloat(max) || 0) * factor,
  };
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
    currentGMLevel: 0, // purely visual
    currentApMod: "",
    newApMod: "",
    skillApMultiplier: "1.05",
    balanceTweak: "1.00", // balance slider, defaults to 1
  });

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

  const currentGMPercent = formData.currentGMLevel * 1.9;

  const calculateGMTotals = () => {
    let gmLevel = 0;

    books.forEach((book) => {
      gmLevel += book.level * book.count;
    });

    const percentPerLevel = GM_PERCENT_LOOKUP[gmLevel] ?? 0; // fallback to 0 if undefined

    return { gmLevel, percentPerLevel };
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCurrentGMLevelChange = (change) => {
    setFormData((prev) => ({
      ...prev,
      currentGMLevel: Math.max(0, parseInt(prev.currentGMLevel || 0) + change),
    }));
  };

  const handleBookCountChange = (bookId, change) => {
    setBooks((prev) =>
      prev.map((book) =>
        book.id === bookId
          ? { ...book, count: Math.max(0, book.count + change) }
          : book
      )
    );
  };

  const handleTierConvert = () => {
    const { minDamage, maxDamage, currentApMod, newApMod } = formData;
    const { newMin, newMax } = convertSkillDamage(
      minDamage,
      maxDamage,
      currentApMod,
      newApMod
    );
    setFormData((prev) => ({
      ...prev,
      minDamage: newMin.toFixed(0),
      maxDamage: newMax.toFixed(0),
    }));
  };

  const calculateDamage = () => {
    const { minDamage, maxDamage, attackPower, soulBadge, crit, critDmg } =
      formData;

    const { gmLevel, percentPerLevel } = calculateGMTotals();
    const currentGM = parseInt(formData.currentGMLevel) || 0;

    const min = parseFloat(minDamage);
    const max = parseFloat(maxDamage);
    const ap = parseFloat(attackPower);
    const badgePercent = parseFloat(soulBadge) || 0;
    const critValue = parseFloat(crit);
    const critDmgValue = parseFloat(critDmg);
    const balance = parseFloat(formData.balanceTweak) || 1.0;

    if (
      isNaN(min) ||
      isNaN(max) ||
      isNaN(ap) ||
      isNaN(critValue) ||
      isNaN(critDmgValue)
    ) {
      setResult({
        error: true,
        message: "⚠️ Please fill in all required fields.",
      });
      return;
    }

    // Calculate Crit Damage using new universal scaling
    const baseAvg = (min + max) / 2;
    const badgeMult = badgePercent / 100;
    // Total character stats for tier scaling
    const totalStats = ap + critDmgValue;

    // Smooth scaling factor based on stat tier
    const scaleFactor = Math.min(1.2, Math.max(0.85, totalStats / 4800));
    const apScale = 0.62 + scaleFactor * 0.3;
    const baseScale = 0.88 + scaleFactor * 0.1;
    const critBase = 1.27 + scaleFactor * 0.15;
    const critScale = (0.00028 + scaleFactor * 0.00004) * balance;

    // 🎯 Only use books for damage calculation (currentGM is visual only)
    const gmPercentFromTable = GM_PERCENT_LOOKUP[gmLevel] ?? gmLevel * 1.9;
    const gmPercentBonus = gmPercentFromTable * 0.728; // damage scale

    // Adjusted base average
    const adjustedBaseAvg = baseAvg + (baseAvg * gmPercentBonus) / 100;

    // Base + AP + Badge
    const totalBase =
      adjustedBaseAvg * baseScale + ap * apScale + ap * badgeMult;

    // Crit calculation
    const critMultiplier = critBase + critDmgValue * critScale;
    const avgCrit = totalBase * critMultiplier * (0.95 * balance);

    // Variance
    const variance = avgCrit * 0.04;
    const critMin = avgCrit - variance;
    const critMax = avgCrit + variance;

    // 🎯 Show UI base damage (min/max) with full GM effect (books + currentGM — for display only)
    const totalGMPercent = percentPerLevel + currentGM * 1.9;
    const gmDisplayBonus = (totalGMPercent * 0.728) / 100;

    const adjustedBaseMin = min + min * gmDisplayBonus;
    const adjustedBaseMax = max + max * gmDisplayBonus;
    const avgNormalHit = totalBase.toFixed(2);
    const normalMin = (totalBase * 0.97).toFixed(2);
    const normalMax = (totalBase * 1.03).toFixed(2);

    setResult({
      error: false,
      baseWithoutGM: `🟫 Base Damage (no GM): ${min.toFixed(0)} – ${max.toFixed(
        0
      )}`,
      baseWithGM: `🟪 Base Damage (with GM): ${adjustedBaseMin.toFixed(
        0
      )} – ${adjustedBaseMax.toFixed(0)}`,
      normalDamage: `🔸 Non-Crit Damage: ${normalMin} – ${normalMax}`,

      critDamage: `🔹 Crit Range: ${critMin.toFixed(2)} – ${critMax.toFixed(
        2
      )}`,
      avgNormalHit: `⚪ Avg Hit (non-crit): ${avgNormalHit}`,
      avgCritHit: `💥 Avg Crit Damage: ${avgCrit.toFixed(2)}`,
      // critRateCalculated: `📈 Crit Rate: ${critRate.toFixed(2)}%`,
      visualTotalLevel: gmLevel + currentGM,
      visualTotalPercent: percentPerLevel + currentGM * 1.9,
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

        <div className="bg-black/40 p-5 rounded-lg border-l-4 border-yellow-600 mb-6">
          <h2 className="text-yellow-400 text-lg uppercase tracking-wide flex items-center mb-4 font-semibold">
            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
            Instructions
          </h2>

          <div className="text-red-400 space-y-3 text-sm">
            {/* Important Notes */}
            <p>
              <strong>Important Notes:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                This calculator assumes <strong>zero defense</strong> on the
                enemy (based on training dummy tests).
              </li>
              <li>
                Expect <strong>700–1000 less damage</strong> on actual enemies
                due to defense.
              </li>
              <li>
                Results are <strong>estimates</strong> meant to guide your build
                — not exact values.
              </li>
              <li>
                <strong>Crit Rate</strong> and{" "}
                <strong>Crit Damage Multiplier</strong> use{" "}
                <strong>community-based formulas</strong>. They are not official
                but closely match in-game results.
              </li>
            </ul>
          </div>
          <div className="text-cyan-200 text-sm">
            {/* How to Use */}
            <p className="mt-3">
              <strong>How to Use:</strong>
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Enter your base skill damage and character stats.{" "}
                <span className="text-yellow-300">
                  (Press K and hover your skill in-game)
                </span>
              </li>
              <li>
                If your skill already has books applied, set the{" "}
                <strong className="text-red-500">Current GM Level</strong>{" "}
                accordingly.
              </li>
              <li>
                To test extra GM books, use the <strong>Book Selector</strong>{" "}
                to add them.
              </li>
              <li>
                <strong>Balance Tweak Slider:</strong> Use this slider to adjust
                crit damage scaling.
                <br />
                Match it to your in-game average crit range — then test GM book
                bonuses for that skill.
              </li>
              <li>
                <strong>AP Modifier Conversion:</strong>
                Use this only when upgrading your base skill to a higher-tier
                book. For example:
                <br />
                You have 3 Blue Ice Rains and want to simulate a Purple one:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>
                    Set the Blue book’s AP Modifier as <strong>Current</strong>.
                  </li>
                  <li>
                    Set the Purple book’s AP Modifier as <strong>New</strong>.
                  </li>
                  <li>
                    Click <strong>"Convert Skill Tier"</strong> once. It will
                    simulate having that higher-tier book as your base skill.
                  </li>
                  <li>
                    After that, use the Book Selector below to add more books
                    for GM testing.
                  </li>
                </ul>
              </li>
              <li>
                Finally, press <strong>"Calculate"</strong> to view damage
                output.
              </li>
            </ol>
          </div>
          <div className="text-yellow-500 text-sm">
            {/* Skill Books Reference */}
            <p className="mt-3">
              <strong>📚 Skill Books Reference:</strong>
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
          <>
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
                {/* AP Modifier Conversion Section */}
                <p className="mt-4 text-yellow-300 text-sm">
                  🔗 You can look up skill AP modifiers at{" "}
                  <a
                    href="https://yast.vercel.app/?subView=%22SkillView%22&p=%22NEOEU190325%22"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-cyan-400 hover:text-cyan-300"
                  >
                    yast.vercel.app
                  </a>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      htmlFor="currentApMod"
                      className="block text-cyan-200 font-medium mb-1 text-sm hover:text-cyan-400 transition-colors"
                    >
                      Current AP Modifier:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      id="currentApMod"
                      placeholder="e.g. 2.80"
                      className="no-spinner w-full p-3 bg-gray-900/90 border border-cyan-500/30 rounded-lg text-white outline-none focus:border-cyan-500/80 focus:shadow-lg focus:shadow-cyan-500/40 transition-all"
                      value={formData.currentApMod}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="newApMod"
                      className="block text-cyan-200 font-medium mb-1 text-sm hover:text-cyan-400 transition-colors"
                    >
                      New AP Modifier:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      id="newApMod"
                      placeholder="e.g. 3.30"
                      className="no-spinner w-full p-3 bg-gray-900/90 border border-cyan-500/30 rounded-lg text-white outline-none focus:border-cyan-500/80 focus:shadow-lg focus:shadow-cyan-500/40 transition-all"
                      value={formData.newApMod}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Convert Button */}
                <div className="mt-4">
                  <button
                    onClick={handleTierConvert}
                    className="w-full bg-gradient-to-r cursor-pointer from-purple-700 to-purple-500 hover:from-purple-600 hover:to-purple-400 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-purple-700/40"
                  >
                    Convert Skill Tier
                  </button>
                </div>

                {/* Current GM Level Selector */}
                <div className="mt-4 p-3 bg-purple-800/20 rounded-lg border border-purple-500/20">
                  <h3 className="text-purple-300 font-medium mb-2">
                    Current GM Level
                  </h3>
                  <p className="text-white/70 text-sm mb-3">
                    If your skill already has books applied, set this to your
                    current GM level.{" "}
                    <span className="font-semibold text-red-500">
                      {" (each level = 1.90%)"}
                    </span>{" "}
                  </p>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleCurrentGMLevelChange(-1)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-purple-300  text-xl hover:bg-purple-800 transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="mx-3 text-white w-10 text-center">
                      {formData.currentGMLevel || 0}
                    </span>
                    <button
                      onClick={() => handleCurrentGMLevelChange(1)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-xl text-purple-300 hover:bg-purple-800 transition-colors cursor-pointer"
                    >
                      +
                    </button>
                    <div className="ml-4">
                      <span className="text-purple-200">GM Percent: </span>
                      <span className="text-white font-medium">
                        {GM_PERCENT_LOOKUP[formData.currentGMLevel] || 0}%
                      </span>
                    </div>
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
                      <div
                        className={`text-${book.color}-300 font-medium w-24`}
                      >
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

                  {/* Corrected Additional GM Summary (Books only) */}
                  <div className="mt-4 p-3 bg-gray-900/40 rounded-lg border border-cyan-500/20">
                    <div className="flex justify-between">
                      <span className="text-cyan-200">
                        Additional GM Level:
                      </span>
                      <span className="text-white font-medium">{gmLevel}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-cyan-200">Additional Percent:</span>
                      <span className="text-white font-medium">
                        {percentPerLevel.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Total GM Summary (GM level + books) */}
                  <div className="mt-2 p-3 bg-gray-800/40 rounded-lg border border-yellow-500/20">
                    <div className="flex justify-between text-yellow-300 font-semibold">
                      <span>Total GM Level:</span>
                      <span>
                        {gmLevel + (parseInt(formData.currentGMLevel) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-yellow-300 font-semibold mt-1">
                      <span>Total Percent:</span>
                      <span>
                        {(
                          percentPerLevel +
                          (parseInt(formData.currentGMLevel) || 0) * 1.9
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>

          {/* Right Column */}
          <div className="space-y-6">
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
              {/* Balance Tweak Slider */}
              <div className="bg-black/40 p-5 rounded-lg border-l-4 border-yellow-600 mt-4">
                <h2 className="text-yellow-400 text-lg uppercase tracking-wide mb-4 font-semibold">
                  Balance Tweak (Dev Tool)
                </h2>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="balanceTweak"
                    className="text-yellow-200 text-sm"
                  >
                    Tweak global damage scaling (affects crit scale + final
                    multiplier)
                  </label>
                  <input
                    type="range"
                    id="balanceTweak"
                    min="0.50"
                    max="1.50"
                    step="0.01"
                    value={formData.balanceTweak}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <span className="text-white text-sm">
                    Balance Factor:{" "}
                    <strong className="text-yellow-300">
                      {formData.balanceTweak}
                    </strong>
                  </span>
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
      <footer className="mt-2 flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4">
        {/* Copyright */}
        <div className="bg-black/40 p-2 rounded-lg border-l-4 border-cyan-600">
          <h2 className="text-cyan-400 text-lg uppercase tracking-wide font-semibold">
            &#169; Ci3t {new Date().getFullYear()}
          </h2>
        </div>
        {/* PayPal Donate Button */}
        <div className="bg-black/40 p-2 rounded-lg border border-cyan-500/20">
          <form
            action="https://www.paypal.com/donate"
            method="post"
            target="_top"
          >
            <input
              type="hidden"
              name="hosted_button_id"
              value="QUQUW9C58UNJL"
            />
            <input
              type="image"
              src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif"
              name="submit"
              alt="Donate with PayPal button"
              className="w-auto h-auto"
            />
          </form>
        </div>
      </footer>
    </div>
  );
}

export default App;
