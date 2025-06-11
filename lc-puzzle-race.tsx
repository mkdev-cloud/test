import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, Trophy, RotateCcw, Play, AlertTriangle } from 'lucide-react';

const LCPuzzleRace = () => {
  const [gameState, setGameState] = useState('menu'); // menu, playing, completed
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showDiscrepancy, setShowDiscrepancy] = useState(false);

  // LC Lifecycle Steps (correct order)
  const correctSteps = [
    { id: 1, title: "Application", description: "Buyer applies for LC with issuing bank", phase: "initiation" },
    { id: 2, title: "Issuance", description: "Issuing bank issues LC to seller", phase: "initiation" },
    { id: 3, title: "Advising", description: "Advising bank notifies seller of LC terms", phase: "initiation" },
    { id: 4, title: "Shipment", description: "Seller ships goods according to LC terms", phase: "execution" },
    { id: 5, title: "Document Preparation", description: "Seller prepares required documents", phase: "execution" },
    { id: 6, title: "Document Presentation", description: "Seller presents documents to advising bank", phase: "execution" },
    { id: 7, title: "Document Examination", description: "Banks examine documents for compliance", phase: "settlement" },
    { id: 8, title: "Payment", description: "Payment made upon document compliance", phase: "settlement" },
    { id: 9, title: "Document Delivery", description: "Documents delivered to buyer for goods release", phase: "settlement" }
  ];

  // Shuffled steps for the puzzle
  const [shuffledSteps, setShuffledSteps] = useState([]);
  const [arrangedSteps, setArrangedSteps] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);

  // Document discrepancy challenges
  const discrepancyChallenges = [
    {
      id: 1,
      document: "Commercial Invoice",
      correctValue: "USD 50,000",
      incorrectValue: "USD 55,000",
      field: "Total Amount",
      explanation: "Invoice amount exceeds LC amount limit"
    },
    {
      id: 2,
      document: "Bill of Lading",
      correctValue: "Hamburg Port",
      incorrectValue: "Bremen Port",
      field: "Port of Loading",
      explanation: "Port doesn't match LC specifications"
    },
    {
      id: 3,
      document: "Insurance Certificate",
      correctValue: "110% of Invoice Value",
      incorrectValue: "100% of Invoice Value",
      field: "Coverage Amount",
      explanation: "Insurance coverage below required 110%"
    }
  ];

  const [currentDiscrepancy, setCurrentDiscrepancy] = useState(null);
  const [discrepancyAnswer, setDiscrepancyAnswer] = useState('');

  // Initialize game
  const initializeGame = useCallback(() => {
    const shuffled = [...correctSteps].sort(() => Math.random() - 0.5);
    setShuffledSteps(shuffled);
    setArrangedSteps([]);
    setTimeLeft(180);
    setScore(0);
    setShowDiscrepancy(false);
    setCurrentDiscrepancy(null);
  }, []);

  // Start game
  const startGame = () => {
    initializeGame();
    setGameState('playing');
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (gameState === 'playing' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setGameState('completed');
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft]);

  // Drag and drop handlers
  const handleDragStart = (e, item, source) => {
    setDraggedItem({ item, source });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetArea) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { item, source } = draggedItem;

    if (targetArea === 'arranged' && source === 'shuffled') {
      setShuffledSteps(prev => prev.filter(step => step.id !== item.id));
      setArrangedSteps(prev => [...prev, item]);
    } else if (targetArea === 'shuffled' && source === 'arranged') {
      setArrangedSteps(prev => prev.filter(step => step.id !== item.id));
      setShuffledSteps(prev => [...prev, item]);
    }

    setDraggedItem(null);

    // Check if puzzle is complete
    if (arrangedSteps.length + 1 === correctSteps.length && targetArea === 'arranged') {
      checkSolution([...arrangedSteps, item]);
    }
  };

  const checkSolution = (solution) => {
    const isCorrect = solution.every((step, index) => step.id === correctSteps[index].id);
    
    if (isCorrect) {
      const timeBonus = Math.floor(timeLeft / 10);
      setScore(prev => prev + 1000 + timeBonus);
      
      // Show discrepancy challenge
      setTimeout(() => {
        const randomDiscrepancy = discrepancyChallenges[Math.floor(Math.random() * discrepancyChallenges.length)];
        setCurrentDiscrepancy(randomDiscrepancy);
        setShowDiscrepancy(true);
      }, 1500);
    }
  };

  const handleDiscrepancySubmit = () => {
    if (discrepancyAnswer.toLowerCase().includes('discrepancy') || 
        discrepancyAnswer.toLowerCase().includes('error') ||
        discrepancyAnswer.toLowerCase().includes('incorrect')) {
      setScore(prev => prev + 500);
      setShowDiscrepancy(false);
      setGameState('completed');
    } else {
      setScore(prev => Math.max(0, prev - 100));
    }
    setDiscrepancyAnswer('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'initiation': return 'bg-blue-100 border-blue-300';
      case 'execution': return 'bg-orange-100 border-orange-300';
      case 'settlement': return 'bg-green-100 border-green-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <Trophy className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">LC Puzzle Race</h1>
            <p className="text-gray-600">Master the Letter of Credit workflow!</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">How to Play:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Drag steps to arrange LC lifecycle in correct order</li>
              <li>• Complete within 3 minutes for maximum points</li>
              <li>• Identify document discrepancies for bonus points</li>
              <li>• Learn critical checkpoints in LC processing</li>
            </ul>
          </div>

          <button
            onClick={startGame}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center mx-auto"
          >
            <Play className="mr-2 h-5 w-5" />
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <Trophy className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Complete!</h2>
          <div className="text-2xl font-bold text-green-600 mb-4">Score: {score}</div>
          
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-800 mb-2">LC Workflow Mastered!</h3>
            <p className="text-sm text-green-700">
              You've learned the complete Letter of Credit lifecycle from application to settlement, 
              including critical document examination checkpoints.
            </p>
          </div>

          <button
            onClick={() => setGameState('menu')}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Clock className="h-6 w-6 text-white" />
          <span className="text-xl font-bold text-white">{formatTime(timeLeft)}</span>
        </div>
        <div className="text-xl font-bold text-white">Score: {score}</div>
        <button
          onClick={() => setGameState('menu')}
          className="text-white hover:text-gray-300 transition-colors"
        >
          <RotateCcw className="h-6 w-6" />
        </button>
      </div>

      {/* Discrepancy Challenge Modal */}
      {showDiscrepancy && currentDiscrepancy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500 mr-2" />
              <h3 className="text-lg font-bold">Document Discrepancy Challenge</h3>
            </div>
            
            <div className="mb-4">
              <div className="bg-gray-50 p-3 rounded mb-2">
                <strong>{currentDiscrepancy.document}</strong>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">LC Requirement: {currentDiscrepancy.correctValue}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Document Shows: {currentDiscrepancy.incorrectValue}</span>
              </div>
            </div>

            <input
              type="text"
              placeholder="Identify the issue..."
              value={discrepancyAnswer}
              onChange={(e) => setDiscrepancyAnswer(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />

            <button
              onClick={handleDiscrepancySubmit}
              className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition-colors"
            >
              Submit Answer
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shuffled Steps */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Available Steps</h2>
          <div
            className="min-h-96 bg-white/5 rounded-lg p-4 border-2 border-dashed border-white/20"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'shuffled')}
          >
            {shuffledSteps.map((step) => (
              <div
                key={step.id}
                draggable
                onDragStart={(e) => handleDragStart(e, step, 'shuffled')}
                className={`${getPhaseColor(step.phase)} p-3 rounded-lg mb-3 cursor-move hover:shadow-lg transition-all duration-200 border-2`}
              >
                <div className="font-semibold text-gray-800">{step.title}</div>
                <div className="text-sm text-gray-600">{step.description}</div>
                <div className="text-xs text-gray-500 mt-1 capitalize">{step.phase} Phase</div>
              </div>
            ))}
          </div>
        </div>

        {/* Arranged Steps */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">LC Workflow Order</h2>
          <div
            className="min-h-96 bg-white/5 rounded-lg p-4 border-2 border-dashed border-white/20"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'arranged')}
          >
            {arrangedSteps.map((step, index) => (
              <div
                key={step.id}
                draggable
                onDragStart={(e) => handleDragStart(e, step, 'arranged')}
                className={`${getPhaseColor(step.phase)} p-3 rounded-lg mb-3 cursor-move hover:shadow-lg transition-all duration-200 border-2 relative`}
              >
                <div className="absolute -left-2 -top-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div className="font-semibold text-gray-800">{step.title}</div>
                <div className="text-sm text-gray-600">{step.description}</div>
                <div className="text-xs text-gray-500 mt-1 capitalize">{step.phase} Phase</div>
                {step.id === correctSteps[index]?.id && (
                  <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-green-600" />
                )}
                {arrangedSteps.length === correctSteps.length && step.id !== correctSteps[index]?.id && (
                  <XCircle className="absolute top-2 right-2 h-5 w-5 text-red-600" />
                )}
              </div>
            ))}
            {arrangedSteps.length === 0 && (
              <div className="text-white/60 text-center py-8">
                Drag steps here to arrange the LC workflow in correct order
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phase Legend */}
      <div className="mt-6 bg-white/10 backdrop-blur-md rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2">LC Phases:</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded mr-2"></div>
            <span className="text-white text-sm">Initiation</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded mr-2"></div>
            <span className="text-white text-sm">Execution</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded mr-2"></div>
            <span className="text-white text-sm">Settlement</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LCPuzzleRace;