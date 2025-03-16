import React, { useState } from "react";
import { StateCheckers, StateTransitions, KanjiHelpers } from "../utils/stateManager";
import styles from '../styles/components/Navi.module.css';

/**
 * アラートメッセージを表示するコンポーネント
 */
const AlertMessage = ({ message, onClose }) => {
  return (
    <div className={styles.alertOverlay}>
      <div className={styles.alertBox}>
        <p>{message}</p>
        <button className={styles.alertButton} onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

/**
 * ナビゲーションの状態に基づいてボタンの設定を決定する
 * @param {Object} state - アプリケーションの状態
 * @param {Object} updateFunctions - 状態更新関数群
 * @param {Function} showAlert - アラートを表示する関数
 * @returns {Object} - 表示するボタンの設定
 */
const getNavigationConfig = (state, updateFunctions, showAlert) => {
    // 初期状態
    if (StateCheckers.isInitialScreen(state)) {
        return { showBackButton: false, showButtons: [] };
    }

    // 練習方法選択画面
    if (StateCheckers.isLearningMethodSelection(state)) {
        return {
            showBackButton: false,
            showButtons: [{
                text: "モード選択に戻る",
                onClick: () => StateTransitions.RETURN_TO_START(updateFunctions)
            }]
        };
    }

    // レベル選択画面
    if (StateCheckers.isLevelSelection(state)) {
        return {
            showBackButton: false,
            showButtons: [{
                text: "TOPへ",
                onClick: () => StateTransitions.RETURN_TO_METHOD_SELECTION(updateFunctions)
            }]
        };
    }

    // 漢字選択画面
    if (StateCheckers.isKanjiSelection(state)) {
        return {
            showBackButton: true,
            backButtonAction: () => StateTransitions.RETURN_TO_LEVEL_SELECTION(updateFunctions),
            showButtons: [
                {
                    text: "選択解除",
                    onClick: () => StateTransitions.CLEAR_KANJI_SELECTION(updateFunctions, state.selectedLevel)
                },
                {
                    text: "次へ",
                    onClick: () => {
                        const selectedCount = KanjiHelpers.getSelectedKanjiCount(state);
                        if (selectedCount > 0) {
                            // 選択された漢字の画像をプリロード
                            const selectedIndices = state.selectedKanji[state.selectedLevel] || [];
                            if (selectedIndices.length > 0) {
                                console.log('選択された漢字の画像をプリロード開始');
                                selectedIndices.forEach(index => {
                                    const kanjiData = state.kanjiList[index];
                                    if (kanjiData && kanjiData.illust) {
                                        const img = new Image();
                                        const imgSrc = kanjiData.illust.default || kanjiData.illust;
                                        img.src = imgSrc;
                                        console.log(`漢字「${kanjiData.kanji}」の画像をプリロード: ${imgSrc}`);
                                    }
                                });
                            }
                            
                            // 通常の遷移処理
                            StateTransitions.PROCEED_TO_NEXT(updateFunctions);
                        } else {
                            // 漢字が選択されていない場合、アラートを表示
                            showAlert("漢字を選択してください。");
                        }
                    }
                },
                {
                    text: "TOPへ",
                    onClick: () => StateTransitions.RETURN_TO_METHOD_SELECTION(updateFunctions)
                }
            ]
        };
    }

    // 反復回数選択画面
    if (StateCheckers.isRepetitionSelection(state)) {
        return {
            showBackButton: true,
            backButtonAction: () => updateFunctions.updateNavigation({ selectNext: false }),
            showButtons: [{
                text: "TOPへ",
                onClick: () => StateTransitions.RETURN_TO_METHOD_SELECTION(updateFunctions)
            }]
        };
    }

    // 確認回数選択画面
    if (StateCheckers.isConfirmationSelection(state)) {
        return {
            showBackButton: true,
            backButtonAction: () => {
                // 反復回数選択画面に戻る
                updateFunctions.updateRepetition({
                    confirmationCount: "initial",
                    remainingConfirmation: 0,
                    repetitionCount: "initial",
                    remainingRepetitions: 0
                });
                // 反復回数選択画面の条件を満たすために、selectNextはtrueのままにする
            },
            showButtons: [{
                text: "TOPへ",
                onClick: () => StateTransitions.RETURN_TO_METHOD_SELECTION(updateFunctions)
            }]
        };
    }

    // おぼえよう！の学習終了後の画面
    if (StateCheckers.isMemorizeComplete(state)) {
        return {
            showBackButton: false,
            showButtons: [{
                text: "TOPへ",
                onClick: () => StateTransitions.RETURN_TO_METHOD_SELECTION(updateFunctions)
            }]
        };
    }

    // たしかめよう！の学習終了後の画面（がんばったね！画面）
    if (StateCheckers.isEndScreen(state)) {
        return {
            showBackButton: false,
            showButtons: [{
                text: "TOPへ",
                onClick: () => StateTransitions.RETURN_TO_METHOD_SELECTION(updateFunctions)
            }]
        };
    }

    return { showBackButton: false, showButtons: [] };
};

/**
 * ナビゲーションコンポーネント
 * 画面遷移のためのナビゲーションボタンを提供する
 * @param {Object} props
 * @param {Object} props.state - アプリケーションの状態
 * @param {Function} props.updateNavigation - ナビゲーション状態を更新する関数
 * @param {Function} props.updateKanji - 漢字学習状態を更新する関数
 * @param {Function} props.updateRepetition - 反復学習状態を更新する関数
 * @param {Function} props.handleRemoveKanjiSelection - 漢字選択をクリアする関数
 */
export const Navi = ({ 
    state,
    updateNavigation,
    updateKanji,
    updateRepetition,
    handleRemoveKanjiSelection
}) => {
    // アラート表示のための状態
    const [alertMessage, setAlertMessage] = useState("");
    const [showAlertBox, setShowAlertBox] = useState(false);

    // アラートを表示する関数
    const showAlert = (message) => {
        setAlertMessage(message);
        setShowAlertBox(true);
    };

    // アラートを閉じる関数
    const closeAlert = () => {
        setShowAlertBox(false);
    };

    const updateFunctions = {
        updateNavigation,
        updateKanji,
        updateRepetition,
        handleRemoveKanjiSelection
    };

    // ナビゲーションバーを表示すべきでない場合は何も表示しない
    if (!StateCheckers.shouldShowNavigation(state)) {
        return null;
    }

    const config = getNavigationConfig(state, updateFunctions, showAlert);

    return (
        <>
            <div className={styles.container}>
                {/* 左側：戻るボタン */}
                <div className={styles.leftButtons}>
                    {config.showBackButton && (
                        <button 
                            className={styles.button}
                            onClick={config.backButtonAction}
                        >
                            ＜戻る
                        </button>
                    )}
                </div>

                {/* 右側：その他のボタン群 */}
                <div className={styles.rightButtons}>
                    {config.showButtons && config.showButtons.length > 0 && (
                        <div className={styles.buttonContainer}>
                            {config.showButtons.map((button, index) => (
                                <button
                                    key={index}
                                    className={styles.button}
                                    onClick={button.onClick}
                                >
                                    {button.text}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* アラートメッセージ */}
            {showAlertBox && (
                <AlertMessage 
                    message={alertMessage} 
                    onClose={closeAlert} 
                />
            )}
        </>
    );
};
  