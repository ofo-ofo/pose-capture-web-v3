import React, { useState } from 'react';
import { Thresholds } from '../../metrics/thresholds';

/**
 * Settings page allows tuning of threshold parameters used for pose evaluation.
 * These settings are kept locally and not persisted between sessions.
 */
const Settings: React.FC = () => {
  const [thresholds, setThresholds] = useState<Thresholds>({
    rollMaxDeg: 4.0,
    centerOffsetMax: 0.08,
    heightRatioMin: 0.75,
    topMarginMin: 0.03,
    bottomMarginMin: 0.03,
    lumaMin: 30,
    stabilityFrames: 10,
    presenceMin: 0.5
  });

  const handleChange = (key: keyof Thresholds, value: number) => {
    setThresholds((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-semibold mb-2">Eşik Ayarları</h2>
      {(
        Object.entries(thresholds) as [keyof Thresholds, number][]
      ).map(([key, val]) => (
        <div key={key} className="flex items-center space-x-4">
          <label className="w-40 capitalize">
            {key.replace(/[A-Z]/g, (m) => ' ' + m.toLowerCase())}
          </label>
          <input
            type="number"
            step="0.01"
            className="flex-1 p-2 border rounded"
            value={val}
            onChange={(e) => handleChange(key, parseFloat(e.target.value))}
          />
        </div>
      ))}
      <p className="text-sm text-gray-600">
        Not: Bu ayarlar yalnızca geçerli oturum için geçerlidir. Çekim ekranındaki algoritma dahili varsayılanları
        kullanır.
      </p>
    </div>
  );
};

export default Settings;