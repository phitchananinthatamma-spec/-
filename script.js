const TOTAL_ROUNDS = 10;

let round = 1;
let score = 0;
let streak = 0;
let selectedBagIndex = null;

const roundEl = document.getElementById("round");
const scoreEl = document.getElementById("score");
const streakEl = document.getElementById("streak");

const missionText = document.getElementById("missionText");
const hintText = document.getElementById("hintText");
const bagsEl = document.getElementById("bags");

const guessRange = document.getElementById("guessRange");
const guessValue = document.getElementById("guessValue");

const playBtn = document.getElementById("playBtn");
const resetBtn = document.getElementById("resetBtn");
const resultBox = document.getElementById("resultBox");

// สร้างคอนเซปต์ “ถุงสุ่มควอนตัม” = มีโอกาสเปลี่ยนตามรอบแบบไม่ซ้ำ
function generateBags(r) {
  // 3 ถุง: ปลอดภัย / เสี่ยง / ลึกลับ
  // ใช้การเปลี่ยน probability แบบ deterministic เพื่อให้ “ไม่ซ้ำใคร”
  const p1 = clamp(0.35 + (Math.sin(r * 1.2) * 0.12), 0.1, 0.9);
  const p2 = clamp(0.55 + (Math.cos(r * 0.9) * 0.18), 0.1, 0.95);
  const p3 = clamp(0.25 + (Math.sin(r * 2.1) * 0.25), 0.05, 0.98);

  // reward/penalty ต่างกัน
  return [
    {
      name: "🟦 ถุงนิ่ง (Stable Bag)",
      desc: "โอกาสสำเร็จค่อนข้างคงที่ ได้แต้มกลางๆ",
      p: p1,
      reward: 12,
      penalty: -4
    },
    {
      name: "🟥 ถุงเสี่ยง (Risk Bag)",
      desc: "โอกาสสูงกว่า แต่ถ้าพลาดโดนหักหนัก",
      p: p2,
      reward: 18,
      penalty: -10
    },
    {
      name: "🟪 ถุงลึกลับ (Quantum Bag)",
      desc: "โอกาสแกว่งมาก! แต่ถ้าถูกได้โบนัสสตรีค",
      p: p3,
      reward: 10,
      penalty: -2,
      streakBonus: 8
    }
  ];
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

// ภารกิจแบบไม่ซ้ำ: ผู้เล่นต้อง “เดาโอกาสสำเร็จ” ให้ใกล้จริงที่สุด
function generateMission(bags) {
  const secret = Math.floor(Math.random() * bags.length);
  const targetBag = bags[secret];

  return {
    text: `เลือกถุง 1 ใบ แล้วเดาว่า "โอกาสสำเร็จ" ของถุงนั้นคือกี่เปอร์เซ็นต์`,
    hint: `แต่ละถุงมีโอกาสไม่เท่ากัน (รอบนี้ถูกสุ่มใหม่แล้ว)`,
  };
}

function renderRound() {
  roundEl.textContent = round;
  scoreEl.textContent = score;
  streakEl.textContent = streak;

  selectedBagIndex = null;
  resultBox.innerHTML = "";

  const bags = generateBags(round);
  const mission = generateMission(bags);

  missionText.textContent = mission.text;
  hintText.textContent = mission.hint;

  bagsEl.innerHTML = "";
  bags.forEach((b, i) => {
    const div = document.createElement("div");
    div.className = "bag";
    div.innerHTML = `
      <div class="bag-title">${b.name}</div>
      <div class="bag-desc">${b.desc}</div>
    `;
    div.addEventListener("click", () => {
      document.querySelectorAll(".bag").forEach(x => x.classList.remove("selected"));
      div.classList.add("selected");
      selectedBagIndex = i;
    });
    bagsEl.appendChild(div);
  });
}

guessRange.addEventListener("input", () => {
  guessValue.textContent = `${guessRange.value}%`;
});

playBtn.addEventListener("click", () => {
  if (selectedBagIndex === null) {
    resultBox.innerHTML = "⚠️ กรุณาเลือกถุงก่อน!";
    return;
  }

  const bags = generateBags(round);
  const bag = bags[selectedBagIndex];

  const userGuess = parseInt(guessRange.value, 10) / 100;
  const realP = bag.p;

  // ความแม่นยำการเดา = ใกล้จริงแค่ไหน
  const diff = Math.abs(userGuess - realP);
  const accuracy = 1 - diff; // 1 = แม่นสุด

  // สุ่มผลลัพธ์ตามความน่าจะเป็นจริง
  const success = Math.random() < realP;

  let delta = 0;

  if (success) {
    streak += 1;
    delta += bag.reward;

    // โบนัสจากความแม่นยำ (เดาใกล้จริง)
    delta += Math.round(accuracy * 10);

    // ถุงลึกลับมีโบนัสสตรีค
    if (bag.streakBonus && streak >= 2) {
      delta += bag.streakBonus;
    }
  } else {
    streak = 0;
    delta += bag.penalty;

    // ถ้าเดามั่นใจผิดมาก โดนหักเพิ่มนิดหน่อย
    if (diff > 0.35) delta -= 3;
  }

  score += delta;

  // แสดงผล
  resultBox.innerHTML = `
    <b>ผลลัพธ์:</b> ${success ? "✅ สำเร็จ!" : "❌ พลาด!"}<br>
    <b>โอกาสจริง:</b> ${(realP * 100).toFixed(0)}%<br>
    <b>คุณเดา:</b> ${(userGuess * 100).toFixed(0)}%<br>
    <b>ความแม่นยำ:</b> ${(accuracy * 100).toFixed(0)}%<br>
    <b>คะแนนรอบนี้:</b> ${delta > 0 ? "+" : ""}${delta}
  `;

  // ไปต่อ
  if (round < TOTAL_ROUNDS) {
    round++;
    setTimeout(renderRound, 1200);
  } else {
    setTimeout(() => {
      resultBox.innerHTML += `<hr><b>🎉 จบเกม!</b><br>คะแนนรวม: <b>${score}</b>`;
    }, 800);
  }

  scoreEl.textContent = score;
  streakEl.textContent = streak;
});

resetBtn.addEventListener("click", () => {
  round = 1;
  score = 0;
  streak = 0;
  renderRound();
});

renderRound();
