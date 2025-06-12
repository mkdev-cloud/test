import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, Trophy, RotateCcw, Play, AlertTriangle } from 'lucide-react';

const LCPuzzleRace = () => {
  const [gameState, setGameState] = useState('menu'); // menu, playing, completed
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1); // Not used in current logic, kept for potential future use
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
    // Adding a timeout to allow the state to update before checking solution
    setTimeout(() => {
        if (targetArea === 'arranged' && arrangedSteps.length + 1 === correctSteps.length) {
            checkSolution([...arrangedSteps, item]);
        }
    }, 0);
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
    // A more robust check might involve pattern matching or predefined correct answers
    if (discrepancyAnswer.toLowerCase().includes('discrepancy') || 
        discrepancyAnswer.toLowerCase().includes('error') ||
        discrepancyAnswer.toLowerCase().includes('incorrect') ||
        discrepancyAnswer.toLowerCase().includes(currentDiscrepancy?.explanation.toLowerCase().split(' ')[0] || '')) { // Basic check for first word of explanation
      setScore(prev => prev + 500);
      setShowDiscrepancy(false);
      setGameState('completed'); // Assuming discrepancy challenge is the last step before completion
    } else {
      setScore(prev => Math.max(0, prev - 100)); // Penalize for incorrect answer
    }
    setDiscrepancyAnswer(''); // Clear input after submission
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColorClass = (phase) => {
    switch (phase) {
      case 'initiation': return 'phase-initiation';
      case 'execution': return 'phase-execution';
      case 'settlement': return 'phase-settlement';
      default: return 'phase-default';
    }
  };

  return (
    <div className="lc-puzzle-container">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');

        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
        }

        .lc-puzzle-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #1A202C 0%, #2B6CB0 50%, #4C51BF 100%); /* slate-900 via-blue-900 to-indigo-900 */
            padding: 1rem;
            box-sizing: border-box;
            color: #fff;
        }

        /* Menu State */
        .menu-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #1A202C 0%, #2B6CB0 50%, #4C51BF 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            box-sizing: border-box;
        }

        .menu-card {
            background-color: #fff;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); /* shadow-2xl */
            padding: 2rem;
            max-width: 28rem; /* max-w-md */
            width: 100%;
            text-align: center;
        }

        .menu-icon {
            margin: 0 auto 1rem;
            height: 4rem; /* h-16 */
            width: 4rem; /* w-16 */
            color: #F6E05E; /* text-yellow-500 */
        }

        .menu-title {
            font-size: 1.875rem; /* text-3xl */
            font-weight: 700; /* font-bold */
            color: #2D3748; /* text-gray-800 */
            margin-bottom: 0.5rem;
        }

        .menu-subtitle {
            color: #4A5568; /* text-gray-600 */
        }

        .how-to-play-box {
            background-color: #EBF8FF; /* bg-blue-50 */
            border-radius: 0.5rem; /* rounded-lg */
            padding: 1rem;
            margin-bottom: 1.5rem;
            text-align: left;
        }

        .how-to-play-title {
            font-weight: 600; /* font-semibold */
            color: #2C5282; /* text-blue-800 */
            margin-bottom: 0.5rem;
        }

        .how-to-play-list {
            font-size: 0.875rem; /* text-sm */
            color: #2B6CB0; /* text-blue-700 */
            list-style: none; /* Remove default list bullets */
            padding: 0;
            margin: 0;
        }

        .how-to-play-list li {
            margin-bottom: 0.25rem; /* space-y-1 */
            position: relative;
            padding-left: 1.25rem; /* Add padding for custom bullet */
        }

        .how-to-play-list li::before {
            content: '•'; /* Custom bullet point */
            position: absolute;
            left: 0;
            color: #2B6CB0; /* Match text color */
        }


        .start-game-button {
            background: linear-gradient(to right, #3182CE 0%, #4C51BF 100%); /* bg-gradient-to-r from-blue-600 to-indigo-600 */
            color: #fff;
            padding: 0.75rem 2rem; /* px-8 py-3 */
            border-radius: 0.5rem; /* rounded-lg */
            font-weight: 600; /* font-semibold */
            transition: all 0.2s ease-in-out; /* transition-all duration-200 */
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            border: none;
            cursor: pointer;
        }

        .start-game-button:hover {
            background: linear-gradient(to right, #2B6CB0 0%, #3F51B5 100%); /* hover:from-blue-700 hover:to-indigo-700 */
        }

        .start-game-button svg {
            margin-right: 0.5rem;
            height: 1.25rem; /* h-5 */
            width: 1.25rem; /* w-5 */
        }

        /* Completed State */
        .completed-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #1A202C 0%, #2F855A 50%, #38A169 100%); /* from-green-900 via-green-800 to-emerald-900 */
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            box-sizing: border-box;
        }

        .completed-card {
            background-color: #fff;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            padding: 2rem;
            max-width: 28rem;
            width: 100%;
            text-align: center;
        }

        .completed-icon {
            margin: 0 auto 1rem;
            height: 4rem;
            width: 4rem;
            color: #F6E05E;
        }

        .completed-title {
            font-size: 1.875rem;
            font-weight: 700;
            color: #2D3748;
            margin-bottom: 0.5rem;
        }

        .completed-score {
            font-size: 1.5rem; /* text-2xl */
            font-weight: 700;
            color: #38A169; /* text-green-600 */
            margin-bottom: 1rem;
        }

        .workflow-mastered-box {
            background-color: #F0FFF4; /* bg-green-50 */
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1.5rem;
        }

        .workflow-mastered-title {
            font-weight: 600;
            color: #2F855A; /* text-green-800 */
            margin-bottom: 0.5rem;
        }

        .workflow-mastered-text {
            font-size: 0.875rem;
            color: #2B6CB0; /* text-green-700 */
        }

        .play-again-button {
            background: linear-gradient(to right, #38A169 0%, #2F855A 100%); /* bg-gradient-to-r from-green-600 to-emerald-600 */
            color: #fff;
            padding: 0.75rem 2rem;
            border-radius: 0.5rem;
            font-weight: 600;
            transition: all 0.2s ease-in-out;
            border: none;
            cursor: pointer;
        }

        .play-again-button:hover {
            background: linear-gradient(to right, #2F855A 0%, #28774e 100%); /* hover:from-green-700 hover:to-emerald-700 */
        }

        /* Header (Playing State) */
        .game-header {
            background-color: rgba(255, 255, 255, 0.1); /* bg-white/10 */
            backdrop-filter: blur(8px); /* backdrop-blur-md */
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .game-header-left {
            display: flex;
            align-items: center;
            gap: 1rem; /* space-x-4 */
        }

        .game-header-left svg {
            height: 1.5rem; /* h-6 */
            width: 1.5rem; /* w-6 */
            color: #fff;
        }

        .game-header-score {
            font-size: 1.25rem; /* text-xl */
            font-weight: 700;
            color: #fff;
        }

        .game-header-reset-button {
            color: #fff;
            border: none;
            background: none;
            cursor: pointer;
            transition: color 0.2s ease-in-out;
        }

        .game-header-reset-button:hover {
            color: #A0AEC0; /* hover:text-gray-300 */
        }

        .game-header-reset-button svg {
            height: 1.5rem;
            width: 1.5rem;
        }

        /* Discrepancy Challenge Modal */
        .discrepancy-modal-overlay {
            position: fixed;
            inset: 0; /* inset-0 */
            background-color: rgba(0, 0, 0, 0.5); /* bg-black/50 */
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 50; /* z-50 */
        }

        .discrepancy-modal-content {
            background-color: #fff;
            border-radius: 0.75rem; /* rounded-xl */
            padding: 1.5rem;
            max-width: 28rem; /* max-w-md */
            width: 100%;
        }

        .discrepancy-modal-header {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
        }

        .discrepancy-modal-header svg {
            height: 1.5rem;
            width: 1.5rem;
            color: #F97316; /* text-orange-500 */
            margin-right: 0.5rem;
        }

        .discrepancy-modal-header h3 {
            font-size: 1.125rem; /* text-lg */
            font-weight: 700;
        }

        .discrepancy-details {
            margin-bottom: 1rem;
        }

        .discrepancy-document-box {
            background-color: #F9FAFB; /* bg-gray-50 */
            padding: 0.75rem;
            border-radius: 0.25rem;
            margin-bottom: 0.5rem;
        }

        .discrepancy-detail-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
        }

        .discrepancy-detail-item span {
            font-size: 0.875rem; /* text-sm */
        }

        .discrepancy-input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #E2E8F0; /* border */
            border-radius: 0.25rem;
            margin-bottom: 1rem;
            box-sizing: border-box; /* Ensures padding doesn't add to width */
        }

        .discrepancy-submit-button {
            width: 100%;
            background-color: #EA580C; /* bg-orange-600 */
            color: #fff;
            padding: 0.5rem;
            border-radius: 0.25rem;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s ease-in-out;
        }

        .discrepancy-submit-button:hover {
            background-color: #C2410C; /* hover:bg-orange-700 */
        }

        /* Puzzle Grids */
        .puzzle-grids {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem; /* gap-6 */
        }

        @media (min-width: 1024px) { /* lg breakpoint */
            .puzzle-grids {
                grid-template-columns: repeat(2, 1fr); /* lg:grid-cols-2 */
            }
        }

        .puzzle-section {
            background-color: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(8px);
            border-radius: 0.5rem;
            padding: 1.5rem;
        }

        .puzzle-section-title {
            font-size: 1.25rem; /* text-xl */
            font-weight: 700;
            color: #fff;
            margin-bottom: 1rem;
        }

        .puzzle-drop-area {
            min-height: 24rem; /* min-h-96 */
            background-color: rgba(255, 255, 255, 0.05); /* bg-white/5 */
            border-radius: 0.5rem;
            padding: 1rem;
            border: 2px dashed rgba(255, 255, 255, 0.2); /* border-2 border-dashed border-white/20 */
        }

        .puzzle-step-card {
            padding: 0.75rem;
            border-radius: 0.5rem;
            margin-bottom: 0.75rem; /* mb-3 */
            cursor: move;
            transition: all 0.2s ease-in-out;
            border: 2px solid;
            position: relative;
        }

        .puzzle-step-card:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* hover:shadow-lg */
        }

        .puzzle-step-card .title {
            font-weight: 600; /* font-semibold */
            color: #2D3748; /* text-gray-800 */
        }

        .puzzle-step-card .description {
            font-size: 0.875rem; /* text-sm */
            color: #4A5568; /* text-gray-600 */
        }

        .puzzle-step-card .phase {
            font-size: 0.75rem; /* text-xs */
            color: #718096; /* text-gray-500 */
            margin-top: 0.25rem;
            text-transform: capitalize;
        }

        .arranged-step-number {
            position: absolute;
            left: -0.5rem; /* -left-2 */
            top: -0.5rem; /* -top-2 */
            background-color: #3182CE; /* bg-blue-600 */
            color: #fff;
            border-radius: 9999px; /* rounded-full */
            width: 1.5rem; /* w-6 */
            height: 1.5rem; /* h-6 */
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem; /* text-xs */
            font-weight: 700;
        }

        .feedback-icon {
            position: absolute;
            top: 0.5rem; /* top-2 */
            right: 0.5rem; /* right-2 */
            height: 1.25rem; /* h-5 */
            width: 1.25rem; /* w-5 */
        }

        .feedback-icon.correct {
            color: #38A169; /* text-green-600 */
        }

        .feedback-icon.incorrect {
            color: #E53E3E; /* text-red-600 */
        }

        .empty-drop-area-text {
            color: rgba(255, 255, 255, 0.6); /* text-white/60 */
            text-align: center;
            padding: 2rem 0; /* py-8 */
        }

        /* Phase Legend */
        .phase-legend-box {
            margin-top: 1.5rem;
            background-color: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(8px);
            border-radius: 0.5rem;
            padding: 1rem;
        }

        .phase-legend-title {
            color: #fff;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .phase-legend-items {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem; /* gap-4 */
        }

        .phase-legend-item {
            display: flex;
            align-items: center;
        }

        .phase-color-box {
            width: 1rem; /* w-4 */
            height: 1rem; /* h-4 */
            border-width: 2px; /* border-2 */
            border-radius: 0.25rem;
            margin-right: 0.5rem;
        }

        .phase-legend-text {
            color: #fff;
            font-size: 0.875rem; /* text-sm */
        }

        /* Phase specific colors */
        .phase-initiation {
            background-color: #DBEAFE; /* bg-blue-100 */
            border-color: #93C5FD; /* border-blue-300 */
        }
        .phase-execution {
            background-color: #FFEDD5; /* bg-orange-100 */
            border-color: #FDBA74; /* border-orange-300 */
        }
        .phase-settlement {
            background-color: #D1FAE5; /* bg-green-100 */
            border-color: #A7F3D0; /* border-green-300 */
        }
        .phase-default {
            background-color: #F3F4F6; /* bg-gray-100 */
            border-color: #D1D5DB; /* border-gray-300 */
        }
        `}
      </style>

      {gameState === 'menu' && (
        <div className="menu-container">
          <div className="menu-card">
            <Trophy className="menu-icon" />
            <h1 className="menu-title">LC Puzzle Race</h1>
            <p className="menu-subtitle">Master the Letter of Credit workflow!</p>
            
            <div className="how-to-play-box">
              <h3 className="how-to-play-title">How to Play:</h3>
              <ul className="how-to-play-list">
                <li>Drag steps to arrange LC lifecycle in correct order</li>
                <li>Complete within 3 minutes for maximum points</li>
                <li>Identify document discrepancies for bonus points</li>
                <li>Learn critical checkpoints in LC processing</li>
              </ul>
            </div>

            <button
              onClick={startGame}
              className="start-game-button"
            >
              <Play style={{ marginRight: '0.5rem', height: '1.25rem', width: '1.25rem' }} />
              Start Game
            </button>
          </div>
        </div>
      )}

      {gameState === 'completed' && (
        <div className="completed-container">
          <div className="completed-card">
            <Trophy className="completed-icon" />
            <h2 className="completed-title">Game Complete!</h2>
            <div className="completed-score">Score: {score}</div>
            
            <div className="workflow-mastered-box">
              <h3 className="workflow-mastered-title">LC Workflow Mastered!</h3>
              <p className="workflow-mastered-text">
                You've learned the complete Letter of Credit lifecycle from application to settlement, 
                including critical document examination checkpoints.
              </p>
            </div>

            <button
              onClick={() => setGameState('menu')}
              className="play-again-button"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          {/* Header */}
          <div className="game-header">
            <div className="game-header-left">
              <Clock style={{ height: '1.5rem', width: '1.5rem', color: '#fff' }} />
              <span className="game-header-score">{formatTime(timeLeft)}</span>
            </div>
            <div className="game-header-score">Score: {score}</div>
            <button
              onClick={() => setGameState('menu')}
              className="game-header-reset-button"
            >
              <RotateCcw style={{ height: '1.5rem', width: '1.5rem' }} />
            </button>
          </div>

          {/* Discrepancy Challenge Modal */}
          {showDiscrepancy && currentDiscrepancy && (
            <div className="discrepancy-modal-overlay">
              <div className="discrepancy-modal-content">
                <div className="discrepancy-modal-header">
                  <AlertTriangle style={{ height: '1.5rem', width: '1.5rem', color: '#F97316', marginRight: '0.5rem' }} />
                  <h3>Document Discrepancy Challenge</h3>
                </div>
                
                <div className="discrepancy-details">
                  <div className="discrepancy-document-box">
                    <strong>{currentDiscrepancy.document}</strong>
                  </div>
                  <div className="discrepancy-detail-item">
                    <span>LC Requirement: {currentDiscrepancy.correctValue}</span>
                  </div>
                  <div className="discrepancy-detail-item">
                    <span>Document Shows: {currentDiscrepancy.incorrectValue}</span>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Identify the issue..."
                  value={discrepancyAnswer}
                  onChange={(e) => setDiscreptancyAnswer(e.target.value)}
                  className="discrepancy-input"
                />

                <button
                  onClick={handleDiscrepancySubmit}
                  className="discrepancy-submit-button"
                >
                  Submit Answer
                </button>
              </div>
            </div>
          )}

          <div className="puzzle-grids">
            {/* Shuffled Steps */}
            <div className="puzzle-section">
              <h2 className="puzzle-section-title">Available Steps</h2>
              <div
                className="puzzle-drop-area"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'shuffled')}
              >
                {shuffledSteps.map((step) => (
                  <div
                    key={step.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, step, 'shuffled')}
                    className={`puzzle-step-card ${getPhaseColorClass(step.phase)}`}
                  >
                    <div className="title">{step.title}</div>
                    <div className="description">{step.description}</div>
                    <div className="phase">{step.phase} Phase</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arranged Steps */}
            <div className="puzzle-section">
              <h2 className="puzzle-section-title">LC Workflow Order</h2>
              <div
                className="puzzle-drop-area"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'arranged')}
              >
                {arrangedSteps.map((step, index) => (
                  <div
                    key={step.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, step, 'arranged')}
                    className={`puzzle-step-card ${getPhaseColorClass(step.phase)}`}
                  >
                    <div className="arranged-step-number">
                      {index + 1}
                    </div>
                    <div className="title">{step.title}</div>
                    <div className="description">{step.description}</div>
                    <div className="phase">{step.phase} Phase</div>
                    {step.id === correctSteps[index]?.id && (
                      <CheckCircle className="feedback-icon correct" />
                    )}
                    {arrangedSteps.length === correctSteps.length && step.id !== correctSteps[index]?.id && (
                      <XCircle className="feedback-icon incorrect" />
                    )}
                  </div>
                ))}
                {arrangedSteps.length === 0 && (
                  <div className="empty-drop-area-text">
                    Drag steps here to arrange the LC workflow in correct order
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Phase Legend */}
          <div className="phase-legend-box">
            <h3 className="phase-legend-title">LC Phases:</h3>
            <div className="phase-legend-items">
              <div className="phase-legend-item">
                <div className="phase-color-box phase-initiation"></div>
                <span className="phase-legend-text">Initiation</span>
              </div>
              <div className="phase-legend-item">
                <div className="phase-color-box phase-execution"></div>
                <span className="phase-legend-text">Execution</span>
              </div>
              <div className="phase-legend-item">
                <div className="phase-color-box phase-settlement"></div>
                <span className="phase-legend-text">Settlement</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LCPuzzleRace;
