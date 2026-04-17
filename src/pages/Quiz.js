import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import './Quiz.css';

const QUIZ_QUESTIONS = [
  {
    topic: 'Arrays & Strings',
    question: 'What is the time complexity of accessing an element in an array by its index?',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
    answer: 0,
    explanation: 'Arrays store elements in contiguous memory locations, allowing O(1) direct access via mathematical offset calculation.'
  },
  {
    topic: 'Stack',
    question: 'Which principle does a Stack data structure follow?',
    options: ['First In First Out (FIFO)', 'Last In First Out (LIFO)', 'First In Last Out (FILO)', 'Both B and C'],
    answer: 3,
    explanation: 'A stack follows Last-In-First-Out (LIFO), which is synonymous with First-In-Last-Out (FILO).'
  },
  {
    topic: 'Queue',
    question: 'Which of the following is an application of a Queue?',
    options: ['Undo mechanism in text editors', 'Browser history', 'Task scheduling in operating systems', 'Evaluating postfix expressions'],
    answer: 2,
    explanation: 'Task scheduling generally uses Queue (FIFO) to serve requests in the exact order they arrive.'
  },
  {
    topic: 'Trees',
    question: 'What is the maximum number of children a node can have in a Binary Tree?',
    options: ['1', '2', '3', 'Any number'],
    answer: 1,
    explanation: 'In a binary tree, each node can have at most two children, referred to as the left child and the right child.'
  },
  {
    topic: 'Sorting',
    question: 'Which sorting algorithm has the best average-case time complexity?',
    options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'],
    answer: 2,
    explanation: 'Merge sort has an average and worst-case time complexity of O(n log n), which is optimal among these choices.'
  }
];

const Quiz = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const [quizQuestions, setQuizQuestions] = useState(QUIZ_QUESTIONS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuestions = () => {
    setIsLoading(true);
    fetch('https://opentdb.com/api.php?amount=10&category=18&type=multiple')
      .then(res => res.json())
      .then(data => {
        if (data.response_code === 0 && data.results.length > 0) {
          const formatted = data.results.map(q => {
            const ops = [...q.incorrect_answers];
            const ansIdx = Math.floor(Math.random() * 4);
            ops.splice(ansIdx, 0, q.correct_answer);
            
            const decode = (str) => {
              const txt = document.createElement("textarea");
              txt.innerHTML = str;
              return txt.value;
            };

            return {
              topic: 'Computer Science',
              question: decode(q.question),
              options: ops.map(decode),
              answer: ansIdx,
              explanation: `The correct answer is "${decode(q.correct_answer)}".`
            };
          });
          setQuizQuestions(formatted);
        }
      })
      .catch(err => console.error("Failed to fetch questions, using fallback.", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const question = quizQuestions[currentIdx];

  const handleSelect = (idx) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    if (idx === question.answer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx < quizQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsFinished(true);
    // Save to localStorage
    const savedStats = JSON.parse(localStorage.getItem('userStats')) || { visualizations: 0, quizzesTaken: 0, avgScore: 0, history: [] };
    
    const percentage = Math.round((score / quizQuestions.length) * 100);
    
    savedStats.quizzesTaken++;
    savedStats.avgScore = Math.round(((savedStats.avgScore * (savedStats.quizzesTaken - 1)) + percentage) / savedStats.quizzesTaken);
    
    savedStats.history.unshift({
      topic: 'Random Assessment',
      score: `${percentage}%`,
      date: new Date().toLocaleDateString()
    });
    
    if (savedStats.history.length > 5) savedStats.history.pop();
    localStorage.setItem('userStats', JSON.stringify(savedStats));
  };

  const restartQuiz = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
    fetchQuestions(); // Grab new questions!
  };

  if (isLoading) {
    return (
      <div className="quiz-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
        <h2 style={{color: 'white'}}>Fetching fresh questions...</h2>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    return (
      <div className="quiz-container">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="quiz-card result-card"
        >
          <Trophy size={64} className="trophy-icon" />
          <h2>Quiz Completed!</h2>
          <div className="score-circle">
            <span className="score-text">{percentage}%</span>
          </div>
          <p>You scored {score} out of {quizQuestions.length}</p>
          <button onClick={restartQuiz} className="quiz-btn restart-btn">
            <RotateCcw size={18} /> Take Another Quiz
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h1>Knowledge Assessment</h1>
        <div className="quiz-progress">
          <div className="progress-text">
            <span>Question {currentIdx + 1} of {quizQuestions.length}</span>
            <span>Score: {score}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentIdx + 1) / quizQuestions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="quiz-card"
        >
          <div className="question-topic">{question.topic}</div>
          <h2 className="question-text">{question.question}</h2>

          <div className="options-grid">
            {question.options.map((opt, idx) => {
              let btnClass = 'option-btn';
              if (isAnswered) {
                if (idx === question.answer) btnClass += ' correct';
                else if (idx === selectedOption) btnClass += ' incorrect';
              } else if (idx === selectedOption) {
                btnClass += ' selected';
              }

              return (
                <button 
                  key={idx}
                  className={btnClass}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                >
                  <span className="option-text">{opt}</span>
                  {isAnswered && idx === question.answer && <CheckCircle2 size={20} className="result-icon success" />}
                  {isAnswered && idx === selectedOption && idx !== question.answer && <XCircle size={20} className="result-icon error" />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`explanation ${selectedOption === question.answer ? 'exp-correct' : 'exp-incorrect'}`}
            >
              <p><strong>{selectedOption === question.answer ? 'Correct!' : 'Incorrect.'}</strong> {question.explanation}</p>
            </motion.div>
          )}

          {isAnswered && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="quiz-footer"
            >
              <button className="quiz-btn next-btn" onClick={nextQuestion}>
                {currentIdx < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'} <ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Quiz;
