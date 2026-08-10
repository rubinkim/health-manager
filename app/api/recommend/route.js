import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function buildMedicationSection(medication) {
  const taken = medication?.taken || [];
  const overdue = medication?.overdue || [];
  const upcoming = medication?.upcoming || [];

  if (taken.length === 0 && overdue.length === 0 && upcoming.length === 0) {
    return "등록된 복약 일정 없음";
  }

  const lines = [];
  if (taken.length > 0) {
    lines.push(`- 오늘 이미 복용 완료: ${taken.map(m => `${m.name}(${m.time})`).join(", ")}`);
  }
  if (overdue.length > 0) {
    lines.push(`- 예정 시각이 지났는데 아직 복용 안 함: ${overdue.map(m => `${m.name}(예정 ${m.time})`).join(", ")}`);
  }
  if (upcoming.length > 0) {
    lines.push(`- 오늘 남은 복약 예정: ${upcoming.map(m => `${m.name}(${m.time})`).join(", ")}`);
  }
  return lines.join("\n");
}

function buildPrompt({ health, weather, medication }) {
  const medicationSection = buildMedicationSection(medication);

  if (health) {
    return `당신은 시니어 건강 관리 전문가입니다.
현재 사용자의 건강 수치, 날씨, 오늘의 복약 현황을 보고 하나의 자연스러운 안내문을 작성하세요.

건강 수치:
- 수축기 혈압: ${health.systolic_bp} mmHg
- 이완기 혈압: ${health.diastolic_bp} mmHg
- 심박수: ${health.heart_rate} bpm
- 혈당: ${health.blood_sugar} mg/dL
- 체온: ${health.temperature} ℃

오늘 날씨:
- 기온: ${weather.temperature}°C
- 강수확률: ${weather.precipitation}%
- 풍속: ${weather.wind_speed} m/s

오늘의 복약 현황:
${medicationSection}

작성 지침:
1. 혈압/심박수가 높으면 저강도 운동 권장, 운동 시간과 강도를 구체적으로 제시
2. 예정 시각이 지났는데 복용 안 한 약이 있으면, 지금 바로 복용하고 화면에서 체크해달라고 자연스럽게 안내에 포함
3. 오늘 복약을 잘 챙기고 있다면(복용 완료 목록이 있다면) 짧게 칭찬
4. 오늘 남은 복약 예정이 있다면 잊지 않도록 다시 알려주기
5. 단정적인 의료 진단은 하지 말고 참고용 조언 톤 유지
6. 반드시 한국어로, 항목 나열이 아니라 자연스러운 문장 두세 개로 간결하게 작성

운동/활동 추천과 복약 안내를 포함한 안내문을 작성하세요.`;
  }

  return `당신은 시니어 건강 관리 전문가입니다.
사용자가 오늘 아직 건강 수치(혈압, 혈당, 심박수, 체온)를 입력하지 않았습니다.

오늘의 복약 현황:
${medicationSection}

다음 내용을 포함해서 정중하고 다정한 한국어 안내문을 두세 문장으로 작성하세요:
1. 매일 건강 수치를 기록하는 것이 왜 중요한지 짧게 알려주고, 잔소리처럼 느껴지지 않게 지금 입력해달라고 부탁
2. 예정 시각이 지났는데 복용 안 한 약이 있으면 지금 복용하고 체크해달라고 안내
3. 오늘 이미 복용을 잘 챙겼다면 짧게 칭찬
4. 오늘 남은 복약 예정이 있다면 다시 알려주기
5. 따뜻하고 다정한 톤 유지, 항목 나열이 아니라 자연스러운 문장으로 작성`;
}

export async function POST(request) {
  try {
    const { health, weather, medication } = await request.json();

    // 입력값 검증
    if (!weather) {
      return new Response(
        JSON.stringify({ error: "날씨 정보가 필요합니다." }),
        { status: 400 }
      );
    }

    const prompt = buildPrompt({ health, weather, medication });

    // Gemini API 호출
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const result = await model.generateContent(prompt);
    const recommendation = result.response.text();

    return new Response(
      JSON.stringify({ recommendation }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI 추천 생성 오류:", error);
    return new Response(
      JSON.stringify({
        error: "안내 생성 중 오류가 발생했습니다",
        recommendation: "오늘은 가볍게 산책 30분을 권장합니다."
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
