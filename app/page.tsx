'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface HealthLog {
  temperature: number;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  blood_sugar: number;
}

interface MedicationSchedule {
  id: string;
  medicine_name: string;
  time: string;
}

interface MedicationLog {
  medication_id: string;
  time: string | null;
  taken: boolean;
}

interface MedicationStatusItem {
  name: string;
  time: string;
}

interface MedicationStatus {
  taken: MedicationStatusItem[];
  overdue: MedicationStatusItem[];
  upcoming: MedicationStatusItem[];
}

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';

// 오늘의 건강 수치 / 복약 스케줄 / 복약 현황(복용완료·미복용-시각경과·예정)을 최신 상태로 조회
async function fetchTodayStatus() {
  const today = new Date().toISOString().split('T')[0];

  const { data: healthData } = await supabase
    .from('health_log')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('date', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: medData } = await supabase
    .from('medication_schedule')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('active', true);

  const { data: medLogData } = await supabase
    .from('medication_log')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('date', today);

  const logByMedId: Record<string, MedicationLog> = {};
  (medLogData || []).forEach((log: MedicationLog) => {
    logByMedId[log.medication_id] = log;
  });

  const nowHM = new Date().toTimeString().slice(0, 5);
  const medicationStatus: MedicationStatus = { taken: [], overdue: [], upcoming: [] };

  (medData || []).forEach((s: MedicationSchedule) => {
    const log = logByMedId[s.id];
    const scheduledHM = s.time.slice(0, 5);
    if (log?.taken) {
      medicationStatus.taken.push({ name: s.medicine_name, time: (log.time || s.time).slice(0, 5) });
    } else if (scheduledHM <= nowHM) {
      medicationStatus.overdue.push({ name: s.medicine_name, time: scheduledHM });
    } else {
      medicationStatus.upcoming.push({ name: s.medicine_name, time: scheduledHM });
    }
  });

  return {
    healthData: (healthData as HealthLog | null) || null,
    schedules: (medData as MedicationSchedule[]) || [],
    medicationStatus
  };
}

export default function Home() {
  const [todayHealth, setTodayHealth] = useState<HealthLog | null>(null);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [recommendation, setRecommendation] = useState<string>('');
  const [recommending, setRecommending] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setError('');
    try {
      const { healthData, schedules: scheduleList } = await fetchTodayStatus();
      setTodayHealth(healthData);
      setSchedules(scheduleList);
    } catch (err) {
      console.error('데이터 조회 실패:', err);
      setError('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleGetRecommendation = async () => {
    setRecommending(true);
    setError('');
    try {
      const { healthData, medicationStatus } = await fetchTodayStatus();

      const weatherResponse = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=37.3858512&longitude=127.1093695&current=temperature_2m,precipitation,weather_code&timezone=Asia/Seoul'
      );
      const weatherData = await weatherResponse.json();
      const currentWeather = {
        temperature: weatherData.current.temperature_2m,
        precipitation: weatherData.current.precipitation,
        wind_speed: 5
      };
      setWeather(currentWeather);

      const recommendResponse = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          health: healthData,
          weather: currentWeather,
          medication: medicationStatus
        })
      });
      const recommendData = await recommendResponse.json();
      setRecommendation(recommendData.recommendation || '추천 생성 중 오류가 발생했습니다');
    } catch (err) {
      console.error('AI 추천 요청 실패:', err);
      setError('AI 추천을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setRecommending(false);
    }
  };

  return (
    <div>
      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
          ⚠️ {error}
        </div>
      )}

    {/* 카드들 */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 카드 1: 오늘의 건강 수치 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">📊 오늘의 건강 수치</h2>
          {todayHealth ? (
            <div className="space-y-2 text-sm">
              <p>🌡️ 체온: <span className="font-medium">{todayHealth.temperature}°C</span></p>
              <p>🩸 혈압: <span className="font-medium">{todayHealth.systolic_bp}/{todayHealth.diastolic_bp} mmHg</span></p>
              <p>💓 심박수: <span className="font-medium">{todayHealth.heart_rate} bpm</span></p>
              <p>🍬 혈당: <span className="font-medium">{todayHealth.blood_sugar} mg/dL</span></p>
            </div>
          ) : (
            <p className="text-gray-600">아직 기록이 없습니다</p>
          )}
          <Link href="/health" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            건강 수치 입력
          </Link>
        </div>

        {/* 카드 2: 복약 일정 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">💊 복약 일정</h2>
          {schedules.length === 0 ? (
            <p className="text-gray-600">복약 일정을 설정해주세요</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {schedules.map(schedule => (
                <li key={schedule.id} className="border-l-4 border-blue-500 pl-2 py-1">
                  <p className="font-medium">{schedule.medicine_name}</p>
                  <p className="text-gray-600">⏰ {schedule.time}</p>
                </li>
              ))}
            </ul>
          )}
          <Link href="/medication" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            복약 관리
          </Link>
        </div>

        {/* 카드 3: AI 맞춤 안내 (운동 추천 + 복약 안내, 버튼을 눌러야 호출됨) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">💬 오늘의 AI 맞춤 안내</h2>

          {recommendation && (
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
              {weather && (
                <p className="text-xs text-gray-500 mt-3">
                  📍 기온: {weather.temperature}°C | 강수확률: {weather.precipitation}%
                </p>
              )}
            </div>
          )}

          {!recommendation && !recommending && (
            <p className="text-gray-600 mb-4">
              버튼을 누르면 오늘 입력하신 건강 수치와 복약 현황, 날씨를 바탕으로 AI가 맞춤 안내를 드립니다
            </p>
          )}

          <button
            onClick={handleGetRecommendation}
            disabled={recommending}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {recommending ? 'AI가 분석 중...' : recommendation ? '다시 추천받기' : 'AI에게 추천받기'}
          </button>
        </div>
      </div>
    </div>
  );
}
