'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { ContactShadows, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import * as Tone from 'tone';
import { GestureState } from '@/hooks/useHandGesture';

// --- Types ---
export interface SongNote {
    note: string;
    label: string;
}

export interface Song {
    id: string;
    title: string;
    notes: SongNote[];
    color?: string; // For UI matching if needed
}

const NOTE_COLORS: Record<string, string> = {
    'C4': '#FF0000', 'D4': '#FF7F00', 'E4': '#FFFF00', 'F4': '#00FF00',
    'G4': '#87CEEB', 'A4': '#0000FF', 'B4': '#9400D3', 'C5': '#FF1493'
};

interface PitchBellSceneProps {
    gesture: GestureState;
    handX: number;
    handY: number;
    isTracking: boolean;
    song: Song;
    isPlaying: boolean;
}

// --- Components ---

function HandCursor({ position }: { position: THREE.Vector3 }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.position.lerp(position, 0.2);
        }
    });

    return (
        <mesh ref={meshRef}>
            <coneGeometry args={[0.2, 0.5, 32]} />
            <meshStandardMaterial color="gold" metalness={1} roughness={0.2} />
        </mesh>
    );
}

function Burst({ position, color }: { position: [number, number, number], color: string }) {
    const group = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (group.current) {
            group.current.children.forEach((child: any) => {
                child.position.add(child.userData.velocity);
                if (child.material) {
                    child.material.opacity -= delta * 2;
                }
                child.scale.multiplyScalar(0.9);
            });
        }
    });

    return (
        <group ref={group} position={position}>
            {Array.from({ length: 8 }).map((_, i) => (
                <mesh key={i} userData={{
                    velocity: new THREE.Vector3(
                        (Math.random() - 0.5) * 0.2,
                        (Math.random() - 0.5) * 0.2,
                        (Math.random() - 0.5) * 0.2
                    )
                }}>
                    <sphereGeometry args={[0.1, 8, 8]} />
                    <meshBasicMaterial color={color} transparent opacity={1} />
                </mesh>
            ))}
        </group>
    );
}

function SequentialBubble({
    note,
    label,
    color,
    x,
    y,
    handPosition,
    onPop
}: {
    note: string;
    label: string;
    color: string;
    x: number;
    y: number;
    handPosition: THREE.Vector3;
    onPop: () => void;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const hasPopped = useRef(false);

    useFrame(() => {
        if (!groupRef.current || hasPopped.current) return;

        // Update position
        groupRef.current.position.set(x, y, 0);

        // Gentle wobble (add to position)
        groupRef.current.position.x += Math.sin(y * 2) * 0.1;
        groupRef.current.position.y += Math.cos(x * 2) * 0.1;

        // Check collision
        if (groupRef.current.position.distanceTo(handPosition) < 0.8) {
            hasPopped.current = true;
            onPop();
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
            <group ref={groupRef} position={[x, y, 0]}>
                {/* Outer Shell */}
                <mesh scale={1}>
                    <sphereGeometry args={[0.8, 64, 64]} />
                    <meshPhysicalMaterial
                        color={color}
                        metalness={0.1}
                        roughness={0}
                        transmission={0.95}
                        thickness={0.1}
                        ior={1.33}
                        clearcoat={1}
                        transparent
                        opacity={0.4}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* Rim Glow */}
                <mesh scale={0.82}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.BackSide} />
                </mesh>

                {/* Highlights */}
                <mesh position={[0.25, 0.3, 0.55]} scale={0.15}>
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshBasicMaterial color="white" transparent opacity={0.8} />
                </mesh>
                <mesh position={[-0.18, -0.25, 0.5]} scale={0.08}>
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshBasicMaterial color="white" transparent opacity={0.5} />
                </mesh>

                {/* Label */}
                <Text
                    position={[0, 0, 0.9]}
                    fontSize={0.35}
                    color={color}
                    anchorX="center"
                    anchorY="middle"
                    fontWeight="bold"
                    outlineWidth={0.02}
                    outlineColor="white"
                >
                    {label}
                </Text>
            </group>
        </Float>
    );
}

function FreeModeBubble({
    note,
    label,
    color,
    x,
    y,
    handPosition,
    onPop,
    isPlaying
}: {
    note: string;
    label: string;
    color: string;
    x: number;
    y: number;
    handPosition: THREE.Vector3;
    onPop: () => void;
    isPlaying: boolean;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const lastPopTime = useRef(0);
    const [scale, setScale] = useState(1);

    useFrame((state) => {
        if (!groupRef.current) return;

        // Bobbing animation
        const t = state.clock.getElapsedTime();
        groupRef.current.position.y = y + Math.sin(t * 2 + x) * 0.2;

        // Recovery animation
        if (scale < 1) {
            setScale(prev => Math.min(prev + 0.05, 1));
        }
        groupRef.current.scale.setScalar(scale);

        // Check collision (only if playing)
        if (isPlaying && groupRef.current.position.distanceTo(handPosition) < 0.8) {
            const now = Date.now();
            if (now - lastPopTime.current > 500) { // 500ms debounce
                lastPopTime.current = now;
                setScale(0.8); // Pop effect
                onPop();
            }
        }
    });

    return (
        <group ref={groupRef} position={[x, y, 0]}>
            {/* Outer Shell */}
            <mesh scale={1}>
                <sphereGeometry args={[0.8, 64, 64]} />
                <meshPhysicalMaterial
                    color={color}
                    metalness={0.1}
                    roughness={0}
                    transmission={0.95}
                    thickness={0.1}
                    ior={1.33}
                    clearcoat={1}
                    transparent
                    opacity={0.4}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Rim Glow */}
            <mesh scale={0.82}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.BackSide} />
            </mesh>

            {/* Highlights */}
            <mesh position={[0.25, 0.3, 0.55]} scale={0.15}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial color="white" transparent opacity={0.8} />
            </mesh>
            <mesh position={[-0.18, -0.25, 0.5]} scale={0.08}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial color="white" transparent opacity={0.5} />
            </mesh>

            {/* Label */}
            <Text
                position={[0, 0, 0.9]}
                fontSize={0.35}
                color={color}
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
                outlineWidth={0.02}
                outlineColor="white"
            >
                {label}
            </Text>
        </group>
    );
}

function SceneContent({ gesture, handX, handY, isTracking, song, isPlaying }: PitchBellSceneProps) {
    const [synth, setSynth] = useState<Tone.PolySynth | null>(null);
    const audioInitialized = useRef(false);
    const [currentNoteIndex, setCurrentNoteIndex] = useState(0);

    // [startX, startY, endX, endY]
    const [bubbleStartEnd, setBubbleStartEnd] = useState<[number, number, number, number]>([0, -6, 0, 6]);
    const [bubbleProgress, setBubbleProgress] = useState(0);
    const [bursts, setBursts] = useState<{ id: number, position: [number, number, number], color: string }[]>([]);

    const handPosition = useMemo(() => new THREE.Vector3(0, -10, 0), []);
    const currentNote = song.notes[currentNoteIndex];
    const bubbleColor = NOTE_COLORS[currentNote?.note] || '#FFFFFF';

    // Reset when song changes
    useEffect(() => {
        setCurrentNoteIndex(0);
        setBubbleProgress(0);
    }, [song.id]);

    // Generate random position
    const getRandomPosition = () => {
        const side = Math.floor(Math.random() * 4); // 0: Bottom, 1: Top, 2: Left, 3: Right
        let startX = 0, startY = 0, endX = 0, endY = 0;

        // Visible range approx: X[-8, 8], Y[-4.5, 4.5]
        switch (side) {
            case 0: // Bottom -> Top
                startX = (Math.random() - 0.5) * 14; // Range [-7, 7]
                startY = -6;
                endX = startX + (Math.random() - 0.5) * 4;
                endY = 6;
                break;
            case 1: // Top -> Bottom
                startX = (Math.random() - 0.5) * 14; // Range [-7, 7]
                startY = 6;
                endX = startX + (Math.random() - 0.5) * 4;
                endY = -6;
                break;
            case 2: // Left -> Right
                startX = -10;
                startY = (Math.random() - 0.5) * 8; // Range [-4, 4]
                endX = 10;
                endY = startY + (Math.random() - 0.5) * 4;
                break;
            case 3: // Right -> Left
                startX = 10;
                startY = (Math.random() - 0.5) * 8; // Range [-4, 4]
                endX = -10;
                endY = startY + (Math.random() - 0.5) * 4;
                break;
        }
        return [startX, startY, endX, endY];
    };

    // Reset when song changes
    useEffect(() => {
        setCurrentNoteIndex(0);
        setBubbleProgress(0);
        // @ts-ignore
        setBubbleStartEnd(getRandomPosition());
    }, [song.id]);

    // Initialize Audio
    useEffect(() => {
        if (!audioInitialized.current) {
            const newSynth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "fmsine", modulationType: "square", modulationIndex: 3, harmonicity: 3.4 },
                envelope: { attack: 0.001, decay: 0.1, sustain: 0.1, release: 1.2 }
            }).toDestination();
            newSynth.volume.value = -5;

            const reverb = new Tone.Reverb({ decay: 3, wet: 0.5 }).toDestination();
            newSynth.connect(reverb);

            setSynth(newSynth);
            audioInitialized.current = true;
        }
        return () => { if (synth) synth.dispose(); };
    }, []);

    // Bubble Movement
    useFrame((state, delta) => {
        if (isTracking && isPlaying && currentNote) {
            setBubbleProgress(prev => {
                const next = prev + delta * 0.15; // Speed
                return next > 1.2 ? 0 : next;
            });
        }

        // Update Hand Position
        if (isTracking) {
            const x = (handX - 0.5) * 30; // High sensitivity (-15 to 15) for easy reach
            const y = (0.5 - handY) * 14; // Wider Y range (-7 to 7)
            handPosition.set(x, y, 0);
        } else {
            handPosition.set(0, -10, 0);
        }
    });

    const handlePop = () => {
        if (!currentNote) return;

        // Play sound
        if (synth && Tone.context.state === 'running') {
            synth.triggerAttackRelease(currentNote.note, "8n");
        }

        // Spawn burst effect
        setBursts(prev => [...prev.slice(-5), {
            id: Date.now(),
            position: [handPosition.x, handPosition.y, 0],
            color: bubbleColor
        }]);

        // Advance to next note AND reset position atomically
        setCurrentNoteIndex(prev => {
            const next = prev + 1;
            return next >= song.notes.length ? 0 : next;
        });

        // Immediate reset for next bubble to prevent ghost touch
        setBubbleProgress(0);
        // @ts-ignore
        setBubbleStartEnd(getRandomPosition());
        // bubbleStartEnd updates via effect
    };

    // Auto-start audio
    useEffect(() => {
        const startAudio = async () => { if (Tone.context.state !== 'running') await Tone.start(); };
        window.addEventListener('click', startAudio);
        if (isTracking) startAudio();
        return () => window.removeEventListener('click', startAudio);
    }, [isTracking]);

    return (
        <>
            <color attach="background" args={['#FAFAF9']} />
            <ambientLight intensity={1.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={1} color="purple" />

            {/* Hand Cursor (Only show when game starts) */}
            {isTracking && isPlaying && <HandCursor position={handPosition} />}

            {/* Current Note Indicator & Song Info */}
            {isTracking && (
                <group position={[0, 4.5, 0]}>
                    {/* Song Title */}
                    <Text
                        position={[0, 0.8, 0]}
                        fontSize={0.4}
                        color="#4B4036"
                        anchorX="center"
                        anchorY="middle"
                    >
                        ♫ {song.title}
                    </Text>

                    {/* Progress Bar (Dots) */}
                    <group position={[0, 0, 0]}>
                        {song.notes.map((n, i) => (
                            <mesh key={i} position={[(i - song.notes.length / 2) * 0.3, 0, 0]}>
                                <sphereGeometry args={[0.1, 16, 16]} />
                                <meshBasicMaterial
                                    color={i < currentNoteIndex ? NOTE_COLORS[n.note] : '#ccc'}
                                    transparent
                                    opacity={i === currentNoteIndex ? 1 : 0.5}
                                />
                                {i === currentNoteIndex && (
                                    <pointLight distance={1} intensity={2} color={NOTE_COLORS[n.note]} />
                                )}
                            </mesh>
                        ))}
                    </group>
                </group>
            )}

            {/* Single Bubble */}
            {/* Single Bubble (Sequential Mode) */}
            {isTracking && isPlaying && song.id !== 'free_mode' && currentNote && (
                <SequentialBubble
                    key={currentNoteIndex} // Reset state for new note
                    note={currentNote.note}
                    label={currentNote.label}
                    color={bubbleColor}
                    x={THREE.MathUtils.lerp(bubbleStartEnd[0], bubbleStartEnd[2], bubbleProgress)}
                    y={THREE.MathUtils.lerp(bubbleStartEnd[1], bubbleStartEnd[3], bubbleProgress)}
                    handPosition={handPosition}
                    onPop={handlePop}
                />
            )}

            {/* Free Mode Bubbles (Always visible when Free Mode is selected) */}
            {song.id === 'free_mode' && (
                <group>
                    {song.notes.map((n, i) => (
                        <FreeModeBubble
                            key={n.note}
                            note={n.note}
                            label={n.label}
                            color={NOTE_COLORS[n.note]}
                            x={-6 + (i * 2)} // Tighter: -6 to +6
                            y={Math.sin(i) * 1.5} // Slightly lower wave
                            handPosition={handPosition}
                            isPlaying={isTracking && isPlaying} // Only allow pop when tracking and playing
                            onPop={() => {
                                if (synth && Tone.context.state === 'running') {
                                    synth.triggerAttackRelease(n.note, "8n");
                                }
                                setBursts(prev => [...prev.slice(-5), {
                                    id: Date.now(),
                                    position: [-6 + (i * 2), Math.sin(i) * 1.5, 0],
                                    color: NOTE_COLORS[n.note]
                                }]);
                            }}
                        />
                    ))}
                </group>
            )}

            {/* Bursts */}
            {bursts.map(b => (
                <Burst key={b.id} position={b.position} color={b.color} />
            ))}
        </>
    );
}

export default function PitchBellScene(props: PitchBellSceneProps) {
    return (
        <div className="w-full h-full">
            <Canvas
                shadows
                camera={{ position: [0, 0, 10], fov: 50 }}
                dpr={[1, 2]}
            >
                <Suspense fallback={null}>
                    <SceneContent {...props} />
                    <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={20} blur={2.5} far={4} />
                </Suspense>
            </Canvas>
        </div>
    );
}
