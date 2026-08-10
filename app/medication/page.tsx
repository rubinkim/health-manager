'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getTodayKST, getNowTimeKST } from '@/lib/date';

interface MedicationSchedule {
  id: string;
  medicine_name: string;
  time: string;
}

interface MedicationLog {
  id: string;
  medication_id: string;
  date: string;
  time: string | null;
  taken: boolean;
}

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';

export default function MedicationPage() {
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [todayLogs, setTodayLogs] = useState<Record<string, MedicationLog>>({});
  const [formData, setFormData] = useState({
    medicineName: '',
    time: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const today = getTodayKST();

  useEffect(() => {
    loadSchedules();
    loadTodayLogs();
  }, []);

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('medication_schedule')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('active', true);

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error('일정 조회 실패:', err);
    }
  };

  const handleDeactivate = async (scheduleId: string, medicineName: string) => {
    if (!confirm(`'${medicineName}' 복용을 중단하시겠습니까?\n(과거 복용 기록은 그대로 보관됩니다)`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('medication_schedule')
        .update({ active: false })
        .eq('id', scheduleId);

      if (error) throw error;

      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      setMessage('✅ 복용을 중단했습니다');
    } catch (err) {
      console.error('복용 중단 실패:', err);
      setMessage('❌ 복용 중단 처리에 실패했습니다');
    }
  };

  const loadTodayLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('medication_log')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('date', today);

      if (error) throw error;

      const map: Record<string, MedicationLog> = {};
      (data || []).forEach((log: MedicationLog) => {
        map[log.medication_id] = log;
      });
      setTodayLogs(map);
    } catch (err) {
      console.error('오늘 복약 기록 조회 실패:', err);
    }
  };

  const handleToggleTaken = async (scheduleId: string) => {
    const existing = todayLogs[scheduleId];

    try {
      if (existing?.taken) {
        // 미복용으로 되돌리기: 기록 자체를 삭제 (기록 없음 = 미복용)
        const { error } = await supabase
          .from('medication_log')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        setTodayLogs(prev => {
          const next = { ...prev };
          delete next[scheduleId];
          return next;
        });
      } else {
        // 복용함으로 체크: 현재 시각으로 기록
        const nextTime = getNowTimeKST();
        const { data, error } = await supabase
          .from('medication_log')
          .insert([{
            user_id: USER_ID,
            medication_id: scheduleId,
            date: today,
            taken: true,
            time: nextTime,
          }])
          .select()
          .single();

        if (error) throw error;
        setTodayLogs(prev => ({ ...prev, [scheduleId]: data }));
      }
    } catch (err) {
      console.error('복약 체크 실패:', err);
      setMessage('❌ 복약 체크에 실패했습니다');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!formData.medicineName || !formData.time) {
        setMessage('약 이름과 시간을 입력해주세요');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('medication_schedule')
        .insert([
          {
            user_id: '550e8400-e29b-41d4-a716-446655440001',
            medicine_name: formData.medicineName,
            time: formData.time,
            days_of_week: '1,2,3,4,5,6,0',
          }
        ]);

      if (error) throw error;

      setMessage('✅ 복약 일정이 등록되었습니다!');
      setFormData({ medicineName: '', time: '' });
      loadSchedules();
    } catch (err) {
      setMessage('❌ 등록 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">💊 복약 관리</h1>

      {/* 복약 일정 등록 폼 */}
      <div className="bg-white p-4 md:p-6 rounded shadow mb-6">
        <h2 className="text-lg font-bold mb-4">복약 일정 등록</h2>
        <form onSubmit={handleAddSchedule} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">약 이름</label>
            <input
              type="text"
              name="medicineName"
              placeholder="예: 혈압약"
              value={formData.medicineName}
              onChange={handleChange}
              disabled={loading}
              className="w-full border border-gray-300 rounded px-3 py-2 md:py-3 disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">복용 시간</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              disabled={loading}
              className="w-full border border-gray-300 rounded px-3 py-2 md:py-3 disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 md:py-3 rounded-lg font-medium text-base md:text-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '등록 중...' : '등록'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 md:p-4 rounded-lg text-sm md:text-base ${
            message.includes('✅')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* 오늘의 복약 체크리스트 */}
      <div className="bg-white p-4 md:p-6 rounded shadow mb-6">
        <h2 className="text-lg font-bold mb-4">✅ 오늘의 복약 체크리스트 ({today})</h2>

        {schedules.length === 0 ? (
          <p className="text-gray-600">등록된 복약 일정이 없습니다</p>
        ) : (
          <ul className="space-y-3">
            {schedules.map(schedule => {
              const log = todayLogs[schedule.id];
              const taken = log?.taken ?? false;
              return (
                <li
                  key={schedule.id}
                  className={`flex items-center gap-3 border-l-4 pl-4 py-2 md:py-3 ${
                    taken ? 'border-green-500 bg-green-50' : 'border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={taken}
                    onChange={() => handleToggleTaken(schedule.id)}
                    className="w-5 h-5 accent-green-600"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{schedule.medicine_name}</p>
                    <p className="text-sm text-gray-600">
                      ⏰ 예정 시각: {schedule.time}
                      {taken && log?.time && (
                        <span className="text-green-700"> · 복용 시각: {log.time.slice(0, 5)}</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${taken ? 'text-green-700' : 'text-gray-400'}`}>
                    {taken ? '복용함' : '미복용'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 복약 일정 목록 */}
      <div className="bg-white p-4 md:p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-4">📋 등록된 복약 일정</h2>

        {schedules.length === 0 ? (
          <p className="text-gray-600">등록된 복약 일정이 없습니다</p>
        ) : (
          <ul className="space-y-3">
            {schedules.map(schedule => (
              <li key={schedule.id} className="flex justify-between items-center border-l-4 border-blue-500 pl-4 py-2 md:py-3">
                <div>
                  <p className="font-medium">{schedule.medicine_name}</p>
                  <p className="text-sm text-gray-600">⏰ {schedule.time}</p>
                </div>
                <button
                  onClick={() => handleDeactivate(schedule.id, schedule.medicine_name)}
                  className="text-sm text-red-600 border border-red-300 rounded px-3 py-1.5 hover:bg-red-50 transition-colors"
                >
                  복용 중단
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
