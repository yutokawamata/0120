import React, { useEffect, useState } from 'react';
import { StateCheckers, StateTransitions, KanjiHelpers } from '../utils/stateManager';
import styles from '../styles/components/Training.module.css';

// ランダムな位置を生成する関数
const getRandomPosition = () => {
    return {
        x: Math.random() * 60 + 20,
        y: Math.random() * 60 + 20
    };
};

/**
 * 漢字学習のトレーニングを行うコンポーネント
 * @param {Object} props
 * @param {Object} props.state - アプリケーションの状態
 * @param {Function} props.updateNavigation - ナビゲーション状態を更新する関数
 * @param {Function} props.updateKanji - 漢字学習状態を更新する関数
 * @param {Function} props.updateRepetition - 反復学習状態を更新する関数
 */
export const Training = ({
    state,
    updateNavigation,
    updateKanji,
    updateRepetition
}) => {
    // 基本的な状態管理
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentKanji, setCurrentKanji] = useState(null);
    const [showImage, setShowImage] = useState(false);
    const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
    const [remainingKanji, setRemainingKanji] = useState([]);
    const [showKanji, setShowKanji] = useState(false);
    const [nextAudio, setNextAudio] = useState(null);
    const [showBlackScreen, setShowBlackScreen] = useState(false);
    const [currentAudio, setCurrentAudio] = useState(null);

    // 個人モード用のstate
    const [kanjiPosition, setKanjiPosition] = useState({ x: 50, y: 50 });
    const [isKanjiClicked, setIsKanjiClicked] = useState(false);

    const updateFunctions = {
        updateNavigation,
        updateKanji,
        updateRepetition
    };

    // 音声データの準備
    const prepareAudio = async (voiceFile) => {
        try {
            if (!voiceFile) {
                console.warn('音声ファイルが設定されていません');
                return null;
            }

            const audioSrc = voiceFile.default || voiceFile;
            const audio = new Audio(audioSrc);
            
            audio.preload = "auto";
            audio.playsinline = true;
            
            await new Promise((resolve, reject) => {
                audio.addEventListener('loadeddata', resolve);
                audio.addEventListener('error', reject);
            });

            return audio;
        } catch (error) {
            console.error('音声データの準備中にエラーが発生:', error);
            return null;
        }
    };

    // 音声再生処理
    const playAudio = async (audio) => {
        if (!audio) return Promise.resolve();
        
        return new Promise((resolve) => {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }

            const cleanup = () => {
                setIsPlaying(false);
                resolve();
            };
            
            setCurrentAudio(audio);
            
            audio.onplay = () => {
                setIsPlaying(true);
                setShowImage(false);
                setShowKanji(true);
            };

            audio.onended = () => {
                cleanup();
                setTimeout(() => setShowImage(true), 800);
            };

            audio.onerror = () => {
                cleanup();
                setTimeout(() => setShowImage(true), 800);
            };

            const attemptPlay = async () => {
                try {
                    await audio.play();
                } catch (error) {
                    console.error('音声再生エラー:', error);
                    cleanup();
                    setTimeout(() => setShowImage(true), 800);
                }
            };

            attemptPlay();
        });
    };

    // 初期化処理
    useEffect(() => {
        let isMounted = true;

        const initializeTraining = async () => {
            if (state.selectedKanji[state.selectedLevel]?.length > 0) {
                const shuffled = [...state.selectedKanji[state.selectedLevel]]
                    .sort(() => Math.random() - 0.5);
                
                if (isMounted) {
                    setRemainingKanji(shuffled);
                    setShowKanji(false);
                    updateKanji({ currentKanjiIndex: 0 });
                }

                const firstKanji = state.kanjiList[shuffled[0]];
                if (firstKanji?.voice) {
                    const audio = await prepareAudio(firstKanji.voice);
                    if (isMounted && audio) {
                        setNextAudio(audio);
                    }
                }
            }
        };

        initializeTraining();
        return () => {
            isMounted = false;
        };
    }, [state.remainingRepetitions, state.isTraining]);

    // 次の音声を準備
    const prepareNextAudio = async () => {
        if (state.currentKanjiIndex < remainingKanji.length - 1) {
            try {
                const nextKanjiIndex = remainingKanji[state.currentKanjiIndex + 1];
                const nextKanji = state.kanjiList[nextKanjiIndex];
                if (nextKanji?.voice) {
                    const audio = await prepareAudio(nextKanji.voice);
                    setNextAudio(audio);
                }
            } catch (error) {
                console.error('次の音声の準備中にエラーが発生:', error);
                setNextAudio(null);
            }
        }
    };

    // 個人モードでの漢字クリック処理
    const handleKanjiClick = async () => {
        if (state.mode === "individual" && !isKanjiClicked && !isPlaying) {
            setIsKanjiClicked(true);
            try {
                const audioToPlay = await prepareAudio(currentKanji.voice);
                if (audioToPlay) {
                    await playAudio(audioToPlay);
                    setHasPlayedAudio(true);
                } else {
                    setTimeout(() => {
                        setShowImage(true);
                        setHasPlayedAudio(true);
                    }, 800);
                }
            } catch (error) {
                setTimeout(() => {
                    setShowImage(true);
                    setHasPlayedAudio(true);
                }, 800);
            }
        }
    };

    // 漢字表示の更新処理
    useEffect(() => {
        if (!remainingKanji.length || state.currentKanjiIndex === undefined) return;

        const current = state.kanjiList[remainingKanji[state.currentKanjiIndex]];
        setCurrentKanji(current);
        setShowImage(false);
        setHasPlayedAudio(false);
        setIsKanjiClicked(false);

        if (state.mode === "individual") {
            setKanjiPosition(getRandomPosition());
            setShowKanji(true);
        } else {
            setShowKanji(false);
        }

        const initializeKanji = async () => {
            if (state.selectedOption === "remember") {
                if (state.mode === "group") {
                    if (nextAudio) {
                        if (state.currentKanjiIndex === 0) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                        await playAudio(nextAudio);
                        setHasPlayedAudio(true);
                        setNextAudio(null);
                    } else {
                        const audioToPlay = await prepareAudio(current.voice);
                        if (audioToPlay) {
                            if (state.currentKanjiIndex === 0) {
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                            await playAudio(audioToPlay);
                            setHasPlayedAudio(true);
                        } else {
                            setTimeout(initializeKanji, 500);
                            return;
                        }
                    }
                }
                prepareNextAudio();
            } else {
                setShowKanji(true);
            }
        };

        initializeKanji();
    }, [state.currentKanjiIndex, remainingKanji]);

    // 集団モード（自動進行処理）
    useEffect(() => {
        let timer;
        if (state.mode === "group" && state.selectedOption === "remember" && showImage && hasPlayedAudio) {
            timer = setTimeout(() => {
                setShowBlackScreen(true);
                setTimeout(() => {
                    handleMemorizingNext();
                    setShowBlackScreen(false);
                }, 500);
            }, 2000);
        }
        return () => timer && clearTimeout(timer);
    }, [showImage, hasPlayedAudio]);

    // 個人モード(画像表示後の処理)
    useEffect(() => {
        let timer;
        if (state.mode === "individual" && showImage) {
            timer = setTimeout(() => {
                setShowBlackScreen(true);
                setTimeout(() => {
                    setShowImage(false);
                    setShowKanji(true);
                    setIsKanjiClicked(false);
                    setShowBlackScreen(false);
                    if (state.currentKanjiIndex >= remainingKanji.length - 1) {
                        if (state.remainingRepetitions > 1) {
                            updateRepetition({ remainingRepetitions: state.remainingRepetitions - 1 });
                        } else {
                            StateTransitions.COMPLETE_TRAINING(updateFunctions);
                        }
                    } else {
                        updateKanji({ currentKanjiIndex: state.currentKanjiIndex + 1 });
                    }
                }, 500);
            }, 2000);
        }
        return () => timer && clearTimeout(timer);
    }, [showImage]);

    // 次の漢字への移動処理
    const handleMemorizingNext = () => {
        setShowImage(false);
        if (state.currentKanjiIndex >= remainingKanji.length - 1) {
            if (state.remainingRepetitions > 1) {
                updateRepetition({ remainingRepetitions: state.remainingRepetitions - 1 });
            } else {
                StateTransitions.COMPLETE_TRAINING(updateFunctions);
            }
        } else {
            updateKanji({ currentKanjiIndex: state.currentKanjiIndex + 1 });
        }
    };

    // 読み方確認モードの処理
    const handleReadingNext = () => {
        if (state.currentKanjiIndex < remainingKanji.length - 1) {
            updateKanji({ currentKanjiIndex: state.currentKanjiIndex + 1 });
        } else {
            if (state.remainingRepetitions > 1) {
                const shuffled = [...remainingKanji].sort(() => Math.random() - 0.5);
                setRemainingKanji(shuffled);
                updateKanji({ currentKanjiIndex: 0 });
                updateRepetition({ remainingRepetitions: state.remainingRepetitions - 1 });
            } else {
                StateTransitions.COMPLETE_TRAINING(updateFunctions);
                if (state.confirmationCount === "initial") {
                    StateTransitions.RESET_GROUP_MODE_STATE(updateFunctions);
                }
            }
        }
    };

    // キーボードイベントの処理
    useEffect(() => {
        if (state.selectedOption === "read") {
            const handleKeyPress = (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    handleReadingNext();
                }
            };
            window.addEventListener("keydown", handleKeyPress);
            return () => window.removeEventListener("keydown", handleKeyPress);
        }
    }, [state.selectedOption, state.currentKanjiIndex, remainingKanji, state.remainingRepetitions]);

    // コンポーネントのクリーンアップ
    useEffect(() => {
        return () => {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
        };
    }, []);

    // スタイルの設定
    const containerClassName = state.mode === "group" ? styles['container--group'] : styles.container;
    const kanjiClassName = state.mode === "individual" ? styles['kanjiDisplay--individual'] : styles.kanjiDisplay;
    const imageContainerClassName = state.mode === "individual" 
        ? styles['imageContainer--individual'] 
        : state.mode === "group" 
            ? styles['imageContainer--group'] 
            : styles.imageContainer;
    const imageClassName = `${state.mode === "individual" ? styles['image--individual'] : styles['image--group']} ${showImage ? styles['image--visible'] : ''}`;

    return (
        <div className={containerClassName}>
            {showBlackScreen && <div className={`${styles.blackScreen} ${styles['blackScreen--visible']}`} />}
            {state.selectedOption === "read" ? (
                <div className={styles.kanjiDisplay} onClick={handleReadingNext}>
                    {showKanji && currentKanji?.kanji}
                </div>
            ) : (
                <>
                    {!showImage ? (
                        state.mode === "individual" ? (
                            <div 
                                className={kanjiClassName}
                                style={{
                                    left: `${kanjiPosition.x}%`,
                                    top: `${kanjiPosition.y}%`
                                }}
                                onClick={handleKanjiClick}
                            >
                                {showKanji && currentKanji?.kanji}
                            </div>
                        ) : (
                            <div className={styles.kanjiDisplay}>
                                {showKanji && currentKanji?.kanji}
                            </div>
                        )
                    ) : (
                        <div className={imageContainerClassName}>
                            {currentKanji?.illust && (
                                <img 
                                    src={currentKanji.illust.default || currentKanji.illust} 
                                    alt={`${currentKanji?.kanji}のイラスト`}
                                    className={imageClassName}
                                    onLoad={() => setShowImage(true)}
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};