'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function HealthPage() {
  const [formData, setFormData] = useState({
    temperature: '',
    systolicBp: '',
    diastolicBp: '',
    heartRate: '',
    bloodSugar: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 1. 입력값 검증
      if (!formData.temperature || !formData.systolicBp || !formData.diastolicBp || !formData.heartRate || !formData.bloodSugar) {
        setMessage('모든 항목을 입력해주세요');
        setLoading(false);
        return;
      }

      // 2. 범위 검사
      const temp = parseFloat(formData.temperature);
      const systolic = parseInt(formData.systolicBp);
      const diastolic = parseInt(formData.diastolicBp);
      const heart = parseInt(formData.heartRate);
      const sugar = parseInt(formData.bloodSugar);

      if (temp < 35 || temp > 42) {
        setMessage('❌ 체온이 정상 범위(35~42°C)를 벗어났습니다');
        setLoading(false);
        return;
      }
      if (systolic < 60 || systolic > 200) {
        setMessage('❌ 수축기 혈압이 정상 범위(60~200)를 벗어났습니다');
        setLoading(false);
        return;
      }
      if (diastolic < 60 || diastolic > 200) {
        setMessage('❌ 이완기 혈압이 정상 범위(60~200)를 벗어났습니다');
        setLoading(false);
        return;
      }
      if (heart < 30 || heart > 200) {
        setMessage('❌ 심박수가 정상 범위(30~200)를 벗어났습니다');
        setLoading(false);
        return;
      }
      if (sugar < 50 || sugar > 500) {
        setMessage('❌ 혈당이 정상 범위(50~500)를 벗어났습니다');
        setLoading(false);
        return;
      }

      // 3. Supabase에 데이터 저장
      const { error } = await supabase
        .from('health_log')
        .insert([
          {
            user_id: '550e8400-e29b-41d4-a716-446655440001',
            date: new Date().toISOString().split('T')[0],
            temperature: temp,
            systolic_bp: systolic,
            diastolic_bp: diastolic,
            heart_rate: heart,
            blood_sugar: sugar,
          }
        ]);

      if (error) {
        setMessage(`❌ 저장 실패: ${error.message}`);
      } else {
        setMessage('✅ 건강 수치가 저장되었습니다!');
        // 폼 초기화
        setFormData({
          temperature: '',
          systolicBp: '',
          diastolicBp: '',
          heartRate: '',
          bloodSugar: '',
        });
      }
    } catch (err) {
      setMessage('❌ 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-gray-50">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">📊 건강 수치 입력</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">체온 (℃)</label>
            <input
              type="number"
              name="temperature"
              step="0.1"
              placeholder="36.5"
              value={formData.temperature}
              onChange={handleChange}
              disabled={loading}
              className="w-full border border-gray-300 rounded px-3 py-2 md:py-3 disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">수축기 혈압 (mmHg)</label>
            <input
              type="number"
              name="systolicBp"
              placeholder="120"
              value={formData.systolicBp}
              onChange={handleChange}
              disabled={loading}
              className="w-full border border-gray-300 rounded px-3 py-2 md:py-3 disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">이완기 혈압 (mmHg)</label>
            <input
              type="number"
              name="diastolicBp"
              placeholder="80"
              value={formData.diastolicBp}
              onChange={handleChange}
              disabled={loading}
              className="w-full border border-gray-300 rounded px-3 py-2 md:py-3 disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">심박수 (bpm)</label>
            <input
              type="number"
              name="heartRate"
              placeholder="72"
              value={formData.heartRate}
              onChange={handleChange}
              disabled={loading}
              className="w-full border border-gray-300 rounded px-3 py-2 md:py-3 disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">혈당 (mg/dL)</label>
            <input
              type="number"
              name="bloodSugar"
              placeholder="110"
              value={formData.bloodSugar}
              onChange={handleChange}
              disabled={loading}
              className="w-full border border-gray-300 rounded px-3 py-2 md:py-3 disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 md:py-4 rounded-lg font-medium text-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '저장 중...' : '저장'}
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
    </div>
  );
}