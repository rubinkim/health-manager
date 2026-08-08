import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { health, weather } = await request.json();

    // 입력값 검증
    if (!health || !weather) {
      return new Response(
        JSON.stringify({ error: "건강 수치와 날씨 정보가 필요합니다." }),
        { status: 400 }
      );
    }

    // Gemini 프롬프트 작성
    const prompt = `당신은 시니어 건강 관리 전문가입니다.
현재 사용자의 건강 수치와 날씨 정보를 보고, 적절한 운동을 추천하세요.

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

주의사항:
1. 혈압/심박수가 높으면 저강도 운동 권장
2. 운동 시간과 강도를 구체적으로 제시
3. 반드시 한국어로 답변
4. 한두 문장으로 간결하게 작성

운동 추천을 작성하세요.`;

    // Gemini API 호출
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
        error: "운동 추천 생성 중 오류가 발생했습니다",
        recommendation: "오늘은 가볍게 산책 30분을 권장합니다."
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}