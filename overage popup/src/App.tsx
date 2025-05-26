import React, { useState, useEffect } from 'react';
import { XCircle, RotateCcw, Clipboard, Check } from 'lucide-react';

function App() {
  const [squareFeet, setSquareFeet] = useState<number | ''>(67.83);
  const [overageType, setOverageType] = useState<string>('10%');
  const [manualOverage, setManualOverage] = useState<number>(10);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [results, setResults] = useState({
    overageAmount: 0,
    totalCoverage: 0,
    boxes: 0,
    totalPrice: 0
  });

  const pricePerBox = 29.99;
  const squareFeetPerBox = 20;
  const MAX_SQUARE_FEET = 10000;

  const overageExplanations = {
    '10%': 'Recommended for most applications',
    '15%': 'For complex patterns or diagonal installations',
    'Manual Input': 'Custom percentage for specific needs',
    'No Overage': 'Not recommended - no extra material for cuts'
  };

  useEffect(() => {
    if (squareFeet === '') {
      setError('Please enter square footage');
      return;
    }
    
    if (typeof squareFeet === 'number') {
      if (squareFeet < 0) {
        setError('Square footage cannot be negative');
        return;
      }
      if (squareFeet > MAX_SQUARE_FEET) {
        setError(`Maximum square footage is ${MAX_SQUARE_FEET}`);
        return;
      }
    }
    
    setError('');
    let overagePercent = 0;
    if (overageType === '10%') overagePercent = 10;
    else if (overageType === '15%') overagePercent = 15;
    else if (overageType === 'Manual Input') overagePercent = manualOverage;
    
    const overageAmount = (squareFeet * overagePercent) / 100;
    const totalCoverage = squareFeet + overageAmount;
    const boxes = Math.ceil(totalCoverage / squareFeetPerBox);
    const totalPrice = boxes * pricePerBox;
    
    setResults({ overageAmount, totalCoverage, boxes, totalPrice });
  }, [squareFeet, overageType, manualOverage]);

  const resetCalculator = () => {
    setSquareFeet('');
    setOverageType('10%');
    setManualOverage(10);
    setError('');
  };

  const copyToClipboard = async () => {
    const text = `
Overage Calculator Results:
Square Feet: ${squareFeet}
Overage: ${results.overageAmount.toFixed(2)} Sq. Ft.
Total Coverage: ${results.totalCoverage.toFixed(2)} Sq. Ft.
Boxes Needed: ${results.boxes}
Total Price: $${results.totalPrice.toFixed(2)}
    `.trim();

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-[340px] w-full">
        {/* Header */}
        <div className="bg-[#4a90e2] text-white p-3">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-semibold text-center w-full">Overage Calculator</h1>
            <div className="flex gap-2">
              <RotateCcw 
                className="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                onClick={resetCalculator}
                role="button"
                aria-label="Reset calculator"
              />
              <XCircle 
                className="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                role="button"
                aria-label="Close calculator"
              />
            </div>
          </div>
          <p className="text-sm text-gray-100 mt-0.5 text-center">
            Add overage for cuts, waste, breaks, and repairs
          </p>
        </div>
        
        <div className="p-3 space-y-3">
          {/* Input Section */}
          <div>
            <div className="relative">
              <input
                type="number"
                value={squareFeet}
                onChange={(e) => setSquareFeet(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className={`w-full p-2.5 border rounded-lg outline-none transition-all text-center text-lg
                  ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-[#4a90e2] focus:border-[#4a90e2]'}`}
                min="0"
                max={MAX_SQUARE_FEET}
                step="0.01"
                aria-label="Square feet input"
                placeholder="Enter square feet"
              />
              <div className="absolute inset-x-0 bottom-0 text-center text-gray-500 text-xs translate-y-5">
                Square Feet
              </div>
              {error && (
                <div className="absolute inset-x-0 -bottom-4 text-center text-red-500 text-xs">
                  {error}
                </div>
              )}
            </div>
            
            <div className="pt-6">
              <label className="font-semibold text-gray-800 mb-1.5 block text-base text-center">
                Overage Amount
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {['10%', '15%', 'Manual Input', 'No Overage'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setOverageType(type)}
                    className={`py-1.5 px-2 rounded-lg border text-sm transition-all ${
                      overageType === type 
                        ? 'bg-[#4a90e2] text-white border-[#4a90e2]' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    aria-pressed={overageType === type}
                  >
                    {type}
                  </button>
                ))}
              </div>
              
              <div className="mt-2 text-center text-sm text-blue-600 italic">
                {overageExplanations[overageType]}
              </div>
              
              {overageType === 'Manual Input' && (
                <div className="mt-2 flex items-center justify-center">
                  <input
                    type="number"
                    value={manualOverage}
                    onChange={(e) => setManualOverage(parseFloat(e.target.value))}
                    className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a90e2] focus:border-[#4a90e2] outline-none transition-all text-center"
                    min="0"
                    max="100"
                    aria-label="Manual overage percentage"
                  />
                  <span className="ml-2 text-gray-700">%</span>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="mt-4 bg-gray-50 rounded-lg p-3 relative group">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base font-semibold text-gray-800 w-full text-center">Calculation Results</h2>
              <button
                onClick={copyToClipboard}
                className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3"
                aria-label="Copy results to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Clipboard className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Overage:</span>
                <span className="font-medium text-red-500 transition-all">
                  {results.overageAmount.toFixed(2)} Sq. Ft.
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Total:</span>
                <span className="font-medium text-red-500 transition-all">
                  {results.totalCoverage.toFixed(2)} Sq. Ft.
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Boxes Needed:</span>
                <span className="font-medium text-red-500 transition-all">
                  {results.boxes}
                </span>
              </div>
              
              <div className="flex justify-between pt-1.5 border-t border-gray-200">
                <span className="text-gray-600 text-sm">Total Price:</span>
                <span className="text-base font-bold text-red-500 transition-all">
                  ${results.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            className="w-full bg-[#4a90e2] text-white py-2 rounded-lg font-medium hover:bg-[#357abd] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!!error}
          >
            Add To Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;