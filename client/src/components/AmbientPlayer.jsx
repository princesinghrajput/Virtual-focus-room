import { useState, useRef, useEffect } from 'react';
import {
    HiPlay,
    HiPause,
    HiSpeakerWave,
    HiSpeakerXMark,
    HiXMark,
    HiMusicalNote,
    HiCloud,
    HiFire,
    HiSparkles
} from 'react-icons/hi2';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const SOUNDS = [
    {
        id: 'rain',
        name: 'Soft Rain',
        icon: HiCloud,
        url: 'https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3'
    },
    {
        id: 'lofi',
        name: 'Lo-Fi Chill',
        icon: HiMusicalNote,
        url: 'https://assets.mixkit.co/active_storage/sfx/2487/2487-preview.mp3'
    },
    {
        id: 'cafe',
        name: 'Coffee Shop',
        icon: HiSparkles,
        url: 'https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3'
    },
    {
        id: 'fire',
        name: 'Fireplace',
        icon: HiFire,
        url: 'https://assets.mixkit.co/active_storage/sfx/2392/2392-preview.mp3'
    }
];

export default function AmbientPlayer({ isOpen, onClose }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSound, setCurrentSound] = useState(SOUNDS[0]);
    const [volume, setVolume] = useState(0.5);
    const audioRef = useRef(null);
    const playerRef = useRef(null);

    useEffect(() => {
        // Initialize audio instance only on client side
        audioRef.current = new Audio(SOUNDS[0].url);
        audioRef.current.loop = true;
        audioRef.current.volume = volume;

        // Cleanup
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && playerRef.current && !playerRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Handle sound change
    useEffect(() => {
        if (!audioRef.current) return;
        const wasPlaying = isPlaying;
        audioRef.current.pause();
        audioRef.current.src = currentSound.url;
        audioRef.current.volume = volume;
        if (wasPlaying) {
            audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
        }
    }, [currentSound]);

    // Handle volume change
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Handle play/pause
    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className={isOpen ? 'block' : 'hidden'} ref={playerRef}>
            <Card className="w-80 h-auto fixed right-4 bottom-20 z-40 border shadow-2xl bg-card/95 backdrop-blur animate-in slide-in-from-bottom-5">
                <CardHeader className="flex flex-row items-center justify-between py-4 border-b">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <HiMusicalNote className="w-5 h-5 text-indigo-500" />
                        Focus Sounds
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                        <HiXMark className="w-5 h-5" />
                    </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-6">
                    {/* Now Playing */}
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mb-3">
                            <currentSound.icon className={`w-8 h-8 text-indigo-500 ${isPlaying ? 'animate-pulse' : ''}`} />
                        </div>
                        <h3 className="font-medium">{currentSound.name}</h3>
                        <p className="text-xs text-muted-foreground">{isPlaying ? 'Playing' : 'Paused'}</p>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 rounded-full border-2"
                                onClick={togglePlay}
                            >
                                {isPlaying ? <HiPause className="w-6 h-6" /> : <HiPlay className="w-6 h-6 pl-1" />}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <HiSpeakerXMark className="w-4 h-4" />
                                <HiSpeakerWave className="w-4 h-4" />
                            </div>
                            <Slider
                                value={[volume * 100]}
                                max={100}
                                step={1}
                                onValueChange={(val) => setVolume(val[0] / 100)}
                                className="cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Sound Selection */}
                    <div className="grid grid-cols-4 gap-2">
                        {SOUNDS.map(sound => (
                            <button
                                key={sound.id}
                                onClick={() => setCurrentSound(sound)}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${currentSound.id === sound.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500' : 'hover:bg-muted'}`}
                            >
                                <sound.icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium">{sound.name.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
