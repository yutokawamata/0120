import React, { useEffect, useState } from 'react';

const trainingContainerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    width: "100%",
    maxWidth: "1000px",
    marginTop: "100px"
};

const kanjiDisplayStyle = {
    fontSize: "180px",
    cursor: "pointer",
    userSelect: "none",  // テキスト選択を防ぐ
};

const progressStyle = {
    fontSize: "18px",
    color: "#666",
};

const imageStyle = {
    maxWidth: "80%",
    height: "auto",
    opacity: 0,
    transition: "opacity 0.5s ease-in-out",
};

const imageVisibleStyle = {
    ...imageStyle,
    opacity: 1,
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
    const [showKanji, setShowKanji] = useState(false);  // 漢字表示の制御用
    const [nextAudio, setNextAudio] = useState(null);   // 次の音声データを保持

    // 音声データの準備
    const prepareAudio = async (yomigana) => {
        try {
            const audioUrl = `https://deprecatedapis.tts.quest/v2/voicevox/audio/?text=${encodeURIComponent(yomigana)}&speaker=14&key=Y-19B-r0D4q5f20&speed=1.0&pitch=0&intonationScale=1`;
            const response = await fetch(audioUrl);
            if (!response.ok) {
                throw new Error(`音声データの取得に失敗: ${response.status}`);
            }
            const audioBlob = await response.blob();
            return new Audio(URL.createObjectURL(audioBlob));
        } catch (error) {
            return null;
        }
    };

    // 次の音声を準備
    const prepareNextAudio = async () => {
        if (state.currentKanjiIndex < remainingKanji.length - 1) {
            const nextKanjiIndex = remainingKanji[state.currentKanjiIndex + 1];
            const nextKanji = state.kanjiList[nextKanjiIndex];
            const audio = await prepareAudio(nextKanji.yomigana);
            setNextAudio(audio);
        }
    };

    // 音声再生処理
    const playAudio = async (audio) => {
        if (!audio) return Promise.resolve();
        
        return new Promise((resolve) => {
            audio.onplay = () => {
                setIsPlaying(true);
                setShowImage(false);
            };

            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(audio.src);
                setTimeout(() => {
                    setShowImage(true);
                    resolve();
                }, 1500);
            };

            audio.onerror = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(audio.src);
                resolve();
            };

            audio.play().catch(() => {
                setIsPlaying(false);
                URL.revokeObjectURL(audio.src);
                resolve();
            });
        });
    };

    // 初期化処理
    useEffect(() => {
        if (state.selectedKanji[state.selectedLevel]?.length > 0) {
            const shuffled = [...state.selectedKanji[state.selectedLevel]].sort(() => Math.random() - 0.5);
            setRemainingKanji(shuffled);
            setShowKanji(false);
            updateKanji({ currentKanjiIndex: 0 });

            // 最初の漢字の音声を事前に準備
            const prepareFirstAudio = async () => {
                const firstKanji = state.kanjiList[shuffled[0]];
                const audio = await prepareAudio(firstKanji.yomigana);
                setNextAudio(audio);
            };
            prepareFirstAudio();
        }
    }, [state.remainingRepetitions]);

    // 漢字表示の更新処理
    useEffect(() => {
        if (!remainingKanji.length || state.currentKanjiIndex === undefined) return;

        const current = state.kanjiList[remainingKanji[state.currentKanjiIndex]];
        setCurrentKanji(current);
        setShowImage(false);
        setHasPlayedAudio(false);

        const initializeKanji = async () => {
            if (state.selectedOption === "remember") {
                // 次の音声がすでに準備されている場合
                if (nextAudio) {
                    setShowKanji(true);  // 音声が準備済みなのですぐに表示
                    await playAudio(nextAudio);
                    setHasPlayedAudio(true);
                    setNextAudio(null);
                } else {
                    // 音声が準備されていない場合（主に1文字目）
                    setShowKanji(false);
                    const audioToPlay = await prepareAudio(current.yomigana);
                    if (audioToPlay) {
                        setTimeout(() => setShowKanji(true), 500);
                        await playAudio(audioToPlay);
                        setHasPlayedAudio(true);
                    } else {
                        setShowKanji(true);  // 音声生成に失敗した場合でも漢字は表示
                    }
                }

                // 次の音声を準備
                prepareNextAudio();
            } else {
                setShowKanji(true);
            }
        };

        initializeKanji();
    }, [state.currentKanjiIndex, remainingKanji]);

    // 自動進行処理
    useEffect(() => {
        let timer;
        if (state.selectedOption === "remember" && showImage && hasPlayedAudio) {
            timer = setTimeout(handleMemorizingNext, 3500);
        }
        return () => timer && clearTimeout(timer);
    }, [showImage, hasPlayedAudio]);

    // 次の漢字への移動処理
    const handleMemorizingNext = () => {
        setShowImage(false);
        if (state.currentKanjiIndex >= remainingKanji.length - 1) {
            if (state.remainingRepetitions > 1) {
                updateRepetition({ remainingRepetitions: state.remainingRepetitions - 1 });
            } else {
                updateKanji({ isTraining: "complete", currentKanjiIndex: 0 });
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
                // シャッフルして再度開始
                const shuffled = [...remainingKanji].sort(() => Math.random() - 0.5);
                setRemainingKanji(shuffled);
                updateKanji({ currentKanjiIndex: 0 });
                updateRepetition({ remainingRepetitions: state.remainingRepetitions - 1 });
            } else {
                updateKanji({ isTraining: "initial", currentKanjiIndex: 0 });
                updateRepetition({ repetitionCount: "initial" });
                updateNavigation({ selectedLevel: "initial", selectedOption: "initial", selectNext: false });
            }
        }
    };

    // キーボードイベントの処理
    useEffect(() => {
        if (state.selectedOption === "read") {
            const handleKeyPress = (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();  // デフォルトの動作を防止
                    handleReadingNext();
                }
            };
            window.addEventListener("keydown", handleKeyPress);
            return () => window.removeEventListener("keydown", handleKeyPress);
        }
    }, [state.selectedOption, state.currentKanjiIndex, remainingKanji, state.remainingRepetitions]);

    return (
        <div style={trainingContainerStyle}>
            {state.selectedOption === "read" ? (
                <div style={kanjiDisplayStyle} onClick={handleReadingNext}>
                    {showKanji && currentKanji?.kanji}
                </div>
            ) : (
                <>
                    {!showImage ? (
                        <div style={kanjiDisplayStyle}>
                            {showKanji && currentKanji?.kanji}
                        </div>
                    ) : (
                        currentKanji?.illust && <img 
                            src={currentKanji.illust.default || currentKanji.illust} 
                            alt={`${currentKanji?.kanji}のイラスト`}
                            style={imageVisibleStyle}
                            onLoad={() => setShowImage(true)}
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    )}
                </>
            )}
        </div>
    );
};