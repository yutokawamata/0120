import React, { useEffect, useState } from 'react';
import { StateCheckers, StateTransitions, KanjiHelpers } from '../utils/stateManager';
import styles from '../styles/components/Training.module.css';
import { Button } from './Button';

/**
 * 固定された16箇所の位置から一つをランダムに選ぶ関数
 * 個人モードで漢字をランダムな位置に表示するために使用
 * @returns {Object} x, y座標（パーセント値）
 */
// AudioContextを使用した音声再生のためのグローバル変数
let audioContext = null;
let audioBufferCache = {};
let isAudioContextInitialized = false;

// 音声再生が可能かどうかを確認するフラグ
let isAudioEnabled = false;

// AudioContextを初期化する関数
const initAudioContext = () => {
    if (isAudioContextInitialized) return;
    
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        isAudioContextInitialized = true;
        console.log('[音声初期化] AudioContextが初期化されました');
    } catch (error) {
        console.error('[音声初期化] AudioContextの初期化に失敗しました:', error);
        // 失敗した場合はフォールバックとしてAudioオブジェクトを使用
        isAudioContextInitialized = false;
    }
};

// ユーザーインタラクションで音声再生を有効化する関数
const enableAudio = () => {
    if (isAudioEnabled) return Promise.resolve();
    
    return new Promise((resolve) => {
        // AudioContextを初期化
        initAudioContext();
        
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('[音声初期化] AudioContextが再開されました');
                isAudioEnabled = true;
                resolve();
            }).catch(error => {
                console.warn('[音声初期化] AudioContextの再開に失敗しました:', error);
                resolve();
            });
        } else {
            // 無音の短い音声を再生して音声再生を有効化（フォールバック）
            const tempAudio = new Audio();
            tempAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
            tempAudio.volume = 0.01;
            
            const playHandler = () => {
                console.log('[音声初期化] 音声再生が有効化されました');
                isAudioEnabled = true;
                tempAudio.removeEventListener('play', playHandler);
                tempAudio.removeEventListener('ended', endedHandler);
                tempAudio.removeEventListener('error', errorHandler);
                resolve();
            };
            
            const endedHandler = () => {
                tempAudio.removeEventListener('play', playHandler);
                tempAudio.removeEventListener('ended', endedHandler);
                tempAudio.removeEventListener('error', errorHandler);
                resolve();
            };
            
            const errorHandler = (error) => {
                console.warn('[音声初期化] 音声再生の有効化に失敗しました:', error);
                tempAudio.removeEventListener('play', playHandler);
                tempAudio.removeEventListener('ended', endedHandler);
                tempAudio.removeEventListener('error', errorHandler);
                // エラーが発生しても続行
                resolve();
            };
            
            tempAudio.addEventListener('play', playHandler);
            tempAudio.addEventListener('ended', endedHandler);
            tempAudio.addEventListener('error', errorHandler);
            
            // 再生を試みる
            tempAudio.play().catch(errorHandler);
        }
        
        // 5秒後にタイムアウト
        setTimeout(() => {
            if (!isAudioEnabled) {
                console.warn('[音声初期化] タイムアウトしましたが続行します');
                isAudioEnabled = true;
                resolve();
            }
        }, 5000);
    });
};

// ページ読み込み時にクリックイベントを設定
if (typeof document !== 'undefined') {
    document.addEventListener('click', () => {
        enableAudio();
    }, { once: true });
}

// 前回の位置を記憶するための変数
let lastPositionIndex = -1;

const getRandomPosition = () => {
    // 7箇所の固定座標を定義
    const positions = [
        { x: 20, y: 15 },  // 左上端
        { x: 50, y: 15 },  // 左上中
        { x: 80, y: 15 },  // 右上端

        { x: 50, y: 50 },  // 中央

        { x: 20, y: 85 },  // 左下中
        { x: 50, y: 85 },  // 右下中
        { x: 80, y: 85 }   // 右下端
    ];
    
    // 前回と異なる位置をランダムに選択
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * positions.length);
    } while (randomIndex === lastPositionIndex && positions.length > 1);
    
    // 選択した位置を記憶
    lastPositionIndex = randomIndex;
    
    return positions[randomIndex];
};

/**
 * 漢字学習のトレーニングを行うコンポーネント
 * 「おぼえよう！」モードと「よめるかな？」モードの両方に対応
 * 個人モードと集団モードの両方に対応
 * 
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
    // ======== 基本的な状態管理 ========
    const [isPlaying, setIsPlaying] = useState(false);           // 音声再生中かどうか
    const [currentKanji, setCurrentKanji] = useState(null);      // 現在表示中の漢字データ
    const [showImage, setShowImage] = useState(false);           // イラストを表示するかどうか
    const [hasPlayedAudio, setHasPlayedAudio] = useState(false); // 音声再生が完了したかどうか
    const [remainingKanji, setRemainingKanji] = useState([]);    // 残りの漢字リスト（シャッフル済み）
    const [showKanji, setShowKanji] = useState(false);           // 漢字を表示するかどうか
    const [nextAudio, setNextAudio] = useState(null);            // 次の漢字の音声データ（先読み用）
    const [showBlackScreen, setShowBlackScreen] = useState(false); // 黒画面（遷移効果用）
    const [currentAudio, setCurrentAudio] = useState(null);      // 現在再生中の音声データ
    const [isFirstPlay, setIsFirstPlay] = useState(true);        // 最初の再生かどうか（遅延用）

    // ======== 個人モード用のstate ========
    const [kanjiPosition, setKanjiPosition] = useState({ x: 50, y: 50 }); // 漢字の表示位置
    const [isKanjiClicked, setIsKanjiClicked] = useState(false);          // 漢字がクリックされたかどうか

    // 更新関数をまとめたオブジェクト（状態遷移関数に渡すため）
    const updateFunctions = {
        updateNavigation,
        updateKanji,
        updateRepetition
    };

    /**
     * 音声データの準備
     * 音声ファイルを読み込み、再生可能な状態にする
     * 
     * @param {Object} voiceFile - 音声ファイルのパス
     * @returns {Promise<string|null>} 準備完了した音声ファイルのパスまたはnull
     */
    const prepareAudio = async (voiceFile) => {
        try {
            if (!voiceFile) {
                console.warn('[音声準備] 音声ファイルが設定されていません');
                return null;
            }

            console.log('[音声準備] 音声ファイル読み込み開始:', voiceFile);
            
            // ファイルパスを取得（default経由かどうかで処理を分ける）
            const audioSrc = voiceFile.default || voiceFile;
            
            // パスの存在確認は行わない（CORSエラーになる可能性があるため）
            console.log('[音声準備] 音声ファイルのパス:', audioSrc);
            return audioSrc;
            
        } catch (error) {
            console.error('[音声準備] 音声データの準備中にエラーが発生:', error);
            // エラーが発生しても学習を続行できるようにnullを返す
            return null;
        }
    };

    /**
     * AudioContextを使用して音声を再生する関数
     * 
     * @param {string} audioSrc - 音声ファイルのパス
     * @returns {Promise} 再生完了時に解決するPromise
     */
    const playWithAudioContext = async (audioSrc) => {
        if (!audioContext) {
            console.warn('[音声再生] AudioContextが利用できないため、通常の再生方法を使用します');
            return playWithAudioElement(audioSrc);
        }
        
        return new Promise(async (resolve) => {
            try {
                // キャッシュから音声バッファを取得するか、新たに読み込む
                let buffer;
                if (audioBufferCache[audioSrc]) {
                    buffer = audioBufferCache[audioSrc];
                    console.log('[音声再生] キャッシュから音声バッファを取得しました');
                } else {
                    console.log('[音声再生] 音声ファイルを読み込みます');
                    const response = await fetch(audioSrc);
                    const arrayBuffer = await response.arrayBuffer();
                    buffer = await audioContext.decodeAudioData(arrayBuffer);
                    audioBufferCache[audioSrc] = buffer;
                    console.log('[音声再生] 音声バッファをキャッシュしました');
                }
                
                // 音声ソースを作成
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                
                // 再生開始時の処理
                setIsPlaying(true);
                setShowImage(false);
                setShowKanji(true);
                console.log('[音声再生] 再生開始');
                
                // 再生終了時の処理
                source.onended = () => {
                    console.log('[音声再生] 再生終了');
                    setIsPlaying(false);
                    setTimeout(() => setShowImage(true), 800);
                    resolve();
                };
                
                // 最初の再生で、集団モードの「おぼえよう」の場合は遅延を入れる
                if (isFirstPlay && state.mode === "group" && state.selectedOption === "remember" && state.remainingRepetitions === parseInt(state.repetitionCount)) {
                    console.log('[音声再生] 最初の再生で遅延を入れる');
                    await new Promise(resolve => setTimeout(resolve, 400));
                    setIsFirstPlay(false);
                }
                
                // 再生開始
                source.start(0);
                
            } catch (error) {
                console.error('[音声再生] AudioContextでの再生に失敗しました:', error);
                setIsPlaying(false);
                setTimeout(() => setShowImage(true), 800);
                resolve();
                
                // エラーが発生した場合は通常の再生方法にフォールバック
                return playWithAudioElement(audioSrc);
            }
        });
    };
    
    /**
     * 通常のAudioオブジェクトを使用して音声を再生する関数（フォールバック用）
     * 
     * @param {string} audioSrc - 音声ファイルのパス
     * @returns {Promise} 再生完了時に解決するPromise
     */
    const playWithAudioElement = async (audioSrc) => {
        return new Promise((resolve) => {
            const audio = new Audio(audioSrc);
            
            // 再生開始時の処理
            audio.onplay = () => {
                console.log('[音声再生] 再生開始 (Audio要素)');
                setIsPlaying(true);
                setShowImage(false);
                setShowKanji(true);
            };
            
            // 再生終了時の処理
            audio.onended = () => {
                console.log('[音声再生] 再生終了 (Audio要素)');
                setIsPlaying(false);
                setTimeout(() => setShowImage(true), 800);
                resolve();
            };
            
            // エラー発生時の処理
            audio.onerror = (e) => {
                console.error('[音声再生] エラー発生 (Audio要素)', e);
                setIsPlaying(false);
                setTimeout(() => setShowImage(true), 800);
                resolve();
            };
            
            // 最初の再生で、集団モードの「おぼえよう」の場合は遅延を入れる
            const playWithDelay = async () => {
                if (isFirstPlay && state.mode === "group" && state.selectedOption === "remember" && state.remainingRepetitions === parseInt(state.repetitionCount)) {
                    console.log('[音声再生] 最初の再生で遅延を入れる (Audio要素)');
                    await new Promise(resolve => setTimeout(resolve, 400));
                    setIsFirstPlay(false);
                }
                
                // 再生開始
                audio.play().catch(error => {
                    console.error('[音声再生] 再生エラー (Audio要素):', error);
                    setIsPlaying(false);
                    setTimeout(() => setShowImage(true), 800);
                    resolve();
                });
            };
            
            playWithDelay();
        });
    };

    /**
     * 音声再生処理
     * 音声を再生し、再生完了後にイラストを表示する
     * 
     * @param {string} audioSrc - 再生する音声ファイルのパス
     * @returns {Promise} 再生完了時に解決するPromise
     */
    const playAudio = async (audioSrc) => {
        if (!audioSrc) return Promise.resolve();
        
        console.log(`[音声再生] 開始 - 反復回数: ${state.remainingRepetitions}/${state.repetitionCount}, 漢字インデックス: ${state.currentKanjiIndex}`);
        
        // 音声再生を有効化（初回のみ実行される）
        await enableAudio();
        
        // AudioContextが利用可能ならそれを使用、そうでなければAudio要素を使用
        if (isAudioContextInitialized && audioContext) {
            return playWithAudioContext(audioSrc);
        } else {
            return playWithAudioElement(audioSrc);
        }
    };

    /**
     * 初期化処理
     * トレーニング開始時に実行され、漢字リストの準備と最初の漢字の表示を行う
     */
    useEffect(() => {
        let isMounted = true;
        
        // スタートボタンクリック時に音声再生を有効化
        enableAudio();
        
        // 最初の反復時のみisFirstPlayをリセット
        if (state.remainingRepetitions === parseInt(state.repetitionCount)) {
            console.log('[初期化] 最初の反復なのでisFirstPlayをリセット');
            setIsFirstPlay(true);
        } else {
            console.log('[初期化] 2回目以降の反復なのでisFirstPlayはリセットしない');
        }
        
        console.log(`[初期化] トレーニング初期化 - 反復回数: ${state.remainingRepetitions}/${state.repetitionCount}`);

        const initializeTraining = async () => {
            if (state.selectedKanji[state.selectedLevel]?.length > 0) {
                // 選択された漢字をシャッフル
                const shuffled = [...state.selectedKanji[state.selectedLevel]]
                    .sort(() => Math.random() - 0.5);
                
                console.log(`[初期化] 漢字シャッフル完了 - 漢字数: ${shuffled.length}`);
                
                if (isMounted) {
                    // 最初は漢字を表示せず、少し遅延させる（集団モードの「おぼえよう」の場合）
                    const shouldDelay = state.mode === "group" && 
                                       state.selectedOption === "remember" && 
                                       state.remainingRepetitions === parseInt(state.repetitionCount);
                    
                    setRemainingKanji(shuffled);
                    setShowKanji(!shouldDelay);  // 遅延が必要な場合は最初は非表示
                    updateKanji({ currentKanjiIndex: 0 });
                    
                    console.log(`[初期化] 漢字表示設定 - 遅延: ${shouldDelay}`);
                    
                    // 遅延が必要な場合は、少し待ってから漢字を表示
                    if (shouldDelay) {
                        setTimeout(() => {
                            if (isMounted) {
                                console.log('[初期化] 遅延後に漢字を表示');
                                setShowKanji(true);
                            }
                        }, 400);
                    }
                }

                // 最初の漢字の音声を準備
                const firstKanji = state.kanjiList[shuffled[0]];
                if (firstKanji?.voice) {
                    console.log('[初期化] 最初の漢字の音声を準備');
                    const audioSrc = await prepareAudio(firstKanji.voice);
                    if (isMounted && audioSrc) {
                        setNextAudio(audioSrc);
                        console.log('[初期化] 音声準備完了');
                        
                        // 集団モードの「おぼえよう」の場合のみ、ここで音声再生
                        // 個人モードや「よめるかな？」モードでは再生しない
                        if (state.mode === "group" && state.selectedOption === "remember") {
                            // 少し遅延させてから再生（最初の漢字のみ）
                            if (state.remainingRepetitions === parseInt(state.repetitionCount)) {
                                console.log('[初期化] 最初の反復で遅延後に音声再生');
                                setTimeout(async () => {
                                    if (isMounted) {
                                        await playAudio(audioSrc);
                                        setHasPlayedAudio(true);
                                        setNextAudio(null); // 再生後はnextAudioをクリア
                                    }
                                }, 400);
                            } else {
                                // 2回目以降の反復では、漢字更新処理で音声再生するため、ここでは再生しない
                                console.log('[初期化] 2回目以降の反復では漢字更新処理で音声再生するため、ここでは再生しない');
                                setNextAudio(audioSrc); // 次の音声として設定しておく
                            }
                        }
                    }
                }
            }
        };

        initializeTraining();
        
        // クリーンアップ関数
        return () => {
            console.log('[初期化] クリーンアップ');
            isMounted = false;
        };
    }, [state.remainingRepetitions, state.isTraining]);

    /**
     * 次の音声を準備する関数
     * 現在の漢字の次の漢字の音声を先読みして準備する
     */
    const prepareNextAudio = async () => {
        if (state.currentKanjiIndex < remainingKanji.length - 1) {
            try {
                const nextKanjiIndex = remainingKanji[state.currentKanjiIndex + 1];
                const nextKanji = state.kanjiList[nextKanjiIndex];
                if (nextKanji?.voice) {
                    const audioSrc = await prepareAudio(nextKanji.voice);
                    setNextAudio(audioSrc);
                }
            } catch (error) {
                console.error('次の音声の準備中にエラーが発生:', error);
                setNextAudio(null);
            }
        }
    };

    /**
     * 個人モードでの漢字クリック処理
     * 個人モードで漢字をクリックした時に音声を再生する
     */
    const handleKanjiClick = async () => {
        if (state.mode === "individual" && !isKanjiClicked && !isPlaying) {
            setIsKanjiClicked(true);
            try {
                const audioSrc = await prepareAudio(currentKanji.voice);
                if (audioSrc) {
                    await playAudio(audioSrc);
                    setHasPlayedAudio(true);
                } else {
                    // 音声がない場合は少し待ってからイラスト表示
                    setTimeout(() => {
                        setShowImage(true);
                        setHasPlayedAudio(true);
                    }, 800);
                }
            } catch (error) {
                // エラー時も少し待ってからイラスト表示
                setTimeout(() => {
                    setShowImage(true);
                    setHasPlayedAudio(true);
                }, 800);
            }
        }
    };

    /**
     * 漢字表示の更新処理
     * 現在の漢字インデックスが変わった時に実行され、新しい漢字を表示する
     */
    useEffect(() => {
        if (!remainingKanji.length || state.currentKanjiIndex === undefined) return;

        console.log(`[漢字更新] 漢字インデックス変更: ${state.currentKanjiIndex}, 反復回数: ${state.remainingRepetitions}/${state.repetitionCount}`);

        // 現在の漢字データを取得
        const current = state.kanjiList[remainingKanji[state.currentKanjiIndex]];
        setCurrentKanji(current);
        setShowImage(false);
        setHasPlayedAudio(false);
        setIsKanjiClicked(false);
        setShowKanji(true);  // 常に漢字を表示

        console.log(`[漢字更新] 現在の漢字: ${current?.kanji}`);

        // 個人モードの場合、ランダムな位置を設定
        if (state.mode === "individual") {
            setKanjiPosition(getRandomPosition());
        }

        /**
         * 漢字の初期化処理
         * 「おぼえよう！」モードの場合、音声を自動再生する
         */
        const initializeKanji = async () => {
            if (state.selectedOption === "remember") {
                if (state.mode === "group") {
                    // 集団モードの場合
                    // 最初の漢字（currentKanjiIndex === 0）かつ最初の反復（remainingRepetitions === repetitionCount）の場合は
                    // 初期化処理で既に再生されているので、ここでは再生しない
                    const isFirstKanjiAndFirstRepetition = 
                        state.currentKanjiIndex === 0 && 
                        state.remainingRepetitions === parseInt(state.repetitionCount);
                    
                    console.log(`[漢字更新] 最初の漢字かつ最初の反復: ${isFirstKanjiAndFirstRepetition}`);
                    
                    if (!isFirstKanjiAndFirstRepetition) {
                        if (nextAudio) {
                            // 先読みしておいた音声がある場合はそれを使用
                            console.log('[漢字更新] 先読み音声を使用して再生');
                            await playAudio(nextAudio);
                            setHasPlayedAudio(true);
                            setNextAudio(null);
                        } else {
                            // 先読み音声がない場合は新たに準備
                            console.log('[漢字更新] 新たに音声を準備して再生');
                            const audioSrc = await prepareAudio(current.voice);
                            if (audioSrc) {
                                await playAudio(audioSrc);
                                setHasPlayedAudio(true);
                            } else {
                                // 音声の準備に失敗した場合、再試行
                                console.log('[漢字更新] 音声準備失敗、再試行');
                                setTimeout(initializeKanji, 500);
                                return;
                            }
                        }
                    } else if (isFirstKanjiAndFirstRepetition) {
                        // 最初の漢字かつ最初の反復の場合は、初期化処理で既に再生されているので
                        // ここでは再生せず、hasPlayedAudioをtrueに設定するだけ
                        console.log('[漢字更新] 最初の漢字かつ最初の反復なので再生せず');
                        setHasPlayedAudio(true);
                    }
                }
                // 次の漢字の音声を先読み
                console.log('[漢字更新] 次の漢字の音声を先読み');
                prepareNextAudio();
            }
        };

        initializeKanji();
    }, [state.currentKanjiIndex, remainingKanji]);

    /**
     * 集団モード（自動進行処理）
     * イラスト表示後、一定時間経過したら次の漢字に進む
     */
    useEffect(() => {
        let timer;
        if (state.mode === "group" && state.selectedOption === "remember" && showImage && hasPlayedAudio) {
            console.log(`[自動進行] イラスト表示後のタイマー開始 - 漢字インデックス: ${state.currentKanjiIndex}, 反復回数: ${state.remainingRepetitions}/${state.repetitionCount}`);
            
            timer = setTimeout(() => {
                console.log('[自動進行] ブラックスクリーン表示');
                setShowBlackScreen(true);  // 黒画面表示（遷移効果）
                
                // ブラックスクリーン表示中に次の漢字の準備
                setTimeout(() => {
                    // 次の漢字の準備
                    if (state.currentKanjiIndex >= remainingKanji.length - 1) {
                        if (state.remainingRepetitions > 1) {
                            // まだ反復回数が残っている場合
                            console.log(`[自動進行] 全漢字表示完了、反復回数を減らす: ${state.remainingRepetitions} -> ${state.remainingRepetitions - 1}`);
                            updateRepetition({ remainingRepetitions: state.remainingRepetitions - 1 });
                        } else {
                            // 全ての反復が終了した場合
                            console.log('[自動進行] 全反復完了、トレーニング終了');
                            StateTransitions.COMPLETE_TRAINING(updateFunctions);
                        }
                    } else {
                        // 次の漢字へ
                        console.log(`[自動進行] 次の漢字へ: ${state.currentKanjiIndex} -> ${state.currentKanjiIndex + 1}`);
                        updateKanji({ currentKanjiIndex: state.currentKanjiIndex + 1 });
                    }
                    
                    // 少し遅延させてからブラックスクリーンを非表示
                    setTimeout(() => {
                        console.log('[自動進行] ブラックスクリーン非表示');
                        setShowBlackScreen(false);  // 黒画面を非表示
                    }, 200);
                },500);  // ブラックスクリーン表示から0.5秒後
            }, 2000);  // イラスト表示から2秒後
        }
        return () => {
            if (timer) {
                console.log('[自動進行] タイマークリア');
                clearTimeout(timer);
            }
        };  // クリーンアップ
    }, [showImage, hasPlayedAudio]);

    /**
     * 個人モード(画像表示後の処理)
     * イラスト表示後、一定時間経過したら次の漢字に進む
     */
    useEffect(() => {
        let timer;
        if (state.mode === "individual" && showImage) {
            console.log(`[個人モード] イラスト表示後のタイマー開始 - 漢字インデックス: ${state.currentKanjiIndex}, 反復回数: ${state.remainingRepetitions}/${state.repetitionCount}`);
            
            timer = setTimeout(() => {
                console.log('[個人モード] ブラックスクリーン表示');
                setShowBlackScreen(true);  // 黒画面表示（遷移効果）
                
                // ブラックスクリーン表示中に次の漢字の準備
                setTimeout(() => {
                    setShowImage(false);
                    
                    // 全ての漢字を表示し終えた場合
                    if (state.currentKanjiIndex >= remainingKanji.length - 1) {
                        if (state.remainingRepetitions > 1) {
                            // まだ反復回数が残っている場合
                            console.log(`[個人モード] 全漢字表示完了、反復回数を減らす: ${state.remainingRepetitions} -> ${state.remainingRepetitions - 1}`);
                            updateRepetition({ remainingRepetitions: state.remainingRepetitions - 1 });
                        } else {
                            // 全ての反復が終了した場合
                            console.log('[個人モード] 全反復完了、トレーニング終了');
                            StateTransitions.COMPLETE_TRAINING(updateFunctions);
                        }
                    } else {
                        // 次の漢字へ
                        console.log(`[個人モード] 次の漢字へ: ${state.currentKanjiIndex} -> ${state.currentKanjiIndex + 1}`);
                        updateKanji({ currentKanjiIndex: state.currentKanjiIndex + 1 });
                    }
                    
                    // 少し遅延させてから表示を更新
                    setTimeout(() => {
                        console.log('[個人モード] 表示更新、ブラックスクリーン非表示');
                        setShowKanji(true);
                        setIsKanjiClicked(false);
                        setShowBlackScreen(false);  // 黒画面を非表示
                    }, 200);
                }, 500);  // ブラックスクリーン表示から0.5秒後
            }, 2000);  // イラスト表示から2秒後
        }
        return () => {
            if (timer) {
                console.log('[個人モード] タイマークリア');
                clearTimeout(timer);
            }
        };  // クリーンアップ
    }, [showImage]);

    /**
     * 次の漢字への移動処理
     * 「おぼえよう！」モードで次の漢字に進む処理
     */
    const handleMemorizingNext = () => {
        setShowImage(false);
        // 全ての漢字を表示し終えた場合
        if (state.currentKanjiIndex >= remainingKanji.length - 1) {
            if (state.remainingRepetitions > 1) {
                // まだ反復回数が残っている場合
                updateRepetition({ remainingRepetitions: state.remainingRepetitions - 1 });
            } else {
                // 全ての反復が終了した場合
                StateTransitions.COMPLETE_TRAINING(updateFunctions);
            }
        } else {
            // 次の漢字へ
            updateKanji({ currentKanjiIndex: state.currentKanjiIndex + 1 });
        }
    };

    /**
     * 読み方確認モードの処理
     * 「よめるかな？」モードで次の漢字に進む処理
     */
    const handleReadingNext = () => {
        if (state.currentKanjiIndex < remainingKanji.length - 1) {
            // 次の漢字へ
            updateKanji({ currentKanjiIndex: state.currentKanjiIndex + 1 });
        } else {
            // 全ての漢字を表示し終えた場合
            if (state.remainingConfirmation > 1) {
                // まだ確認回数が残っている場合、漢字をシャッフルして最初から
                console.log(`[よめるかな] 確認回数を減らす: ${state.remainingConfirmation} -> ${state.remainingConfirmation - 1}`);
                const shuffled = [...remainingKanji].sort(() => Math.random() - 0.5);
                setRemainingKanji(shuffled);
                updateKanji({ currentKanjiIndex: 0 });
                updateRepetition({ remainingConfirmation: state.remainingConfirmation - 1 });
            } else if (state.remainingRepetitions > 1) {
                // 確認回数は終了したが、まだ反復回数が残っている場合
                console.log(`[よめるかな] 反復回数を減らす: ${state.remainingRepetitions} -> ${state.remainingRepetitions - 1}, 確認回数をリセット: ${state.confirmationCount}`);
                const shuffled = [...remainingKanji].sort(() => Math.random() - 0.5);
                setRemainingKanji(shuffled);
                updateKanji({ currentKanjiIndex: 0 });
                updateRepetition({ 
                    remainingRepetitions: state.remainingRepetitions - 1,
                    remainingConfirmation: state.confirmationCount ? parseInt(state.confirmationCount) : 1
                });
            } else {
                // 全ての確認と反復が終了した場合
                console.log('[よめるかな] 全ての確認と反復が終了');
                StateTransitions.COMPLETE_TRAINING(updateFunctions);
                // 集団モードで確認回数が設定されていない場合、学習方法選択に戻る
                if (state.confirmationCount === "initial") {
                    StateTransitions.RESET_GROUP_MODE_STATE(updateFunctions);
                }
            }
        }
    };

    /**
     * キーボードイベントの処理
     * 「よめるかな？」モードでEnterキーを押すと次の漢字に進む
     */
    useEffect(() => {
        if (state.selectedOption === "read") {
            const handleKeyPress = (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    handleReadingNext();
                }
            };
            window.addEventListener("keydown", handleKeyPress);
            return () => window.removeEventListener("keydown", handleKeyPress);  // クリーンアップ
        }
    }, [state.selectedOption, state.currentKanjiIndex, remainingKanji, state.remainingRepetitions]);

    /**
     * コンポーネントのクリーンアップ
     * コンポーネントがアンマウントされる時に音声を停止する
     */
    useEffect(() => {
        return () => {
            // AudioContextのクリーンアップ
            if (audioContext) {
                // AudioContextは閉じない（他の場所で再利用するため）
                // ただし、バッファキャッシュはクリアする
                audioBufferCache = {};
            }
        };
    }, []);

    // ======== スタイルの設定 ========
    // モードに応じたコンテナのクラス名
    const containerClassName = state.mode === "group" ? styles['container--group'] : styles.container;
    
    // 個人モード/集団モードに応じた漢字表示のクラス名
    const kanjiClassName = state.mode === "individual" ? styles['kanjiDisplay--individual'] : styles.kanjiDisplay;
    
    // モードに応じたイラスト表示コンテナのクラス名
    const imageContainerClassName = state.mode === "individual" 
        ? styles['imageContainer--individual'] 
        : state.mode === "group" 
            ? styles['imageContainer--group'] 
            : styles.imageContainer;
    
    // イラスト表示のクラス名（表示/非表示の状態も含む）
    const imageClassName = `${state.mode === "individual" ? styles['image--individual'] : styles['image--group']} ${showImage ? styles['image--visible'] : ''}`;

    // イラスト読み込みエラー時の処理
    const handleImageError = (e) => {
        console.error('[イラスト表示] 読み込みエラー');
        e.target.style.display = 'none';
        // イラストが読み込めなくても学習を続行できるようにする
        setShowImage(true);
    };

    // イラスト読み込み完了時の処理
    const handleImageLoad = () => {
        console.log('[イラスト表示] 読み込み完了');
        setShowImage(true);
    };

    // ======== レンダリング ========
    return (
        <div className={containerClassName}>
            {/* 黒画面（遷移効果用） */}
            {showBlackScreen && <div className={`${styles.blackScreen} ${styles['blackScreen--visible']}`} />}
            
            {/* よめるかな？モード */}
            {state.selectedOption === "read" ? (
                <div 
                    className={styles.kanjiDisplay} 
                    onClick={handleReadingNext}
                    data-length={currentKanji?.kanji?.length}
                >
                    {showKanji && currentKanji?.kanji}
                </div>
            ) : (
                <>
                    {/* おぼえよう！モード - 漢字表示 */}
                    {!showImage ? (
                        state.mode === "individual" ? (
                            // 個人モード - ランダムな位置に漢字を表示
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
                            // 集団モード - 中央に漢字を表示
                            <div 
                                className={styles.kanjiDisplay}
                                data-length={currentKanji?.kanji?.length}
                            >
                                {showKanji && currentKanji?.kanji}
                            </div>
                        )
                    ) : (
                        // イラスト表示
                        <div className={imageContainerClassName}>
                            {currentKanji?.illust && (
                                <img 
                                    src={currentKanji.illust.default || currentKanji.illust} 
                                    alt={`${currentKanji?.kanji}のイラスト`}
                                    className={imageClassName}
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                />
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};