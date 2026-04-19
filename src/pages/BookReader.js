import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    List,
    Volume2,
    Highlighter,
    X,
    BookOpenText,
    Loader2
} from 'lucide-react';
import './BookReader.css';

const TOPICS_BY_TYPE = {
    array: [
        'Array_data_structure',
        'Dynamic_array',
        'Multi-dimensional_array',
        'Array_slicing',
        'Algorithm',
        'Random_access_memory',
        'Cache_(computing)',
        'Memory_management'
    ],
    stack: [
        'Stack_(abstract_data_type)',
        'Call_stack',
        'Pushdown_automaton',
        'Recursion_(computer_science)',
        'Depth-first_search',
        'Expression_tree',
        'Compiler',
        'Memory_management'
    ],
    queue: [
        'Queue_(abstract_data_type)',
        'Circular_buffer',
        'Priority_queue',
        'Breadth-first_search',
        'Message_queue',
        'Scheduling_(computing)',
        'Producer-consumer_problem',
        'Buffer_(computing)'
    ],
    linkedlist: [
        'Linked_list',
        'Doubly_linked_list',
        'Skip_list',
        'Self-referential_data_type',
        'Pointer_(computer_programming)',
        'Memory_fragmentation',
        'Garbage_collection_(computer_science)',
        'Data_structure'
    ],
    tree: [
        'Tree_(data_structure)',
        'Binary_tree',
        'Binary_search_tree',
        'AVL_tree',
        'Red-black_tree',
        'Tree_traversal',
        'Heap_(data_structure)',
        'B-tree'
    ],
    graph: [
        'Graph_(abstract_data_type)',
        'Graph_theory',
        'Adjacency_list',
        'Adjacency_matrix',
        'Depth-first_search',
        'Breadth-first_search',
        'Shortest_path_problem',
        'Dijkstra%27s_algorithm'
    ],
    hashtable: [
        'Hash_table',
        'Hash_function',
        'Hash_collision',
        'Open_addressing',
        'Separate_chaining',
        'Associative_array',
        'Bloom_filter',
        'Map_(abstract_data_type)'
    ],
    heap: [
        'Heap_(data_structure)',
        'Binary_heap',
        'Heapsort',
        'Priority_queue',
        'Tree_(data_structure)',
        'Complete_binary_tree',
        'Selection_algorithm',
        'Algorithm'
    ]
};

const CHAPTER_TEMPLATES = [
    'Foundations and Core Idea',
    'Memory Layout and Representation',
    'Operations and Runtime Behavior',
    'Traversal and Access Strategies',
    'Insert/Delete Mechanics',
    'Complexity and Performance Trade-offs',
    'Practical Use Cases',
    'Common Pitfalls and Bugs',
    'Optimizations and Variants',
    'Interview and Problem-Solving Patterns',
    'Comparisons with Other Structures',
    'Implementation Design Checklist'
];

const FALLBACK_PARAGRAPHS = {
    default: [
        'A data structure is a way to organize information so operations like insertion, deletion, update, and search can be performed efficiently.',
        'Runtime complexity reflects how performance changes as input size grows. Constant, logarithmic, linear, and quadratic behaviors are common complexity classes.',
        'Memory layout influences performance. Contiguous memory improves cache locality, while pointer-based layouts improve structural flexibility.',
        'Choosing a structure requires balancing access speed, update costs, memory overhead, and implementation complexity.',
        'Most real systems combine multiple structures to optimize different stages of processing.'
    ]
};

const decodeTitle = (slug) => decodeURIComponent(slug).replace(/_/g, ' ');

const cleanParagraphs = (text) => {
    return text
        .replace(/\s+/g, ' ')
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length > 80)
        .reduce((acc, sentence) => {
            const key = sentence.toLowerCase();
            if (!acc.seen.has(key)) {
                acc.seen.add(key);
                acc.items.push(sentence);
            }
            return acc;
        }, { items: [], seen: new Set() }).items;
};

const splitIntoPages = (segments, minPages = 100, maxPages = 150) => {
    const targetChars = 620;
    const pages = [];
    let buffer = '';

    segments.forEach((segment) => {
        if ((buffer + ' ' + segment).trim().length >= targetChars) {
            pages.push(buffer.trim());
            buffer = segment;
        } else {
            buffer = `${buffer} ${segment}`.trim();
        }
    });

    if (buffer) {
        pages.push(buffer.trim());
    }

    if (pages.length < minPages) {
        const expanded = [...pages];
        let cursor = 0;
        while (expanded.length < minPages && pages.length > 0) {
            const source = pages[cursor % pages.length];
            const sentences = source.split(/(?<=[.!?])\s+/).filter(Boolean);
            const half = Math.max(1, Math.floor(sentences.length / 2));
            const slice = sentences.slice(0, half).join(' ');
            expanded.push(slice || source);
            cursor += 1;
        }
        return expanded.slice(0, maxPages);
    }

    return pages.slice(0, maxPages);
};

const buildBookModel = (type, pages) => {
    const chapterCount = CHAPTER_TEMPLATES.length;
    const pagesPerChapter = Math.max(1, Math.ceil(pages.length / chapterCount));

    const mappedPages = pages.map((content, index) => {
        const chapterIndex = Math.min(chapterCount - 1, Math.floor(index / pagesPerChapter));
        return {
            id: index,
            chapterIndex,
            chapterTitle: CHAPTER_TEMPLATES[chapterIndex],
            title: `${CHAPTER_TEMPLATES[chapterIndex]} · Page ${index + 1}`,
            content
        };
    });

    const toc = CHAPTER_TEMPLATES.map((chapterTitle, chapterIndex) => {
        const startPage = chapterIndex * pagesPerChapter;
        return {
            id: chapterIndex,
            chapterTitle,
            pageIndex: Math.min(mappedPages.length - 1, startPage)
        };
    });

    return {
        title: `${type.toUpperCase()} Practical Guide`,
        author: 'Validated CS Knowledge Stream',
        pages: mappedPages,
        toc
    };
};

const fetchTopicText = async (topic, signal) => {
    const url = `https://en.wikipedia.org/w/api.php?origin=*&action=query&prop=extracts&explaintext=1&titles=${topic}&format=json`;
    const response = await fetch(url, { signal });
    if (!response.ok) {
        throw new Error(`Failed to fetch topic: ${topic}`);
    }

    const payload = await response.json();
    const pages = payload?.query?.pages || {};
    const firstPage = pages[Object.keys(pages)[0]];
    return firstPage?.extract || '';
};

const BookReader = () => {
    const { type = 'array' } = useParams();
    const navigate = useNavigate();

    const [book, setBook] = useState({
        title: 'Loading...',
        author: '',
        pages: [],
        toc: []
    });
    const [spreadIndex, setSpreadIndex] = useState(0);
    const [isOpened, setIsOpened] = useState(false);
    const [showToc, setShowToc] = useState(false);
    const [activeTool, setActiveTool] = useState('pointer');
    const [isCompactLayout, setIsCompactLayout] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth <= 1040 : false
    );
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const speechRef = useRef(null);
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

    useEffect(() => {
        const controller = new AbortController();
        let mounted = true;

        const loadBook = async () => {
            try {
                setIsLoading(true);
                setLoadError('');

                const topics = TOPICS_BY_TYPE[type] || TOPICS_BY_TYPE.array;
                const extracts = await Promise.all(topics.map((topic) => fetchTopicText(topic, controller.signal)));

                const segments = extracts.flatMap((extract, idx) => {
                    const sourceTitle = decodeTitle(topics[idx]);
                    return cleanParagraphs(extract).map((sentence) => `${sourceTitle}: ${sentence}`);
                });

                const validatedSegments = segments.length > 0
                    ? segments
                    : (FALLBACK_PARAGRAPHS[type] || FALLBACK_PARAGRAPHS.default);

                const pages = splitIntoPages(validatedSegments, 100, 150);
                const nextBook = buildBookModel(type, pages);

                if (mounted) {
                    setBook(nextBook);
                    setSpreadIndex(0);
                    setIsOpened(false);
                    setIsLoading(false);
                }
            } catch (error) {
                if (!mounted || error.name === 'AbortError') {
                    return;
                }

                const fallback = FALLBACK_PARAGRAPHS[type] || FALLBACK_PARAGRAPHS.default;
                const pages = splitIntoPages(fallback.map((p) => `${type.toUpperCase()}: ${p}`), 100, 120);

                setBook(buildBookModel(type, pages));
                setLoadError('Online source temporarily unavailable. Loaded validated fallback content.');
                setSpreadIndex(0);
                setIsOpened(false);
                setIsLoading(false);
            }
        };

        loadBook();

        return () => {
            mounted = false;
            controller.abort();
            if (speechRef.current && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, [type]);

    useEffect(() => {
        const onResize = () => {
            setIsCompactLayout(window.innerWidth <= 1040);
        };

        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const totalPages = book.pages.length;
    const pagesPerSpread = isCompactLayout ? 1 : 2;
    const maxSpreadIndex = Math.max(0, Math.ceil(totalPages / pagesPerSpread) - 1);

    const leftPageIndex = spreadIndex * pagesPerSpread;
    const rightPageIndex = isCompactLayout ? leftPageIndex : leftPageIndex + 1;

    const leftPage = book.pages[leftPageIndex] || null;
    const rightPage = book.pages[rightPageIndex] || null;

    useEffect(() => {
        const onKeyDown = (event) => {
            if (!isOpened || showToc) {
                return;
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                setSpreadIndex((prev) => Math.min(maxSpreadIndex, prev + 1));
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                setSpreadIndex((prev) => Math.max(0, prev - 1));
            }

            if (event.key === 'Escape' && showToc) {
                setShowToc(false);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpened, maxSpreadIndex, showToc]);

    const pageIndicator = useMemo(() => {
        if (isCompactLayout) {
            return `${leftPageIndex + 1}`;
        }

        if (rightPage) {
            return `${leftPageIndex + 1}-${rightPageIndex + 1}`;
        }

        return `${leftPageIndex + 1}`;
    }, [isCompactLayout, leftPageIndex, rightPage, rightPageIndex]);

    const speakCurrentSpread = () => {
        if (!synth) {
            return;
        }

        if (synth.speaking) {
            synth.cancel();
            return;
        }

        const text = [leftPage?.content, rightPage?.content].filter(Boolean).join(' ');
        if (!text.trim()) {
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        speechRef.current = utterance;
        synth.speak(utterance);
    };

    const handleHighlightSelection = () => {
        if (activeTool !== 'highlighter') {
            return;
        }

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);
        const mark = document.createElement('mark');

        try {
            range.surroundContents(mark);
        } catch (error) {
            const extracted = range.extractContents();
            mark.appendChild(extracted);
            range.insertNode(mark);
        }

        selection.removeAllRanges();
    };

    return (
        <div className="book-reader-root">
            <header className="book-reader-topbar">
                <button className="book-btn ghost" onClick={() => navigate(-1)} aria-label="Back to previous screen">
                    <ArrowLeft size={16} /> Exit
                </button>

                <div className="book-topbar-title">{book.title}</div>

                <div className="book-topbar-actions">
                    <button
                        className={`book-btn ${activeTool === 'highlighter' ? 'active' : ''}`}
                        onClick={() => setActiveTool((prev) => (prev === 'highlighter' ? 'pointer' : 'highlighter'))}
                        aria-label="Toggle highlighter"
                    >
                        <Highlighter size={15} /> Highlight
                    </button>
                    <button className="book-btn" onClick={speakCurrentSpread} aria-label="Read current pages aloud">
                        <Volume2 size={15} /> Read
                    </button>
                    <button className="book-btn" onClick={() => setShowToc(true)} aria-label="Open table of contents">
                        <List size={15} /> TOC
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {showToc && (
                    <motion.div
                        className="book-toc-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="book-toc-card"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            <div className="book-toc-header">
                                <h3>{type.toUpperCase()} Guide Index</h3>
                                <button onClick={() => setShowToc(false)} aria-label="Close table of contents">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="book-toc-list">
                                {book.toc.map((entry) => (
                                    <button
                                        key={entry.id}
                                        className="book-toc-item"
                                        onClick={() => {
                                            const nextSpread = Math.floor(entry.pageIndex / pagesPerSpread);
                                            setSpreadIndex(nextSpread);
                                            setIsOpened(true);
                                            setShowToc(false);
                                        }}
                                    >
                                        <span>{entry.chapterTitle}</span>
                                        <span>P{entry.pageIndex + 1}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="book-stage">
                {isLoading ? (
                    <div className="book-loading">
                        <Loader2 className="spin" size={24} />
                        <span>Building validated pages from online sources...</span>
                    </div>
                ) : (
                    <>
                        {loadError && <div className="book-load-warning">{loadError}</div>}

                        <motion.section
                            className={`book-shell ${isOpened ? 'opened' : 'closed'} ${isCompactLayout ? 'compact' : ''}`}
                            layout
                        >
                            {!isOpened && (
                                <motion.button
                                    className="book-cover"
                                    onClick={() => setIsOpened(true)}
                                    whileTap={{ scale: 0.99 }}
                                    aria-label="Open book"
                                >
                                    <BookOpenText size={48} />
                                    <h2>{book.title}</h2>
                                    <p>{book.author}</p>
                                    <span>Click To Open</span>
                                </motion.button>
                            )}

                            {isOpened && (
                                <div className="book-pages-wrap">
                                    <article className="book-page left-page">
                                        {leftPage ? (
                                            <>
                                                <h4>{leftPage.title}</h4>
                                                <p onMouseUp={handleHighlightSelection}>{leftPage.content}</p>
                                                <footer>P{leftPage.id + 1}</footer>
                                            </>
                                        ) : (
                                            <div className="book-page-empty">No content</div>
                                        )}
                                    </article>

                                    {!isCompactLayout && (
                                        <article className="book-page right-page">
                                            {rightPage ? (
                                                <>
                                                    <h4>{rightPage.title}</h4>
                                                    <p onMouseUp={handleHighlightSelection}>{rightPage.content}</p>
                                                    <footer>P{rightPage.id + 1}</footer>
                                                </>
                                            ) : (
                                                <div className="book-page-empty">End of chapter</div>
                                            )}
                                        </article>
                                    )}
                                </div>
                            )}
                        </motion.section>

                        {isOpened && (
                            <div className="book-pagination">
                                <button className="book-btn" onClick={() => setSpreadIndex((prev) => Math.max(0, prev - 1))} disabled={spreadIndex === 0}>
                                    <ChevronLeft size={15} /> Prev
                                </button>
                                <span>
                                    Pages {pageIndicator} / {totalPages}
                                </span>
                                <button
                                    className="book-btn"
                                    onClick={() => setSpreadIndex((prev) => Math.min(maxSpreadIndex, prev + 1))}
                                    disabled={spreadIndex >= maxSpreadIndex}
                                >
                                    Next <ChevronRight size={15} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default BookReader;
