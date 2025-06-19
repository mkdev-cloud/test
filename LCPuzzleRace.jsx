import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, Trophy, RotateCcw, Play, AlertTriangle } from 'lucide-react';
import gameData from './gameData.json';


// IMPORTANT: In a real application, gameData would typically be loaded from an external JSON file
// using a fetch request or by being imported if part of the module system.
// For this environment, the JSON structure is directly included as a constant.

const LCPuzzleRace = () => {
  // Initialize with a default domain, e.g., the first one from gameData or a specific one.
  // This ensures selectedDomain is not null when initializeGame is first called.
  const [selectedDomain, setSelectedDomain] = useState(gameData.domains[0]?.name || null); // FIX: Initialize with a default domain
  const [gameState, setGameState] = useState('menu'); // menu, playing, completed
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes for each puzzle
  const [score, setScore] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0); // Still used for stage name display and future expansion
  const [totalPuzzlesCompleted, setTotalPuzzlesCompleted] = useState(0); // New state for overall puzzle completion

  const [correctSteps, setCorrectSteps] = useState([]); // Loaded for current puzzle
  const [shuffledSteps, setShuffledSteps] = useState([]);
  const [arrangedSteps, setArrangedSteps] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);

  // New state for custom game messages (success/fail/winner)
  const [showGameMessage, setShowGameMessage] = useState(false);
  const [gameMessageTitle, setGameMessageTitle] = useState('');
  const [gameMessageText, setGameMessageText] = useState('');
  const [gameMessageIcon, setGameMessageIcon] = useState(null); // Lucide icon component

  // To track completed puzzles in the *current* session for randomization (avoiding repeats)
  const [completedPuzzlesInSession, setCompletedPuzzlesInSession] = useState([]); // Renamed from completedPuzzlesInStage

  // Function to get a random non-repeating puzzle from ANY stage
  const getRandomPuzzle = useCallback(() => {
    const selectedDomainData = gameData.domains.find(d => d.name === selectedDomain);
    if (!selectedDomainData) return null; // Ensure a domain is selected before proceeding

    const allPuzzles = selectedDomainData.stages.flatMap(stage => stage.puzzles);

    const availablePuzzles = allPuzzles.filter(
      (puzzle) => !completedPuzzlesInSession.includes(puzzle.id)
    );

    if (availablePuzzles.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availablePuzzles.length);
    return availablePuzzles[randomIndex];
  }, [completedPuzzlesInSession, selectedDomain]);




  // Initialize game or move to the next puzzle
  const initializeGame = useCallback(() => {
    setShowGameMessage(false); // Hide any previous messages

    const puzzleData = getRandomPuzzle();

    if (puzzleData) {
      setCorrectSteps(puzzleData.correctSteps);
      // Shuffle the steps for the new puzzle
      const shuffled = [...puzzleData.correctSteps].sort(() => Math.random() - 0.5);
      setShuffledSteps(shuffled);
      setArrangedSteps([]);
      setTimeLeft(180); // Reset timer for each new puzzle
      setGameState('playing'); // Ensure game state is playing
    } else {
      // This 'else' means getRandomPuzzle returned null, which implies all available puzzles are exhausted.
      setGameMessageTitle("No More Puzzles Available!");
      setGameMessageText("You've exhausted all unique puzzles in the game data for the selected domain."); // Clarify message
      setGameMessageIcon(<AlertTriangle className="text-yellow-500" />);
      setShowGameMessage(true);
      setTimeout(() => {
        setShowGameMessage(false);
        setGameState('menu');
      }, 3000);
    }
  }, [getRandomPuzzle]);

  // Start game from the beginning (menu button click)
  const startGame = () => {
    // If no domain is explicitly selected by the user, default to the first one available
    if (!selectedDomain && gameData.domains.length > 0) {
      setSelectedDomain(gameData.domains[0].name);
    }
    setCurrentStageIndex(0);
    setCompletedPuzzlesInSession([]);
    setScore(0);
    setTotalPuzzlesCompleted(0);
    // Use a setTimeout with 0 delay to ensure selectedDomain state updates before initializeGame is called
    // or refactor initializeGame to take selectedDomain as an argument.
    // For simplicity, ensuring selectedDomain is not null initially is better.
    initializeGame();
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (gameState === 'playing' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      // Time's up, game over
      setGameMessageTitle("Time's Up!");
      setGameMessageText("You ran out of time. Game Over!");
      setGameMessageIcon(<XCircle className="text-red-500" />);
      setShowGameMessage(true);
      setTimeout(() => {
        setShowGameMessage(false);
        setGameState('menu'); // Return to menu after message
      }, 3000);
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

    let newShuffledSteps = [...shuffledSteps];
    let newArrangedSteps = [...arrangedSteps];

    if (targetArea === 'arranged' && source === 'shuffled') {
      newShuffledSteps = newShuffledSteps.filter(step => step.id !== item.id);
      newArrangedSteps = [...newArrangedSteps, item];
    } else if (targetArea === 'shuffled' && source === 'arranged') {
      newArrangedSteps = newArrangedSteps.filter(step => step.id !== item.id);
      newShuffledSteps = [...newShuffledSteps, item];
    }

    setShuffledSteps(newShuffledSteps);
    setArrangedSteps(newArrangedSteps);
    setDraggedItem(null);

    // Check solution when the arranged steps length matches the correct steps length
    // Use the updated state values for checking
    if (targetArea === 'arranged' && newArrangedSteps.length === correctSteps.length) {
      checkSolution(newArrangedSteps);
    }
  };

  const checkSolution = (solution) => {
    // Only check if all steps are arranged
    if (solution.length !== correctSteps.length) {
      return;
    }
    const isCorrect = solution.every((step, index) => step.id === correctSteps[index].id);

    if (isCorrect) {
      const timeBonus = Math.floor(timeLeft / 10);
      setScore(prev => prev + 1000 + timeBonus);

      // Mark the current puzzle as completed in the session
      // Find current puzzle by matching its first step's ID across ALL puzzles
      // FIX: Get puzzles from the selected domain, not directly from gameData.stages
      const selectedDomainData = gameData.domains.find(d => d.name === selectedDomain);
      let currentPuzzleId = null;
      if (selectedDomainData) {
        const allPuzzlesInSelectedDomain = selectedDomainData.stages.flatMap(stage => stage.puzzles);
        currentPuzzleId = allPuzzlesInSelectedDomain.find(
          (puzzle) => puzzle.correctSteps[0].id === correctSteps[0].id
        )?.id;
      }

      if (currentPuzzleId) {
        setCompletedPuzzlesInSession(prev => [...prev, currentPuzzleId]);
      }

      // Calculate the total puzzles completed AFTER this one
      const newTotalPuzzlesCompleted = totalPuzzlesCompleted + 1; // Use the current state and add 1
      setTotalPuzzlesCompleted(newTotalPuzzlesCompleted); // Update the state

      // IMMEDIATE CHECK FOR WIN CONDITION
      if (newTotalPuzzlesCompleted >= gameData.levelsToWin) {
        setGameMessageTitle("Congratulations, Winner!");
        setGameMessageText(`You've mastered ${gameData.levelsToWin} workflows in ${selectedDomain} with a final score of ${score + 1000 + timeBonus}!`); // Ensure score is updated in message
        setGameMessageIcon(<Trophy className="text-yellow-500" />);
        setShowGameMessage(true);
        setTimeout(() => { // Still use timeout to show message
          setShowGameMessage(false);
          setGameState('completed'); // Set game state to completed
        }, 3000); // Longer message time for win
      } else {
        // Show success message and proceed to next puzzle
        setGameMessageTitle("Correct Order!");
        setGameMessageText("Excellent! Proceeding to the next challenge.");
        setGameMessageIcon(<CheckCircle className="text-green-500" />);
        setShowGameMessage(true);

        setTimeout(() => {
          setShowGameMessage(false);
          initializeGame(); // Load next puzzle
        }, 2000); // Show message for 2 seconds
      }

    } else {
      // Handle incorrect solution - Game Over
      setScore(prev => Math.max(0, prev - 50));
      setGameMessageTitle("Incorrect Order!");
      setGameMessageText("Oops! The workflow is incorrect. Game Over.");
      setGameMessageIcon(<XCircle className="text-red-500" />);
      setShowGameMessage(true);

      setTimeout(() => {
        setShowGameMessage(false);
        setGameState('menu');
      }, 3000);
    }
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
            overflow-x: hidden; /* Prevent horizontal scroll */
        }

        .lc-puzzle-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #1A202C 0%, #2B6CB0 50%, #4C51BF 100%); /* slate-900 via-blue-900 to-indigo-900 */
            padding: 1rem;
            box-sizing: border-box;
            color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        /* Menu State */
        .menu-container {
            min-height: 100vh;
            width: 100%;
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
            width: 100%;
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
            width: 100%;
            max-width: 1200px; /* Limit width for larger screens */
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
        
        .game-header-stage {
            font-size: 1rem;
            font-weight: 600;
            color: #fff;
            margin-left: 1rem;
            text-align: center;
            flex-grow: 1; /* Allow stage name to take available space */
        }
        .game-header-puzzle-progress {
            font-size: 1rem;
            font-weight: 600;
            color: #fff;
            margin-left: 1rem;
            text-align: center;
        }

        .game-header-reset-button {
            color: #fff;
            border: none;
            background: none;
            cursor: pointer;
            transition: color 0.2s ease-in-out;
            margin-left: 1rem; /* Space from stage name */
        }

        .game-header-reset-button:hover {
            color: #A0AEC0; /* hover:text-gray-300 */
        }

        .game-header-reset-button svg {
            height: 1.5rem;
            width: 1.5rem;
        }

        /* Custom Game Message Modal */
        .game-message-modal-overlay {
            position: fixed;
            inset: 0; /* inset-0 */
            background-color: rgba(0, 0, 0, 0.5); /* bg-black/50 */
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 50; /* z-50 */
        }

        .game-message-modal-content {
            background-color: #fff;
            border-radius: 0.75rem; /* rounded-xl */
            padding: 1.5rem;
            max-width: 28rem; /* max-w-md */
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .game-message-modal-icon {
            margin: 0 auto 1rem;
            height: 4rem;
            width: 4rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .game-message-modal-icon svg {
          height: 100%;
          width: 100%;
        }

        .game-message-modal-title {
            font-size: 1.875rem;
            font-weight: 700;
            color: #2D3748;
            margin-bottom: 0.5rem;
        }

        .game-message-modal-text {
            font-size: 1rem;
            color: #4A5568;
            margin-bottom: 1rem;
        }

        /* Puzzle Grids */
        .puzzle-grids {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem; /* gap-6 */
            width: 100%;
            max-width: 1200px; /* Limit width for larger screens */
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
            display: flex; /* Enable flex for vertical stacking */
            flex-direction: column;
            gap: 0.75rem; /* spacing between cards */
        }

        .puzzle-step-card {
            padding: 0.75rem;
            border-radius: 0.5rem;
            cursor: grab; /* Indicates draggable */
            transition: all 0.2s ease-in-out;
            border: 2px solid;
            position: relative;
            background-color: #fff; /* White background for card content */
            color: #2D3748; /* Dark text for readability on white background */
            display: flex;
            flex-direction: column;
            justify-content: center; /* Center content vertically */
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* shadow-md */
        }

        .puzzle-step-card:active {
            cursor: grabbing;
        }

        .puzzle-step-card:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* hover:shadow-lg */
            transform: translateY(-2px);
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
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
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
            flex-grow: 1; /* Allow it to take up space */
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Phase Legend */
        .phase-legend-box {
            margin-top: 1.5rem;
            background-color: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(8px);
            border-radius: 0.5rem;
            padding: 1rem;
            width: 100%;
            max-width: 1200px; /* Match puzzle grids width */
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
            <h1 className="menu-title">Lending Puzzle Race</h1>
            <p className="menu-subtitle"></p>

            {/* 🟡 NEW: Choose Domain - Moved inside card */}
            {/* <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label htmlFor="domain-select" style={{ display: 'block', marginBottom: '0.5rem', color: '#2D3748', fontWeight: '600' }}>
                Choose a Domain:
              </label>
              <select
                id="domain-select"
                onChange={(e) => setSelectedDomain(e.target.value)}
                value={selectedDomain || (gameData.domains[0]?.name || '')} // ✅ Default to the first domain if selectedDomain is null
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #CBD5E0',
                  fontSize: '1rem'
                }}
              >
                <option value="" disabled>Select Domain</option>
                {gameData.domains.map(domain => (
                  <option key={domain.name} value={domain.name}>{domain.name}</option>
                ))}
              </select>
            </div> */}

            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', color: '#2D3748', fontWeight: '600' }}>
                Choose a Domain:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {gameData.domains.map(domain => (
                  <button
                    key={domain.name}
                    onClick={() => setSelectedDomain(domain.name)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: selectedDomain === domain.name ? '2px solid #2B6CB0' : '1px solid #CBD5E0',
                      backgroundColor: selectedDomain === domain.name ? '#2B6CB0' : '#EDF2F7',
                      color: selectedDomain === domain.name ? '#fff' : '#2D3748',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {domain.name}
                  </button>
                ))}
              </div>
            </div>


            <div className="how-to-play-box">
              <h3 className="how-to-play-title">How to Play:</h3>
              <ul className="how-to-play-list">
                <li>Drag steps to arrange the lifecycle in correct order for each puzzle.</li>
                <li>Clear all puzzles in a stage to win the domain.</li>
                <li>Complete within the time limit for maximum points.</li>
                <li>Wrong order ends the game. Think before you drag!</li>
              </ul>
            </div>

            <button
              onClick={startGame}
              className="start-game-button"
              disabled={!selectedDomain}
              style={{ opacity: selectedDomain ? 1 : 0.5 }}
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
            <div className="completed-score">Final Score: {score}</div>
            <div className="workflow-mastered-box">
              <h3 className="workflow-mastered-title">Congratulations!</h3>
              <p className="workflow-mastered-text">
                You've successfully mastered all stages of the {selectedDomain} workflow.
              </p>
            </div>

            <button
              onClick={() => setGameState('menu')} // Go back to menu, preserving selected domain for next play
              className="play-again-button"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (<>
        <span className="game-header-stage">
          Domain: {selectedDomain}
        </span>

        {/* Header */}
        <div className="game-header">
          <div className="game-header-left">
            <Clock style={{ height: '1.5rem', width: '1.5rem', color: '#fff' }} />
            <span className="game-header-score">{formatTime(timeLeft)}</span>
          </div>
          <span className="game-header-score">Score: {score}</span>
          <span className="game-header-puzzle-progress">
            Levels Completed: {totalPuzzlesCompleted} / {gameData.levelsToWin}
          </span>
          <button
            onClick={() => setGameState('menu')}
            className="game-header-reset-button"
          >
            <RotateCcw style={{ height: '1.5rem', width: '1.5rem' }} />
          </button>
        </div>

        {/* Custom Game Message Modal (for success/fail/winner) */}
        {showGameMessage && (
          <div className="game-message-modal-overlay">
            <div className="game-message-modal-content">
              <div className="game-message-modal-icon">
                {gameMessageIcon}
              </div>
              <h3 className="game-message-modal-title">{gameMessageTitle}</h3>
              <p className="game-message-modal-text">{gameMessageText}</p>
              {/* No explicit close button, messages auto-close after timeout */}
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
              {shuffledSteps.length > 0 ? (
                shuffledSteps.map((step) => (
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
                ))
              ) : (
                <div className="empty-drop-area-text">
                  All steps dragged out!
                </div>
              )}
            </div>
          </div>

          {/* Arranged Steps */}
          <div className="puzzle-section">
            <h2 className="puzzle-section-title">Workflow Order</h2>
            <div
              className="puzzle-drop-area"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'arranged')}
            >
              {arrangedSteps.length > 0 ? (
                arrangedSteps.map((step, index) => (
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
                    {/* Feedback icons for correctness */}
                    {arrangedSteps.length === correctSteps.length && step.id === correctSteps[index]?.id && (
                      <CheckCircle className="feedback-icon correct" />
                    )}
                    {arrangedSteps.length === correctSteps.length && step.id !== correctSteps[index]?.id && (
                      <XCircle className="feedback-icon incorrect" />
                    )}
                  </div>
                ))
              ) : (
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