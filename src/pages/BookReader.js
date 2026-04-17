import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Highlighter, 
  Book as BookIcon,
  MousePointer2
} from 'lucide-react';
import './BookReader.css';

const BOOK_DATA = {
  array: {
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen, Charles E. Leiserson",
    pages: [
      {
        header: "The Array Structure",
        content: "An array is a data structure consisting of a collection of elements, each identified by at least one array index or key. An array is stored such that the position of each element can be computed from its index tuple by a mathematical formula. The simplest type of data structure is a linear array, also called a one-dimensional array.",
        image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=250&fit=crop"
      },
      {
        header: "Contiguous Memory Allocations",
        content: "Arrays allocate memory in contiguous blocks. This fundamental characteristic provides O(1) random access time because the address of an element can be computed simply by an offset from the base. Because memory is contiguous, arrays have excellent spatial locality, which is highly optimal for modern CPU caches.",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop"
      },
      {
        header: "Insertion & Deletion Limits",
        content: "While access is O(1), inserting or deleting an element at an arbitrary index requires moving on average half of the array's elements, leading to O(n) runtime complexity. Dynamic arrays allocate extra space to offset initialization limits, doubling their capacity when filled.",
        image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=250&fit=crop"
      }
    ]
  },
  stack: {
    title: "The Art of Computer Programming: Vol 1",
    author: "Donald E. Knuth",
    pages: [
      {
        header: "Stack Fundamentals",
        content: "A Stack is a linear data structure that follows the Last In First Out (LIFO) principle. Elements can be added and removed from the stack only at the top. The push operation adds an element to the top of the stack, while the pop operation removes the top element.",
        image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=250&fit=crop"
      },
      {
        header: "Applications of Stacks",
        content: "Stacks are used extensively in modern computing systems. Key applications include expression evaluation, function call management (the Call Stack), and features like syntax parsing, backtracking, and undo mechanisms in text editors.",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop"
      }
    ]
  },
  queue: {
    title: "Algorithms, 4th Edition",
    author: "Robert Sedgewick",
    pages: [
      {
        header: "The Queue Principle",
        content: "A Queue operates on the First In First Out (FIFO) principle. It is analogous to a line of people waiting for a service. Items are added at the rear (enqueue) and removed from the front (dequeue). Queues are fundamental for ordered task processing.",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop"
      },
      {
        header: "Queue Implementations",
        content: "Queues are highly utilized in Breadth-First Search algorithms, CPU scheduling, print spooling, and serving API requests in backend web servers. A Circular Queue is a popular variation that improves memory utilization over simple arrays.",
        image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=250&fit=crop"
      }
    ]
  },
  linkedlist: {
    title: "Data Structures and Algorithm Analysis",
    author: "Mark Allen Weiss",
    pages: [
      {
        header: "Pointers and Nodes",
        content: "A Linked List is a linear collection of data elements where order is not given by their physical placement in memory. Instead, each element (node) points to the next. It consists of data and a reference (pointer) to the next node in the sequence.",
        image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=250&fit=crop"
      }
    ]
  },
  tree: {
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    pages: [
      {
        header: "Hierarchical Data",
        content: "A tree is an undirected graph in which any two vertices are connected by exactly one path. Trees simulate hierarchical tree structures with a set of linked nodes. In computer science, they are primarily used in filesystem structures and search mechanisms.",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop"
      }
    ]
  },
  graph: {
    title: "Graph Theory",
    author: "Reinhard Diestel",
    pages: [
      {
        header: "Networks and Vertices",
        content: "A Graph is a non-linear data structure consisting of vertices (nodes) and edges. Graphs are extremely powerful for representing networks such as roads, social networks, circuits, and internet router topologies.",
        image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=250&fit=crop"
      }
    ]
  },
  hashtable: {
    title: "Algorithms in C++",
    author: "Robert Sedgewick",
    pages: [
      {
        header: "Hash Functions",
        content: "A Hash Table is an associative array that maps keys to values. It uses a hash function to compute an index into an array of buckets or slots, from which the desired value can be found. It is prized for O(1) average lookup scaling.",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop"
      }
    ]
  },
  heap: {
    title: "The Algorithm Design Manual",
    author: "Steven S. Skiena",
    pages: [
      {
        header: "Priority Queues",
        content: "A Heap is a specialized tree-based data structure which is essentially an almost complete tree that satisfies the heap property. Heaps are the fundamental structure behind standard Priority Queues and Heap Sort.",
        image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=250&fit=crop"
      }
    ]
  }
};

const BookReader = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [isOpened, setIsOpened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTool, setActiveTool] = useState('pointer'); // 'pointer' or 'highlighter'
  
  const book = BOOK_DATA[type] || BOOK_DATA.array;
  const synth = window.speechSynthesis;
  const utteranceRef = useRef(null);

  useEffect(() => {
    // Start the opening animation
    const timer = setTimeout(() => setIsOpened(true), 1000);
    return () => {
      clearTimeout(timer);
      if (utteranceRef.current) synth.cancel();
    };
  }, []);

  const speak = (text) => {
    if (synth.speaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    setIsSpeaking(true);
    synth.speak(utterance);
  };

  const handleNext = () => {
    if (currentPage < book.pages.length - 1) {
      setCurrentPage(prev => prev + 1);
      if (synth.speaking) synth.cancel();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      if (synth.speaking) synth.cancel();
    }
  };

  const handleClose = () => {
    setIsOpened(false);
    if (synth.speaking) synth.cancel();
    setTimeout(() => {
      navigate(-1);
    }, 1500); // wait for close animation
  };

  const handleHighlight = () => {
    const selection = window.getSelection();
    if (selection.toString() && activeTool === 'highlighter') {
      const range = selection.getRangeAt(0);
      const span = document.createElement("span");
      span.className = "book-highlight";
      range.surroundContents(span);
      selection.removeAllRanges();
    }
  };

  return (
    <div className="reader-container">
      {/* Dynamic Background */}
      <div className="reader-bg">
        <div className="reader-glow"></div>
      </div>

      {/* Top Navbar */}
      <nav className="reader-nav">
        <button onClick={handleClose} className="nav-btn skeuo-btn">
          <ArrowLeft size={18} /> Exit
        </button>
        <div className="nav-title">
          <BookIcon size={20} className="purple-icon" />
          <span>Interactive Learning Assistant</span>
        </div>
        <div className="nav-tools">
          <button 
            className={`tool-btn ${activeTool === 'pointer' ? 'active' : ''}`}
            onClick={() => setActiveTool('pointer')}
          >
            <MousePointer2 size={18} />
          </button>
          <button 
            className={`tool-btn ${activeTool === 'highlighter' ? 'active' : ''}`}
            onClick={() => setActiveTool('highlighter')}
            title="Skeuomorphic Highlighter"
          >
            <Highlighter size={18} />
          </button>
          <button 
            onClick={() => speak(book.pages[currentPage].content)} 
            className={`tool-btn ${isSpeaking ? 'speaking' : ''}`}
          >
            {isSpeaking ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </nav>

      {/* Main Reader Area */}
      <div className="book-area">
        <div className={`book-wrapper ${isOpened ? 'opened' : ''}`}>
          
          {/* Cover Page */}
          <div className="book-cover">
            <div className="cover-inner">
              <div className="cover-title">
                <BookIcon size={48} />
                <h1>{book.title}</h1>
                <p>Volume I: Fundamental Structures</p>
                <div className="author-badge">By {book.author}</div>
              </div>
            </div>
          </div>

          {/* Left Page (Content) */}
          <div className="book-page left-page">
            <div className="page-content" onMouseUp={handleHighlight}>
              <div className="page-header">
                <span className="chapter-tag">Chapter {currentPage + 1}</span>
                <h2>{book.pages[currentPage].header}</h2>
              </div>
              <p className="main-text">
                {book.pages[currentPage].content}
              </p>
              <div className="page-number">{currentPage * 2 + 1}</div>
            </div>
          </div>

          {/* Right Page (Image/Detail) */}
          <div className="book-page right-page">
            <div className="page-content">
              <div className="visual-preview">
                <img src={book.pages[currentPage].image} alt="Visual explanation" />
                <div className="image-caption">Visual Diagram for Reference</div>
              </div>
              <div className="fact-box">
                <h4>Quick Insight</h4>
                <p>Did you know? Arrays are stored in a contiguous block of memory, meaning there are no gaps between elements.</p>
              </div>
              <div className="page-number">{currentPage * 2 + 2}</div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="reader-controls">
          <button 
            onClick={handlePrev} 
            disabled={currentPage === 0 || !isOpened}
            className="arrow-btn left"
          >
            <ChevronLeft size={32} />
          </button>
          
          {currentPage === book.pages.length - 1 ? (
             <button 
               onClick={handleClose} 
               disabled={!isOpened}
               className="arrow-btn right close-book-btn"
               style={{ backgroundColor: '#ef4444', color: 'white', width: 'auto', padding: '0 20px', borderRadius: '12px' }}
             >
               <span style={{ fontWeight: 'bold', fontSize: '1rem', marginRight: '8px' }}>Close Book</span>
             </button>
          ) : (
            <button 
              onClick={handleNext} 
              disabled={!isOpened}
              className="arrow-btn right"
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>
      </div>

      {/* Assistant Avatar */}
      <div className={`assistant-avatar ${isSpeaking ? 'active' : ''}`}>
         <div className="assistant-glow"></div>
         <img src="https://api.dicebear.com/7.x/bottts/svg?seed=ReaderAssistant" alt="Assistant" />
         <div className="speech-bubble">
            {isSpeaking ? "I am reading the page for you..." : "Hello! Use the marker to highlight important text."}
         </div>
      </div>
    </div>
  );
};

export default BookReader;
