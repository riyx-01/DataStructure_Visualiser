import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Trash2,
    Search,
    Shuffle,
    RotateCcw,
    Check,
    X,
    Book,
    BrainCircuit,
    Ghost,
    Info,
    Cpu
} from 'lucide-react';

import ArrayVisualizer from '../components/visualizers/ArrayVisualizer';
import StackVisualizer from '../components/visualizers/StackVisualizer';
import QueueVisualizer from '../components/visualizers/QueueVisualizer';
import LinkedListVisualizer from '../components/visualizers/LinkedListVisualizer';
import TreeVisualizer from '../components/visualizers/TreeVisualizer';
import GraphVisualizer from '../components/visualizers/GraphVisualizer';
import HashTableVisualizer from '../components/visualizers/HashTableVisualizer';
import HeapVisualizer from '../components/visualizers/HeapVisualizer';

const structureInfo = {
    array: {
        title: 'Array',
        subtitle: 'Contiguous memory storage with O(1) access',
        maxSize: 10
    },
    stack: {
        title: 'Stack',
        subtitle: 'LIFO - Last In First Out principle',
        maxSize: 8
    },
    queue: {
        title: 'Queue',
        subtitle: 'FIFO - First In First Out principle',
        maxSize: 8
    },
    linkedlist: {
        title: 'Linked List',
        subtitle: 'Nodes connected by pointers',
        maxSize: 8
    },
    tree: {
        title: 'Binary Tree',
        subtitle: 'Hierarchical structure with parent-child relationships',
        maxSize: 7
    },
    graph: {
        title: 'Graph',
        subtitle: 'Network of vertices connected by edges',
        maxSize: 4
    },
    hashtable: {
        title: 'Hash Table',
        subtitle: 'Key-value pairs with O(1) average lookup',
        maxSize: 6
    },
    heap: {
        title: 'Heap',
        subtitle: 'Complete binary tree with heap property',
        maxSize: 7
    }
};

const cloneData = (value) => JSON.parse(JSON.stringify(value));

const numberFromItem = (item) => (typeof item === 'object' ? item?.value ?? 0 : item);

const normalizeDataForType = (type, data) => {
    const source = Array.isArray(data) ? data : [];

    if (type === 'hashtable') {
        return source.map((item, index) => {
            if (item && typeof item === 'object' && 'key' in item && 'value' in item) {
                return item;
            }

            return {
                key: index,
                value: numberFromItem(item)
            };
        });
    }

    return source.map((item) => numberFromItem(item));
};

const asHex = (n) => `0x${n.toString(16).toUpperCase()}`;

const buildMemoryModel = (type, data) => {
    const cacheLineBytes = 64;

    if (type === 'array' || type === 'stack' || type === 'queue') {
        const base = 0x1800;
        const stride = 8;
        const cells = data.map((item, index) => {
            const address = base + index * stride;
            return {
                slot: index,
                value: numberFromItem(item),
                address: asHex(address),
                binary: Number(numberFromItem(item) || 0).toString(2).padStart(8, '0'),
                cacheLine: Math.floor((address - base) / cacheLineBytes)
            };
        });

        return {
            heading: 'Contiguous Layout',
            summary: 'Elements sit side-by-side in memory. One pointer jump can bring nearby elements into cache.',
            cells
        };
    }

    if (type === 'linkedlist') {
        const cells = data.map((item, index) => {
            const address = 0x2400 + ((index * 37) % 13) * 0x2a + index * 11;
            const nextAddress = index < data.length - 1 ? 0x2400 + (((index + 1) * 37) % 13) * 0x2a + (index + 1) * 11 : null;
            return {
                slot: index,
                value: numberFromItem(item),
                address: asHex(address),
                next: nextAddress ? asHex(nextAddress) : 'NULL',
                cacheLine: Math.floor((address - 0x2400) / cacheLineBytes)
            };
        });

        return {
            heading: 'Pointer-Chasing Layout',
            summary: 'Nodes are scattered. Traversal follows pointers, so cache locality is weaker than arrays.',
            cells
        };
    }

    if (type === 'hashtable') {
        const cells = data.map((item, index) => {
            const bucket = Number(item.key) % 10;
            const address = 0x3200 + bucket * 16 + index * 4;
            return {
                slot: bucket,
                value: `${item.key}:${item.value}`,
                address: asHex(address),
                binary: Number(item.value || 0).toString(2).padStart(8, '0'),
                cacheLine: Math.floor((address - 0x3200) / cacheLineBytes)
            };
        });

        return {
            heading: 'Bucketed Layout',
            summary: 'Keys map to buckets. Collisions may cause multiple key-value pairs in related memory regions.',
            cells
        };
    }

    const cells = data.map((item, index) => {
        const address = 0x4100 + index * 24;
        return {
            slot: index,
            value: numberFromItem(item),
            address: asHex(address),
            binary: Number(numberFromItem(item) || 0).toString(2).padStart(8, '0'),
            cacheLine: Math.floor((address - 0x4100) / cacheLineBytes)
        };
    });

    return {
        heading: 'Object Graph Layout',
        summary: 'Nodes and references form logical relationships; physical placement can vary at runtime.',
        cells
    };
};

const buildWhyExplanation = (step, level, type) => {
    const beginner = {
        insert: `We insert here because ${type} needs to include your new value while keeping the structure valid.`,
        delete: 'This removes the last active element in the current interaction model so you can see the structure shrink safely.',
        search: 'Search checks one candidate at a time so we can visually show how matching works.',
        pointer: 'The pointer moved to inspect the next candidate node/slot.',
        found: 'The highlighted item matches your target value.',
        miss: 'No item matched the requested value in this pass.',
        reset: 'Reset returns to a known starting state so the next run is easy to follow.',
        shuffle: 'Shuffle changes order to demonstrate how position impacts traversal and search.'
    };

    const advanced = {
        insert: `Insertion appends data while preserving ${type} invariants. This creates a new state transition and updates memory occupancy.`,
        delete: 'Deletion compacts the active view by removing terminal state, which is useful for showing underflow boundaries and tail behavior.',
        search: 'A linear scan advances comparison pointer state, exposing time complexity growth with data size.',
        pointer: 'Pointer progression models iterator advancement. In pointer-heavy structures this implies additional memory dereferences.',
        found: 'Match event emits a terminal success state and halts traversal path.',
        miss: 'Traversal exhausted candidate set, emitting a negative lookup result.',
        reset: 'Reset re-initializes data and transient state, clearing stale indexes, highlights, and ghost overlays.',
        shuffle: 'Shuffle randomizes locality/order to compare access behavior across different spatial layouts.'
    };

    const table = level === 'advanced' ? advanced : beginner;
    return table[step.kind] || `This step updates the ${type} state to keep the animation and data model synchronized.`;
};

const VisualizerPage = () => {
    const { type } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [notification, setNotification] = useState(null);
    const [searchIndex, setSearchIndex] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [foundIndex, setFoundIndex] = useState(null);

    const [isXRayMode, setIsXRayMode] = useState(false);
    const [ghostSnapshot, setGhostSnapshot] = useState(null);
    const [ghostPointerIndex, setGhostPointerIndex] = useState(null);
    const [steps, setSteps] = useState([]);
    const [explainLevel, setExplainLevel] = useState('beginner');
    const [activeWhy, setActiveWhy] = useState(null);
    const [isWhyLoading, setIsWhyLoading] = useState(false);

    const ghostTimerRef = useRef(null);
    const pointerGhostTimerRef = useRef(null);

    const info = structureInfo[type] || { title: type, subtitle: '', maxSize: 10 };

    const normalizedData = useMemo(() => normalizeDataForType(type, data), [type, data]);

    const memoryModel = useMemo(() => buildMemoryModel(type, normalizedData), [type, normalizedData]);

    const pushStep = (payload) => {
        setSteps((prev) => [{ id: Date.now() + Math.random(), ...payload }, ...prev].slice(0, 16));
    };

    const showNotification = (message, isError = false) => {
        setNotification({ message, isError });
        setTimeout(() => setNotification(null), 3000);
    };

    const dropGhostAfterDelay = () => {
        if (ghostTimerRef.current) {
            clearTimeout(ghostTimerRef.current);
        }

        ghostTimerRef.current = setTimeout(() => {
            setGhostSnapshot(null);
        }, 2000);
    };

    const rememberGhostState = (reason) => {
        if (!data.length) {
            return;
        }

        setGhostSnapshot({ reason, data: cloneData(data) });
        dropGhostAfterDelay();
    };

    useEffect(() => {
        const stats = JSON.parse(localStorage.getItem('userStats')) || {
            visualizations: 0,
            quizzesTaken: 0,
            avgScore: 0,
            history: []
        };
        stats.visualizations += 1;
        localStorage.setItem('userStats', JSON.stringify(stats));

        switch (type) {
            case 'array':
                setData([10, 25, 15, 30, 45, 20]);
                break;
            case 'stack':
                setData([5, 10, 15, 20]);
                break;
            case 'queue':
                setData([3, 6, 9, 12]);
                break;
            case 'linkedlist':
                setData([7, 14, 21, 28]);
                break;
            case 'tree':
                setData([50, 30, 70, 20, 40, 60, 80]);
                break;
            case 'graph':
                setData([1, 2, 3, 4]);
                break;
            case 'hashtable':
                setData([
                    { key: 0, value: 10 },
                    { key: 3, value: 23 },
                    { key: 5, value: 45 },
                    { key: 7, value: 67 }
                ]);
                break;
            case 'heap':
                setData([90, 70, 80, 50, 60, 40, 30]);
                break;
            default:
                setData([]);
        }

        setSearchIndex(null);
        setFoundIndex(null);
        setIsSearching(false);
        setGhostSnapshot(null);
        setGhostPointerIndex(null);
        setSteps([]);
        setActiveWhy(null);
    }, [type]);

    useEffect(() => {
        return () => {
            if (ghostTimerRef.current) {
                clearTimeout(ghostTimerRef.current);
            }
            if (pointerGhostTimerRef.current) {
                clearTimeout(pointerGhostTimerRef.current);
            }
        };
    }, []);

    const markPointerGhost = (index) => {
        setGhostPointerIndex(index);
        if (pointerGhostTimerRef.current) {
            clearTimeout(pointerGhostTimerRef.current);
        }

        pointerGhostTimerRef.current = setTimeout(() => {
            setGhostPointerIndex(null);
        }, 2000);
    };

    const handleInsert = () => {
        if (!inputValue) {
            showNotification('Please enter a value', true);
            return;
        }

        const val = Number.parseInt(inputValue, 10);
        if (Number.isNaN(val)) {
            showNotification('Please enter a valid number', true);
            return;
        }

        if (data.length >= info.maxSize) {
            showNotification(`Maximum ${info.maxSize} elements allowed for ${type}`, true);
            return;
        }

        rememberGhostState('Before insert');

        setSearchIndex(null);
        setFoundIndex(null);

        if (type === 'hashtable') {
            const existingKeys = data.map((d) => d.key);
            let newKey = 0;
            while (existingKeys.includes(newKey) && newKey < 10) {
                newKey += 1;
            }

            if (newKey >= 10) {
                showNotification('Hash table full', true);
                return;
            }

            setData((prev) => [...prev, { key: newKey, value: val }]);
            showNotification(`Inserted ${val} at key ${newKey}`);
            pushStep({ kind: 'insert', label: `Inserted ${val} into bucket ${newKey}` });
        } else {
            setData((prev) => [...prev, val]);
            showNotification(`Inserted ${val}`);
            pushStep({ kind: 'insert', label: `Inserted ${val}` });
        }

        setInputValue('');
    };

    const handleDelete = () => {
        if (data.length === 0) {
            showNotification('Nothing to delete', true);
            return;
        }

        rememberGhostState('Before delete');

        setSearchIndex(null);
        setFoundIndex(null);

        setData((prev) => {
            const newData = [...prev];
            const removed = newData.pop();
            const displayValue = typeof removed === 'object' ? removed.value : removed;
            showNotification(`Deleted ${displayValue}`);
            pushStep({ kind: 'delete', label: `Deleted ${displayValue}` });
            return newData;
        });
    };

    const handleSearch = async () => {
        if (!inputValue) {
            showNotification('Enter a value to search', true);
            return;
        }

        const searchVal = Number.parseInt(inputValue, 10);
        if (Number.isNaN(searchVal)) {
            showNotification('Enter a valid number', true);
            return;
        }

        setIsSearching(true);
        setSearchIndex(null);
        setFoundIndex(null);

        const workingData = normalizedData;

        if (['array', 'linkedlist', 'stack', 'queue', 'hashtable'].includes(type)) {
            for (let i = 0; i < workingData.length; i += 1) {
                if (searchIndex !== null) {
                    markPointerGhost(searchIndex);
                    pushStep({ kind: 'pointer', label: `Pointer moved from slot ${searchIndex} to slot ${i}` });
                }

                setSearchIndex(i);
                pushStep({ kind: 'search', label: `Checking slot ${i}` });
                await new Promise((resolve) => setTimeout(resolve, 400));

                const currentVal = type === 'hashtable' ? workingData[i].value : numberFromItem(workingData[i]);
                if (currentVal === searchVal) {
                    setFoundIndex(i);
                    if (type === 'hashtable') {
                        showNotification(`Found ${searchVal} at key ${workingData[i].key}`);
                    } else {
                        showNotification(`Found ${searchVal} at index ${i}`);
                    }
                    pushStep({ kind: 'found', label: `Found ${searchVal} at slot ${i}` });
                    setIsSearching(false);
                    return;
                }
            }

            showNotification(`${searchVal} not found`, true);
            pushStep({ kind: 'miss', label: `${searchVal} was not found` });
            setSearchIndex(null);
            setGhostPointerIndex(null);
        } else {
            const index = workingData.findIndex((item) => numberFromItem(item) === searchVal);
            if (index !== -1) {
                setFoundIndex(index);
                showNotification(`${searchVal} found in ${type}`);
                pushStep({ kind: 'found', label: `Found ${searchVal} in ${type}` });
            } else {
                showNotification(`${searchVal} not found in ${type}`, true);
                pushStep({ kind: 'miss', label: `${searchVal} missing in ${type}` });
            }
        }

        setIsSearching(false);
    };

    const handleShuffle = () => {
        if (['stack', 'queue', 'hashtable', 'tree', 'heap', 'graph'].includes(type)) {
            showNotification('Shuffle not available for this structure', true);
            return;
        }

        rememberGhostState('Before shuffle');

        setSearchIndex(null);
        setFoundIndex(null);

        setData((prev) => {
            const shuffled = [...prev].sort(() => Math.random() - 0.5);
            showNotification('Array shuffled');
            pushStep({ kind: 'shuffle', label: 'Shuffled current order' });
            return shuffled;
        });
    };

    const handleReset = () => {
        rememberGhostState('Before reset');
        setInputValue('');
        setSearchIndex(null);
        setFoundIndex(null);
        setIsSearching(false);
        pushStep({ kind: 'reset', label: 'Reset to initial defaults' });
        window.location.reload();
    };

    const renderVisualizer = () => {
        const commonProps = {
            data: normalizedData,
            searchIndex,
            isSearching,
            foundIndex,
            xRayMode: isXRayMode,
            memoryModel,
            ghostData: ghostSnapshot?.data || [],
            ghostSearchIndex: ghostPointerIndex
        };

        switch (type) {
            case 'array':
                return <ArrayVisualizer {...commonProps} />;
            case 'stack':
                return <StackVisualizer {...commonProps} />;
            case 'queue':
                return <QueueVisualizer {...commonProps} />;
            case 'linkedlist':
                return <LinkedListVisualizer {...commonProps} />;
            case 'tree':
                return <TreeVisualizer {...commonProps} />;
            case 'graph':
                return <GraphVisualizer {...commonProps} />;
            case 'hashtable':
                return <HashTableVisualizer {...commonProps} />;
            case 'heap':
                return <HeapVisualizer {...commonProps} />;
            default:
                return <div>Visualizer not found</div>;
        }
    };

    const handleWhyClick = async (step) => {
        setIsWhyLoading(true);

        let explanation = buildWhyExplanation(step, explainLevel, type);

        try {
            const response = await fetch('/api/why-explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    level: explainLevel,
                    step: step.label,
                    kind: step.kind,
                    data: data.slice(0, 10)
                })
            });

            if (response.ok) {
                const payload = await response.json();
                if (payload?.explanation && typeof payload.explanation === 'string') {
                    explanation = payload.explanation;
                }
            }
        } catch (error) {
            // Keep local explanation when remote AI endpoint is unavailable.
        }

        setActiveWhy({ step, text: explanation });
        setIsWhyLoading(false);
    };

    return (
        <div
            style={{
                padding: '40px 24px',
                minHeight: '100vh',
                marginLeft: '260px',
                width: 'calc(100% - 260px)',
                boxSizing: 'border-box'
            }}
        >
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        style={{
                            position: 'fixed',
                            top: '100px',
                            right: '24px',
                            zIndex: 1000,
                            padding: '16px 24px',
                            borderRadius: '12px',
                            background: notification.isError
                                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                : 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontWeight: '600',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                        }}
                    >
                        {notification.isError ? <X size={20} /> : <Check size={20} />}
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    marginBottom: '32px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline'
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: '56px',
                            fontWeight: '900',
                            marginBottom: '8px',
                            color: '#f3f4f6',
                            letterSpacing: '-1px'
                        }}
                    >
                        {info.title}
                    </h1>
                    <p
                        style={{
                            fontSize: '20px',
                            color: '#9ca3af',
                            fontWeight: '500'
                        }}
                    >
                        {info.subtitle}
                    </p>
                </div>

                <button
                    onClick={() => navigate(`/reader/${type}`)}
                    style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderTop: '1px solid #34d399',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '16px',
                        transition: 'all 0.2s'
                    }}
                    className="skeuo-theory-btn"
                >
                    <Book size={20} />
                    Study Theory (Interactive Book)
                </button>
            </motion.div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 380px',
                    gap: '32px',
                    height: 'calc(100vh - 280px)'
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        background: 'rgba(17, 24, 39, 0.7)',
                        borderRadius: '24px',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.08) 0%, transparent 70%)'
                        }}
                    />

                    {renderVisualizer()}

                    <AnimatePresence>
                        {ghostSnapshot && (
                            <motion.div
                                initial={{ opacity: 0.55 }}
                                animate={{ opacity: 0.38 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    position: 'absolute',
                                    bottom: '12px',
                                    left: '12px',
                                    right: '12px',
                                    border: '1px dashed rgba(255,255,255,0.35)',
                                    background: 'rgba(15, 23, 42, 0.55)',
                                    borderRadius: '12px',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    overflowX: 'auto'
                                }}
                            >
                                <Ghost size={18} color="#d1d5db" />
                                {ghostSnapshot.data.slice(0, 14).map((item, idx) => (
                                    <div
                                        key={`ghost-${idx}`}
                                        style={{
                                            minWidth: '36px',
                                            textAlign: 'center',
                                            color: '#d1d5db',
                                            fontSize: '12px',
                                            padding: '4px 6px',
                                            borderRadius: '8px',
                                            background: 'rgba(255,255,255,0.08)'
                                        }}
                                    >
                                        {typeof item === 'object' ? item.value : item}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isXRayMode && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '16px',
                                left: '16px',
                                right: '16px',
                                maxHeight: '44%',
                                overflow: 'auto',
                                borderRadius: '14px',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                background: 'rgba(2, 6, 23, 0.78)',
                                padding: '12px',
                                backdropFilter: 'blur(6px)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#34d399' }}>
                                <Cpu size={16} />
                                <strong>{memoryModel.heading}</strong>
                            </div>
                            <p style={{ color: '#cbd5e1', fontSize: '12px', marginTop: 0 }}>{memoryModel.summary}</p>
                            <div style={{ display: 'grid', gap: '6px' }}>
                                {memoryModel.cells.slice(0, 14).map((cell) => (
                                    <div
                                        key={`mem-${cell.slot}-${cell.address}`}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '54px 1fr 84px 72px',
                                            gap: '10px',
                                            fontSize: '11px',
                                            color: '#e2e8f0',
                                            background: 'rgba(15, 23, 42, 0.7)',
                                            borderRadius: '8px',
                                            padding: '6px 8px'
                                        }}
                                    >
                                        <span>#{cell.slot}</span>
                                        <span>{String(cell.value)}</span>
                                        <span>{cell.address}</span>
                                        <span>L{cell.cacheLine}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        background: 'rgba(17, 24, 39, 0.7)',
                        borderRadius: '24px',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '18px',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <h3
                        style={{
                            fontSize: '24px',
                            fontWeight: '800',
                            marginBottom: '0',
                            color: '#f3f4f6'
                        }}
                    >
                        Controls
                    </h3>

                    <div style={{ display: 'grid', gap: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#d1d5db', fontSize: '13px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <BrainCircuit size={15} /> X-Ray Mode
                            </span>
                            <input type="checkbox" checked={isXRayMode} onChange={(e) => setIsXRayMode(e.target.checked)} />
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#d1d5db', fontSize: '13px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <Info size={15} /> Explain Level
                            </span>
                            <select
                                value={explainLevel}
                                onChange={(e) => setExplainLevel(e.target.value)}
                                style={{
                                    background: 'rgba(2, 6, 23, 0.8)',
                                    color: '#f8fafc',
                                    border: '1px solid rgba(148, 163, 184, 0.3)',
                                    borderRadius: '8px',
                                    padding: '4px 8px'
                                }}
                            >
                                <option value="beginner">Beginner</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </label>
                    </div>

                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                marginBottom: '8px',
                                color: '#9ca3af',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}
                        >
                            Input Value
                        </label>
                        <input
                            type="number"
                            placeholder="Enter number..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleInsert()}
                            disabled={isSearching}
                            style={{
                                width: '100%',
                                padding: '14px 18px',
                                borderRadius: '12px',
                                border: '2px solid rgba(16, 185, 129, 0.3)',
                                background: 'rgba(0, 0, 0, 0.3)',
                                color: '#f3f4f6',
                                fontSize: '16px',
                                fontWeight: '600',
                                outline: 'none',
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                            onClick={handleInsert}
                            disabled={isSearching}
                            style={{
                                padding: '14px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(90deg, #10b981, #22c55e)',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: isSearching ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                opacity: isSearching ? 0.6 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            <Plus size={24} /> Insert
                        </button>

                        <button
                            onClick={handleDelete}
                            disabled={isSearching}
                            style={{
                                padding: '14px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: isSearching ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                opacity: isSearching ? 0.6 : 1
                            }}
                        >
                            <Trash2 size={20} /> Delete
                        </button>

                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            style={{
                                padding: '14px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: isSearching ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)',
                                color: '#fbbf24',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: isSearching ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                        >
                            <Search size={20} />
                            {isSearching ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handleShuffle}
                            disabled={isSearching}
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                border: 'none',
                                background: 'transparent',
                                color: '#9ca3af',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: isSearching ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <Shuffle size={16} /> Shuffle
                        </button>

                        <button
                            onClick={handleReset}
                            disabled={isSearching}
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                border: 'none',
                                background: 'transparent',
                                color: '#9ca3af',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: isSearching ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <RotateCcw size={16} /> Reset
                        </button>
                    </div>

                    <div
                        style={{
                            borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                            paddingTop: '12px',
                            display: 'grid',
                            gap: '8px'
                        }}
                    >
                        <div style={{ color: '#f3f4f6', fontWeight: 700, fontSize: '14px' }}>Step Timeline</div>

                        <div style={{ display: 'grid', gap: '8px', maxHeight: '210px', overflow: 'auto', paddingRight: '3px' }}>
                            {steps.length === 0 && <div style={{ color: '#9ca3af', fontSize: '13px' }}>Run an operation to see why-steps.</div>}
                            {steps.map((step) => (
                                <div
                                    key={step.id}
                                    style={{
                                        background: 'rgba(15, 23, 42, 0.7)',
                                        border: '1px solid rgba(148, 163, 184, 0.2)',
                                        borderRadius: '10px',
                                        padding: '8px 10px',
                                        color: '#e2e8f0',
                                        fontSize: '12px',
                                        display: 'grid',
                                        gap: '6px'
                                    }}
                                >
                                    <span>{step.label}</span>
                                    <button
                                        onClick={() => handleWhyClick(step)}
                                        style={{
                                            justifySelf: 'start',
                                            border: '1px solid rgba(52, 211, 153, 0.4)',
                                            background: 'rgba(16, 185, 129, 0.16)',
                                            color: '#86efac',
                                            fontSize: '11px',
                                            borderRadius: '999px',
                                            padding: '4px 9px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Why?
                                    </button>
                                </div>
                            ))}
                        </div>

                        {isWhyLoading && <div style={{ color: '#93c5fd', fontSize: '12px' }}>Generating explanation...</div>}

                        {activeWhy && (
                            <div
                                style={{
                                    marginTop: '6px',
                                    border: '1px solid rgba(56, 189, 248, 0.35)',
                                    background: 'rgba(2, 132, 199, 0.14)',
                                    color: '#e0f2fe',
                                    borderRadius: '10px',
                                    padding: '10px',
                                    fontSize: '12px'
                                }}
                            >
                                <strong style={{ display: 'block', marginBottom: '4px' }}>{activeWhy.step.label}</strong>
                                {activeWhy.text}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default VisualizerPage;
