import React, { useState } from 'react';
import { Delete } from 'lucide-react';

interface PinPadProps {
  onComplete: (pin: string) => void;
  length?: number;
}

const PinPad: React.FC<PinPadProps> = ({ onComplete, length = 4 }) => {
  const [pin, setPin] = useState('');

  const handleNumberClick = (num: number) => {
    if (pin.length < length) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === length) {
        onComplete(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Visual PIN display */}
      <div className="flex space-x-4 mb-12">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              i < pin.length
                ? 'bg-primary-500 border-primary-500 scale-125'
                : 'border-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Grid of numbers */}
      <div className="grid grid-cols-3 gap-4 w-full">
        {buttons.map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num)}
            className="aspect-square text-3xl font-bold rounded-2xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white transition-colors shadow-lg border border-gray-700 flex items-center justify-center"
          >
            {num}
          </button>
        ))}

        <button
          onClick={handleDelete}
          className="aspect-square text-xl rounded-2xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-400 flex items-center justify-center shadow-lg border border-gray-700"
        >
          <Delete size={32} />
        </button>

        <button
          onClick={() => handleNumberClick(0)}
          className="aspect-square text-3xl font-bold rounded-2xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white flex items-center justify-center shadow-lg border border-gray-700"
        >
          0
        </button>

        <div className="aspect-square flex items-center justify-center">
          {/* Placeholder for symmetry or extra action */}
        </div>
      </div>
    </div>
  );
};

export default PinPad;
