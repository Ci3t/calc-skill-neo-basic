import { useState } from "react";
import CombatStatsOverview from "./CombatStatsOverview";

const GM_PERCENT_LOOKUP = [
  0.0, 1.9, 3.8, 5.7, 7.6, 9.5, 11.4, 13.3, 15.2, 17.1, 19.0, 20.9, 22.8, 24.7,
  26.6, 28.5, 30.0, 31.5, 33.0, 34.5, 36.0, 37.5, 39.0, 40.5, 42.0, 43.5, 45.0,
  46.5, 48.0, 49.5, 51.0, 52.5, 54.0, 55.5, 57.0, 58.5, 59.6, 60.7, 61.8, 62.9,
  64.0, 65.1, 66.2, 67.3, 68.4, 69.5, 70.6, 71.7, 72.8, 73.9, 75.0, 76.1, 77.2,
  78.3, 79.4, 80.5, 81.6, 82.7, 83.8, 84.9, 86.0, 87.1, 88.2, 89.3, 90.4, 91.5,
  92.6, 93.7, 94.8, 95.9, 97.0, 98.1, 99.2, 100.3, 101.4, 102.5, 103.6, 104.7,
  105.8, 106.9, 108.0, 109.1, 110.2, 111.3, 112.4, 113.5, 114.6, 115.7, 116.8,
  117.9, 119.0, 120.1, 121.2, 122.3, 123.4, 124.5, 125.6, 126.7, 127.8, 128.9,
  130.0, 130.7, 131.4, 132.1, 132.8, 133.5, 134.2, 134.9, 135.6, 136.3, 137.0,
  137.7, 138.4, 139.1, 139.8, 140.5, 141.2, 141.9, 142.6, 143.3, 144.0, 144.7,
  145.4, 146.1, 146.8, 147.5, 148.2, 148.9, 149.6, 150.3, 151.0, 151.7, 152.4,
  153.1, 153.8, 154.5, 155.2, 155.9, 156.6, 157.3, 158.0, 158.7, 159.4, 160.1,
  160.8, 161.5, 162.2, 162.9, 163.6, 164.3, 165.0, 165.7, 166.4, 167.1, 167.8,
  168.5, 169.2, 169.9, 170.6, 171.3, 172.0, 172.7, 173.4, 174.1, 174.8, 175.5,
  175.8, 176.1, 176.4, 176.7, 177.0, 177.3, 177.6, 177.9, 178.2, 178.5, 178.8,
  179.1, 179.4, 179.7, 180.0, 180.3, 180.6, 180.9, 181.2, 181.5, 181.8, 182.1,
  182.4, 182.7, 183.0, 183.3, 183.6, 183.9, 184.2, 184.5, 184.8, 185.1, 185.4,
  185.7, 186.0, 186.3, 186.6, 186.9, 187.2, 187.5, 187.8, 188.1, 188.4, 188.7,
  189.0, 189.3, 189.6, 189.9, 190.2, 190.5, 190.8, 191.1, 191.4, 191.7, 192.0,
  192.3, 192.6, 192.9, 193.2, 193.5, 193.8, 194.1, 194.4, 194.7, 195.0, 195.3,
  195.6, 195.9, 196.2, 196.5, 196.8, 197.1, 197.4, 197.7, 198.0, 198.3, 198.6,
  198.9, 199.2, 199.5, 199.8, 200.1, 200.4, 200.7, 201.0, 201.3, 201.6, 201.9,
  202.2, 202.5, 202.8, 203.1, 203.4, 203.7, 204.0, 204.3, 204.6, 204.9, 205.2,
  205.5, 205.8, 206.1, 206.4, 206.7, 207.0, 207.3, 207.6, 207.9, 208.2, 208.5,
  208.8, 209.1, 209.4, 209.7, 210.0, 210.3, 210.6, 210.9, 211.2, 211.5, 211.8,
  212.1, 212.4, 212.7, 213.0, 213.3, 213.6, 213.9, 214.2, 214.5, 214.8, 215.1,
  215.4, 215.7, 216.0, 216.3, 216.6, 216.9, 217.2, 217.5, 217.8,
];

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
    balanceTweak: "1.00", // defaults to 1
    onrush: false,
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

  const getGmPercent = (gmLevel) => {
    const MAX_GM_LEVEL = 306;
    const MAX_GM_PERCENT = 217.8;
    if (gmLevel > MAX_GM_LEVEL) {
      return MAX_GM_PERCENT;
    }
    return GM_PERCENT_LOOKUP[gmLevel] ?? 0;
  };

  const calculateGMTotals = () => {
    let totalGmLevel = 0;
    books.forEach((book) => {
      totalGmLevel += book.level * book.count;
    });
    const MAX_GM_LEVEL = 306;
    const limitedGmLevel = Math.min(totalGmLevel, MAX_GM_LEVEL);
    const percentPerLevel = getGmPercent(limitedGmLevel);
    return { gmLevel: limitedGmLevel, percentPerLevel };
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: id === "onrush" ? value === "true" || value === true : value,
    }));
  };

  const handleCurrentGMLevelChange = (change) => {
    setFormData((prev) => ({
      ...prev,
      currentGMLevel: Math.max(0, parseInt(prev.currentGMLevel || 0) + change),
    }));
  };

  const handleBookCountChange = (bookId, change) => {
    const MAX_GM_LEVEL = 306;
    setBooks((prevBooks) => {
      const totalGmLevel = prevBooks.reduce(
        (sum, b) => sum + b.level * b.count,
        0
      );
      return prevBooks.map((book) => {
        if (book.id !== bookId) return book;
        const newCount = book.count + change;
        const newLevel = totalGmLevel + change * book.level;
        if (newCount < 0 || newLevel > MAX_GM_LEVEL) return book;
        return { ...book, count: newCount };
      });
    });
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
      currentApMod: "",
      newApMod: "",
    }));
  };

  // AP Multiplier Conversion
  function convertSkillDamage(min, max, oldMultiplier, newMultiplier) {
    const factor = newMultiplier / oldMultiplier;
    return {
      newMin: (parseFloat(min) || 0) * factor,
      newMax: (parseFloat(max) || 0) * factor,
    };
  }

  const calculateDamage = () => {
    const {
      minDamage,
      maxDamage,
      attackPower,
      soulBadge,
      crit,
      critDmg,
      balanceTweak,
    } = formData;
    const { gmLevel, percentPerLevel } = calculateGMTotals();
    const currentGM = parseInt(formData.currentGMLevel) || 0;
    const min = parseFloat(minDamage);
    const max = parseFloat(maxDamage);
    const ap = parseFloat(attackPower);
    const badgePercent = parseFloat(soulBadge) || 0;
    const critDmgValue = parseFloat(critDmg);
    const balance = parseFloat(balanceTweak) || 1.0;

    if (isNaN(min) || isNaN(max) || isNaN(ap) || isNaN(critDmgValue)) {
      setResult({
        error: true,
        message: "⚠️ Please fill in all required fields.",
      });
      return;
    }

    // Base averages and scaling
    const baseAvg = (min + max) / 2;
    const badgeMult = badgePercent / 100;
    const totalStats = ap + critDmgValue;
    const scaleFactor = Math.min(1.2, Math.max(0.85, totalStats / 4800));
    const apScale = 0.62 + scaleFactor * 0.3;
    const baseScale = 0.88 + scaleFactor * 0.1;
    const critBase = 1.27 + scaleFactor * 0.15;
    const critScale = (0.00028 + scaleFactor * 0.00004) * balance;

    // Use only books for damage calc (currentGM is visual only)
    const gmPercentFromTable = getGmPercent(gmLevel);
    const gmPercentBonus = gmPercentFromTable * 0.728; // damage scale

    const adjustedBaseAvg = baseAvg + (baseAvg * gmPercentBonus) / 100;
    const totalBase =
      adjustedBaseAvg * baseScale + ap * apScale + ap * badgeMult;
    const critMultiplier = critBase + critDmgValue * critScale;
    const avgCrit = totalBase * critMultiplier * (0.95 * balance);
    const variance = avgCrit * 0.04;
    const critMin = avgCrit - variance;
    const critMax = avgCrit + variance;

    // Display: Only use books for GM bonus (exclude currentGM)
    const gmDisplayBonus = (percentPerLevel * 0.728) / 100;
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
      visualTotalLevel: gmLevel,
      visualTotalPercent: percentPerLevel.toFixed(2),
    });
  };

  const { gmLevel, percentPerLevel } = calculateGMTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-teal-900 py-8 px-4 flex flex-col items-center justify-center">
      <div className="bg-black/70 p-6 md:p-8 rounded-xl shadow-lg shadow-cyan-500/30 w-full max-w-4xl backdrop-blur-md border border-cyan-500/10 animate-fade-in">
        <h1 className="text-cyan-400 text-2xl md:text-3xl font-bold mb-6 text-center drop-shadow-lg shadow-cyan-500/50">
          Skill Damage Calculator
        </h1>

        {/* Instructions and Info */}
        <div className="bg-black/40 p-5 rounded-lg border-l-4 border-yellow-600 mb-6">
          {/* Credits */}
          <div className="mt-8 text-xs text-gray-400 text-center bg-black/40 p-3 rounded-lg border border-yellow-600/20">
            <p>
              📜 <strong>Credits & Sources</strong>
            </p>
            <p className="mt-1">
              Calculator created by{" "}
              <span className="text-cyan-300 font-medium">Ci3t</span>
            </p>
            <p>
              Data transcribed by{" "}
              <span className="text-cyan-300 font-medium">Soviet Panda</span>{" "}
              [NA-Heaven's Reach]
            </p>
            <p>
              Source research and KR info compiled by{" "}
              <span className="text-yellow-300 font-semibold">Yasin</span> (
              <em>subscribe to him below</em>)
            </p>
            <p className="italic mt-1">
              Special thanks to <strong>YasinBakh</strong> for gathering and
              publishing core Korean data used in this tool.
            </p>
            <p className="mt-1 text-green-300 font-semibold">
              Updated for Moonwater Patch
            </p>
          </div>

          <h2 className="text-yellow-400 text-lg uppercase tracking-wide flex items-center mb-4 font-semibold">
            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
            Instructions
          </h2>

          <div className="text-red-400 space-y-3 text-sm">
            <p>
              <strong>Important Notes:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Best tested on <strong>training dummies</strong> — they have no
                defense.
              </li>
              <li>
                Expect <strong>~700–1000 less damage</strong> in actual
                dungeons. Use the{" "}
                <strong className="text-yellow-300">Balance Tweak</strong>{" "}
                slider to match your real boss damage.
              </li>
              <li>
                This calculator gives a <strong>close estimate</strong>, not a
                100% match. Use it to compare builds, books, and upgrades.
              </li>
              <li>
                <strong>Crit Rate</strong> and{" "}
                <strong>Crit Damage Multiplier</strong> use{" "}
                <strong>community formulas</strong>. Not official, but they
                align well with what you see in-game.
              </li>
            </ul>
          </div>

          <div className="text-cyan-200 text-sm">
            <p className="mt-3">
              <strong>How to Use:</strong>
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Input your base skill damage and stats (
                <span className="text-yellow-300">
                  Press K and hover your skill
                </span>
                ).
              </li>
              <li>
                Set your{" "}
                <strong className="text-red-400">Current GM Level</strong> if
                your skill already has books applied.
              </li>
              <li>
                Use the <strong>Book Selector</strong> to simulate extra books.
              </li>
              <li>
                Use the <strong>Balance Slider</strong> to match in-game average
                crit range.
              </li>
              <li>
                <strong>AP Modifier Conversion:</strong> Use only when upgrading
                to a higher-tier skill book.
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Enter current and new AP modifiers.</li>
                  <li>
                    Click <strong>"Convert Skill Tier"</strong> to simulate it.
                  </li>
                  <li>Then use the Book Selector for GM testing.</li>
                </ul>
              </li>
              <li>
                Press <strong>"Calculate"</strong> for results.
              </li>
              <li className="text-yellow-400 font-semibold">
                Prefer watching instead? 🎥
                <a
                  href="https://www.youtube.com/watch?v=GhYvH4RCkBM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 underline ml-1 hover:text-cyan-200"
                >
                  Watch the video guide
                </a>
              </li>
            </ol>
          </div>

          <div className="text-yellow-500 text-sm mt-4">
            <p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      (each level = 1.90%)
                    </span>
                  </p>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleCurrentGMLevelChange(-1)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-purple-300 text-xl hover:bg-purple-800 transition-colors cursor-pointer"
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
                        {getGmPercent(formData.currentGMLevel)}%
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

                  {/* Visual Total GM Summary (Books only) */}
                  <div className="mt-2 p-3 bg-gray-800/40 rounded-lg border border-yellow-500/20">
                    <div className="flex justify-between text-yellow-300 font-semibold">
                      <span>Total GM Level:</span>
                      <span>{gmLevel}</span>
                    </div>
                    <div className="flex justify-between text-yellow-300 font-semibold mt-1">
                      <span>Total Percent:</span>
                      <span>{percentPerLevel.toFixed(2)}%</span>
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
                  Balance Tweak
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
              onrush={formData.onrush}
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
